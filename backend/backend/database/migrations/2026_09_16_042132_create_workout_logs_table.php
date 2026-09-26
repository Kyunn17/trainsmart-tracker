<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('workout_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete(); // KTP Gerakan
            $table->integer('set_number'); // Set ke-berapa
            $table->decimal('weight', 5, 2); // Beban dalam Kg (pake decimal biar bisa nyimpen 2.5 kg)
            $table->integer('reps'); // Jumlah repetisi yang sukses diangkat
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workout_logs');
    }
};
