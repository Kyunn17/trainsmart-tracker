<?php

namespace App\Services;

use App\Models\DailySession;
use App\Models\User;
use App\Models\UserPlan;
use App\Models\WorkoutLog;
use Carbon\Carbon;

class WeeklyEvaluationService
{
    private const DAY_NAMES = [
        1 => 'Senin',
        2 => 'Selasa',
        3 => 'Rabu',
        4 => 'Kamis',
        5 => 'Jumat',
        6 => 'Sabtu',
        7 => 'Minggu',
    ];

    public function evaluate(User $user, string $period = 'last_week'): array
    {
        $anchor = $period === 'current_week'
            ? Carbon::today()
            : Carbon::today()->subWeek();

        $periodStart = $anchor->copy()->startOfWeek(Carbon::MONDAY)->startOfDay();
        $periodEnd = $anchor->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();

        $prevStart = $periodStart->copy()->subWeek()->startOfDay();
        $prevEnd = $periodEnd->copy()->subWeek()->endOfDay();

        $activePlan = UserPlan::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->with(['split', 'schedules.splitSession'])
            ->latest('id')
            ->first();

        $dailySessions = DailySession::query()
            ->where('user_id', $user->id)
            ->whereBetween('session_date', [$periodStart->toDateString(), $periodEnd->toDateString()])
            ->with('splitSession')
            ->get()
            ->keyBy(fn (DailySession $s) => $s->session_date->toDateString());

        $periodLogs = WorkoutLog::query()
            ->where('user_id', $user->id)
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->get();

        $prevLogs = WorkoutLog::query()
            ->where('user_id', $user->id)
            ->whereBetween('created_at', [$prevStart, $prevEnd])
            ->get();

        $totalSets = $periodLogs->count();
        $totalTonnage = round((float) $periodLogs->sum(fn (WorkoutLog $l) => (float) $l->weight * (int) $l->reps), 1);
        $prevTonnage = round((float) $prevLogs->sum(fn (WorkoutLog $l) => (float) $l->weight * (int) $l->reps), 1);
        $tonnageChangeKg = round($totalTonnage - $prevTonnage, 1);
        $tonnageChangePct = $prevTonnage > 0
            ? round((($totalTonnage - $prevTonnage) / $prevTonnage) * 100, 1)
            : null;

        $rirValues = $periodLogs->pluck('rir')->filter(fn ($v) => $v !== null);
        $averageRir = $rirValues->isNotEmpty() ? round((float) $rirValues->avg(), 1) : null;

        $schedulesByDay = $activePlan ? $activePlan->schedules->keyBy('day_of_week') : collect();
        $dailyBreakdown = [];
        $scheduledCount = 0;
        $completedCount = 0;
        $skippedCount = 0;

        for ($d = 1; $d <= 7; $d++) {
            $dateObj = $periodStart->copy()->addDays($d - 1);
            $dateStr = $dateObj->toDateString();

            $sessionRow = $dailySessions->get($dateStr);
            $template = $schedulesByDay->get($d);

            $isPlannedWorkout = $sessionRow
                ? ($sessionRow->split_session_id !== null || $sessionRow->status === 'done' || $sessionRow->status === 'skipped')
                : ($template?->split_session_id !== null);

            $status = $sessionRow?->status ?? ($isPlannedWorkout ? 'pending' : 'rest');

            if ($isPlannedWorkout) {
                $scheduledCount++;
            }
            if ($status === 'done') {
                $completedCount++;
            } elseif ($status === 'skipped') {
                $skippedCount++;
            }

            $dayLogs = $periodLogs->filter(function (WorkoutLog $l) use ($sessionRow, $dateStr) {
                if ($sessionRow && $l->daily_session_id === $sessionRow->id) {
                    return true;
                }
                return $l->created_at?->toDateString() === $dateStr;
            });

            $dayTonnage = round((float) $dayLogs->sum(fn (WorkoutLog $l) => (float) $l->weight * (int) $l->reps), 1);

            $dailyBreakdown[] = [
                'day_of_week' => $d,
                'day_name' => self::DAY_NAMES[$d],
                'date' => $dateStr,
                'session_name' => $sessionRow?->splitSession?->name
                    ?? $template?->splitSession?->name
                    ?? 'Istirahat',
                'status' => $status,
                'sets_logged' => $dayLogs->count(),
                'tonnage_kg' => $dayTonnage,
            ];
        }

        $completionPct = $scheduledCount > 0
            ? (int) round(($completedCount / $scheduledCount) * 100)
            : 0;

        $suggestions = $this->buildSuggestions(
            hasPlan: $activePlan !== null,
            scheduledCount: $scheduledCount,
            completedCount: $completedCount,
            skippedCount: $skippedCount,
            completionPct: $completionPct,
            totalSets: $totalSets,
            tonnageChangePct: $tonnageChangePct,
            averageRir: $averageRir,
        );

        return [
            'period' => $period === 'current_week' ? 'current_week' : 'last_week',
            'period_start' => $periodStart->toDateString(),
            'period_end' => $periodEnd->toDateString(),
            'has_plan' => $activePlan !== null,
            'split_name' => $activePlan?->split?->name,
            'scheduled_sessions' => $scheduledCount,
            'completed_sessions' => $completedCount,
            'skipped_sessions' => $skippedCount,
            'completion_percentage' => $completionPct,
            'total_sets' => $totalSets,
            'total_tonnage_kg' => $totalTonnage,
            'previous_week_tonnage_kg' => $prevTonnage,
            'tonnage_change_kg' => $tonnageChangeKg,
            'tonnage_change_percentage' => $tonnageChangePct,
            'average_rir' => $averageRir,
            'daily_breakdown' => $dailyBreakdown,
            'suggestions' => $suggestions,
        ];
    }

