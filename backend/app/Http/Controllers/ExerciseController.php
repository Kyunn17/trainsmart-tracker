<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExerciseFilterRequest;
use App\Models\Exercise;

class ExerciseController extends Controller
{
    /**
     * Search and filter active exercises with pagination.
     */
    public function index(ExerciseFilterRequest $request)
    {
        $validated = $request->validated();

        $query = Exercise::query()
            ->where('is_active', true)
            ->with('images');

        if (!empty($validated['search'])) {
            $term = '%' . trim($validated['search']) . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('primary_muscle', 'like', $term)
                    ->orWhere('equipment', 'like', $term);
            });
        }

        if (!empty($validated['muscle'])) {
            $query->where('primary_muscle', $validated['muscle']);
        }

        if (!empty($validated['equipment'])) {
            $query->where('equipment', $validated['equipment']);
        }

        if (!empty($validated['difficulty'])) {
            $query->where('difficulty', $validated['difficulty']);
        }

        if (!empty($validated['beginner_only'])) {
            $query->where('is_beginner_friendly', true);
        }

        if (!empty($validated['session_type'])) {
            $sessionType = $validated['session_type'];
            $query->whereHas('splitSessions', function ($q) use ($sessionType) {
                $q->where('session_type', $sessionType);
            });
        }

        $perPage = (int) ($validated['per_page'] ?? 24);

        $paginator = $query
            ->orderByDesc('is_beginner_friendly')
            ->orderBy('name')
            ->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Show full exercise detail by numeric ID or slug.
     */
    public function show(string $idOrSlug)
    {
        $query = Exercise::query()
            ->where('is_active', true)
            ->with(['images', 'splitSessions.split']);

        $exercise = ctype_digit($idOrSlug)
            ? $query->where('id', (int) $idOrSlug)->first()
            : $query->where('slug', $idOrSlug)->first();

        if (!$exercise) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gerakan latihan tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $exercise,
        ]);
    }
}
