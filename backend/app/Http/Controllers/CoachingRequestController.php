<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateCoachingRequestRequest;
use App\Http\Requests\RespondCoachingRequestRequest;
use App\Models\CoachingRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CoachingRequestController extends Controller
{
    /**
     * Client views their coaching requests.
     */
    public function clientIndex(Request $request)
    {
        $requests = CoachingRequest::query()
            ->where('client_id', $request->user()->id)
            ->with('trainer:id,name,email,specialization')
            ->latest('id')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $requests,
        ]);
    }

    /**
     * Client sends a coaching request to a trainer.
     */
    public function store(CreateCoachingRequestRequest $request)
    {
        $client = $request->user();

        if ($client->role !== 'client') {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya akun Member (Client) yang dapat mengajukan bimbingan.',
            ], 403);
        }

        $trainer = User::where('id', $request->validated('trainer_id'))
            ->where('role', 'trainer')
            ->first();

        if (!$trainer) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengguna yang dipilih bukan Personal Trainer.',
            ], 422);
        }

        if ($client->trainer_id === $trainer->id) {
            return response()->json([
                'status' => 'error',
                'message' => "{$trainer->name} sudah menjadi Personal Trainer aktif Anda.",
            ], 422);
        }

        $duplicate = CoachingRequest::query()
            ->where('client_id', $client->id)
            ->where('trainer_id', $trainer->id)
            ->where('status', 'pending')
            ->exists();

        if ($duplicate) {
            return response()->json([
                'status' => 'error',
                'message' => 'Permintaan bimbingan ke trainer ini masih menunggu persetujuan.',
            ], 422);
        }

        $coachingRequest = CoachingRequest::create([
            'client_id' => $client->id,
            'trainer_id' => $trainer->id,
            'status' => 'pending',
            'message' => $request->validated('message'),
        ]);

        $coachingRequest->load('trainer:id,name,email,specialization');

        return response()->json([
            'status' => 'success',
            'message' => "Permintaan bimbingan telah dikirim ke {$trainer->name}.",
            'data' => $coachingRequest,
        ], 201);
    }

    /**
     * Trainer views incoming coaching requests (pending first).
     */
    public function trainerIndex(Request $request)
    {
        $trainer = $request->user();

        $requests = CoachingRequest::query()
            ->where('trainer_id', $trainer->id)
            ->with('client:id,name,email,phone')
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->latest('id')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $requests,
        ]);
    }

    /**
     * Trainer accepts or rejects an incoming coaching request.
     */
    public function respond(RespondCoachingRequestRequest $request, int $id)
    {
        $trainer = $request->user();
        $coachingRequest = CoachingRequest::findOrFail($id);

        if ($coachingRequest->trainer_id !== $trainer->id && $trainer->role !== 'admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak berhak merespons permintaan ini.',
            ], 403);
        }

        if ($coachingRequest->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Permintaan bimbingan ini sudah diproses sebelumnya.',
            ], 422);
        }

        $newStatus = $request->validated('status');

        DB::transaction(function () use ($coachingRequest, $newStatus) {
            $coachingRequest->update([
                'status' => $newStatus,
                'responded_at' => now(),
            ]);

            if ($newStatus === 'accepted') {
                User::where('id', $coachingRequest->client_id)->update([
                    'trainer_id' => $coachingRequest->trainer_id,
                ]);
            }
        });

        $coachingRequest->load('client:id,name,email,phone');

        return response()->json([
            'status' => 'success',
            'message' => $newStatus === 'accepted'
                ? 'Permintaan diterima. Klien telah dihubungkan ke roster Anda.'
                : 'Permintaan bimbingan telah ditolak.',
            'data' => $coachingRequest,
        ]);
    }
}
