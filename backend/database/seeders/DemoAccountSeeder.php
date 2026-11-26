<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoAccountSeeder extends Seeder
{
    /**
     * Seed 3 akun khusus: Member (client), Trainer, dan Admin.
     * Idempotent: dijalankan ulang akan memperbarui akun yang sama (berdasarkan email).
     */
    public function run(): void
    {
        $trainer = User::updateOrCreate(
            ['email' => 'trainer@trainsmart.test'],
            [
                'name' => 'Coach Trainer',
                'password' => Hash::make('Trainer#12345'),
                'role' => 'trainer',
                'phone' => '+628111000002',
                'specialization' => 'Hypertrophy & Strength Coach',
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin@trainsmart.test'],
            [
                'name' => 'Admin TrainSmart',
                'password' => Hash::make('Admin#12345'),
                'role' => 'admin',
                'phone' => '+628111000003',
            ]
        );

        User::updateOrCreate(
            ['email' => 'member@trainsmart.test'],
            [
                'name' => 'Member Demo',
                'password' => Hash::make('Member#12345'),
                'role' => 'client',
                'trainer_id' => $trainer->id,
                'phone' => '+628111000001',
            ]
        );
    }
}
