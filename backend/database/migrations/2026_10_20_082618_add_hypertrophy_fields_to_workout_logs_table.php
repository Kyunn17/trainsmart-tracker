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
        Schema::table('workout_logs', function (Blueprint $table) {
            $table->unsignedTinyInteger('rir')->nullable()->after('reps')->comment('Reps In Reserve (0=Failure, 1-4=Hypertrophy buffer)');
            $table->decimal('rpe', 3, 1)->nullable()->after('rir')->comment('Rate of Perceived Exertion (6.0 - 10.0)');
            $table->text('notes')->nullable()->after('rpe')->comment('Hypertrophy notes: tempo, form cues, pump feel, seat settings');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workout_logs', function (Blueprint $table) {
            $table->dropColumn(['rir', 'rpe', 'notes']);
        });
    }
};
