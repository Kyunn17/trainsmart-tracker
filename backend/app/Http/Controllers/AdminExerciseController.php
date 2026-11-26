<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminStoreExerciseRequest;
use App\Http\Requests\AdminUpdateExerciseRequest;
use App\Http\Requests\AdminUploadExerciseImageRequest;
use App\Http\Requests\ReviewCustomExerciseRequest;
use App\Models\Exercise;
use App\Models\ExerciseImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminExerciseController extends Controller
{
    public function index(Request $request)
    {
        $query = Exercise::query()->with([
            'images',
            'splitSessions:id,name,split_id',
            'creator:id,name,email,role',
        ]);

        if ($search = trim((string) $request->query('search', ''))) {
            $term = "%{$search}%";
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('primary_muscle', 'like', $term)
                    ->orWhere('muscle_region', 'like', $term)
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
        } elseif ($status === 'pending_custom') {
            $query->where('is_custom', true)->where('approval_status', 'pending');
        } elseif ($status === 'rejected_custom') {
            $query->where('is_custom', true)->where('approval_status', 'rejected');
        } elseif ($status === 'custom') {
            $query->where('is_custom', true);
        } elseif ($status === 'official') {
            $query->where('is_custom', false);
        }

        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));
        $paginator = $query->orderByDesc('id')->paginate($perPage);

        $pendingCustomCount = Exercise::query()
            ->where('is_custom', true)
            ->where('approval_status', 'pending')
            ->count();

        return response()->json([
            'status' => 'success',
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'pending_custom_count' => $pendingCustomCount,
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
        while (Exercise::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        $validated['slug'] = $slug;
        $validated['source'] = 'curated';
        $validated['is_custom'] = false;
        $validated['user_id'] = null;
        $validated['approval_status'] = 'approved';
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

        $exercise->load(['images', 'splitSessions:id,name,split_id', 'creator:id,name,email,role']);

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

        $exercise->load(['images', 'splitSessions:id,name,split_id', 'creator:id,name,email,role']);

        return response()->json([
            'status' => 'success',
            'message' => "Gerakan \"{$exercise->name}\" berhasil diperbarui.",
            'data' => $exercise,
        ]);
    }

    /**
     * Admin approves or rejects a user-submitted custom exercise request.
     */
    public function review(ReviewCustomExerciseRequest $request, int $id)
    {
        $exercise = Exercise::query()->where('is_custom', true)->findOrFail($id);
        $validated = $request->validated();

        if ($validated['action'] === 'approve') {
            $exercise->update([
                'approval_status' => 'approved',
                'is_active' => true,
                'rejection_reason' => null,
            ]);
            $message = "Gerakan custom \"{$exercise->name}\" telah disetujui (ACC) dan kini aktif untuk pembuatnya.";
        } else {
            $exercise->update([
                'approval_status' => 'rejected',
                'is_active' => false,
                'rejection_reason' => trim((string) $validated['rejection_reason']),
            ]);
            $message = "Gerakan custom \"{$exercise->name}\" telah ditolak.";
        }

        $exercise->load(['images', 'splitSessions:id,name,split_id', 'creator:id,name,email,role']);

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $exercise,
        ]);
    }

    /**
     * Admin promotes a custom exercise into the official curated library visible to all users.
     */
    public function promote(int $id)
    {
        $exercise = Exercise::query()->where('is_custom', true)->findOrFail($id);

        $exercise->update([
            'is_custom' => false,
            'user_id' => null,
            'approval_status' => 'approved',
            'rejection_reason' => null,
            'is_active' => true,
            'source' => 'curated',
        ]);

        $exercise->load(['images', 'splitSessions:id,name,split_id', 'creator:id,name,email,role']);

        return response()->json([
            'status' => 'success',
            'message' => "Gerakan \"{$exercise->name}\" berhasil dipromosikan ke Library Resmi untuk semua pengguna.",
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
