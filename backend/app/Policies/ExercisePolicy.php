<?php

namespace App\Policies;

use App\Models\Exercise;
use App\Models\User;

class ExercisePolicy
{
    /**
     * Determine whether the user can view the exercise.
     * - Official active + approved exercises: visible to everyone (including guests).
     * - Custom exercises: visible ONLY to creator, admin, or the creator's assigned trainer (read-only).
     */
    public function view(?User $user, Exercise $exercise): bool
    {
        if (!$exercise->is_custom && $exercise->user_id === null) {
            if ($exercise->is_active && $exercise->approval_status === 'approved') {
                return true;
            }

            return $user !== null && $user->role === 'admin';
        }

        if ($user === null) {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        if ($exercise->user_id === $user->id) {
            return true;
        }

        // Trainers can read linked clients' custom exercises (e.g. inside client progress view)
        if ($user->role === 'trainer' && $exercise->user_id !== null) {
            return User::query()
                ->where('id', $exercise->user_id)
                ->where('trainer_id', $user->id)
                ->exists();
        }

        return false;
    }

    /**
     * Any authenticated user can submit a custom exercise.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Only the creator of a custom exercise or an admin can update it.
     */
    public function update(User $user, Exercise $exercise): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $exercise->is_custom && $exercise->user_id === $user->id;
    }

    /**
     * Only the creator of a custom exercise or an admin can archive/delete it.
     */
    public function delete(User $user, Exercise $exercise): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $exercise->is_custom && $exercise->user_id === $user->id;
    }

    /**
     * Only admins can approve/reject custom exercise requests.
     */
    public function review(User $user, Exercise $exercise): bool
    {
        return $user->role === 'admin' && $exercise->is_custom;
    }

    /**
     * Only admins can promote a custom exercise to the official library.
     */
    public function promote(User $user, Exercise $exercise): bool
    {
        return $user->role === 'admin' && $exercise->is_custom;
    }
}
