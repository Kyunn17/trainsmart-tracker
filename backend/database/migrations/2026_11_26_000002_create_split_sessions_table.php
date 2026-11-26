<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('split_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('split_id')->constrained('splits')->cascadeOnDelete();
            $table->string('slug');
            $table->string('name');
            $table->string('session_type');
            $table->json('muscle_groups');
            $table->unsignedTinyInteger('default_day_of_week')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['split_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('split_sessions');
    }
};
