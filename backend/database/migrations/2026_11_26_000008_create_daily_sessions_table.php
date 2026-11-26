<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('user_plan_id')->nullable()->constrained('user_plans')->nullOnDelete();
            $table->foreignId('split_session_id')->nullable()->constrained('split_sessions')->nullOnDelete();
            $table->date('session_date');
            $table->string('status')->default('pending');
            $table->text('trainer_note')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('changed_by_role')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'session_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_sessions');
    }
};
