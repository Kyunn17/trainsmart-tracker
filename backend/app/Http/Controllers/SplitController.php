<?php

namespace App\Http\Controllers;

use App\Http\Requests\SplitRecommendationRequest;
use App\Models\Split;

class SplitController extends Controller
{
    /**
     * Recommend 1-3 splits matching the user's weekly training days (2-6).
     */
    public function recommendations(SplitRecommendationRequest $request)
    {
        $days = (int) $request->validated('days');

        $splits = Split::query()
            ->where('is_active', true)
            ->where('min_days', '<=', $days)
            ->where('max_days', '>=', $days)
            ->with('sessions')
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
        $split = Split::query()
            ->where('is_active', true)
            ->with([
                'sessions.exercises' => function ($query) {
                    $query->where('exercises.is_active', true)
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
