<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\WorkoutController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\TrainerController;
use App\Http\Controllers\ClientController;

/*
|--------------------------------------------------------------------------
| API Routes - TrainSmart
|--------------------------------------------------------------------------
*/

// --- 1. Public Authentication Routes ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// --- 2. Public Workout & Split Endpoints ---
Route::get('/menu-latihan', [WorkoutController::class, 'index']);
Route::get('/categories', [WorkoutController::class, 'index']);
Route::get('/categories/{id}', [WorkoutController::class, 'show']);
Route::get('/trainers', [ClientController::class, 'trainers']);
Route::get('/workout-logs', [WorkoutController::class, 'history']);
Route::post('/workout-logs', [WorkoutController::class, 'storeLogs']);

// --- 3. Authenticated Routes (Any Role) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Client-specific actions
    Route::post('/client/select-trainer', [ClientController::class, 'selectTrainer']);
    Route::get('/client/my-progress', [ClientController::class, 'myProgress']);

    // --- 4. Trainer Routes (Personal Trainer & Admin) ---
    Route::middleware('role:trainer,admin')->prefix('trainer')->group(function () {
        Route::get('/clients', [TrainerController::class, 'clients']);
        Route::post('/clients', [TrainerController::class, 'addClient']);
        Route::delete('/clients/{clientId}', [TrainerController::class, 'removeClient']);
        Route::get('/clients/{clientId}/progress', [TrainerController::class, 'clientProgress']);
    });

    // --- 5. Admin Routes (Admin Only) ---
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::patch('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        Route::post('/exercises', [WorkoutController::class, 'storeExercise']);
    });
});