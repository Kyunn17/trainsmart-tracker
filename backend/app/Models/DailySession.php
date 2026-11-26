<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DailySession extends Model
{
    protected $fillable = [
        'user_id',
        'user_plan_id',
        'split_session_id',
        'session_date',
        'status',
        'trainer_note',
        'changed_by',
        'changed_by_role',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'session_date' => 'date:Y-m-d',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function userPlan(): BelongsTo
    {
        return $this->belongsTo(UserPlan::class);
    }

    public function splitSession(): BelongsTo
    {
        return $this->belongsTo(SplitSession::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    public function workoutLogs(): HasMany
    {
        return $this->hasMany(WorkoutLog::class);
    }
}
