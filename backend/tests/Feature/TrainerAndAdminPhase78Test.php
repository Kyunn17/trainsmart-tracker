<?php

namespace Tests\Feature;

use App\Models\CoachingRequest;
use App\Models\DailySession;
use App\Models\Exercise;
use App\Models\Split;
use App\Models\User;
use App\Models\UserPlan;
use Carbon\Carbon;
use Database\Seeders\SplitSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TrainerAndAdminPhase78Test extends TestCase
{
    use RefreshDatabase;

    public function test_coaching_request_flow_accept_and_reject(): void
    {
        $trainer = User::factory()->create(['role' => 'trainer']);
        $client1 = User::factory()->create(['role' => 'client', 'trainer_id' => null]);
        $client2 = User::factory()->create(['role' => 'client', 'trainer_id' => null]);

        // Client 1 sends request
        Sanctum::actingAs($client1);
        $res = $this->postJson('/api/client/coaching-requests', [
            'trainer_id' => $trainer->id,
            'message' => 'Mohon bimbingan program hipertrofi.',
        ]);
        $res->assertStatus(201);
        $reqId1 = $res->json('data.id');

        // Duplicate pending request rejected with 422
        $this->postJson('/api/client/coaching-requests', [
            'trainer_id' => $trainer->id,
        ])->assertStatus(422);

        // Client 2 sends request
        Sanctum::actingAs($client2);
        $res2 = $this->postJson('/api/client/coaching-requests', [
            'trainer_id' => $trainer->id,
        ])->assertStatus(201);
        $reqId2 = $res2->json('data.id');

        // Trainer accepts client 1 and rejects client 2
        Sanctum::actingAs($trainer);
        $this->getJson('/api/trainer/coaching-requests')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data');

        $this->patchJson("/api/trainer/coaching-requests/{$reqId1}", ['status' => 'accepted'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'accepted');

        $this->patchJson("/api/trainer/coaching-requests/{$reqId2}", ['status' => 'rejected'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'rejected');

        $this->assertDatabaseHas('users', [
            'id' => $client1->id,
            'trainer_id' => $trainer->id,
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $client2->id,
            'trainer_id' => null,
        ]);
    }

    public function test_trainer_can_view_client_today_and_override_with_conflict_enforcement(): void
    {
        $this->seed(SplitSeeder::class);
        $trainer = User::factory()->create(['role' => 'trainer']);
        $otherTrainer = User::factory()->create(['role' => 'trainer']);
        $client = User::factory()->create(['role' => 'client', 'trainer_id' => $trainer->id]);

        $split = Split::where('slug', 'upper-lower')->with('sessions')->firstOrFail();
        $plan = UserPlan::create([
            'user_id' => $client->id,
            'split_id' => $split->id,
            'days_per_week' => 4,
            'is_active' => true,
        ]);

        $todayStr = Carbon::today()->toDateString();

        // Unlinked trainer gets 403
        Sanctum::actingAs($otherTrainer);
        $this->getJson("/api/trainer/clients/{$client->id}/today")->assertStatus(403);

        // Linked trainer can view today & override
        Sanctum::actingAs($trainer);
        $this->getJson("/api/trainer/clients/{$client->id}/today")
            ->assertStatus(200)
            ->assertJsonPath('has_plan', true);

        $overrideRes = $this->patchJson("/api/trainer/clients/{$client->id}/daily-sessions/{$todayStr}", [
            'status' => 'rest',
            'trainer_note' => 'Istirahat hari ini untuk pemulihan bahu.',
        ]);
        $overrideRes->assertStatus(200)
            ->assertJsonPath('data.status', 'rest')
            ->assertJsonPath('data.changed_by_role', 'trainer');

        $dailyId = $overrideRes->json('data.id');

        // Client trying to overwrite trainer override receives 409 Conflict
        Sanctum::actingAs($client);
        $this->patchJson("/api/daily-sessions/{$dailyId}/status", ['status' => 'done'])
            ->assertStatus(409);
    }

    public function test_admin_can_manage_exercises_images_and_splits(): void
    {
        Storage::fake('public');
        $this->seed(SplitSeeder::class);

        $admin = User::factory()->create(['role' => 'admin']);
        $client = User::factory()->create(['role' => 'client']);

        // Non-admin rejected
        Sanctum::actingAs($client);
        $this->getJson('/api/admin/exercises')->assertStatus(403);
        $this->getJson('/api/admin/splits')->assertStatus(403);

        Sanctum::actingAs($admin);

        // Create exercise
        $createRes = $this->postJson('/api/admin/exercises', [
            'name' => 'Cable Chest Fly',
            'primary_muscle' => 'chest',
            'equipment' => 'cable',
            'difficulty' => 'beginner',
            'is_beginner_friendly' => true,
            'instructions' => ['Berdiri di tengah mesin cable', 'Rapatkan kedua pegangan di depan dada'],
        ]);
        $createRes->assertStatus(201)->assertJsonPath('data.slug', 'cable-chest-fly');
        $exerciseId = $createRes->json('data.id');

        // Upload valid image
        $fakeImg = UploadedFile::fake()->create('fly-start.jpg', 120, 'image/jpeg');
        $uploadRes = $this->postJson("/api/admin/exercises/{$exerciseId}/images", [
            'image' => $fakeImg,
            'position' => 0,
        ]);
        $uploadRes->assertStatus(201);
        $imageId = $uploadRes->json('data.id');
        $storedPath = $uploadRes->json('data.path');
        Storage::disk('public')->assertExists($storedPath);

        // Invalid mime rejected
        $badFile = UploadedFile::fake()->create('script.txt', 20, 'text/plain');
        $this->postJson("/api/admin/exercises/{$exerciseId}/images", [
            'image' => $badFile,
            'position' => 1,
        ])->assertStatus(422);

        // Delete image
        $this->deleteJson("/api/admin/exercises/{$exerciseId}/images/{$imageId}")
            ->assertStatus(200);
        Storage::disk('public')->assertMissing($storedPath);

        // Deactivate exercise
        $this->patchJson("/api/admin/exercises/{$exerciseId}", ['is_active' => false])
            ->assertStatus(200)
            ->assertJsonPath('data.is_active', false);

        // Admin splits list & update
        $split = Split::where('slug', 'full-body')->firstOrFail();
        $this->getJson('/api/admin/splits')->assertStatus(200);
        $this->patchJson("/api/admin/splits/{$split->id}", [
            'suitable_for' => 'Pemula yang berlatih 2-3 kali seminggu.',
        ])->assertStatus(200)
            ->assertJsonPath('data.suitable_for', 'Pemula yang berlatih 2-3 kali seminggu.');
    }
}
