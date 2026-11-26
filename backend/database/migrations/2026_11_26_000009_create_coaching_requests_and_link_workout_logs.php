<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coaching_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('trainer_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->text('message')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->index(['trainer_id', 'status']);
            $table->index(['client_id', 'status']);
        });

        Schema::table('workout_logs', function (Blueprint $table) {
            $table->foreignId('daily_session_id')
                ->nullable()
                ->after('exercise_id')
                ->constrained('daily_sessions')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('workout_logs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('daily_session_id');
        });

        Schema::dropIfExists('coaching_requests');
    }
};
