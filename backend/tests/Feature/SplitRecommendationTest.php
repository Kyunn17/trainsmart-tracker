<?php

namespace Tests\Feature;

use App\Models\Split;
use Database\Seeders\SplitSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SplitRecommendationTest extends TestCase
{
    use RefreshDatabase;

    public function test_split_seeder_is_idempotent(): void
    {
        $this->seed(SplitSeeder::class);
        $this->seed(SplitSeeder::class);

        $this->assertDatabaseCount('splits', 5);
        $this->assertDatabaseHas('splits', ['slug' => 'full-body', 'min_days' => 2, 'max_days' => 3]);
        $this->assertDatabaseHas('splits', ['slug' => 'upper-lower', 'min_days' => 4, 'max_days' => 4]);
        $this->assertDatabaseHas('splits', ['slug' => 'ppl-ul', 'min_days' => 5, 'max_days' => 5]);
        $this->assertDatabaseHas('splits', ['slug' => 'ppl-ap', 'min_days' => 5, 'max_days' => 5]);
        $this->assertDatabaseHas('splits', ['slug' => 'ppl-2x', 'min_days' => 6, 'max_days' => 6]);
    }

    public function test_recommendations_for_2_and_3_days_return_full_body(): void
    {
        $this->seed(SplitSeeder::class);

        foreach ([2, 3] as $days) {
            $response = $this->getJson("/api/splits/recommendations?days={$days}");
            $response->assertStatus(200)
                ->assertJsonPath('status', 'success')
                ->assertJsonPath('days', $days)
                ->assertJsonCount(1, 'data')
                ->assertJsonPath('data.0.slug', 'full-body');
        }
    }

    public function test_recommendations_for_4_days_return_upper_lower(): void
    {
        $this->seed(SplitSeeder::class);

        $response = $this->getJson('/api/splits/recommendations?days=4');
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'upper-lower')
            ->assertJsonCount(4, 'data.0.sessions');
    }

    public function test_recommendations_for_5_days_return_ppl_ul_and_ppl_ap(): void
    {
        $this->seed(SplitSeeder::class);

        $response = $this->getJson('/api/splits/recommendations?days=5');
        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');

        $slugs = collect($response->json('data'))->pluck('slug')->all();
        $this->assertEquals(['ppl-ul', 'ppl-ap'], $slugs);
    }

    public function test_recommendations_for_6_days_return_ppl_2x(): void
    {
        $this->seed(SplitSeeder::class);

        $response = $this->getJson('/api/splits/recommendations?days=6');
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'ppl-2x')
            ->assertJsonCount(6, 'data.0.sessions');
    }

    public function test_recommendations_validate_days_range(): void
    {
        $this->getJson('/api/splits/recommendations')->assertStatus(422);
        $this->getJson('/api/splits/recommendations?days=1')->assertStatus(422);
        $this->getJson('/api/splits/recommendations?days=7')->assertStatus(422);
    }

    public function test_show_split_returns_sessions_or_404(): void
    {
        $this->seed(SplitSeeder::class);
        $split = Split::where('slug', 'upper-lower')->firstOrFail();

        $this->getJson("/api/splits/{$split->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.slug', 'upper-lower')
            ->assertJsonCount(4, 'data.sessions');

        $this->getJson('/api/splits/999999')
            ->assertStatus(404);
    }
}
