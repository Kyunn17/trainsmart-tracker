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
        // 1. Kategori Latihan Utama (legacy compatibility)
        Category::firstOrCreate(['name' => 'Push']);
        Category::firstOrCreate(['name' => 'Pull']);
        Category::firstOrCreate(['name' => 'Legs']);

        // 2. Seed Users for 3 Roles: Admin, Trainer, Client
        User::firstOrCreate(
            ['email' => 'admin@trainsmart.com'],
            [
                'name' => 'Head Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'phone' => '+628111000999',
                'specialization' => 'Gym Director & System Administrator',
            ]
        );

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

        User::firstOrCreate(
            ['email' => 'chris@trainsmart.com'],
            [
                'name' => 'Coach Chris',
                'password' => Hash::make('password123'),
                'role' => 'trainer',
                'phone' => '+628987654321',
                'specialization' => 'Strength & Classic Physique Coach',
            ]
        );

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

        User::firstOrCreate(
            ['email' => 'sarah@trainsmart.com'],
            [
                'name' => 'Sarah Fit',
                'password' => Hash::make('password123'),
                'role' => 'client',
                'trainer_id' => null,
                'phone' => '+62813888999',
            ]
        );

        // 3. Seed Indonesian workout splits & curated 53-exercise official library
        $this->call([
            SplitSeeder::class,
            CuratedExerciseSeeder::class,
        ]);

        // 4. Sample initial log for client Budi
        $incDb = Exercise::where('slug', 'incline-dumbbell-press')->first();
        if ($incDb && WorkoutLog::where('user_id', $clientBudi->id)->count() === 0) {
            WorkoutLog::create([
                'user_id' => $clientBudi->id,
                'exercise_id' => $incDb->id,
                'set_number' => 1,
                'weight' => 26.0,
                'reps' => 10,
                'rir' => 1,
                'rpe' => 9.0,
                'notes' => 'Regangan terasa bagus di bawah, tempo 3-0-1',
            ]);
            WorkoutLog::create([
                'user_id' => $clientBudi->id,
                'exercise_id' => $incDb->id,
                'set_number' => 2,
                'weight' => 26.0,
                'reps' => 8,
                'rir' => 0,
                'rpe' => 10.0,
                'notes' => 'Set terakhir dekat failure dengan kontrol penuh',
            ]);
        }
    }
}
