<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->change();

            $table->string('slug')->nullable()->unique()->after('name');
            $table->string('primary_muscle')->nullable()->index()->after('slug');
            $table->json('secondary_muscles')->nullable()->after('primary_muscle');
            $table->string('equipment')->nullable()->index()->after('secondary_muscles');
            $table->string('movement_pattern')->nullable()->after('equipment');
            $table->string('difficulty')->default('beginner')->index()->after('movement_pattern');
            $table->boolean('is_beginner_friendly')->default(false)->index()->after('difficulty');
            $table->json('instructions')->nullable()->after('is_beginner_friendly');
            $table->json('common_mistakes')->nullable()->after('instructions');
            $table->json('tips')->nullable()->after('common_mistakes');
            $table->string('video_url')->nullable()->after('tips');
            $table->boolean('is_active')->default(true)->index()->after('video_url');
            $table->string('source')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            $table->dropColumn([
                'slug',
                'primary_muscle',
                'secondary_muscles',
                'equipment',
                'movement_pattern',
                'difficulty',
                'is_beginner_friendly',
                'instructions',
                'common_mistakes',
                'tips',
                'video_url',
                'is_active',
                'source',
            ]);
        });
    }
};
