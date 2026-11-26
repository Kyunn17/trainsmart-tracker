<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\DailySession;
use App\Models\Exercise;
use App\Models\WorkoutLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkoutController extends Controller
{
    /**
     * Get all categories with exercises (Backwards compatible with /menu-latihan)
     */
    public function index()
    {
        $categories = Category::with('exercises')->get();

        return response()->json([
            'status' => 'success',
            'pesan' => 'Data jadwal dan gerakan berhasil ditarik',
            'data' => $categories,
        ]);
    }

    /**
     * Get single category with its exercises and latest logs for hypertrophy reference
     */
    public function show($id)
    {
        $category = Category::with(['exercises' => function ($query) {
            $query->with(['workoutLogs' => function ($q) {
                $q->latest()->limit(5);
            }]);
        }])->find($id);

        if (!$category) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kategori latihan tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $category,
        ]);
    }

    /**
     * Store batch workout logs (after finishing a workout session)
     */
    public function storeLogs(Request $request)
    {
        $validated = $request->validate([
            'daily_session_id' => 'nullable|integer|exists:daily_sessions,id',
            'logs' => 'required|array|min:1',
            'logs.*.exercise_id' => 'required|exists:exercises,id',
            'logs.*.set_number' => 'required|integer|min:1',
            'logs.*.weight' => 'required|numeric|min:0',
            'logs.*.reps' => 'required|integer|min:1',
            'logs.*.rir' => 'nullable|integer|min:0|max:10',
            'logs.*.rpe' => 'nullable|numeric|min:1|max:10',
            'logs.*.notes' => 'nullable|string|max:1000',
        ]);

        $authUser = auth('sanctum')->user();
        $userId = $authUser?->id ?? $request->user_id;
        $dailySessionId = $validated['daily_session_id'] ?? null;

        $createdLogs = DB::transaction(function () use ($validated, $userId, $authUser, $dailySessionId) {
            $inserted = [];
            foreach ($validated['logs'] as $logData) {
                $inserted[] = WorkoutLog::create([
                    'user_id' => $userId,
                    'exercise_id' => $logData['exercise_id'],
                    'daily_session_id' => $dailySessionId,
                    'set_number' => $logData['set_number'],
                    'weight' => $logData['weight'],
                    'reps' => $logData['reps'],
                    'rir' => $logData['rir'] ?? null,
                    'rpe' => $logData['rpe'] ?? null,
                    'notes' => $logData['notes'] ?? null,
                ]);
            }

            if ($dailySessionId && $userId) {
                $dailySession = DailySession::find($dailySessionId);
                if (
                    $dailySession
                    && $dailySession->user_id === (int) $userId
                    && $dailySession->changed_by_role !== 'trainer'
                ) {
                    $dailySession->update([
                        'status' => 'done',
                        'completed_at' => now(),
                        'changed_by' => (int) $userId,
                        'changed_by_role' => $authUser?->role ?? 'client',
                    ]);
                }
            }

            return $inserted;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Catatan sesi latihan dan hipertrofi berhasil disimpan!',
            'count' => count($createdLogs),
            'data' => $createdLogs,
        ], 201);
    }

    /**
     * Add a custom exercise to a category
     */
    public function storeExercise(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
        ]);

        $exercise = Exercise::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Gerakan baru berhasil ditambahkan',
            'data' => $exercise,
        ], 201);
    }

    /**
     * Get recent workout history & hypertrophy logs
     */
    public function history()
    {
        $logs = WorkoutLog::with('exercise.category')
            ->latest()
            ->limit(30)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $logs,
        ]);
    }
}
