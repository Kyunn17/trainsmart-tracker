<?php

namespace Tests\Feature;

use App\Models\Split;
use App\Models\User;
use Database\Seeders\CuratedExerciseSeeder;
use Database\Seeders\SplitSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SplitRecommendationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create(['role' => 'client']));
    }

    public function test_split_seeder_is_idempotent(): void
    {
        $this->seed(SplitSeeder::class);
        $this->seed(SplitSeeder::class);

        $this->assertDatabaseCount('splits', 18);
        $this->assertDatabaseHas('splits', ['slug' => 'full-body-2d', 'days_per_week' => 2, 'recommendation_level' => 'recommended']);
        $this->assertDatabaseHas('splits', ['slug' => 'full-body', 'days_per_week' => 3, 'recommendation_level' => 'recommended']);
        $this->assertDatabaseHas('splits', ['slug' => 'upper-lower', 'days_per_week' => 4, 'recommendation_level' => 'recommended']);
        $this->assertDatabaseHas('splits', ['slug' => 'ppl-ul', 'days_per_week' => 5, 'recommendation_level' => 'recommended']);
        $this->assertDatabaseHas('splits', ['slug' => 'ppl-ap', 'days_per_week' => 5, 'recommendation_level' => 'alternative']);
        $this->assertDatabaseHas('splits', ['slug' => 'ppl-2x', 'days_per_week' => 6, 'recommendation_level' => 'recommended']);
    }

    public function test_recommendations_return_all_options_ordered_by_level_for_each_day_count(): void
    {
        $this->seed(SplitSeeder::class);

        $expectedByDays = [
            2 => ['full-body-2d', 'upper-lower-2d'],
            3 => ['full-body', 'ul-fb-3d', 'ap-fb-3d', 'ppl-3d'],
            4 => ['upper-lower', 'anterior-posterior-4d', 'ppl-fb-4d', 'bro-split-4d'],
            5 => ['ppl-ul', 'ppl-ap', 'ul-ul-arms-5d', 'bro-split-5d'],
            6 => ['ppl-2x', 'upper-lower-6d', 'anterior-posterior-6d', 'bro-split-6d'],
        ];

        foreach ($expectedByDays as $days => $expectedSlugs) {
            $response = $this->getJson("/api/splits/recommendations?days={$days}");
            $response->assertStatus(200)
                ->assertJsonPath('status', 'success')
                ->assertJsonPath('days', $days)
                ->assertJsonCount(count($expectedSlugs), 'data');

            $actualSlugs = collect($response->json('data'))->pluck('slug')->all();
            $this->assertEquals($expectedSlugs, $actualSlugs, "Unexpected order/slugs for {$days} days");

            $levels = collect($response->json('data'))->pluck('recommendation_level')->all();
            $this->assertEquals('recommended', $levels[0], "First option for {$days} days must be recommended");

            if ($days >= 4) {
                $this->assertEquals('not_recommended', end($levels), "Last option for {$days} days should be not_recommended");
                $lastSplit = collect($response->json('data'))->last();
                $this->assertNotEmpty($lastSplit['not_recommended_reason']);
            }
        }
    }

    public function test_split_includes_computed_muscle_frequency_from_sessions(): void
    {
        $this->seed(SplitSeeder::class);

        $res2d = $this->getJson('/api/splits/recommendations?days=2');
        $res2d->assertStatus(200);
        $fb2d = collect($res2d->json('data'))->firstWhere('slug', 'full-body-2d');
        $this->assertEquals(2, $fb2d['muscle_frequency']['chest']);
        $this->assertEquals(2, $fb2d['muscle_frequency']['quads']);

        $res5d = $this->getJson('/api/splits/recommendations?days=5');
        $res5d->assertStatus(200);
        $ulArms = collect($res5d->json('data'))->firstWhere('slug', 'ul-ul-arms-5d');
        $bro5d = collect($res5d->json('data'))->firstWhere('slug', 'bro-split-5d');

        $this->assertEquals(3, $ulArms['muscle_frequency']['biceps']);
        $this->assertEquals(2, $ulArms['muscle_frequency']['chest']);
        $this->assertEquals(1, $bro5d['muscle_frequency']['chest']);
        $this->assertEquals(1, $bro5d['muscle_frequency']['quads']);
    }

    public function test_recommendations_validate_days_range(): void
    {
        $this->getJson('/api/splits/recommendations')->assertStatus(422);
        $this->getJson('/api/splits/recommendations?days=1')->assertStatus(422);
        $this->getJson('/api/splits/recommendations?days=7')->assertStatus(422);
    }

    public function test_show_split_returns_sessions_in_defined_order_or_404(): void
    {
        $this->seed(SplitSeeder::class);
        $split = Split::where('slug', 'ul-fb-3d')->firstOrFail();

        $response = $this->getJson("/api/splits/{$split->id}");
        $response->assertStatus(200)
            ->assertJsonPath('data.slug', 'ul-fb-3d')
            ->assertJsonCount(3, 'data.sessions');

        $sessionTypes = collect($response->json('data.sessions'))->pluck('session_type')->all();
        $this->assertEquals(['upper', 'lower', 'full_body'], $sessionTypes);

        $this->getJson('/api/splits/999999')
            ->assertStatus(404);
    }

    public function test_curated_exercise_seeder_populates_new_session_templates_by_muscle_region(): void
    {
        $this->seed(SplitSeeder::class);
        $this->seed(CuratedExerciseSeeder::class);

        $apSplit = Split::where('slug', 'ap-fb-3d')->with('sessions.exercises')->firstOrFail();
        $anterior = $apSplit->sessions->firstWhere('session_type', 'anterior');
        $posterior = $apSplit->sessions->firstWhere('session_type', 'posterior');

        $anteriorRegions = $anterior->exercises->pluck('muscle_region')->unique()->all();
        $posteriorRegions = $posterior->exercises->pluck('muscle_region')->unique()->all();

        $this->assertContains('upper_chest', $anteriorRegions);
        $this->assertContains('quads', $anteriorRegions);
        $this->assertContains('biceps', $anteriorRegions);
        $this->assertNotContains('lats', $anteriorRegions);
        $this->assertNotContains('triceps', $anteriorRegions);

        $this->assertContains('lats', $posteriorRegions);
        $this->assertContains('rear_delt', $posteriorRegions);
        $this->assertContains('triceps', $posteriorRegions);
        $this->assertContains('hamstrings', $posteriorRegions);
        $this->assertNotContains('quads', $posteriorRegions);

        $bro5d = Split::where('slug', 'bro-split-5d')->with('sessions.exercises')->firstOrFail();
        foreach ($bro5d->sessions as $session) {
            $this->assertGreaterThan(
                0,
                $session->exercises->count(),
                "Expected exercises populated for {$session->slug}"
            );
        }
    }
}
