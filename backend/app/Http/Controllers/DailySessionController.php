<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateDailySessionStatusRequest;
use App\Models\DailySession;
use App\Models\UserPlan;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DailySessionController extends Controller
{
    /**
     * Get or lazily materialize today's DailySession from the user's active plan,
     * along with the current week (Mon-Sun) status overview.
     */
    public function today(Request $request)
    {
        $user = $request->user();

        $activePlan = UserPlan::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->with(['split', 'schedules.splitSession'])
            ->latest('id')
            ->first();

        if (!$activePlan) {
            return response()->json([
                'status' => 'success',
                'has_plan' => false,
                'data' => null,
                'week_overview' => [],
            ]);
        }

        $today = Carbon::today();
        $todayStr = $today->toDateString();
        $todayIsoDay = $today->dayOfWeekIso; // 1 = Mon .. 7 = Sun

        $scheduledToday = $activePlan->schedules->firstWhere('day_of_week', $todayIsoDay);
        $plannedSessionId = $scheduledToday?->split_session_id;
        $defaultStatus = $plannedSessionId ? 'pending' : 'rest';

        $dailySession = DailySession::firstOrCreate(
            [
                'user_id' => $user->id,
                'session_date' => $todayStr,
            ],
            [
                'user_plan_id' => $activePlan->id,
                'split_session_id' => $plannedSessionId,
                'status' => $defaultStatus,
            ]
        );

        // If the user updated their plan today and today's session has no logs and wasn't overridden by a trainer
        if (
            $dailySession->user_plan_id !== $activePlan->id
            && $dailySession->changed_by_role !== 'trainer'
            && $dailySession->workoutLogs()->count() === 0
        ) {
            $dailySession->update([
                'user_plan_id' => $activePlan->id,
                'split_session_id' => $plannedSessionId,
                'status' => $defaultStatus,
            ]);
        }

        $dailySession->load([
            'userPlan.split',
            'changedBy:id,name,role',
            'workoutLogs.exercise',
            'splitSession.exercises' => function ($query) {
                $query->where('exercises.is_active', true)
                    ->where('exercises.is_custom', false)
                    ->where('exercises.approval_status', 'approved')
                    ->where('exercise_split_session.is_default_recommended', true)
                    ->with('images');
            },
        ]);

        // Build current week overview (Monday - Sunday)
        $weekStart = $today->copy()->startOfWeek(Carbon::MONDAY);
        $weekEnd = $today->copy()->endOfWeek(Carbon::SUNDAY);

        $weekSessions = DailySession::query()
            ->where('user_id', $user->id)
            ->whereBetween('session_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->with('splitSession')
            ->get()
            ->keyBy(fn (DailySession $s) => $s->session_date->toDateString());

        $schedulesByDay = $activePlan->schedules->keyBy('day_of_week');
        $dayLabels = [
            1 => 'Sen',
            2 => 'Sel',
            3 => 'Rab',
            4 => 'Kam',
            5 => 'Jum',
            6 => 'Sab',
            7 => 'Min',
        ];

        $weekOverview = [];
        for ($d = 1; $d <= 7; $d++) {
            $dateObj = $weekStart->copy()->addDays($d - 1);
            $dateStr = $dateObj->toDateString();
            $existing = $weekSessions->get($dateStr);
            $template = $schedulesByDay->get($d);

            $sessionName = $existing?->splitSession?->name
                ?? $template?->splitSession?->name
                ?? 'Istirahat';

            $status = $existing?->status
                ?? ($template?->split_session_id ? 'pending' : 'rest');

            $weekOverview[] = [
                'day_of_week' => $d,
                'day_short' => $dayLabels[$d],
                'date' => $dateStr,
                'is_today' => $dateStr === $todayStr,
                'session_name' => $sessionName,
                'status' => $status,
            ];
        }

        return response()->json([
            'status' => 'success',
            'has_plan' => true,
            'data' => $dailySession,
            'week_overview' => $weekOverview,
        ]);
    }

    /**
     * Get a specific daily session with its exercises & demonstration images.
     */
    public function show(Request $request, int $id)
    {
        $dailySession = DailySession::with([
            'userPlan.split',
            'changedBy:id,name,role',
            'workoutLogs.exercise',
            'splitSession.exercises' => function ($query) {
                $query->where('exercises.is_active', true)
                    ->where('exercises.is_custom', false)
                    ->where('exercises.approval_status', 'approved')
                    ->where('exercise_split_session.is_default_recommended', true)
                    ->with('images');
            },
        ])->find($id);

        if (!$dailySession) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sesi harian tidak ditemukan.',
            ], 404);
        }

        if ($dailySession->user_id !== $request->user()->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak memiliki akses ke sesi ini.',
            ], 403);
        }

        return response()->json([
            'status' => 'success',
            'data' => $dailySession,
        ]);
    }

    /**
     * Update today's or a daily session's status (pending/done/skipped/rest).
     */
    public function updateStatus(UpdateDailySessionStatusRequest $request, int $id)
    {
        $dailySession = DailySession::find($id);

        if (!$dailySession) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sesi harian tidak ditemukan.',
            ], 404);
        }

        $user = $request->user();

        if ($dailySession->user_id !== $user->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak memiliki akses untuk mengubah sesi ini.',
            ], 403);
        }

        // Conflict rule: Trainer override cannot be overwritten by client
        if ($dailySession->changed_by_role === 'trainer' && $user->role === 'client') {
            return response()->json([
                'status' => 'error',
                'message' => 'Status hari ini telah diatur oleh Personal Trainer Anda dan tidak dapat diubah langsung.',
            ], 409);
        }

        $newStatus = $request->validated('status');

        $dailySession->update([
            'status' => $newStatus,
            'changed_by' => $user->id,
            'changed_by_role' => $user->role,
            'completed_at' => $newStatus === 'done' ? now() : null,
        ]);

        $dailySession->load(['userPlan.split', 'splitSession', 'changedBy:id,name,role']);

        return response()->json([
            'status' => 'success',
            'message' => 'Status latihan berhasil diperbarui.',
            'data' => $dailySession,
        ]);
    }
}
