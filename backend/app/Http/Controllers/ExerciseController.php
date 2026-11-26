<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExerciseFilterRequest;
use App\Models\Exercise;
use Illuminate\Support\Facades\Gate;

class ExerciseController extends Controller
{
    /**
     * Search and filter exercises visible to the current user:
     * active official library + the authenticated user's own active & approved custom exercises.
     */
    public function index(ExerciseFilterRequest $request)
    {
        $validated = $request->validated();
        $user = auth('sanctum')->user();

        $query = Exercise::query()
            ->visibleInLibrary($user)
            ->with('images');

        $scope = $validated['scope'] ?? 'all';
        if ($scope === 'official') {
            $query->where('is_custom', false);
        } elseif ($scope === 'custom') {
            if ($user) {
                $query->where('is_custom', true)->where('user_id', $user->id);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        if (!empty($validated['search'])) {
            $escaped = addcslashes(trim($validated['search']), '\\%_');
            $term = '%' . $escaped . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('primary_muscle', 'like', $term)
                    ->orWhere('muscle_region', 'like', $term)
                    ->orWhere('equipment', 'like', $term);
            });
        }

        if (!empty($validated['muscle'])) {
            $query->where('primary_muscle', $validated['muscle']);
        }

        if (!empty($validated['muscle_region'])) {
            $query->where('muscle_region', $validated['muscle_region']);
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
            ->orderByDesc('is_custom')
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
     * Show full exercise detail by numeric ID or slug, enforced via ExercisePolicy.
     */
    public function show(string $idOrSlug)
    {
        $user = auth('sanctum')->user();

        $query = Exercise::query()
            ->with(['images', 'splitSessions.split', 'creator:id,name,role']);

        $exercise = ctype_digit($idOrSlug)
            ? $query->where('id', (int) $idOrSlug)->first()
            : $query->where('slug', $idOrSlug)->first();

        if (!$exercise || !Gate::forUser($user)->allows('view', $exercise)) {
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
