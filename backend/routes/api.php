<?php
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WorkoutController;
use App\Http\Controllers\ReviewController;

// Workout & Hypertrophy Tracker Endpoints
Route::get('/menu-latihan', [WorkoutController::class, 'index']);
Route::get('/categories', [WorkoutController::class, 'index']);
Route::get('/categories/{id}', [WorkoutController::class, 'show']);
Route::post('/exercises', [WorkoutController::class, 'storeExercise']);

Route::get('/workout-logs', [WorkoutController::class, 'history']);
Route::post('/workout-logs', [WorkoutController::class, 'storeLogs']);

// Legacy/Demo endpoints
Route::get('/reviews', [ReviewController::class, 'index']);
Route::post('/reviews', [ReviewController::class, 'store']);