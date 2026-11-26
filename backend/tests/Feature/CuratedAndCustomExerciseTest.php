<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutLog;
use Database\Seeders\CuratedExerciseSeeder;
use Database\Seeders\SplitSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CuratedAndCustomExerciseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SplitSeeder::class);
        $this->seed(CuratedExerciseSeeder::class);
    }

    public function test_curated_seeder_populates_at_least_50_exercises_and_is_idempotent(): void
    {
        $firstCount = Exercise::official()->count();
        $this->assertGreaterThanOrEqual(50, $firstCount);

        // Running seeder a second time must not duplicate records
        $this->seed(CuratedExerciseSeeder::class);
        $this->assertSame($firstCount, Exercise::official()->count());

        // Filter by muscle_region works (authenticated)
        Sanctum::actingAs(User::factory()->create(['role' => 'client']));
        $res = $this->getJson('/api/exercises?muscle_region=upper_chest');
        $res->assertOk();
        $this->assertGreaterThanOrEqual(3, count($res->json('data')));
    }

    public function test_custom_exercise_approval_workflow_privacy_and_authorization(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);
        $linkedTrainer = User::factory()->create(['role' => 'trainer']);
        $otherTrainer = User::factory()->create(['role' => 'trainer']);
        $clientA = User::factory()->create(['role' => 'client', 'trainer_id' => $linkedTrainer->id]);
        $clientB = User::factory()->create(['role' => 'client']);

        // 1. Client A submits a custom exercise with an optional image
        Sanctum::actingAs($clientA);
        $createRes = $this->post('/api/my-exercises', [
            'name' => 'Landmine Chest Press',
            'primary_muscle' => 'chest',
            'muscle_region' => 'upper_chest',
            'equipment' => 'barbell',
            'notes' => 'Dorong miring ke atas sambil menjaga core kencang.',
            'session_types' => ['push', 'upper'],
            'image' => UploadedFile::fake()->create('landmine.jpg', 100, 'image/jpeg'),
        ], ['Accept' => 'application/json']);

        $createRes->assertCreated()
            ->assertJsonPath('data.is_custom', true)
            ->assertJsonPath('data.approval_status', 'pending')
            ->assertJsonPath('data.is_active', false);

        $customId = $createRes->json('data.id');

        // 2. Duplicate case-insensitive name by Client A is rejected (422)
        $this->postJson('/api/my-exercises', [
            'name' => 'landmine chest press',
            'primary_muscle' => 'chest',
            'equipment' => 'barbell',
        ])->assertStatus(422)->assertJsonValidationErrors(['name']);

        // 3. Pending custom exercise is NOT yet in /api/exercises and cannot be logged yet
        $libBefore = $this->getJson('/api/exercises?search=Landmine');
        $libBefore->assertOk();
        $this->assertCount(0, $libBefore->json('data'));

        $this->postJson('/api/workout-logs', [
            'logs' => [
                ['exercise_id' => $customId, 'set_number' => 1, 'weight' => 20, 'reps' => 10],
            ],
        ])->assertStatus(422);

        // 4. Admin approves (ACC) Client A's custom exercise
        Sanctum::actingAs($admin);
        $this->postJson("/api/admin/exercises/{$customId}/review", [
            'action' => 'approve',
        ])->assertOk()
            ->assertJsonPath('data.approval_status', 'approved')
            ->assertJsonPath('data.is_active', true);

        // 5. Client A now sees it in /api/exercises and can log sets with it
        Sanctum::actingAs($clientA);
        $libAfter = $this->getJson('/api/exercises?search=Landmine');
        $libAfter->assertOk();
        $this->assertCount(1, $libAfter->json('data'));

        $this->postJson('/api/workout-logs', [
            'logs' => [
                ['exercise_id' => $customId, 'set_number' => 1, 'weight' => 25, 'reps' => 10],
            ],
        ])->assertCreated();

        // 6. Client B CANNOT see, view, edit, delete, or log Client A's custom exercise
        Sanctum::actingAs($clientB);
        $this->assertCount(0, $this->getJson('/api/exercises?search=Landmine')->json('data'));
        $this->getJson("/api/exercises/{$customId}")->assertNotFound();
        $this->patchJson("/api/my-exercises/{$customId}", ['name' => 'Hacked'])->assertForbidden();
        $this->deleteJson("/api/my-exercises/{$customId}")->assertForbidden();
        $this->postJson('/api/workout-logs', [
            'logs' => [
                ['exercise_id' => $customId, 'set_number' => 1, 'weight' => 25, 'reps' => 10],
            ],
        ])->assertForbidden();

        // 7. Linked trainer CAN view Client A's custom exercise (read-only), unlinked trainer CANNOT
        Sanctum::actingAs($linkedTrainer);
        $this->getJson("/api/exercises/{$customId}")->assertOk()->assertJsonPath('data.name', 'Landmine Chest Press');
        $this->patchJson("/api/my-exercises/{$customId}", ['name' => 'Trainer Edit'])->assertForbidden();

        Sanctum::actingAs($otherTrainer);
        $this->getJson("/api/exercises/{$customId}")->assertNotFound();

        // 8. Deleting a custom exercise that has workout_logs archives (soft-deletes) it safely
        Sanctum::actingAs($clientA);
        $this->deleteJson("/api/my-exercises/{$customId}")
            ->assertOk()
            ->assertJsonPath('archived', true);

        $this->assertSoftDeleted('exercises', ['id' => $customId]);

        // WorkoutLog history still resolves the archived exercise name via withTrashed()
        $log = WorkoutLog::with('exercise')->where('exercise_id', $customId)->first();
        $this->assertNotNull($log?->exercise);
        $this->assertSame('Landmine Chest Press', $log->exercise->name);
    }

    public function test_anti_spam_pending_limit_and_admin_reject_and_promote(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $client = User::factory()->create(['role' => 'client']);
        $otherClient = User::factory()->create(['role' => 'client']);

        Sanctum::actingAs($client);
        $createdIds = [];
        for ($i = 1; $i <= 5; $i++) {
            $res = $this->postJson('/api/my-exercises', [
                'name' => "Custom Move {$i}",
                'primary_muscle' => 'back',
                'equipment' => 'cable',
            ]);
            $res->assertCreated();
            $createdIds[] = $res->json('data.id');
        }

        // 6th pending submission must be blocked by anti-spam limit
        $this->postJson('/api/my-exercises', [
            'name' => 'Custom Move 6',
            'primary_muscle' => 'back',
            'equipment' => 'cable',
        ])->assertStatus(422)->assertJsonValidationErrors(['name']);

        // Unused custom exercise is hard-deleted when deleted by owner
        $this->deleteJson("/api/my-exercises/{$createdIds[4]}")
            ->assertOk()
            ->assertJsonPath('archived', false);
        $this->assertDatabaseMissing('exercises', ['id' => $createdIds[4]]);

        // Admin rejects one with reason and promotes another to Official Library
        Sanctum::actingAs($admin);
        $this->postJson("/api/admin/exercises/{$createdIds[0]}/review", [
            'action' => 'reject',
            'rejection_reason' => 'Nama gerakan kurang jelas.',
        ])->assertOk()
            ->assertJsonPath('data.approval_status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'Nama gerakan kurang jelas.');

        $this->postJson("/api/admin/exercises/{$createdIds[1]}/promote")
            ->assertOk()
            ->assertJsonPath('data.is_custom', false)
            ->assertJsonPath('data.user_id', null)
            ->assertJsonPath('data.approval_status', 'approved');

        // Promoted exercise is now visible to otherClient in /api/exercises
        Sanctum::actingAs($otherClient);
        $this->getJson('/api/exercises?search=Custom Move 2')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
