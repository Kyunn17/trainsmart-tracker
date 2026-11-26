<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Exercise;
use App\Models\ExerciseImage;
use App\Models\SplitSession;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class CuratedExerciseSeeder extends Seeder
{
    public function run(): void
    {
        $items = require database_path('data/curated_exercises.php');

        // Ensure core legacy categories exist for backwards-compatible category_id
        $pushCat = Category::firstOrCreate(['name' => 'Push']);
        $pullCat = Category::firstOrCreate(['name' => 'Pull']);
        $legsCat = Category::firstOrCreate(['name' => 'Legs']);

        $categoryByPattern = [
            'push' => $pushCat->id,
            'pull' => $pullCat->id,
            'squat' => $legsCat->id,
            'hinge' => $legsCat->id,
            'core' => $legsCat->id,
            'other' => $legsCat->id,
        ];

        // Preload split sessions grouped by session_type
        $sessionsByType = SplitSession::query()
            ->get()
            ->groupBy('session_type');

        $sortOrder = 1;

        foreach ($items as $item) {
            $sessionTypes = $item['sessions'] ?? [];
            $recommendedTypes = $item['recommended_sessions'] ?? [];
            $defaultSets = $item['default_sets'] ?? 3;
            $defaultRepRange = $item['default_rep_range'] ?? '8-12';

            $exercise = Exercise::withTrashed()->updateOrCreate(
                ['slug' => $item['slug']],
                [
                    'category_id' => $categoryByPattern[$item['movement_pattern']] ?? $pushCat->id,
                    'user_id' => null,
                    'name' => $item['name'],
                    'primary_muscle' => $item['primary_muscle'],
                    'muscle_region' => $item['muscle_region'],
                    'secondary_muscles' => $item['secondary_muscles'] ?? [],
                    'equipment' => $item['equipment'],
                    'movement_pattern' => $item['movement_pattern'],
                    'difficulty' => $item['difficulty'] ?? 'beginner',
                    'is_beginner_friendly' => $item['is_beginner_friendly'] ?? true,
                    'instructions' => $item['instructions'] ?? [],
                    'common_mistakes' => $item['common_mistakes'] ?? [],
                    'tips' => $item['tips'] ?? [],
                    'video_url' => $item['video_url'] ?? null,
                    'is_active' => true,
                    'is_custom' => false,
                    'approval_status' => 'approved',
                    'rejection_reason' => null,
                    'source' => 'curated',
                    'deleted_at' => null,
                ]
            );

            // Sync split_sessions pivot idempotently
            $syncData = [];
            foreach ($sessionTypes as $type) {
                $matchingSessions = $sessionsByType->get($type, collect());
                $isRecommended = in_array($type, $recommendedTypes, true);

                foreach ($matchingSessions as $splitSession) {
                    $syncData[$splitSession->id] = [
                        'is_default_recommended' => $isRecommended,
                        'default_sets' => $defaultSets,
                        'default_rep_range' => $defaultRepRange,
                        'sort_order' => $sortOrder,
                    ];
                }
            }

            if (!empty($syncData)) {
                $exercise->splitSessions()->sync($syncData);
            }

            // Link local curated illustrations (movement illustration first if present, plus muscle-region highlight)
            $disk = Storage::disk('public');
            $findExisting = function (?string $basePath) use ($disk): ?string {
                if (!$basePath) {
                    return null;
                }
                foreach (['jpg', 'png', 'webp', 'svg'] as $ext) {
                    $candidate = "{$basePath}.{$ext}";
                    if ($disk->exists($candidate)) {
                        return $candidate;
                    }
                }
                return null;
            };

            $movementPath = $findExisting("exercises/{$exercise->slug}/0");
            $regionPath = $exercise->muscle_region
                ? $findExisting("exercises/regions/{$exercise->muscle_region}")
                : null;

            if ($movementPath) {
                ExerciseImage::updateOrCreate(
                    ['exercise_id' => $exercise->id, 'position' => 0],
                    ['path' => $movementPath, 'alt_text' => "{$exercise->name} - ilustrasi gerakan"]
                );
                if ($regionPath) {
                    ExerciseImage::updateOrCreate(
                        ['exercise_id' => $exercise->id, 'position' => 1],
                        ['path' => $regionPath, 'alt_text' => "{$exercise->name} - target otot"]
                    );
                }
            } elseif ($regionPath) {
                ExerciseImage::updateOrCreate(
                    ['exercise_id' => $exercise->id, 'position' => 0],
                    ['path' => $regionPath, 'alt_text' => "{$exercise->name} - target otot"]
                );
            }

            $sortOrder++;
        }
    }
}
