<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Split extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'description',
        'min_days',
        'max_days',
        'pros',
        'cons',
        'suitable_for',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'pros' => 'array',
            'cons' => 'array',
            'is_active' => 'boolean',
            'min_days' => 'integer',
            'max_days' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(SplitSession::class)->orderBy('sort_order');
    }

    public function userPlans(): HasMany
    {
        return $this->hasMany(UserPlan::class);
    }
}
