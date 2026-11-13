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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'trainer', 'client'])->default('client')->after('email');
            $table->foreignId('trainer_id')->nullable()->after('role')->constrained('users')->nullOnDelete();
            $table->string('phone')->nullable()->after('trainer_id');
            $table->string('specialization')->nullable()->after('phone');
        });

        Schema::table('workout_logs', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workout_logs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['trainer_id']);
            $table->dropColumn(['role', 'trainer_id', 'phone', 'specialization']);
        });
    }
};
