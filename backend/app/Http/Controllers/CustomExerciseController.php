<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminUploadExerciseImageRequest;
use App\Http\Requests\StoreCustomExerciseRequest;
use App\Http\Requests\UpdateCustomExerciseRequest;
use App\Models\Category;
use App\Models\Exercise;
use App\Models\ExerciseImage;
use App\Models\SplitSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CustomExerciseController extends Controller
{
    /**
     * List all custom exercises created by the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $exercises = Exercise::query()
            ->where('user_id', $user->id)
            ->where('is_custom', true)
            ->with(['images', 'splitSessions:id,name,session_type'])
            ->withCount('workoutLogs')
            ->latest('id')
            ->get();

        $pendingCount = $exercises->where('approval_status', 'pending')->count();

        return response()->json([
            'status' => 'success',
            'data' => $exercises,
            'meta' => [
                'total' => $exercises->count(),
                'pending_count' => $pendingCount,
                'max_pending' => StoreCustomExerciseRequest::MAX_PENDING_PER_USER,
            ],
        ]);
    }

    /**
     * Create a new private custom exercise (pending admin approval for non-admins).
     */
    public function store(StoreCustomExerciseRequest $request)
    {
        $user = $request->user();
        Gate::forUser($user)->authorize('create', Exercise::class);

        $validated = $request->validated();
        $sessionTypes = $validated['session_types'] ?? [];
        $notes = isset($validated['notes']) ? trim((string) $validated['notes']) : null;
        $imageFile = $request->file('image');

        unset($validated['session_types'], $validated['notes'], $validated['image']);

        $baseSlug = 'custom-' . $user->id . '-' . (Str::slug($validated['name']) ?: 'gerakan');
        $slug = $baseSlug;
        $suffix = 1;
        while (Exercise::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        $pattern = $validated['movement_pattern'] ?? $this->inferMovementPattern($validated['primary_muscle']);
        $categoryId = $this->resolveCategoryId($pattern);
        $isAutoApproved = $user->role === 'admin';

        $exercise = Exercise::create([
            'category_id' => $categoryId,
            'user_id' => $user->id,
            'name' => trim($validated['name']),
            'slug' => $slug,
            'primary_muscle' => $validated['primary_muscle'],
            'muscle_region' => $validated['muscle_region'] ?? $this->defaultMuscleRegion($validated['primary_muscle']),
            'secondary_muscles' => [],
            'equipment' => $validated['equipment'],
            'movement_pattern' => $pattern,
            'difficulty' => $validated['difficulty'] ?? 'beginner',
            'is_beginner_friendly' => ($validated['difficulty'] ?? 'beginner') === 'beginner',
            'instructions' => array_values(array_filter(array_map('trim', $validated['instructions'] ?? []))),
            'common_mistakes' => array_values(array_filter(array_map('trim', $validated['common_mistakes'] ?? []))),
            'tips' => $notes ? [$notes] : [],
            'is_active' => $isAutoApproved,
            'is_custom' => true,
            'approval_status' => $isAutoApproved ? 'approved' : 'pending',
            'rejection_reason' => null,
            'source' => 'user_custom',
        ]);

        if (!empty($sessionTypes)) {
            $this->syncSessionTypes($exercise, $sessionTypes);
        }

        if ($imageFile) {
            $ext = strtolower($imageFile->getClientOriginalExtension() ?: $imageFile->extension() ?: 'jpg');
            $safeName = Str::uuid()->toString() . '.' . $ext;
            $storedPath = $imageFile->storeAs("exercises/custom/{$exercise->slug}", $safeName, 'public');

            ExerciseImage::create([
                'exercise_id' => $exercise->id,
                'position' => 0,
                'path' => $storedPath,
                'alt_text' => "{$exercise->name} - posisi awal",
            ]);
        }

        $exercise->load(['images', 'splitSessions:id,name,session_type']);
        $exercise->loadCount('workoutLogs');

        $message = $isAutoApproved
            ? "Gerakan custom \"{$exercise->name}\" berhasil dibuat dan langsung aktif."
            : "Pengajuan gerakan \"{$exercise->name}\" berhasil dikirim dan menunggu ACC Admin.";

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $exercise,
        ], 201);
    }

    /**
     * Update an existing custom exercise owned by the authenticated user.
     */
    public function update(UpdateCustomExerciseRequest $request, int $id)
    {
        $user = $request->user();
        $exercise = Exercise::query()->where('is_custom', true)->findOrFail($id);

        Gate::forUser($user)->authorize('update', $exercise);

        $validated = $request->validated();
        $sessionTypes = $validated['session_types'] ?? null;
        $notes = array_key_exists('notes', $validated) ? trim((string) ($validated['notes'] ?? '')) : null;
        unset($validated['session_types'], $validated['notes']);

        if (isset($validated['name'])) {
            $validated['name'] = trim($validated['name']);
        }
        if (isset($validated['instructions'])) {
            $validated['instructions'] = array_values(array_filter(array_map('trim', $validated['instructions'])));
        }
        if (isset($validated['common_mistakes'])) {
            $validated['common_mistakes'] = array_values(array_filter(array_map('trim', $validated['common_mistakes'])));
        }
        if ($notes !== null) {
            $validated['tips'] = $notes !== '' ? [$notes] : [];
        }

        // If a rejected custom exercise is edited by a non-admin, re-submit it for review
        if ($exercise->approval_status === 'rejected' && $user->role !== 'admin') {
            $pendingCount = Exercise::query()
                ->where('user_id', $user->id)
                ->where('is_custom', true)
                ->where('approval_status', 'pending')
                ->count();

            if ($pendingCount >= StoreCustomExerciseRequest::MAX_PENDING_PER_USER) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Batas maksimal pengajuan menunggu ACC Admin sudah penuh.',
                ], 422);
            }

            $validated['approval_status'] = 'pending';
            $validated['rejection_reason'] = null;
            $validated['is_active'] = false;
        }

        $exercise->update($validated);

        if (is_array($sessionTypes)) {
            $this->syncSessionTypes($exercise, $sessionTypes);
        }

        $exercise->load(['images', 'splitSessions:id,name,session_type']);
        $exercise->loadCount('workoutLogs');

        return response()->json([
            'status' => 'success',
            'message' => "Gerakan \"{$exercise->name}\" berhasil diperbarui.",
            'data' => $exercise,
        ]);
    }

    /**
     * Delete or safely archive a custom exercise:
     * - If referenced by workout_logs: archive (soft-delete) so history stays intact.
     * - If never used in logs: hard-delete and clean up local images.
     */
    public function destroy(Request $request, int $id)
    {
        $user = $request->user();
        $exercise = Exercise::query()->where('is_custom', true)->findOrFail($id);

        Gate::forUser($user)->authorize('delete', $exercise);

        $hasLogs = $exercise->workoutLogs()->exists();

        if ($hasLogs) {
            $exercise->update(['is_active' => false]);
            $exercise->delete();

            return response()->json([
                'status' => 'success',
                'archived' => true,
                'message' => "Gerakan \"{$exercise->name}\" diarsipkan karena sudah tercatat di riwayat latihan Anda.",
            ]);
        }

        foreach ($exercise->images as $img) {
            if ($img->path && Storage::disk('public')->exists($img->path)) {
                Storage::disk('public')->delete($img->path);
            }
        }
        $exercise->images()->delete();
        $exercise->splitSessions()->detach();
        $exercise->forceDelete();

        return response()->json([
            'status' => 'success',
            'archived' => false,
            'message' => "Gerakan \"{$exercise->name}\" berhasil dihapus permanen.",
        ]);
    }

    /**
     * Upload or replace a local image (position 0 or 1) for a user's custom exercise.
     */
    public function uploadImage(AdminUploadExerciseImageRequest $request, int $id)
    {
        $user = $request->user();
        $exercise = Exercise::query()->where('is_custom', true)->findOrFail($id);
        Gate::forUser($user)->authorize('update', $exercise);

        $file = $request->file('image');
        $position = (int) $request->validated('position');
        $ext = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');
        $safeName = Str::uuid()->toString() . '.' . $ext;
        $storedPath = $file->storeAs("exercises/custom/{$exercise->slug}", $safeName, 'public');

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
            'message' => 'Gambar gerakan custom berhasil diunggah.',
            'data' => $imageRecord,
        ], 201);
    }

    /**
     * Delete a local image from a user's custom exercise.
     */
    public function deleteImage(Request $request, int $id, int $imageId)
    {
        $user = $request->user();
        $exercise = Exercise::query()->where('is_custom', true)->findOrFail($id);
        Gate::forUser($user)->authorize('update', $exercise);

        $image = ExerciseImage::query()
            ->where('exercise_id', $exercise->id)
            ->where('id', $imageId)
            ->firstOrFail();

        if ($image->path && Storage::disk('public')->exists($image->path)) {
            Storage::disk('public')->delete($image->path);
        }

        $image->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Gambar gerakan custom berhasil dihapus.',
        ]);
    }

    private function syncSessionTypes(Exercise $exercise, array $sessionTypes): void
    {
        $sessions = SplitSession::query()
            ->whereIn('session_type', $sessionTypes)
            ->get();

        $syncData = [];
        foreach ($sessions as $idx => $session) {
            $syncData[$session->id] = [
                'is_default_recommended' => false,
                'default_sets' => 3,
                'default_rep_range' => '8-12',
                'sort_order' => 100 + $idx,
            ];
        }

        $exercise->splitSessions()->sync($syncData);
    }

    private function inferMovementPattern(string $muscle): string
    {
        return match ($muscle) {
            'chest', 'shoulders', 'triceps' => 'push',
            'back', 'biceps' => 'pull',
            'quads' => 'squat',
            'hamstrings', 'glutes' => 'hinge',
            'core' => 'core',
            default => 'other',
        };
    }

    private function defaultMuscleRegion(string $muscle): string
    {
        return match ($muscle) {
            'chest' => 'middle_chest',
            'shoulders' => 'front_delt',
            'back' => 'lats',
            default => $muscle,
        };
    }

    private function resolveCategoryId(string $pattern): int
    {
        $name = match ($pattern) {
            'push' => 'Push',
            'pull' => 'Pull',
            default => 'Legs',
        };

        return Category::firstOrCreate(['name' => $name])->id;
    }
}
