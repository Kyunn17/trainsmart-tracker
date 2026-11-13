<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * User registration with validation
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'nullable|in:client,trainer',
            'specialization' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'trainer_id' => 'nullable|exists:users,id',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini sudah terdaftar. Silakan gunakan email lain atau login.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'role.in' => 'Pilihan peran hanya client atau trainer.',
        ]);

        $role = $validated['role'] ?? 'client';

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $role,
            'phone' => $validated['phone'] ?? null,
            'specialization' => $role === 'trainer' ? ($validated['specialization'] ?? 'General Fitness & Hypertrophy') : null,
            'trainer_id' => $role === 'client' ? ($validated['trainer_id'] ?? null) : null,
        ]);

        $token = $user->createToken('trainsmart_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Registrasi berhasil! Selamat datang di TrainSmart.',
            'token' => $token,
            'user' => $user->load(['trainer', 'clients']),
        ], 201);
    }

    /**
     * User login with validation
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ], [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'password.required' => 'Kata sandi wajib diisi.',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email atau kata sandi salah. Silakan periksa kembali.',
            ], 401);
        }

        // Generate Sanctum token
        $token = $user->createToken('trainsmart_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil! Selamat datang kembali, ' . $user->name . '.',
            'token' => $token,
            'user' => $user->load(['trainer', 'clients']),
        ]);
    }

    /**
     * Get currently authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user()->load(['trainer', 'clients']);

        return response()->json([
            'status' => 'success',
            'user' => $user,
        ]);
    }

    /**
     * User logout
     */
    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Logout berhasil. Sesi telah diakhiri.',
        ]);
    }
}
