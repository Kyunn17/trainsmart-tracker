<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutLog;
use Database\Seeders\CuratedExerciseSeeder;
use Database\Seeders\SplitSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityAndAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SplitSeeder::class);
        $this->seed(CuratedExerciseSeeder::class);
    }

    public function test_unauthenticated_guests_cannot_access_protected_endpoints(): void
    {
        $this->getJson('/api/exercises')->assertUnauthorized();
        $this->getJson('/api/exercises/push-up')->assertUnauthorized();
        $this->getJson('/api/splits/recommendations?days=3')->assertUnauthorized();
        $this->getJson('/api/workout-logs')->assertUnauthorized();
        $this->postJson('/api/workout-logs', ['logs' => []])->assertUnauthorized();
        $this->getJson('/api/my-exercises')->assertUnauthorized();
        $this->getJson('/api/daily-sessions/today')->assertUnauthorized();
        $this->getJson('/api/evaluation/weekly')->assertUnauthorized();
    }

    public function test_public_trainers_directory_does_not_expose_sensitive_contact_fields(): void
    {
        User::factory()->create([
            'name' => 'Coach Secure',
            'email' => 'secret@trainer.test',
            'phone' => '+62899999999',
            'role' => 'trainer',
            'specialization' => 'Strength',
        ]);

        $res = $this->getJson('/api/trainers');
        $res->assertOk()
            ->assertJsonPath('data.0.name', 'Coach Secure')
            ->assertJsonMissingPath('data.0.email')
            ->assertJsonMissingPath('data.0.phone');
    }

    public function test_search_and_custom_exercise_queries_resist_sql_injection(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        Sanctum::actingAs($client);

        $payloads = [
            "' OR '1'='1",
            "%; DROP TABLE exercises; --",
            "1' UNION SELECT id, email, password FROM users --",
            "%%",
        ];

        foreach ($payloads as $sqli) {
            $res = $this->getJson('/api/exercises?search=' . urlencode($sqli));
            $res->assertOk();
            $this->assertCount(0, $res->json('data'), "SQLi payload should return 0 rows: {$sqli}");
        }

        // Verify exercises table is completely intact
        $this->assertGreaterThanOrEqual(50, Exercise::official()->count());
    }

    public function test_workout_logs_history_is_strictly_scoped_to_authenticated_user(): void
    {
        $exercise = Exercise::official()->firstOrFail();
        $clientA = User::factory()->create(['role' => 'client']);
        $clientB = User::factory()->create(['role' => 'client']);

        WorkoutLog::create([
            'user_id' => $clientA->id,
            'exercise_id' => $exercise->id,
            'set_number' => 1,
            'weight' => 50,
            'reps' => 10,
        ]);

        // Client B must not see Client A's logs
        Sanctum::actingAs($clientB);
        $this->getJson('/api/workout-logs')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // Client A sees their own log
        Sanctum::actingAs($clientA);
        $this->getJson('/api/workout-logs')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
