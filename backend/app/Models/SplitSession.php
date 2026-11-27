<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SplitSession extends Model
{
    /**
     * Canonical session template registry mapping session_type -> muscle_regions, major muscle_groups, and is_heavy.
     * Exercises in CuratedExerciseSeeder are matched to split sessions via `muscle_regions`.
     */
    public const TEMPLATES = [
        'full_body' => [
            'muscle_regions' => [
                'upper_chest', 'middle_chest', 'lower_chest',
                'lats', 'mid_back',
                'front_delt', 'lateral_delt', 'rear_delt',
                'biceps', 'triceps',
                'quads', 'hamstrings', 'glutes', 'calves', 'core',
            ],
            'muscle_groups' => [
                'chest', 'back', 'shoulders', 'biceps', 'triceps',
                'quads', 'hamstrings', 'glutes', 'calves', 'core',
            ],
            'is_heavy' => true,
        ],
        'upper' => [
            'muscle_regions' => [
                'upper_chest', 'middle_chest', 'lower_chest',
                'lats', 'mid_back',
                'front_delt', 'lateral_delt', 'rear_delt',
                'biceps', 'triceps',
            ],
            'muscle_groups' => ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
            'is_heavy' => false,
        ],
        'lower' => [
            'muscle_regions' => ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
            'muscle_groups' => ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
            'is_heavy' => true,
        ],
        'push' => [
            'muscle_regions' => [
                'upper_chest', 'middle_chest', 'lower_chest',
                'front_delt', 'lateral_delt', 'triceps',
            ],
            'muscle_groups' => ['chest', 'shoulders', 'triceps'],
            'is_heavy' => false,
        ],
        'pull' => [
            'muscle_regions' => ['lats', 'mid_back', 'rear_delt', 'biceps'],
            'muscle_groups' => ['back', 'shoulders', 'biceps'],
            'is_heavy' => false,
        ],
        'legs' => [
            'muscle_regions' => ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
            'muscle_groups' => ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
            'is_heavy' => true,
        ],
        'anterior' => [
            'muscle_regions' => [
                'upper_chest', 'middle_chest', 'lower_chest',
                'front_delt', 'lateral_delt',
                'quads', 'core', 'biceps',
            ],
            'muscle_groups' => ['chest', 'shoulders', 'biceps', 'quads', 'core'],
            'is_heavy' => false,
        ],
        'posterior' => [
            'muscle_regions' => [
                'lats', 'mid_back', 'rear_delt',
                'hamstrings', 'glutes', 'calves', 'triceps',
            ],
            'muscle_groups' => ['back', 'shoulders', 'triceps', 'hamstrings', 'glutes', 'calves'],
            'is_heavy' => true,
        ],
        'arms_delts' => [
            'muscle_regions' => ['front_delt', 'lateral_delt', 'rear_delt', 'biceps', 'triceps'],
            'muscle_groups' => ['shoulders', 'biceps', 'triceps'],
            'is_heavy' => false,
        ],
        'chest' => [
            'muscle_regions' => ['upper_chest', 'middle_chest', 'lower_chest'],
            'muscle_groups' => ['chest'],
            'is_heavy' => false,
        ],
        'back' => [
            'muscle_regions' => ['lats', 'mid_back'],
            'muscle_groups' => ['back'],
            'is_heavy' => true,
        ],
        'shoulders' => [
            'muscle_regions' => ['front_delt', 'lateral_delt', 'rear_delt'],
            'muscle_groups' => ['shoulders'],
            'is_heavy' => false,
        ],
        'arms' => [
            'muscle_regions' => ['biceps', 'triceps', 'core'],
            'muscle_groups' => ['biceps', 'triceps', 'core'],
            'is_heavy' => false,
        ],
    ];

    protected $fillable = [
        'split_id',
        'slug',
        'name',
        'session_type',
        'muscle_groups',
        'muscle_regions',
        'is_heavy',
        'default_day_of_week',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'muscle_groups' => 'array',
            'muscle_regions' => 'array',
            'is_heavy' => 'boolean',
            'default_day_of_week' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function split(): BelongsTo
    {
        return $this->belongsTo(Split::class);
    }

    public function exercises(): BelongsToMany
    {
        return $this->belongsToMany(Exercise::class, 'exercise_split_session')
            ->withPivot(['is_default_recommended', 'default_sets', 'default_rep_range', 'sort_order'])
            ->withTimestamps()
            ->orderBy('exercise_split_session.sort_order');
    }
}
