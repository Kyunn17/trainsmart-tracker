<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Exercise extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'category_id',
        'user_id',
        'name',
        'slug',
        'primary_muscle',
        'muscle_region',
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
        'is_custom',
        'approval_status',
        'rejection_reason',
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
            'is_custom' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
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

    /**
     * Scope to official curated/admin exercises.
     */
    public function scopeOfficial(Builder $query): Builder
    {
        return $query->where('is_custom', false)->whereNull('user_id');
    }

    /**
     * Scope to exercises visible in the active library for a given user:
     * all active official exercises + the user's own active & approved custom exercises.
     */
    public function scopeVisibleInLibrary(Builder $query, ?User $user): Builder
    {
        return $query->where('is_active', true)
            ->where('approval_status', 'approved')
            ->where(function (Builder $q) use ($user) {
                $q->where(function (Builder $official) {
                    $official->where('is_custom', false)->whereNull('user_id');
                });

                if ($user) {
                    $q->orWhere(function (Builder $custom) use ($user) {
                        $custom->where('is_custom', true)
                            ->where('user_id', $user->id);
                    });
                }
            });
    }
}