    /**
     * Generate 1-2 simple rule-based Indonesian suggestions (no AI).
     *
     * @return array<int, array{type: string, title: string, message: string, action_href?: string, action_label?: string}>
     */
    private function buildSuggestions(
        bool $hasPlan,
        int $scheduledCount,
        int $completedCount,
        int $skippedCount,
        int $completionPct,
        int $totalSets,
        ?float $tonnageChangePct,
        ?float $averageRir,
    ): array {
        $suggestions = [];

        if (!$hasPlan) {
            return [[
                'type' => 'info',
                'title' => 'Buat Jadwal Mingguan Terlebih Dahulu',
                'message' => 'Anda belum memiliki program latihan aktif. Ikuti panduan singkat untuk memilih split dan jadwal mingguan yang sesuai.',
                'action_href' => '/onboarding',
                'action_label' => 'Atur Jadwal Sekarang',
            ]];
        }

        if ($scheduledCount > 0 && ($completionPct < 65 || $skippedCount >= 2)) {
            $suggestions[] = [
                'type' => 'warning',
                'title' => 'Jadwal Terlalu Padat untuk Pekan Ini',
                'message' => "Anda menyelesaikan {$completedCount} dari {$scheduledCount} sesi ({$completionPct}%). Pertimbangkan menurunkan frekuensi latihan 1 hari per minggu agar lebih konsisten tanpa sering melewati sesi.",
                'action_href' => '/onboarding',
                'action_label' => 'Sesuaikan Frekuensi Hari',
            ];
        } elseif ($scheduledCount > 0 && $completionPct >= 85) {
            $suggestions[] = [
                'type' => 'success',
                'title' => 'Konsistensi Latihan Sangat Baik',
                'message' => "Anda menyelesaikan {$completionPct}% sesi terjadwal. Pertahankan ritme ini dan fokus naikkan beban 1–2,5 kg atau tambah 1 repetisi saat RIR sudah terasa ringan.",
            ];
        }

        if ($totalSets === 0) {
            $suggestions[] = [
                'type' => 'info',
                'title' => 'Belum Ada Catatan Set pada Periode Ini',
                'message' => 'Gunakan tombol "Mulai Latihan" di Dashboard pada hari latihan untuk mencatat beban, repetisi, dan RIR Anda.',
            ];
        } elseif ($averageRir !== null && $averageRir > 3.0) {
            $suggestions[] = [
                'type' => 'warning',
                'title' => 'Intensitas Set Masih Terlalu Ringan',
                'message' => "Rata-rata RIR Anda adalah {$averageRir}. Untuk stimulus hipertrofi optimal, tingkatkan beban sedikit demi sedikit hingga tersisa 1–2 repetisi sebelum gagal otot (RIR 1–2).",
            ];
        } elseif ($averageRir !== null && $averageRir < 0.8) {
            $suggestions[] = [
                'type' => 'warning',
                'title' => 'Intensitas Sangat Dekat Failure',
                'message' => "Rata-rata RIR Anda sangat rendah ({$averageRir}). Sisakan 1–2 repetisi cadangan pada sebagian besar set agar pemulihan antar sesi tetap terjaga.",
            ];
        } elseif ($tonnageChangePct !== null && $tonnageChangePct > 0 && count($suggestions) < 2) {
            $suggestions[] = [
                'type' => 'success',
                'title' => 'Progressive Overload Tercapai',
                'message' => "Total tonase Anda naik {$tonnageChangePct}% dibanding minggu sebelumnya. Pastikan teknik gerakan tetap rapi di setiap repetisi.",
            ];
        } elseif ($tonnageChangePct !== null && $tonnageChangePct < -15 && count($suggestions) < 2) {
            $suggestions[] = [
                'type' => 'info',
                'title' => 'Volume Latihan Menurun',
                'message' => "Total tonase turun dibanding minggu sebelumnya. Jika sedang kelelahan, pastikan tidur cukup dan kembali ke target set dasar minggu depan.",
            ];
        }

        return array_slice($suggestions, 0, 2);
    }
}
