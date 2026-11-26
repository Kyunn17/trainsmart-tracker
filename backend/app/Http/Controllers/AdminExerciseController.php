<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminStoreExerciseRequest;
use App\Http\Requests\AdminUpdateExerciseRequest;
use App\Http\Requests\AdminUploadExerciseImageRequest;
use App\Models\Exercise;
use App\Models\ExerciseImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminExerciseController extends Controller
{
    public function index(Request $request)
    {
        $query = Exercise::query()->with(['images', 'splitSessions:id,name,split_id']);

        if ($search = trim((string) $request->query('search', ''))) {
            $term = "%{$search}%";
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('primary_muscle', 'like', $term)
                    ->orWhere('equipment', 'like', $term);
            });
        }

        if ($muscle = $request->query('muscle')) {
            $query->where('primary_muscle', $muscle);
        }

        $status = $request->query('status', 'all');
        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));
        $paginator = $query->orderByDesc('id')->paginate($perPage);

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

    public function store(AdminStoreExerciseRequest $request)
    {
        $validated = $request->validated();
        $sessionIds = $validated['split_session_ids'] ?? null;
        unset($validated['split_session_ids']);

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug ?: 'exercise-' . Str::lower(Str::random(6));
        $suffix = 1;
        while (Exercise::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        $validated['slug'] = $slug;
        $validated['source'] = 'admin';
        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['difficulty'] = $validated['difficulty'] ?? 'beginner';
        $validated['is_beginner_friendly'] = $validated['is_beginner_friendly'] ?? false;

        $exercise = Exercise::create($validated);

        if (is_array($sessionIds)) {
            $syncData = [];
            foreach ($sessionIds as $idx => $sid) {
                $syncData[$sid] = [
                    'is_default_recommended' => true,
                    'default_sets' => 3,
                    'default_rep_range' => '8-12',
                    'sort_order' => $idx + 1,
                ];
            }
            $exercise->splitSessions()->sync($syncData);
        }

        $exercise->load(['images', 'splitSessions:id,name,split_id']);

        return response()->json([
            'status' => 'success',
            'message' => "Gerakan \"{$exercise->name}\" berhasil dibuat.",
            'data' => $exercise,
        ], 201);
    }

    public function update(AdminUpdateExerciseRequest $request, int $id)
    {
        $exercise = Exercise::findOrFail($id);
        $validated = $request->validated();
        $sessionIds = $validated['split_session_ids'] ?? null;
        unset($validated['split_session_ids']);

        $exercise->update($validated);

        if (is_array($sessionIds)) {
            $syncData = [];
            foreach ($sessionIds as $idx => $sid) {
                $syncData[$sid] = [
                    'is_default_recommended' => true,
                    'default_sets' => 3,
                    'default_rep_range' => '8-12',
                    'sort_order' => $idx + 1,
                ];
            }
            $exercise->splitSessions()->sync($syncData);
        }

        $exercise->load(['images', 'splitSessions:id,name,split_id']);

        return response()->json([
            'status' => 'success',
            'message' => "Gerakan \"{$exercise->name}\" berhasil diperbarui.",
            'data' => $exercise,
        ]);
    }

    public function uploadImage(AdminUploadExerciseImageRequest $request, int $id)
    {
        $exercise = Exercise::findOrFail($id);
        $file = $request->file('image');
        $position = (int) $request->validated('position');
        $slug = $exercise->slug ?: Str::slug($exercise->name) ?: "exercise-{$exercise->id}";

        $ext = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');
        $safeName = Str::uuid()->toString() . '.' . $ext;
        $storedPath = $file->storeAs("exercises/{$slug}", $safeName, 'public');

        $existing = ExerciseImage::query()
            ->where('exercise_id', $exercise->id)
            ->where('position', $position)
            ->first();

        if ($existing && $existing->path && Storage::disk('public')->exists($existing->path)) {
            Storage::disk('public')->delete($existing->path);
        }

        $imageRecord = ExerciseImage::updateOrCreate(
            [
                'exercise_id' => $exercise->id,
                'position' => $position,
            ],
            [
                'path' => $storedPath,
                'alt_text' => $request->validated('alt_text') ?: sprintf(
                    '%s - %s',
                    $exercise->name,
                    $position === 0 ? 'posisi awal' : 'posisi akhir'
                ),
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Gambar gerakan berhasil diunggah.',
            'data' => $imageRecord,
        ], 201);
    }

    public function deleteImage(int $id, int $imageId)
    {
        $image = ExerciseImage::query()
            ->where('exercise_id', $id)
            ->where('id', $imageId)
            ->firstOrFail();

        if ($image->path && Storage::disk('public')->exists($image->path)) {
            Storage::disk('public')->delete($image->path);
        }

        $image->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Gambar gerakan berhasil dihapus.',
        ]);
    }
}
