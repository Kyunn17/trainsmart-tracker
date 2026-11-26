<?php

namespace Tests\Feature;

use App\Models\DailySession;
use App\Models\PlanSchedule;
use App\Models\Split;
use App\Models\User;
use App\Models\UserPlan;
use Carbon\Carbon;
use Database\Seeders\SplitSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DailySessionRescheduleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SplitSeeder::class);
    }

    public function test_client_can_reschedule_pending_session_to_rest_day_with_reason(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-23 09:00:00')); // Monday

        $client = User::factory()->create(['role' => 'client']);
        $split = Split::where('slug', 'full-body')->with('sessions')->firstOrFail();
        $fbA = $split->sessions->firstWhere('slug', 'full-body-a');
        $fbB = $split->sessions->firstWhere('slug', 'full-body-b');

        $plan = UserPlan::create([
            'user_id' => $client->id,
            'split_id' => $split->id,
            'days_per_week' => 2,
            'is_active' => true,
            'onboarding_completed_at' => now(),
        ]);

        // Monday = Full Body A, Tuesday = Rest, Wednesday = Full Body B
        PlanSchedule::create(['user_plan_id' => $plan->id, 'day_of_week' => 1, 'split_session_id' => $fbA->id]);
        PlanSchedule::create(['user_plan_id' => $plan->id, 'day_of_week' => 2, 'split_session_id' => null]);
        PlanSchedule::create(['user_plan_id' => $plan->id, 'day_of_week' => 3, 'split_session_id' => $fbB->id]);

        Sanctum::actingAs($client);

        // Materialize Monday
        $todayRes = $this->getJson('/api/daily-sessions/today');
        $todayRes->assertOk();
        $sessionId = $todayRes->json('data.id');

        // Reschedule Monday -> Tuesday (rest day)
        $res = $this->postJson("/api/daily-sessions/{$sessionId}/reschedule", [
            'target_date' => '2026-11-24',
            'reason' => 'Sedang demam ringan, butuh istirahat 1 hari',
        ]);

        $res->assertOk()
            ->assertJsonPath('data.status', 'rest')
            ->assertJsonPath('data.split_session_id', null)
            ->assertJsonPath('data.rescheduled_to_date', '2026-11-24')
            ->assertJsonPath('data.reschedule_reason', 'Sedang demam ringan, butuh istirahat 1 hari')
            ->assertJsonPath('target_session.split_session_id', $fbA->id)
            ->assertJsonPath('target_session.status', 'pending')
            ->assertJsonPath('target_session.rescheduled_from_date', '2026-11-23')
            ->assertJsonPath('shifted_days_count', 0);

        // Refreshing today must show Monday as Istirahat (not skipped!) and Tuesday as Full Body A
        $afterRes = $this->getJson('/api/daily-sessions/today')->assertOk();
        $overview = collect($afterRes->json('week_overview'))->keyBy('date');
        $this->assertSame('rest', $overview['2026-11-23']['status']);
        $this->assertSame('Istirahat', $overview['2026-11-23']['session_name']);
        $this->assertSame('Full Body A', $overview['2026-11-24']['session_name']);

        Carbon::setTestNow();
    }

    public function test_rescheduling_onto_occupied_day_cascades_displaced_workout_forward(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-23 09:00:00')); // Monday

        $client = User::factory()->create(['role' => 'client']);
        $split = Split::where('slug', 'upper-lower')->with('sessions')->firstOrFail();
        $upperA = $split->sessions->firstWhere('slug', 'upper-a');
        $lowerA = $split->sessions->firstWhere('slug', 'lower-a');

        $plan = UserPlan::create([
            'user_id' => $client->id,
            'split_id' => $split->id,
            'days_per_week' => 4,
            'is_active' => true,
            'onboarding_completed_at' => now(),
        ]);

        // Mon = Upper A, Tue = Lower A, Wed = Rest
        PlanSchedule::create(['user_plan_id' => $plan->id, 'day_of_week' => 1, 'split_session_id' => $upperA->id]);
        PlanSchedule::create(['user_plan_id' => $plan->id, 'day_of_week' => 2, 'split_session_id' => $lowerA->id]);
        PlanSchedule::create(['user_plan_id' => $plan->id, 'day_of_week' => 3, 'split_session_id' => null]);

        Sanctum::actingAs($client);
        $todayId = $this->getJson('/api/daily-sessions/today')->json('data.id');

        // Shift Monday (Upper A) -> Tuesday (occupied by Lower A) => Lower A shifts to Wednesday!
        $res = $this->postJson("/api/daily-sessions/{$todayId}/reschedule", [
            'target_date' => '2026-11-24',
            'reason' => 'Lembur kantor sampai malam',
        ]);

        $res->assertOk()
            ->assertJsonPath('shifted_days_count', 1);

        $tue = DailySession::where('user_id', $client->id)->whereDate('session_date', '2026-11-24')->first();
        $wed = DailySession::where('user_id', $client->id)->whereDate('session_date', '2026-11-25')->first();

        $this->assertSame($upperA->id, $tue->split_session_id);
        $this->assertSame($lowerA->id, $wed->split_session_id);

        Carbon::setTestNow();
    }

    public function test_reschedule_enforces_validation_ownership_and_trainer_conflict(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-23 09:00:00'));

        $client = User::factory()->create(['role' => 'client']);
        $otherClient = User::factory()->create(['role' => 'client']);
        $split = Split::where('slug', 'full-body')->with('sessions')->firstOrFail();
        $fbA = $split->sessions->first();

        $daily = DailySession::create([
            'user_id' => $client->id,
            'split_session_id' => $fbA->id,
            'session_date' => '2026-11-23',
            'status' => 'pending',
        ]);

        // Another user cannot reschedule client's session (403)
        Sanctum::actingAs($otherClient);
        $this->postJson("/api/daily-sessions/{$daily->id}/reschedule", [
            'target_date' => '2026-11-24',
            'reason' => 'Coba geser',
        ])->assertForbidden();

        // Client cannot reschedule to same day or past date (422)
        Sanctum::actingAs($client);
        $this->postJson("/api/daily-sessions/{$daily->id}/reschedule", [
            'target_date' => '2026-11-23',
            'reason' => 'Sakit',
        ])->assertStatus(422);

        // Trainer-overridden session returns 409
        $daily->update(['changed_by_role' => 'trainer']);
        $this->postJson("/api/daily-sessions/{$daily->id}/reschedule", [
            'target_date' => '2026-11-24',
            'reason' => 'Sakit',
        ])->assertStatus(409);

        Carbon::setTestNow();
    }
}
