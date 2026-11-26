<?php

namespace Tests\Feature;

use App\Models\DailySession;
use App\Models\Exercise;
use App\Models\PlanSchedule;
use App\Models\Split;
use App\Models\User;
use App\Models\UserPlan;
use App\Models\WorkoutLog;
use Carbon\Carbon;
use Database\Seeders\SplitSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DailySessionAndEvaluationTest extends TestCase
{
    use RefreshDatabase;

    private function createActivePlanForUser(User $user): array
    {
        $this->seed(SplitSeeder::class);
        $split = Split::where('slug', 'upper-lower')->with('sessions')->firstOrFail();
        $sessions = $split->sessions->values();

        $plan = UserPlan::create([
            'user_id' => $user->id,
            'split_id' => $split->id,
            'days_per_week' => 4,
            'is_active' => true,
            'onboarding_completed_at' => now(),
        ]);

        // Schedule Mon/Tue/Thu/Fri (days 1,2,4,5) and put today as workout day too if needed
        $todayIso = Carbon::today()->dayOfWeekIso;
        foreach (range(1, 7) as $day) {
            $sessionId = match ($day) {
                1 => $sessions[0]->id,
                2 => $sessions[1]->id,
                4 => $sessions[2]->id,
                5 => $sessions[3]->id,
                default => ($day === $todayIso ? $sessions[0]->id : null),
            };
            PlanSchedule::create([
                'user_plan_id' => $plan->id,
                'day_of_week' => $day,
                'split_session_id' => $sessionId,
            ]);
        }

        return [$plan, $sessions[0]];
    }

    public function test_today_returns_has_plan_false_without_plan(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        Sanctum::actingAs($user);

        $this->getJson('/api/daily-sessions/today')
            ->assertStatus(200)
            ->assertJsonPath('has_plan', false)
            ->assertJsonPath('data', null);
    }

    public function test_today_creates_daily_session_and_returns_week_overview(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        [$plan] = $this->createActivePlanForUser($user);
        Sanctum::actingAs($user);

        $res = $this->getJson('/api/daily-sessions/today');
        $res->assertStatus(200)
            ->assertJsonPath('has_plan', true)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonCount(7, 'week_overview');

        $this->assertDatabaseHas('daily_sessions', [
            'user_id' => $user->id,
            'user_plan_id' => $plan->id,
            'session_date' => Carbon::today()->toDateString(),
        ]);
    }

    public function test_client_can_mark_done_or_skip_unless_trainer_overrode(): void
    {
        $trainer = User::factory()->create(['role' => 'trainer']);
        $user = User::factory()->create(['role' => 'client', 'trainer_id' => $trainer->id]);
        [$plan, $session] = $this->createActivePlanForUser($user);
        Sanctum::actingAs($user);

        $daily = DailySession::create([
            'user_id' => $user->id,
            'user_plan_id' => $plan->id,
            'split_session_id' => $session->id,
            'session_date' => Carbon::today()->toDateString(),
            'status' => 'pending',
        ]);

        $this->patchJson("/api/daily-sessions/{$daily->id}/status", ['status' => 'skipped'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'skipped');

        $this->patchJson("/api/daily-sessions/{$daily->id}/status", ['status' => 'invalid'])
            ->assertStatus(422);

        // Trainer overrides status
        $daily->update([
            'status' => 'rest',
            'changed_by' => $trainer->id,
            'changed_by_role' => 'trainer',
            'trainer_note' => 'Istirahat dulu untuk pemulihan bahu.',
        ]);

        $this->patchJson("/api/daily-sessions/{$daily->id}/status", ['status' => 'done'])
            ->assertStatus(409);
    }

    public function test_workout_logs_link_to_daily_session_and_mark_done(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        [$plan, $session] = $this->createActivePlanForUser($user);
        $exercise = Exercise::create([
            'name' => 'Incline Bench Press',
            'slug' => 'incline-bench-press',
            'primary_muscle' => 'chest',
            'is_active' => true,
        ]);

        $daily = DailySession::create([
            'user_id' => $user->id,
            'user_plan_id' => $plan->id,
            'split_session_id' => $session->id,
            'session_date' => Carbon::today()->toDateString(),
            'status' => 'pending',
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/workout-logs', [
            'daily_session_id' => $daily->id,
            'logs' => [
                [
                    'exercise_id' => $exercise->id,
                    'set_number' => 1,
                    'weight' => 50,
                    'reps' => 10,
                    'rir' => 2,
                ],
            ],
        ])->assertStatus(201);

        $this->assertDatabaseHas('daily_sessions', [
            'id' => $daily->id,
            'status' => 'done',
        ]);
        $this->assertDatabaseHas('workout_logs', [
            'daily_session_id' => $daily->id,
            'exercise_id' => $exercise->id,
        ]);
    }

    public function test_weekly_evaluation_computes_metrics_and_rule_based_suggestions(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        [$plan, $session] = $this->createActivePlanForUser($user);
        $exercise = Exercise::create([
            'name' => 'Barbell Row',
            'slug' => 'barbell-row',
            'primary_muscle' => 'back',
            'is_active' => true,
        ]);

        $lastWeekMonday = Carbon::today()->subWeek()->startOfWeek(Carbon::MONDAY);
        $twoWeeksAgoMonday = Carbon::today()->subWeeks(2)->startOfWeek(Carbon::MONDAY);

        // Two weeks ago: 100kg x 5 = 500kg
        $prevLog = WorkoutLog::create([
            'user_id' => $user->id,
            'exercise_id' => $exercise->id,
            'set_number' => 1,
            'weight' => 100,
            'reps' => 5,
            'rir' => 2,
        ]);
        $prevLog->created_at = $twoWeeksAgoMonday->copy()->addHours(10);
        $prevLog->save();

        // Last week: 1 session done, 2 skipped, total tonnage 600kg, high RIR (4)
        $doneSession = DailySession::create([
            'user_id' => $user->id,
            'user_plan_id' => $plan->id,
            'split_session_id' => $session->id,
            'session_date' => $lastWeekMonday->toDateString(),
            'status' => 'done',
        ]);
        DailySession::create([
            'user_id' => $user->id,
            'user_plan_id' => $plan->id,
            'split_session_id' => $session->id,
            'session_date' => $lastWeekMonday->copy()->addDay()->toDateString(),
            'status' => 'skipped',
        ]);
        DailySession::create([
            'user_id' => $user->id,
            'user_plan_id' => $plan->id,
            'split_session_id' => $session->id,
            'session_date' => $lastWeekMonday->copy()->addDays(3)->toDateString(),
            'status' => 'skipped',
        ]);

        $log = WorkoutLog::create([
            'user_id' => $user->id,
            'exercise_id' => $exercise->id,
            'daily_session_id' => $doneSession->id,
            'set_number' => 1,
            'weight' => 60,
            'reps' => 10,
            'rir' => 4,
        ]);
        $log->created_at = $lastWeekMonday->copy()->addHours(10);
        $log->save();

        Sanctum::actingAs($user);

        $res = $this->getJson('/api/evaluation/weekly?period=last_week');
        $res->assertStatus(200)
            ->assertJsonPath('data.completed_sessions', 1)
            ->assertJsonPath('data.skipped_sessions', 2)
            ->assertJsonPath('data.total_tonnage_kg', 600)
            ->assertJsonPath('data.previous_week_tonnage_kg', 500)
            ->assertJsonPath('data.tonnage_change_percentage', 20)
            ->assertJsonPath('data.average_rir', 4)
            ->assertJsonCount(7, 'data.daily_breakdown');

        $this->assertNotEmpty($res->json('data.suggestions'));
        $this->assertLessThanOrEqual(2, count($res->json('data.suggestions')));
    }
}
