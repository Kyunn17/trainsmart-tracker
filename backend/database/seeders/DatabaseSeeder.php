<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Exercise;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Kita bikin 3 kategori utama
        $push = Category::create(['name' => 'Push']);
        $pull = Category::create(['name' => 'Pull']);
        $legs = Category::create(['name' => 'Legs']);

        // 2. Masukin daftar gerakan PUSH
        Exercise::create(['category_id' => $push->id, 'name' => 'Incline Dumbbell Press']);
        Exercise::create(['category_id' => $push->id, 'name' => 'Bench Press']);
        Exercise::create(['category_id' => $push->id, 'name' => 'Push Up']);
        Exercise::create(['category_id' => $push->id, 'name' => 'Dips']);

        // 3. Masukin daftar gerakan PULL
        Exercise::create(['category_id' => $pull->id, 'name' => 'Lat Pulldown']);
        Exercise::create(['category_id' => $pull->id, 'name' => 'Pull Up']);
        Exercise::create(['category_id' => $pull->id, 'name' => 'Barbell Row']);

        // 4. Masukin daftar gerakan LEGS
        Exercise::create(['category_id' => $legs->id, 'name' => 'Squat']);
        Exercise::create(['category_id' => $legs->id, 'name' => 'Leg Press']);
        Exercise::create(['category_id' => $legs->id, 'name' => 'Calf Raise']);
    }
}