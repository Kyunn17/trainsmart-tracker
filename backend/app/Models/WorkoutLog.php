<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkoutLog extends Model
{
    protected $fillable = [
        'user_id',
        'exercise_id',
        'daily_session_id',
        'set_number',
        'weight',
        'reps',
        'rir',
        'rpe',
        'notes',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class)->withTrashed();
    }

    public function dailySession(): BelongsTo
    {
        return $this->belongsTo(DailySession::class);
    }
}
