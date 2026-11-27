<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('splits', function (Blueprint $table) {
            $table->unsignedTinyInteger('days_per_week')->nullable()->after('description');
            $table->string('recommendation_level', 24)->default('recommended')->after('days_per_week');
            $table->text('not_recommended_reason')->nullable()->after('suitable_for');

            $table->index(['days_per_week', 'recommendation_level', 'is_active'], 'splits_days_rec_active_idx');
        });

        DB::table('splits')
            ->whereNull('days_per_week')
            ->update(['days_per_week' => DB::raw('max_days')]);

        Schema::table('split_sessions', function (Blueprint $table) {
            $table->json('muscle_regions')->nullable()->after('muscle_groups');
            $table->boolean('is_heavy')->default(false)->after('muscle_regions');
        });
    }

    public function down(): void
    {
        Schema::table('splits', function (Blueprint $table) {
            $table->dropIndex('splits_days_rec_active_idx');
            $table->dropColumn(['days_per_week', 'recommendation_level', 'not_recommended_reason']);
        });

        Schema::table('split_sessions', function (Blueprint $table) {
            $table->dropColumn(['muscle_regions', 'is_heavy']);
        });
    }
};
