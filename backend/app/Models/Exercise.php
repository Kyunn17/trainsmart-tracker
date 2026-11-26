<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Exercise extends Model
{
    protected $fillable = [
        'category_id',
        'name',
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
    ];

    protected function casts(): array
    {
        return [
            'secondary_muscles' => 'array',
            'instructions' => 'array',
            'common_mistakes' => 'array',
            'tips' => 'array',
            'is_beginner_friendly' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function workoutLogs(): HasMany
    {
        return $this->hasMany(WorkoutLog::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ExerciseImage::class)->orderBy('position');
    }

    public function splitSessions(): BelongsToMany
    {
        return $this->belongsToMany(SplitSession::class, 'exercise_split_session')
            ->withPivot(['is_default_recommended', 'default_sets', 'default_rep_range', 'sort_order'])
            ->withTimestamps();
    }
}
