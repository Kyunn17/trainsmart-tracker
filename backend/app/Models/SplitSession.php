<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SplitSession extends Model
{
    protected $fillable = [
        'split_id',
        'slug',
        'name',
        'session_type',
        'muscle_groups',
        'default_day_of_week',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'muscle_groups' => 'array',
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
