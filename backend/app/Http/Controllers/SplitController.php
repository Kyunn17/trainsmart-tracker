<?php

namespace App\Http\Controllers;

use App\Http\Requests\SplitRecommendationRequest;
use App\Models\Split;

class SplitController extends Controller
{
    /**
     * Return all active splits matching the requested days_per_week (2-6),
     * ordered by recommendation_level (recommended -> alternative -> not_recommended),
     * then by sort_order, including sessions in defined order and computed muscle_frequency.
     */
    public function recommendations(SplitRecommendationRequest $request)
    {
        $days = (int) $request->validated('days');

        $splits = Split::query()
            ->where('is_active', true)
            ->where('days_per_week', $days)
            ->with('sessions')
            ->orderByRaw("CASE recommendation_level WHEN 'recommended' THEN 1 WHEN 'alternative' THEN 2 WHEN 'not_recommended' THEN 3 ELSE 4 END ASC")
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'status' => 'success',
            'days' => $days,
            'data' => $splits,
        ]);
    }

    /**
     * Get a single split with its template sessions and recommended active exercises.
     */
    public function show(int $id)
    {
        $includeAll = request()->boolean('all_exercises');

        $split = Split::query()
            ->where('is_active', true)
            ->with([
                'sessions.exercises' => function ($query) use ($includeAll) {
                    $query->where('exercises.is_active', true)
                        ->where('exercises.is_custom', false)
                        ->where('exercises.approval_status', 'approved')
                        ->when(!$includeAll, function ($q) {
                            $q->where('exercise_split_session.is_default_recommended', true);
                        })
                        ->with('images');
                },
            ])
            ->find($id);

        if (!$split) {
            return response()->json([
                'status' => 'error',
                'message' => 'Program split tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $split,
        ]);
    }
}
