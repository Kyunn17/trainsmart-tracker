<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WorkoutController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminExerciseController;
use App\Http\Controllers\AdminSplitController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CoachingRequestController;
use App\Http\Controllers\CustomExerciseController;
use App\Http\Controllers\DailySessionController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\SplitController;
use App\Http\Controllers\TrainerController;
use App\Http\Controllers\UserPlanController;

/*
|--------------------------------------------------------------------------
| API Routes - TrainSmart
|--------------------------------------------------------------------------
*/

// --- 1. Public Routes (Auth with Rate Limiting + Public Trainer Showcase) ---
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Public trainer directory for the Home landing page (non-sensitive fields only)
Route::get('/trainers', [ClientController::class, 'trainers']);

// --- 2. Authenticated Routes (Protected by Laravel Sanctum) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Exercise Library (official + authenticated user's approved custom exercises)
    Route::get('/exercises', [ExerciseController::class, 'index']);
    Route::get('/exercises/{idOrSlug}', [ExerciseController::class, 'show']);

    // Split Catalog, Recommendations & Details
    Route::get('/splits', [SplitController::class, 'index']);
    Route::get('/splits/recommendations', [SplitController::class, 'recommendations']);
    Route::get('/splits/{id}', [SplitController::class, 'show'])->whereNumber('id');

    // Workout Categories & Logs (strictly scoped to authenticated user)
    Route::get('/menu-latihan', [WorkoutController::class, 'index']);
    Route::get('/categories', [WorkoutController::class, 'index']);
    Route::get('/categories/{id}', [WorkoutController::class, 'show'])->whereNumber('id');
    Route::get('/workout-logs', [WorkoutController::class, 'history']);
    Route::post('/workout-logs', [WorkoutController::class, 'storeLogs']);

    // Custom Exercises (Private per creator, requires Admin ACC for non-admins)
    Route::get('/my-exercises', [CustomExerciseController::class, 'index']);
    Route::post('/my-exercises', [CustomExerciseController::class, 'store']);
    Route::patch('/my-exercises/{id}', [CustomExerciseController::class, 'update'])->whereNumber('id');
    Route::delete('/my-exercises/{id}', [CustomExerciseController::class, 'destroy'])->whereNumber('id');
    Route::post('/my-exercises/{id}/images', [CustomExerciseController::class, 'uploadImage'])->whereNumber('id');
    Route::delete('/my-exercises/{id}/images/{imageId}', [CustomExerciseController::class, 'deleteImage'])->whereNumber(['id', 'imageId']);

    // Client-specific actions
    Route::post('/client/select-trainer', [ClientController::class, 'selectTrainer']);
    Route::get('/client/my-progress', [ClientController::class, 'myProgress']);
    Route::get('/client/coaching-requests', [CoachingRequestController::class, 'clientIndex']);
    Route::post('/client/coaching-requests', [CoachingRequestController::class, 'store']);

    // User Plan & Weekly Schedule Builder
    Route::get('/user/plan', [UserPlanController::class, 'show']);
    Route::post('/user/plan', [UserPlanController::class, 'store']);
    Route::post('/user/plan/validate-schedule', [UserPlanController::class, 'validateSchedule']);

    // Daily Sessions & Weekly Evaluation
    Route::get('/daily-sessions/today', [DailySessionController::class, 'today']);
    Route::get('/daily-sessions/{id}', [DailySessionController::class, 'show'])->whereNumber('id');
    Route::patch('/daily-sessions/{id}/status', [DailySessionController::class, 'updateStatus'])->whereNumber('id');
    Route::post('/daily-sessions/{id}/reschedule', [DailySessionController::class, 'reschedule'])->whereNumber('id');
    Route::get('/evaluation/weekly', [EvaluationController::class, 'weekly']);

    // --- 3. Trainer Routes (Personal Trainer & Admin) ---
    Route::middleware('role:trainer,admin')->prefix('trainer')->group(function () {
        Route::get('/clients', [TrainerController::class, 'clients']);
        Route::post('/clients', [TrainerController::class, 'addClient']);
        Route::delete('/clients/{clientId}', [TrainerController::class, 'removeClient'])->whereNumber('clientId');
        Route::get('/clients/{clientId}/progress', [TrainerController::class, 'clientProgress'])->whereNumber('clientId');
        Route::get('/clients/{clientId}/today', [TrainerController::class, 'clientToday'])->whereNumber('clientId');
        Route::patch('/clients/{clientId}/daily-sessions/{date}', [TrainerController::class, 'overrideDailySession'])->whereNumber('clientId');
        Route::get('/coaching-requests', [CoachingRequestController::class, 'trainerIndex']);
        Route::patch('/coaching-requests/{id}', [CoachingRequestController::class, 'respond'])->whereNumber('id');
    });

    // --- 4. Admin Routes (Admin Only) ---
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::patch('/users/{id}', [AdminController::class, 'updateUser'])->whereNumber('id');
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser'])->whereNumber('id');
        Route::get('/exercises', [AdminExerciseController::class, 'index']);
        Route::post('/exercises', [AdminExerciseController::class, 'store']);
        Route::patch('/exercises/{id}', [AdminExerciseController::class, 'update'])->whereNumber('id');
        Route::post('/exercises/{id}/review', [AdminExerciseController::class, 'review'])->whereNumber('id');
        Route::post('/exercises/{id}/promote', [AdminExerciseController::class, 'promote'])->whereNumber('id');
        Route::post('/exercises/{id}/images', [AdminExerciseController::class, 'uploadImage'])->whereNumber('id');
        Route::delete('/exercises/{id}/images/{imageId}', [AdminExerciseController::class, 'deleteImage'])->whereNumber(['id', 'imageId']);
        Route::get('/splits', [AdminSplitController::class, 'index']);
        Route::patch('/splits/{id}', [AdminSplitController::class, 'update'])->whereNumber('id');
    });
});
