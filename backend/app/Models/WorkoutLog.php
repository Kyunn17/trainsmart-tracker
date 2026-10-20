<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutLog extends Model
{
    protected $fillable = [
        'exercise_id',
        'set_number',
        'weight',
        'reps',
        'rir',
        'rpe',
        'notes',
    ];

    public function exercise()
    {
        return $this->belongsTo(Exercise::class);
    }
}
