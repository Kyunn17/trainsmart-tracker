<?php

namespace App\Console\Commands;

use App\Models\Exercise;
use App\Models\ExerciseImage;
use App\Models\SplitSession;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportFreeExerciseDb extends Command
{
    protected $signature = 'exercises:import
        {--source= : Path to cloned free-exercise-db repository}
        {--limit=240 : Maximum number of curated exercises to import}';

    protected $description = 'Idempotently import curated exercises and local demonstration images from free-exercise-db';

    private const TARGET_MUSCLES = [
        'chest',
        'back',
        'shoulders',
        'biceps',
        'triceps',
        'quads',
        'hamstrings',
        'glutes',
        'calves',
        'core',
    ];

    public function handle(): int
    {
        $sourceDir = rtrim($this->option('source') ?: storage_path('app/free-exercise-db-src'), '/\\');
        $jsonPath = $sourceDir . DIRECTORY_SEPARATOR . 'dist' . DIRECTORY_SEPARATOR . 'exercises.json';
        $imagesBaseDir = $sourceDir . DIRECTORY_SEPARATOR . 'exercises';

        if (!is_file($jsonPath)) {
            $this->error("Dataset JSON not found at: {$jsonPath}");
            return self::FAILURE;
        }

        $raw = json_decode((string) file_get_contents($jsonPath), true);
        if (!is_array($raw)) {
            $this->error('Failed to decode exercises.json');
            return self::FAILURE;
        }

        $limit = max(10, (int) $this->option('limit'));
        $buckets = array_fill_keys(self::TARGET_MUSCLES, []);

        foreach ($raw as $entry) {
            if (!is_array($entry) || empty($entry['name']) || empty($entry['primaryMuscles'][0])) {
                continue;
            }

            $category = strtolower((string) ($entry['category'] ?? ''));
            if (!in_array($category, ['strength', 'powerlifting', 'olympic weightlifting', 'strongman'], true)) {
                continue;
            }

            $primaryMuscle = $this->normalizeMuscle((string) $entry['primaryMuscles'][0]);
            if ($primaryMuscle === null) {
                continue;
            }

            $images = array_values(array_filter((array) ($entry['images'] ?? [])));
            if (empty($images)) {
                continue;
            }

            $firstImageFile = $imagesBaseDir . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $images[0]);
            if (!is_file($firstImageFile)) {
                continue;
            }

            $instructions = array_values(array_filter((array) ($entry['instructions'] ?? [])));
            if (empty($instructions)) {
                continue;
            }

            $equipment = $this->normalizeEquipment((string) ($entry['equipment'] ?? 'other'));
            $difficulty = $this->normalizeDifficulty((string) ($entry['level'] ?? 'beginner'));
            $isBeginnerFriendly = $difficulty === 'beginner'
                && in_array($equipment, ['bodyweight', 'machine', 'dumbbell', 'cable', 'barbell'], true);

            $entry['_normalized'] = [
                'primary_muscle' => $primaryMuscle,
                'equipment' => $equipment,
                'difficulty' => $difficulty,
                'is_beginner_friendly' => $isBeginnerFriendly,
                'instructions' => $instructions,
            ];

            $buckets[$primaryMuscle][] = $entry;
        }

        // Sort each muscle bucket so beginner-friendly and standard gym equipment appear first
        foreach ($buckets as $muscle => $items) {
            usort($items, function (array $a, array $b): int {
                $aBeginner = $a['_normalized']['is_beginner_friendly'] ? 0 : 1;
                $bBeginner = $b['_normalized']['is_beginner_friendly'] ? 0 : 1;
                if ($aBeginner !== $bBeginner) {
                    return $aBeginner <=> $bBeginner;
                }
                return strcmp((string) $a['name'], (string) $b['name']);
            });
            $buckets[$muscle] = $items;
        }

        // Round-robin selection across all 10 muscles so every group is well represented
        $selected = [];
        $usedSlugs = [];
        $round = 0;

        while (count($selected) < $limit) {
            $addedInRound = false;
            foreach (self::TARGET_MUSCLES as $muscle) {
                if (!isset($buckets[$muscle][$round])) {
                    continue;
                }
                $entry = $buckets[$muscle][$round];
                $slug = Str::slug((string) ($entry['id'] ?? $entry['name']));
                if ($slug === '' || isset($usedSlugs[$slug])) {
                    continue;
                }
                $usedSlugs[$slug] = true;
                $selected[] = $entry;
                $addedInRound = true;

                if (count($selected) >= $limit) {
                    break;
                }
            }
            if (!$addedInRound) {
                break;
            }
            $round++;
        }

        $importedCount = 0;
        $imagesCopiedCount = 0;
        $muscleCounts = array_fill_keys(self::TARGET_MUSCLES, 0);

        DB::transaction(function () use ($selected, $imagesBaseDir, &$importedCount, &$imagesCopiedCount, &$muscleCounts) {
            foreach ($selected as $entry) {
                $norm = $entry['_normalized'];
                $slug = Str::slug((string) ($entry['id'] ?? $entry['name']));
                $primaryMuscle = $norm['primary_muscle'];
                $movementPattern = $this->inferMovementPattern(
                    (string) ($entry['force'] ?? ''),
                    (string) ($entry['mechanic'] ?? ''),
                    $primaryMuscle,
                    (string) $entry['name']
                );

                $secondaryMuscles = collect((array) ($entry['secondaryMuscles'] ?? []))
                    ->map(fn ($m) => $this->normalizeMuscle((string) $m) ?? strtolower((string) $m))
                    ->unique()
                    ->values()
                    ->all();

                $exercise = Exercise::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => (string) $entry['name'],
                        'primary_muscle' => $primaryMuscle,
                        'secondary_muscles' => $secondaryMuscles,
                        'equipment' => $norm['equipment'],
                        'movement_pattern' => $movementPattern,
                        'difficulty' => $norm['difficulty'],
                        'is_beginner_friendly' => $norm['is_beginner_friendly'],
                        'instructions' => $norm['instructions'],
                        'common_mistakes' => $this->defaultCommonMistakes($movementPattern),
                        'tips' => $this->defaultTips($movementPattern),
                        'is_active' => true,
                        'source' => 'free-exercise-db',
                    ]
                );

                $importedCount++;
                $muscleCounts[$primaryMuscle]++;

                $images = array_slice(array_values((array) ($entry['images'] ?? [])), 0, 2);
                foreach ($images as $pos => $relSourcePath) {
                    $srcFile = $imagesBaseDir . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, (string) $relSourcePath);
                    if (!is_file($srcFile)) {
                        continue;
                    }

                    $ext = strtolower(pathinfo($srcFile, PATHINFO_EXTENSION) ?: 'jpg');
                    $targetRelPath = "exercises/{$slug}/{$pos}.{$ext}";

                    if (!Storage::disk('public')->exists($targetRelPath)) {
                        Storage::disk('public')->put($targetRelPath, (string) file_get_contents($srcFile));
                    }

                    ExerciseImage::updateOrCreate(
                        [
                            'exercise_id' => $exercise->id,
                            'position' => $pos,
                        ],
                        [
                            'path' => $targetRelPath,
                            'alt_text' => sprintf(
                                '%s - %s',
                                $exercise->name,
                                $pos === 0 ? 'posisi awal' : 'posisi akhir'
                            ),
                        ]
                    );
                    $imagesCopiedCount++;
                }
            }
        });

        $mappedSessions = $this->mapExercisesToSplitSessions();

        $this->info("Imported/updated {$importedCount} exercises and {$imagesCopiedCount} image records.");
        $this->info("Mapped exercises across {$mappedSessions} split sessions.");
        foreach ($muscleCounts as $muscle => $count) {
            $this->line(" - {$muscle}: {$count}");
        }

        return self::SUCCESS;
    }

    private function mapExercisesToSplitSessions(): int
    {
        $sessions = SplitSession::all();
        if ($sessions->isEmpty()) {
            return 0;
        }

        $activeExercises = Exercise::query()
            ->where('is_active', true)
            ->whereNotNull('primary_muscle')
            ->orderByDesc('is_beginner_friendly')
            ->orderBy('name')
            ->get();

        foreach ($sessions as $session) {
            $targetMuscles = (array) ($session->muscle_groups ?? []);
            if (empty($targetMuscles)) {
                continue;
            }

            $matching = $activeExercises->filter(
                fn (Exercise $ex) => in_array($ex->primary_muscle, $targetMuscles, true)
            );

            // Pick 1 beginner-friendly starter per target muscle (up to 6 recommended per session)
            $recommendedIds = [];
            foreach ($targetMuscles as $muscle) {
                if (count($recommendedIds) >= 6) {
                    break;
                }
                $candidate = $matching->first(
                    fn (Exercise $ex) => $ex->primary_muscle === $muscle
                        && !in_array($ex->id, $recommendedIds, true)
                );
                if ($candidate) {
                    $recommendedIds[] = $candidate->id;
                }
            }

            $syncData = [];
            $order = 1;

            foreach ($recommendedIds as $recId) {
                $ex = $matching->firstWhere('id', $recId);
                $isIsolation = $ex && in_array($ex->movement_pattern, ['isolation', 'core'], true);
                $syncData[$recId] = [
                    'is_default_recommended' => true,
                    'default_sets' => 3,
                    'default_rep_range' => $isIsolation ? '10-15' : '8-12',
                    'sort_order' => $order++,
                ];
            }

            foreach ($matching as $ex) {
                if (isset($syncData[$ex->id])) {
                    continue;
                }
                $isIsolation = in_array($ex->movement_pattern, ['isolation', 'core'], true);
                $syncData[$ex->id] = [
                    'is_default_recommended' => false,
                    'default_sets' => 3,
                    'default_rep_range' => $isIsolation ? '10-15' : '8-12',
                    'sort_order' => $order++,
                ];
            }

            $session->exercises()->syncWithoutDetaching($syncData);
        }

        return $sessions->count();
    }

    private function normalizeMuscle(string $raw): ?string
    {
        return match (strtolower(trim($raw))) {
            'chest' => 'chest',
            'lats', 'middle back', 'lower back', 'traps' => 'back',
            'shoulders' => 'shoulders',
            'biceps', 'forearms' => 'biceps',
            'triceps' => 'triceps',
            'quadriceps' => 'quads',
            'hamstrings' => 'hamstrings',
            'glutes', 'abductors', 'adductors' => 'glutes',
            'calves' => 'calves',
            'abdominals' => 'core',
            default => null,
        };
    }

    private function normalizeEquipment(string $raw): string
    {
        return match (strtolower(trim($raw))) {
            'body only' => 'bodyweight',
            'barbell', 'e-z curl bar' => 'barbell',
            'dumbbell' => 'dumbbell',
            'machine' => 'machine',
            'cable' => 'cable',
            'kettlebells', 'kettlebell' => 'kettlebell',
            'bands' => 'bands',
            default => 'other',
        };
    }

    private function normalizeDifficulty(string $raw): string
    {
        return match (strtolower(trim($raw))) {
            'beginner' => 'beginner',
            'intermediate' => 'intermediate',
            'expert', 'advanced' => 'advanced',
            default => 'beginner',
        };
    }

    private function inferMovementPattern(
        string $force,
        string $mechanic,
        string $primaryMuscle,
        string $name
    ): string {
        $lowerName = strtolower($name);
        if ($primaryMuscle === 'core') {
            return 'core';
        }
        if (str_contains($lowerName, 'squat') || str_contains($lowerName, 'leg press')) {
            return 'squat';
        }
        if (str_contains($lowerName, 'lunge') || str_contains($lowerName, 'split squat')) {
            return 'lunge';
        }
        if (str_contains($lowerName, 'deadlift') || str_contains($lowerName, 'romanian') || str_contains($lowerName, 'hip thrust')) {
            return 'hinge';
        }
        if (strtolower($mechanic) === 'isolation') {
            return 'isolation';
        }
        if (strtolower($force) === 'push') {
            return 'push';
        }
        if (strtolower($force) === 'pull') {
            return 'pull';
        }
        return 'isolation';
    }

    private function defaultCommonMistakes(string $pattern): array
    {
        return match ($pattern) {
            'push' => [
                'Menggunakan momentum tubuh atau memantulkan beban di titik bawah.',
                'Bahu terangkat ke arah telinga sehingga mengurangi aktivasi otot target.',
            ],
            'pull' => [
                'Menarik beban hanya dengan lengan tanpa mengaktifkan otot punggung terlebih dahulu.',
                'Mengayunkan punggung bawah secara berlebihan saat beban mulai terasa berat.',
            ],
            'squat', 'lunge' => [
                'Lutut kolaps masuk ke dalam saat mendorong beban naik.',
                'Tumit terangkat dari lantai karena posisi kaki kurang stabil.',
            ],
            'hinge' => [
                'Punggung bawah membulat (rounding) akibat kurang menjaga kestabilan core.',
                'Menekuk lutut terlalu dalam sehingga gerakan berubah menjadi squat.',
            ],
            default => [
                'Menggunakan beban terlalu berat sehingga rentang gerak (ROM) terpotong.',
                'Mengayunkan tubuh untuk membantu menyelesaikan repetisi.',
            ],
        };
    }

    private function defaultTips(string $pattern): array
    {
        return match ($pattern) {
            'push' => [
                'Tahan fase turun secara terkontrol 2–3 detik untuk stimulus hipertrofi maksimal.',
                'Jaga tulang belikat tetap stabil di bangku atau posisi netral.',
            ],
            'pull' => [
                'Mulai tarikan dengan menurunkan dan merapatkan tulang belikat (scapula).',
                'Berhenti sejenak di puncak kontraksi selama 1 detik sebelum menurunkan beban.',
            ],
            'squat', 'lunge', 'hinge' => [
                'Tarik napas ke perut dan kunci core (bracing) sebelum memulai setiap repetisi.',
                'Dorong melalui bagian tengah kaki dan tumit untuk stabilitas maksimal.',
            ],
            default => [
                'Fokus rasakan kontraksi otot target dan jaga tempo konsisten.',
                'Pilih beban yang memungkinkan 1–2 repetisi sisa (RIR 1–2) dengan form rapi.',
            ],
        };
    }
}
