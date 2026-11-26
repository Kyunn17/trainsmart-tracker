<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'trainer_id',
        'phone',
        'specialization',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Role checks
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isTrainer(): bool
    {
        return $this->role === 'trainer';
    }

    public function isClient(): bool
    {
        return $this->role === 'client';
    }

    // Trainer has many clients
    public function clients()
    {
        return $this->hasMany(User::class, 'trainer_id');
    }

    // Client belongs to a Personal Trainer
    public function trainer()
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }

    // User has many workout logs
    public function workoutLogs()
    {
        return $this->hasMany(WorkoutLog::class);
    }

    // User workout plans
    public function plans()
    {
        return $this->hasMany(UserPlan::class);
    }

    public function activePlan()
    {
        return $this->hasOne(UserPlan::class)->where('is_active', true);
    }

    public function dailySessions()
    {
        return $this->hasMany(DailySession::class);
    }

    public function sentCoachingRequests()
    {
        return $this->hasMany(CoachingRequest::class, 'client_id');
    }

    public function receivedCoachingRequests()
    {
        return $this->hasMany(CoachingRequest::class, 'trainer_id');
    }
}
