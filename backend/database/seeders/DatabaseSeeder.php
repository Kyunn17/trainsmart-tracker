<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Category;
use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutLog;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Kategori Latihan Utama
        $push = Category::firstOrCreate(['name' => 'Push']);
        $pull = Category::firstOrCreate(['name' => 'Pull']);
        $legs = Category::firstOrCreate(['name' => 'Legs']);

        // 2. Gerakan PUSH
        $incDb = Exercise::firstOrCreate(['category_id' => $push->id, 'name' => 'Incline Dumbbell Press']);
        Exercise::firstOrCreate(['category_id' => $push->id, 'name' => 'Bench Press']);
        Exercise::firstOrCreate(['category_id' => $push->id, 'name' => 'Push Up']);
        Exercise::firstOrCreate(['category_id' => $push->id, 'name' => 'Dips']);

        // 3. Gerakan PULL
        Exercise::firstOrCreate(['category_id' => $pull->id, 'name' => 'Lat Pulldown']);
        Exercise::firstOrCreate(['category_id' => $pull->id, 'name' => 'Pull Up']);
        Exercise::firstOrCreate(['category_id' => $pull->id, 'name' => 'Barbell Row']);

        // 4. Gerakan LEGS
        Exercise::firstOrCreate(['category_id' => $legs->id, 'name' => 'Squat']);
        Exercise::firstOrCreate(['category_id' => $legs->id, 'name' => 'Leg Press']);
        Exercise::firstOrCreate(['category_id' => $legs->id, 'name' => 'Calf Raise']);

        // 5. Seed Users for 3 Roles: Admin, Trainer, Client
        // Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@trainsmart.com'],
            [
                'name' => 'Head Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'phone' => '+628111000999',
                'specialization' => 'Gym Director & System Administrator',
            ]
        );

        // Personal Trainer 1
        $trainerArnold = User::firstOrCreate(
            ['email' => 'arnold@trainsmart.com'],
            [
                'name' => 'Coach Arnold',
                'password' => Hash::make('password123'),
                'role' => 'trainer',
                'phone' => '+628123456789',
                'specialization' => 'Hypertrophy & Chest Specialist',
            ]
        );

        // Personal Trainer 2
        $trainerChris = User::firstOrCreate(
            ['email' => 'chris@trainsmart.com'],
            [
                'name' => 'Coach Chris',
                'password' => Hash::make('password123'),
                'role' => 'trainer',
                'phone' => '+628987654321',
                'specialization' => 'Strength & Classic Physique Coach',
            ]
        );

        // Client 1 (Assigned to Coach Arnold)
        $clientBudi = User::firstOrCreate(
            ['email' => 'budi@trainsmart.com'],
            [
                'name' => 'Budi GymBro',
                'password' => Hash::make('password123'),
                'role' => 'client',
                'trainer_id' => $trainerArnold->id,
                'phone' => '+62813555777',
            ]
        );

        // Client 2 (Looking for a trainer)
        $clientSarah = User::firstOrCreate(
            ['email' => 'sarah@trainsmart.com'],
            [
                'name' => 'Sarah Fit',
                'password' => Hash::make('password123'),
                'role' => 'client',
                'trainer_id' => null,
                'phone' => '+62813888999',
            ]
        );

        // Seed Indonesian workout splits & template sessions
        $this->call(SplitSeeder::class);

        // Sample initial log for client Budi
        if (WorkoutLog::where('user_id', $clientBudi->id)->count() === 0) {
            WorkoutLog::create([
                'user_id' => $clientBudi->id,
                'exercise_id' => $incDb->id,
                'set_number' => 1,
                'weight' => 26.0,
                'reps' => 10,
                'rir' => 1,
                'rpe' => 9.0,
                'notes' => 'Great stretch at the bottom, 3-0-1 tempo',
            ]);
            WorkoutLog::create([
                'user_id' => $clientBudi->id,
                'exercise_id' => $incDb->id,
                'set_number' => 2,
                'weight' => 26.0,
                'reps' => 8,
                'rir' => 0,
                'rpe' => 10.0,
                'notes' => 'Hit failure on rep 8, coach assisted rest pause',
            ]);
        }
    }
}