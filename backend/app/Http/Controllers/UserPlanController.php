<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveUserPlanRequest;
use App\Models\PlanSchedule;
use App\Models\Split;
use App\Models\UserPlan;
use App\Services\ScheduleValidationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserPlanController extends Controller
{
    public function __construct(
        private readonly ScheduleValidationService $validatorService
    ) {
    }

    /**
     * Get the authenticated user's active plan, 7-day schedule, advisory warnings, and muscle frequency.
     */
    public function show(Request $request)
    {
        $plan = UserPlan::query()
            ->where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->with(['split.sessions', 'schedules.splitSession'])
            ->latest('id')
            ->first();

        if (!$plan) {
            return response()->json([
                'status' => 'success',
                'data' => null,
                'warnings' => [],
                'muscle_frequency' => [],
            ]);
        }

        $scheduleItems = $plan->schedules->map(fn (PlanSchedule $item) => [
            'day_of_week' => $item->day_of_week,
            'split_session_id' => $item->split_session_id,
        ])->all();

        $warnings = $this->validatorService->validate(
            $plan->split,
            $scheduleItems,
            $plan->days_per_week
        );

        $muscleFrequency = $this->validatorService->computeWeeklyMuscleFrequency(
            $plan->split,
            $scheduleItems
        );

        return response()->json([
            'status' => 'success',
            'data' => $plan,
            'warnings' => $warnings,
            'muscle_frequency' => $muscleFrequency,
        ]);
    }

    /**
     * Save or replace the authenticated user's active weekly plan & Mon-Sun schedule.
     */
    public function store(SaveUserPlanRequest $request)
    {
        $validated = $request->validated();
        $user = $request->user();
        $split = Split::with('sessions')->findOrFail($validated['split_id']);

        $plan = DB::transaction(function () use ($user, $validated) {
            UserPlan::query()
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            $newPlan = UserPlan::create([
                'user_id' => $user->id,
                'split_id' => $validated['split_id'],
                'days_per_week' => $validated['days_per_week'],
                'is_active' => true,
                'onboarding_completed_at' => now(),
            ]);

            foreach ($validated['schedule'] as $dayItem) {
                PlanSchedule::create([
                    'user_plan_id' => $newPlan->id,
                    'day_of_week' => (int) $dayItem['day_of_week'],
                    'split_session_id' => $dayItem['split_session_id'] ?? null,
                ]);
            }

            return $newPlan->load(['split.sessions', 'schedules.splitSession']);
        });

        $warnings = $this->validatorService->validate(
            $split,
            $validated['schedule'],
            (int) $validated['days_per_week']
        );

        $muscleFrequency = $this->validatorService->computeWeeklyMuscleFrequency(
            $split,
            $validated['schedule']
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Rencana dan jadwal latihan mingguan berhasil disimpan!',
            'data' => $plan,
            'warnings' => $warnings,
            'muscle_frequency' => $muscleFrequency,
        ], 201);
    }

    /**
     * Validate a proposed schedule without persisting (advisory warnings + muscle frequency).
     */
    public function validateSchedule(SaveUserPlanRequest $request)
    {
        $validated = $request->validated();
        $split = Split::with('sessions')->findOrFail($validated['split_id']);

        $warnings = $this->validatorService->validate(
            $split,
            $validated['schedule'],
            (int) $validated['days_per_week']
        );

        $muscleFrequency = $this->validatorService->computeWeeklyMuscleFrequency(
            $split,
            $validated['schedule']
        );

        return response()->json([
            'status' => 'success',
            'warnings' => $warnings,
            'muscle_frequency' => $muscleFrequency,
        ]);
    }
}
