<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExerciseImage extends Model
{
    protected $fillable = [
        'exercise_id',
        'path',
        'position',
        'alt_text',
    ];

    protected $appends = ['url'];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
        ];
    }

    protected function url(): Attribute
    {
        return Attribute::get(
            fn () => asset('storage/' . ltrim((string) $this->path, '/'))
        );
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
