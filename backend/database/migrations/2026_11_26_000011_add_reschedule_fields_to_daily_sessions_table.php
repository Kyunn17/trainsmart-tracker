<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('daily_sessions', function (Blueprint $table) {
            if (!Schema::hasColumn('daily_sessions', 'rescheduled_from_date')) {
                $table->date('rescheduled_from_date')->nullable()->after('session_date');
            }
            if (!Schema::hasColumn('daily_sessions', 'rescheduled_to_date')) {
                $table->date('rescheduled_to_date')->nullable()->after('rescheduled_from_date');
            }
            if (!Schema::hasColumn('daily_sessions', 'reschedule_reason')) {
                $table->string('reschedule_reason', 255)->nullable()->after('trainer_note');
            }
        });
    }

    public function down(): void
    {
        Schema::table('daily_sessions', function (Blueprint $table) {
            $cols = array_values(array_filter([
                Schema::hasColumn('daily_sessions', 'rescheduled_from_date') ? 'rescheduled_from_date' : null,
                Schema::hasColumn('daily_sessions', 'rescheduled_to_date') ? 'rescheduled_to_date' : null,
                Schema::hasColumn('daily_sessions', 'reschedule_reason') ? 'reschedule_reason' : null,
            ]));

            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
