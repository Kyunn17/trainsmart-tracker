<?php

namespace Tests\Feature;

use App\Models\DailySession;
use App\Models\Exercise;
use App\Models\PlanSchedule;
use App\Models\Split;
use App\Models\SplitSession;
use App\Models\User;
use App\Models\UserPlan;
use Database\Seeders\SplitSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserPlanTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_user_plan(): void
    {
        $this->getJson('/api/user/plan')->assertStatus(401);
        $this->postJson('/api/user/plan', [])->assertStatus(401);
    }

    public function test_user_plan_returns_null_before_onboarding(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        Sanctum::actingAs($user);

        $this->getJson('/api/user/plan')
            ->assertStatus(200)
            ->assertJsonPath('data', null);
    }

    public function test_can_save_user_plan_and_replace_previous_active_plan(): void
    {
        $this->seed(SplitSeeder::class);
        $user = User::factory()->create(['role' => 'client']);
        Sanctum::actingAs($user);

        $split = Split::where('slug', 'upper-lower')->with('sessions')->firstOrFail();
        $sessions = $split->sessions->values();

        $payload = [
            'split_id' => $split->id,
            'days_per_week' => 4,
            'schedule' => [
                ['day_of_week' => 1, 'split_session_id' => $sessions[0]->id],
                ['day_of_week' => 2, 'split_session_id' => $sessions[1]->id],
                ['day_of_week' => 3, 'split_session_id' => null],
                ['day_of_week' => 4, 'split_session_id' => $sessions[2]->id],
                ['day_of_week' => 5, 'split_session_id' => $sessions[3]->id],
                ['day_of_week' => 6, 'split_session_id' => null],
                ['day_of_week' => 7, 'split_session_id' => null],
            ],
        ];

        $this->postJson('/api/user/plan', $payload)
            ->assertStatus(201)
            ->assertJsonPath('data.days_per_week', 4)
            ->assertJsonCount(7, 'data.schedules')
            ->assertJsonCount(0, 'warnings')
            ->assertJsonPath('muscle_frequency.chest', 2)
            ->assertJsonPath('muscle_frequency.quads', 2);

        // Save again — previous plan becomes inactive
        $this->postJson('/api/user/plan', $payload)->assertStatus(201);

        $this->assertEquals(
            1,
            UserPlan::where('user_id', $user->id)->where('is_active', true)->count()
        );
        $this->assertEquals(2, UserPlan::where('user_id', $user->id)->count());
    }

    public function test_advisory_warnings_do_not_block_saving_and_detect_missing_muscles(): void
    {
        $this->seed(SplitSeeder::class);
        $user = User::factory()->create(['role' => 'client']);
        Sanctum::actingAs($user);

        $split = Split::where('slug', 'full-body')->with('sessions')->firstOrFail();
        $sessionA = $split->sessions[0];
        $sessionB = $split->sessions[1];

        // Put Full Body on every single day (consecutive same muscle + no rest day + day count mismatch)
        $schedule = collect(range(1, 7))->map(fn (int $day) => [
            'day_of_week' => $day,
            'split_session_id' => $day % 2 === 1 ? $sessionA->id : $sessionB->id,
        ])->all();

        $response = $this->postJson('/api/user/plan', [
            'split_id' => $split->id,
            'days_per_week' => 3,
            'schedule' => $schedule,
        ]);

        $response->assertStatus(201);
        $codes = collect($response->json('warnings'))->pluck('code')->all();
        $this->assertContains('no_rest_day', $codes);
        $this->assertContains('consecutive_muscle_overlap', $codes);
        $this->assertContains('days_count_mismatch', $codes);

        // Now test Upper-only placement on Upper/Lower -> should warn missing lower body & back/chest checks appropriately
        $ulSplit = Split::where('slug', 'upper-lower')->with('sessions')->firstOrFail();
        $upperA = $ulSplit->sessions->firstWhere('slug', 'upper-a');

        $upperOnlySchedule = [
            ['day_of_week' => 1, 'split_session_id' => $upperA->id],
            ['day_of_week' => 2, 'split_session_id' => null],
            ['day_of_week' => 3, 'split_session_id' => null],
            ['day_of_week' => 4, 'split_session_id' => $upperA->id],
            ['day_of_week' => 5, 'split_session_id' => null],
            ['day_of_week' => 6, 'split_session_id' => null],
            ['day_of_week' => 7, 'split_session_id' => null],
        ];

        $valRes = $this->postJson('/api/user/plan/validate-schedule', [
            'split_id' => $ulSplit->id,
            'days_per_week' => 2,
            'schedule' => $upperOnlySchedule,
        ]);

        $valRes->assertStatus(200);
        $valCodes = collect($valRes->json('warnings'))->pluck('code')->all();
        $this->assertContains('no_lower_body_session', $valCodes);
        $this->assertNotContains('no_chest_session', $valCodes);
        $this->assertNotContains('no_back_session', $valCodes);

        // Now test Lower-only placement -> missing chest and missing back warnings
        $lowerA = $ulSplit->sessions->firstWhere('slug', 'lower-a');
        $lowerOnlySchedule = [
            ['day_of_week' => 1, 'split_session_id' => $lowerA->id],
            ['day_of_week' => 2, 'split_session_id' => null],
            ['day_of_week' => 3, 'split_session_id' => null],
            ['day_of_week' => 4, 'split_session_id' => $lowerA->id],
            ['day_of_week' => 5, 'split_session_id' => null],
            ['day_of_week' => 6, 'split_session_id' => null],
            ['day_of_week' => 7, 'split_session_id' => null],
        ];

        $valLower = $this->postJson('/api/user/plan/validate-schedule', [
            'split_id' => $ulSplit->id,
            'days_per_week' => 2,
            'schedule' => $lowerOnlySchedule,
        ]);
        $lowerCodes = collect($valLower->json('warnings'))->pluck('code')->all();
        $this->assertContains('no_chest_session', $lowerCodes);
        $this->assertContains('no_back_session', $lowerCodes);
        $this->assertNotContains('no_lower_body_session', $lowerCodes);
    }

    public function test_consecutive_anterior_posterior_or_push_pull_do_not_trigger_false_shoulder_overlap(): void
    {
        $this->seed(SplitSeeder::class);
        $user = User::factory()->create(['role' => 'client']);
        Sanctum::actingAs($user);

        $apSplit = Split::where('slug', 'anterior-posterior-4d')->with('sessions')->firstOrFail();
        $antA = $apSplit->sessions->firstWhere('slug', 'anterior-a');
        $postA = $apSplit->sessions->firstWhere('slug', 'posterior-a');
        $antB = $apSplit->sessions->firstWhere('slug', 'anterior-b');
        $postB = $apSplit->sessions->firstWhere('slug', 'posterior-b');

        $response = $this->postJson('/api/user/plan/validate-schedule', [
            'split_id' => $apSplit->id,
            'days_per_week' => 4,
            'schedule' => [
                ['day_of_week' => 1, 'split_session_id' => $antA->id],
                ['day_of_week' => 2, 'split_session_id' => $postA->id],
                ['day_of_week' => 3, 'split_session_id' => null],
                ['day_of_week' => 4, 'split_session_id' => $antB->id],
                ['day_of_week' => 5, 'split_session_id' => $postB->id],
                ['day_of_week' => 6, 'split_session_id' => null],
                ['day_of_week' => 7, 'split_session_id' => null],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonCount(0, 'warnings');
    }

    public function test_existing_legacy_two_day_full_body_user_plan_migrates_safely_on_reseed(): void
    {
        // Simulate a legacy pre-migration 2-day plan attached to `full-body`
        $legacySplit = Split::create([
            'slug' => 'full-body',
            'name' => 'Full Body',
            'description' => 'Legacy full body',
            'days_per_week' => 3,
            'recommendation_level' => 'recommended',
            'min_days' => 2,
            'max_days' => 3,
            'pros' => ['Pro 1'],
            'cons' => ['Con 1'],
            'suitable_for' => 'Beginners',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $legacyA = SplitSession::create([
            'split_id' => $legacySplit->id,
            'slug' => 'full-body-a',
            'name' => 'Full Body A',
            'session_type' => 'full_body',
            'muscle_groups' => ['chest', 'back', 'quads'],
            'default_day_of_week' => 1,
            'sort_order' => 1,
        ]);

        $legacyB = SplitSession::create([
            'split_id' => $legacySplit->id,
            'slug' => 'full-body-b',
            'name' => 'Full Body B',
            'session_type' => 'full_body',
            'muscle_groups' => ['chest', 'back', 'hamstrings'],
            'default_day_of_week' => 3,
            'sort_order' => 2,
        ]);

        $user = User::factory()->create(['role' => 'client']);
        $plan = UserPlan::create([
            'user_id' => $user->id,
            'split_id' => $legacySplit->id,
            'days_per_week' => 2,
            'is_active' => true,
            'onboarding_completed_at' => now(),
        ]);

        PlanSchedule::create(['user_plan_id' => $plan->id, 'day_of_week' => 1, 'split_session_id' => $legacyA->id]);
        PlanSchedule::create(['user_plan_id' => $plan->id, 'day_of_week' => 4, 'split_session_id' => $legacyB->id]);
        DailySession::create([
            'user_id' => $user->id,
            'user_plan_id' => $plan->id,
            'split_session_id' => $legacyA->id,
            'session_date' => now()->toDateString(),
            'status' => 'done',
        ]);

        // Run new SplitSeeder (which adds full-body-2d and migrates 2-day plans)
        $this->seed(SplitSeeder::class);

        $migratedPlan = UserPlan::findOrFail($plan->id);
        $split2d = Split::where('slug', 'full-body-2d')->with('sessions')->firstOrFail();

        $this->assertEquals($split2d->id, $migratedPlan->split_id);

        Sanctum::actingAs($user);
        $this->getJson('/api/user/plan')
            ->assertStatus(200)
            ->assertJsonPath('data.split.slug', 'full-body-2d')
            ->assertJsonPath('muscle_frequency.chest', 2);

        $this->getJson('/api/daily-sessions/today')
            ->assertStatus(200)
            ->assertJsonPath('has_plan', true)
            ->assertJsonPath('data.status', 'done');
    }

    public function test_rejects_session_from_another_split_with_422(): void
    {
        $this->seed(SplitSeeder::class);
        $user = User::factory()->create(['role' => 'client']);
        Sanctum::actingAs($user);

        $upperLower = Split::where('slug', 'upper-lower')->with('sessions')->firstOrFail();
        $fullBody = Split::where('slug', 'full-body')->with('sessions')->firstOrFail();

        $schedule = [
            ['day_of_week' => 1, 'split_session_id' => $fullBody->sessions[0]->id], // wrong split!
            ['day_of_week' => 2, 'split_session_id' => null],
            ['day_of_week' => 3, 'split_session_id' => null],
            ['day_of_week' => 4, 'split_session_id' => null],
            ['day_of_week' => 5, 'split_session_id' => null],
            ['day_of_week' => 6, 'split_session_id' => null],
            ['day_of_week' => 7, 'split_session_id' => null],
        ];

        $this->postJson('/api/user/plan', [
            'split_id' => $upperLower->id,
            'days_per_week' => 4,
            'schedule' => $schedule,
        ])->assertStatus(422);
    }

    public function test_split_show_defaults_to_recommended_exercises(): void
    {
        $this->seed(SplitSeeder::class);
        $split = Split::where('slug', 'upper-lower')->with('sessions')->firstOrFail();
        $upper = $split->sessions->first();

        $starter = Exercise::create([
            'name' => 'Starter Push Up',
            'slug' => 'starter-push-up',
            'primary_muscle' => 'chest',
            'is_active' => true,
        ]);
        $extra = Exercise::create([
            'name' => 'Extra Fly',
            'slug' => 'extra-fly',
            'primary_muscle' => 'chest',
            'is_active' => true,
        ]);

        $upper->exercises()->attach($starter->id, ['is_default_recommended' => true, 'sort_order' => 1]);
        $upper->exercises()->attach($extra->id, ['is_default_recommended' => false, 'sort_order' => 2]);

        Sanctum::actingAs(User::factory()->create(['role' => 'client']));

        $this->getJson("/api/splits/{$split->id}")
            ->assertStatus(200)
            ->assertJsonCount(1, 'data.sessions.0.exercises')
            ->assertJsonPath('data.sessions.0.exercises.0.slug', 'starter-push-up');
    }
}
