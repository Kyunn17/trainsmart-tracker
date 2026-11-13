<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WorkoutLog;
use App\Models\Exercise;
use App\Models\Category;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Get system-wide stats
     */
    public function stats()
    {
        $totalUsers = User::count();
        $totalTrainers = User::where('role', 'trainer')->count();
        $totalClients = User::where('role', 'client')->count();
        $totalLogs = WorkoutLog::count();
        $totalExercises = Exercise::count();

        $totalTonnage = WorkoutLog::selectRaw('SUM(weight * reps) as total_volume')->value('total_volume') ?? 0;

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_users' => $totalUsers,
                'total_trainers' => $totalTrainers,
                'total_clients' => $totalClients,
                'total_logs' => $totalLogs,
                'total_exercises' => $totalExercises,
                'total_tonnage_kg' => round($totalTonnage, 2),
            ],
        ]);
    }

    /**
     * Get list of all users with their roles and relationships
     */
    public function users(Request $request)
    {
        $query = User::with(['trainer', 'clients'])->withCount('workoutLogs');

        if ($request->has('role') && in_array($request->role, ['admin', 'trainer', 'client'])) {
            $query->where('role', $request->role);
        }

        $users = $query->latest()->get();

        return response()->json([
            'status' => 'success',
            'data' => $users,
        ]);
    }

    /**
     * Update any user's role or trainer assignment
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'role' => 'sometimes|in:admin,trainer,client',
            'trainer_id' => 'nullable|exists:users,id',
            'specialization' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $user->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => "User {$user->name} berhasil diperbarui oleh Admin.",
            'data' => $user->load(['trainer', 'clients']),
        ]);
    }

    /**
     * Delete a user
     */
    public function deleteUser($id)
    {
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak dapat menghapus akun admin Anda sendiri.',
            ], 400);
        }

        $userName = $user->name;
        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => "User {$userName} berhasil dihapus dari sistem.",
        ]);
    }
}
