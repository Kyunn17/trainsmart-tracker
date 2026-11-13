<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutLog extends Model
{
    protected $fillable = [
        'user_id',
        'exercise_id',
        'set_number',
        'weight',
        'reps',
        'rir',
        'rpe',
        'notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function exercise()
    {
        return $this->belongsTo(Exercise::class);
    }
}
