<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WorkoutLog;
use Illuminate\Http\Request;

class TrainerController extends Controller
{
    /**
     * Get list of clients assigned to current Personal Trainer
     */
    public function clients(Request $request)
    {
        $trainer = $request->user();

        $clients = User::where('trainer_id', $trainer->id)
            ->withCount('workoutLogs')
            ->with(['workoutLogs' => function ($q) {
                $q->latest()->limit(1)->with('exercise');
            }])
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $clients,
        ]);
    }

    /**
     * Personal Trainer adds/links a client by email
     */
    public function addClient(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.required' => 'Email klien wajib diisi.',
            'email.exists' => 'Akun dengan email ini tidak ditemukan di sistem.',
        ]);

        $client = User::where('email', $validated['email'])->first();

        if ($client->role !== 'client') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengguna ini bukan akun Klien (perannya adalah ' . ucfirst($client->role) . ').',
            ], 422);
        }

        if ($client->trainer_id === $request->user()->id) {
            return response()->json([
                'status' => 'error',
                'message' => "{$client->name} sudah menjadi klien Anda.",
            ], 422);
        }

        $client->trainer_id = $request->user()->id;
        $client->save();

        return response()->json([
            'status' => 'success',
            'message' => "Berhasil menambahkan {$client->name} ke daftar klien Anda!",
            'data' => $client,
        ]);
    }

    /**
     * Remove client from trainer's roster
     */
    public function removeClient(Request $request, $clientId)
    {
        $client = User::where('id', $clientId)
            ->where('trainer_id', $request->user()->id)
            ->firstOrFail();

        $client->trainer_id = null;
        $client->save();

        return response()->json([
            'status' => 'success',
            'message' => "Klien {$client->name} berhasil dilepas dari daftar bimbingan Anda.",
        ]);
    }

    /**
     * View detailed progress of a specific client
     */
    public function clientProgress(Request $request, $clientId)
    {
        $trainer = $request->user();

        // Check permission: Must be the client's assigned trainer, or an admin
        $client = User::findOrFail($clientId);

        if ($trainer->role !== 'admin' && $client->trainer_id !== $trainer->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak: Klien ini tidak berada di bawah bimbingan Anda.',
            ], 403);
        }

        $logs = WorkoutLog::where('user_id', $clientId)
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
            'client' => $client,
            'summary' => [
                'total_sets' => $totalSets,
                'total_volume_kg' => round($totalVolume, 2),
                'average_rir' => $averageRir !== null ? round($averageRir, 1) : null,
            ],
            'data' => $logs,
        ]);
    }
}
