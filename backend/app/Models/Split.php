<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Split extends Model
{
    public const MAJOR_MUSCLES = [
        'chest',
        'back',
        'shoulders',
        'biceps',
        'triceps',
        'quads',
        'hamstrings',
        'glutes',
        'calves',
        'core',
    ];

    protected $fillable = [
        'slug',
        'name',
        'description',
        'days_per_week',
        'recommendation_level',
        'min_days',
        'max_days',
        'pros',
        'cons',
        'suitable_for',
        'not_recommended_reason',
        'is_active',
        'sort_order',
    ];

    protected $appends = ['muscle_frequency'];

    protected function casts(): array
    {
        return [
            'pros' => 'array',
            'cons' => 'array',
            'is_active' => 'boolean',
            'days_per_week' => 'integer',
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

    /**
     * Compute estimated weekly training frequency per major muscle group
     * dynamically from this split's loaded sessions.
     *
     * @return array<string, int>
     */
    public function getMuscleFrequencyAttribute(): array
    {
        if (!$this->relationLoaded('sessions')) {
            return [];
        }

        $counts = array_fill_keys(self::MAJOR_MUSCLES, 0);

        foreach ($this->sessions as $session) {
            $groups = array_unique((array) ($session->muscle_groups ?? []));
            foreach ($groups as $muscle) {
                if (array_key_exists($muscle, $counts)) {
                    $counts[$muscle]++;
                }
            }
        }

        return $counts;
    }
}
