<?php

namespace App\Services;

use App\Models\Split;

class ScheduleValidationService
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

    private const MUSCLE_LABELS = [
        'chest' => 'Dada',
        'back' => 'Punggung',
        'shoulders' => 'Bahu',
        'biceps' => 'Bisep',
        'triceps' => 'Trisep',
        'quads' => 'Paha Depan',
        'hamstrings' => 'Hamstring',
        'glutes' => 'Glutes',
        'calves' => 'Betis',
        'core' => 'Core',
    ];

    /**
     * Validate a Monday-Sunday schedule and return advisory warnings (never blocks saving).
     *
     * @param  array<int, array{day_of_week: int, split_session_id: int|null}>  $scheduleItems
     * @return array<int, array{code: string, severity: string, message: string, days: int[]}>
     */
    public function validate(Split $split, array $scheduleItems, int $daysPerWeek): array
    {
        $warnings = [];
        $sessionsById = $split->sessions()->get()->keyBy('id');

        // Normalize map of day (1..7) -> SplitSession|null
        $byDay = [];
        for ($d = 1; $d <= 7; $d++) {
            $byDay[$d] = null;
        }
        foreach ($scheduleItems as $item) {
            $day = (int) $item['day_of_week'];
            $sessionId = $item['split_session_id'] ?? null;
            $byDay[$day] = $sessionId ? $sessionsById->get((int) $sessionId) : null;
        }

        $trainingDaysCount = collect($byDay)->filter()->count();

        // 1. Check if there is at least 1 rest day
        if ($trainingDaysCount === 7) {
            $warnings[] = [
                'code' => 'no_rest_day',
                'severity' => 'warning',
                'message' => 'Anda belum menyisakan hari istirahat. Otot bertumbuh saat pemulihan—sisakan minimal 1 hari istirahat setiap minggu.',
                'days' => [1, 2, 3, 4, 5, 6, 7],
            ];
        }

        // 2. Check day count mismatch against user's chosen frequency
        if ($trainingDaysCount !== $daysPerWeek) {
            $warnings[] = [
                'code' => 'days_count_mismatch',
                'severity' => 'info',
                'message' => "Anda memilih target {$daysPerWeek} hari latihan per minggu, tetapi saat ini menjadwalkan {$trainingDaysCount} sesi.",
                'days' => [],
            ];
        }

        // 3. Check consecutive days training the same muscle group (including Sunday -> Monday wrap-around)
        $pairs = [
            [1, 2],
            [2, 3],
            [3, 4],
            [4, 5],
            [5, 6],
            [6, 7],
            [7, 1],
        ];

        foreach ($pairs as [$dayA, $dayB]) {
            $sessionA = $byDay[$dayA];
            $sessionB = $byDay[$dayB];

            if (!$sessionA || !$sessionB) {
                continue;
            }

            $musclesA = (array) ($sessionA->muscle_groups ?? []);
            $musclesB = (array) ($sessionB->muscle_groups ?? []);
            $overlap = array_values(array_intersect($musclesA, $musclesB));

            if (!empty($overlap)) {
                $muscleNames = implode(', ', array_map(
                    fn (string $m) => self::MUSCLE_LABELS[$m] ?? ucfirst($m),
                    $overlap
                ));
                $nameA = self::DAY_NAMES[$dayA];
                $nameB = self::DAY_NAMES[$dayB];

                $warnings[] = [
                    'code' => 'consecutive_muscle_overlap',
                    'severity' => 'warning',
                    'message' => "{$nameA} ({$sessionA->name}) dan {$nameB} ({$sessionB->name}) melatih kelompok otot yang sama secara berturut-turut ({$muscleNames}). Pertimbangkan memberi jeda 1 hari istirahat.",
                    'days' => [$dayA, $dayB],
                ];
            }
        }

        return $warnings;
    }
}
