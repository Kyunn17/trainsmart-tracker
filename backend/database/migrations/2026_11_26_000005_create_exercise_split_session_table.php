<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exercise_split_session', function (Blueprint $table) {
            $table->id();
            $table->foreignId('split_session_id')->constrained('split_sessions')->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained('exercises')->cascadeOnDelete();
            $table->boolean('is_default_recommended')->default(false);
            $table->unsignedTinyInteger('default_sets')->default(3);
            $table->string('default_rep_range')->default('8-12');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['split_session_id', 'exercise_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exercise_split_session');
    }
};
