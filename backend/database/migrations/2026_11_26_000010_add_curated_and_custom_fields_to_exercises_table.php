<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            if (!Schema::hasColumn('exercises', 'user_id')) {
                $table->foreignId('user_id')
                    ->nullable()
                    ->after('category_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('exercises', 'muscle_region')) {
                $table->string('muscle_region', 60)
                    ->nullable()
                    ->after('primary_muscle')
                    ->index();
            }

            if (!Schema::hasColumn('exercises', 'is_custom')) {
                $table->boolean('is_custom')
                    ->default(false)
                    ->after('is_active')
                    ->index();
            }

            if (!Schema::hasColumn('exercises', 'approval_status')) {
                $table->string('approval_status', 20)
                    ->default('approved')
                    ->after('is_custom')
                    ->index();
            }

            if (!Schema::hasColumn('exercises', 'rejection_reason')) {
                $table->string('rejection_reason', 500)
                    ->nullable()
                    ->after('approval_status');
            }

            if (!Schema::hasColumn('exercises', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        // Purge all third-party free-exercise-db records completely for licensing cleanliness.
        $externalIds = DB::table('exercises')
            ->where('source', 'free-exercise-db')
            ->pluck('id');

        if ($externalIds->isNotEmpty()) {
            DB::table('exercise_images')->whereIn('exercise_id', $externalIds)->delete();
            DB::table('exercise_split_session')->whereIn('exercise_id', $externalIds)->delete();
            DB::table('workout_logs')->whereIn('exercise_id', $externalIds)->delete();
            DB::table('exercises')->whereIn('id', $externalIds)->delete();
        }
    }

    public function down(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            if (Schema::hasColumn('exercises', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }

            $columns = array_values(array_filter([
                Schema::hasColumn('exercises', 'muscle_region') ? 'muscle_region' : null,
                Schema::hasColumn('exercises', 'is_custom') ? 'is_custom' : null,
                Schema::hasColumn('exercises', 'approval_status') ? 'approval_status' : null,
                Schema::hasColumn('exercises', 'rejection_reason') ? 'rejection_reason' : null,
                Schema::hasColumn('exercises', 'deleted_at') ? 'deleted_at' : null,
            ]));

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
