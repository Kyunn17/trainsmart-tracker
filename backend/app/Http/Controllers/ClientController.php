<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WorkoutLog;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    /**
     * Get list of all available Personal Trainers for clients to choose from
     */
    public function trainers()
    {
        $trainers = User::where('role', 'trainer')
            ->withCount('clients')
            ->select('id', 'name', 'specialization', 'created_at')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $trainers,
        ]);
    }

    /**
     * Client selects or changes their Personal Trainer
     */
    public function selectTrainer(Request $request)
    {
        $validated = $request->validate([
            'trainer_id' => 'nullable|exists:users,id',
        ], [
            'trainer_id.exists' => 'Personal Trainer yang dipilih tidak ditemukan.',
        ]);

        $user = $request->user();

        if ($user->role !== 'client') {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya akun Klien yang dapat memilih Personal Trainer.',
            ], 403);
        }

        if (!empty($validated['trainer_id'])) {
            $trainer = User::where('id', $validated['trainer_id'])
                ->where('role', 'trainer')
                ->first();

            if (!$trainer) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Pengguna yang dipilih bukan seorang Personal Trainer terdaftar.',
                ], 422);
            }

            $user->trainer_id = $trainer->id;
            $user->save();

            return response()->json([
                'status' => 'success',
                'message' => "Selamat! Anda sekarang dibimbing oleh {$trainer->name}.",
                'data' => $user->load('trainer'),
            ]);
        } else {
            // Unassign trainer
            $user->trainer_id = null;
            $user->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Anda telah melepas Personal Trainer.',
                'data' => $user->load('trainer'),
            ]);
        }
    }

    /**
     * Client views their own hypertrophy progress & workout history
     */
    public function myProgress(Request $request)
    {
        $user = $request->user();

        $logs = WorkoutLog::where('user_id', $user->id)
            ->with('exercise.category')
            ->latest()
            ->get();

        $totalSets = $logs->count();
        $totalVolume = $logs->sum(function ($log) {
            return $log->weight * $log->reps;
        });
        $averageRir = $logs->whereNotNull('rir')->avg('rir');

        return response()->json([
            'status' => 'success',
            'trainer' => $user->trainer,
            'summary' => [
                'total_sets' => $totalSets,
                'total_volume_kg' => round($totalVolume, 2),
                'average_rir' => $averageRir !== null ? round($averageRir, 1) : null,
            ],
            'data' => $logs,
        ]);
    }
}
