<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\ExerciseImage;
use Database\Seeders\SplitSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExerciseLibraryTest extends TestCase
{
    use RefreshDatabase;

    private function seedSampleExercises(): void
    {
        $this->seed(SplitSeeder::class);

        $bench = Exercise::create([
            'name' => 'Dumbbell Bench Press',
            'slug' => 'dumbbell-bench-press',
            'primary_muscle' => 'chest',
            'secondary_muscles' => ['triceps', 'shoulders'],
            'equipment' => 'dumbbell',
            'movement_pattern' => 'push',
            'difficulty' => 'beginner',
            'is_beginner_friendly' => true,
            'instructions' => ['Lie flat on bench', 'Press dumbbells up'],
            'common_mistakes' => ['Flaring elbows'],
            'tips' => ['Control the eccentric'],
            'is_active' => true,
            'source' => 'free-exercise-db',
        ]);

        ExerciseImage::create([
            'exercise_id' => $bench->id,
            'path' => 'exercises/dumbbell-bench-press/0.jpg',
            'position' => 0,
            'alt_text' => 'Dumbbell Bench Press - posisi awal',
        ]);

        $squat = Exercise::create([
            'name' => 'Barbell Squat',
            'slug' => 'barbell-squat',
            'primary_muscle' => 'quads',
            'secondary_muscles' => ['glutes'],
            'equipment' => 'barbell',
            'movement_pattern' => 'squat',
            'difficulty' => 'intermediate',
            'is_beginner_friendly' => false,
            'instructions' => ['Set barbell on upper back', 'Squat down'],
            'is_active' => true,
            'source' => 'free-exercise-db',
        ]);

        Exercise::create([
            'name' => 'Inactive Exercise',
            'slug' => 'inactive-exercise',
            'primary_muscle' => 'chest',
            'equipment' => 'machine',
            'difficulty' => 'beginner',
            'is_beginner_friendly' => true,
            'is_active' => false,
        ]);

        // Attach bench to Push session
        $pushSession = \App\Models\SplitSession::where('session_type', 'push')->first();
        if ($pushSession) {
            $pushSession->exercises()->attach($bench->id, [
                'is_default_recommended' => true,
                'default_sets' => 3,
                'default_rep_range' => '8-12',
                'sort_order' => 1,
            ]);
        }

        // Attach squat to Legs session
        $legsSession = \App\Models\SplitSession::where('session_type', 'legs')->first();
        if ($legsSession) {
            $legsSession->exercises()->attach($squat->id, [
                'is_default_recommended' => false,
                'default_sets' => 3,
                'default_rep_range' => '8-12',
                'sort_order' => 1,
            ]);
        }
    }

    public function test_can_list_and_filter_active_exercises(): void
    {
        $this->seedSampleExercises();

        $this->getJson('/api/exercises')
            ->assertStatus(200)
            ->assertJsonPath('meta.total', 2);

        $this->getJson('/api/exercises?muscle=chest&equipment=dumbbell')
            ->assertStatus(200)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.slug', 'dumbbell-bench-press');

        $this->getJson('/api/exercises?beginner_only=1')
            ->assertStatus(200)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.slug', 'dumbbell-bench-press');

        $this->getJson('/api/exercises?search=Squat')
            ->assertStatus(200)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.slug', 'barbell-squat');

        $this->getJson('/api/exercises?session_type=push')
            ->assertStatus(200)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.slug', 'dumbbell-bench-press');
    }

    public function test_can_fetch_exercise_detail_by_slug_and_returns_404_when_missing(): void
    {
        $this->seedSampleExercises();

        $this->getJson('/api/exercises/dumbbell-bench-press')
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Dumbbell Bench Press')
            ->assertJsonCount(1, 'data.images');

        $this->getJson('/api/exercises/inactive-exercise')
            ->assertStatus(404);
    }

    public function test_invalid_difficulty_filter_returns_422(): void
    {
        $this->getJson('/api/exercises?difficulty=impossible')
            ->assertStatus(422);
    }
}
