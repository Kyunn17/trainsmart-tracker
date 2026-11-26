<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanSchedule extends Model
{
    protected $fillable = [
        'user_plan_id',
        'day_of_week',
        'split_session_id',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
        ];
    }

    public function userPlan(): BelongsTo
    {
        return $this->belongsTo(UserPlan::class);
    }

    public function splitSession(): BelongsTo
    {
        return $this->belongsTo(SplitSession::class);
    }
}
