<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\Split;
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
            ->assertJsonCount(0, 'warnings');

        // Save again — previous plan becomes inactive
        $this->postJson('/api/user/plan', $payload)->assertStatus(201);

        $this->assertEquals(
            1,
            UserPlan::where('user_id', $user->id)->where('is_active', true)->count()
        );
        $this->assertEquals(2, UserPlan::where('user_id', $user->id)->count());
    }

    public function test_advisory_warnings_do_not_block_saving(): void
    {
        $this->seed(SplitSeeder::class);
        $user = User::factory()->create(['role' => 'client']);
        Sanctum::actingAs($user);

        $split = Split::where('slug', 'full-body')->with('sessions')->firstOrFail();
        $sessionA = $split->sessions[0];
        $sessionB = $split->sessions[1];

        // Put Full Body on every single day (consecutive same muscle + no rest day)
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
