<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated: Silakan login terlebih dahulu.',
            ], 401);
        }

        // Admin can access everything
        if ($user->role === 'admin') {
            return $next($request);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Forbidden: Akun Anda (' . ucfirst($user->role) . ') tidak memiliki izin untuk fitur ini.',
            ], 403);
        }

        return $next($request);
    }
}
