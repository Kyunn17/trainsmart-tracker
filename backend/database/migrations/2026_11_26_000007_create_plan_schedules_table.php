<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_plan_id')->constrained('user_plans')->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week');
            $table->foreignId('split_session_id')->nullable()->constrained('split_sessions')->nullOnDelete();
            $table->timestamps();

            $table->unique(['user_plan_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_schedules');
    }
};
