<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserPlan extends Model
{
    protected $fillable = [
        'user_id',
        'split_id',
        'days_per_week',
        'is_active',
        'onboarding_completed_at',
    ];

    protected function casts(): array
    {
        return [
            'days_per_week' => 'integer',
            'is_active' => 'boolean',
            'onboarding_completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function split(): BelongsTo
    {
        return $this->belongsTo(Split::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(PlanSchedule::class)->orderBy('day_of_week');
    }
}
