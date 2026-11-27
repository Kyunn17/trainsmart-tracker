<?php

namespace App\Http\Requests;

use App\Models\Exercise;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreCustomExerciseRequest extends FormRequest
{
    public const MAX_PENDING_PER_USER = 5;

    public const ALLOWED_MUSCLES = [
        'chest', 'back', 'shoulders', 'biceps', 'triceps',
        'quads', 'hamstrings', 'glutes', 'calves', 'core',
    ];

    public const ALLOWED_REGIONS = [
        'upper_chest', 'middle_chest', 'lower_chest',
        'front_delt', 'lateral_delt', 'rear_delt',
        'triceps', 'lats', 'mid_back', 'biceps',
        'quads', 'hamstrings', 'glutes', 'calves', 'core',
    ];

    public const ALLOWED_EQUIPMENT = [
        'barbell', 'dumbbell', 'machine', 'cable',
        'bodyweight', 'kettlebell', 'resistance_band', 'other',
    ];

    public const ALLOWED_SESSIONS = [
        'push', 'pull', 'legs', 'upper', 'lower', 'full_body',
        'anterior', 'posterior', 'arms_delts', 'chest', 'back', 'shoulders', 'arms',
    ];

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'primary_muscle' => ['required', 'string', 'in:' . implode(',', self::ALLOWED_MUSCLES)],
            'muscle_region' => ['nullable', 'string', 'in:' . implode(',', self::ALLOWED_REGIONS)],
            'equipment' => ['required', 'string', 'in:' . implode(',', self::ALLOWED_EQUIPMENT)],
            'movement_pattern' => ['nullable', 'string', 'in:push,pull,squat,hinge,core,other'],
            'difficulty' => ['nullable', 'string', 'in:beginner,intermediate,advanced'],
            'instructions' => ['nullable', 'array', 'max:8'],
            'instructions.*' => ['string', 'max:300'],
            'common_mistakes' => ['nullable', 'array', 'max:5'],
            'common_mistakes.*' => ['string', 'max:300'],
            'notes' => ['nullable', 'string', 'max:600'],
            'session_types' => ['nullable', 'array', 'max:13'],
            'session_types.*' => ['string', 'in:' . implode(',', self::ALLOWED_SESSIONS)],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama gerakan wajib diisi.',
            'name.min' => 'Nama gerakan minimal 2 karakter.',
            'name.max' => 'Nama gerakan maksimal 120 karakter.',
            'primary_muscle.required' => 'Kelompok otot utama wajib dipilih.',
            'primary_muscle.in' => 'Kelompok otot utama tidak valid.',
            'muscle_region.in' => 'Sub-bagian otot tidak valid.',
            'equipment.required' => 'Jenis alat wajib dipilih.',
            'equipment.in' => 'Jenis alat tidak valid.',
            'image.mimes' => 'Format gambar harus JPG, PNG, atau WEBP.',
            'image.max' => 'Ukuran gambar maksimal 2 MB.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $user = $this->user();
            if (!$user) {
                return;
            }

            // 1. Prevent case-insensitive duplicate custom exercise names for the same user
            $name = trim((string) $this->input('name', ''));
            if ($name !== '') {
                $duplicateExists = Exercise::query()
                    ->where('user_id', $user->id)
                    ->where('is_custom', true)
                    ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                    ->exists();

                if ($duplicateExists) {
                    $validator->errors()->add(
                        'name',
                        'Anda sudah memiliki gerakan custom dengan nama yang sama.'
                    );
                }
            }

            // 2. Anti-spam: limit concurrent pending requests per non-admin user
            if ($user->role !== 'admin') {
                $pendingCount = Exercise::query()
                    ->where('user_id', $user->id)
                    ->where('is_custom', true)
                    ->where('approval_status', 'pending')
                    ->count();

                if ($pendingCount >= self::MAX_PENDING_PER_USER) {
                    $validator->errors()->add(
                        'name',
                        'Anda sudah memiliki ' . self::MAX_PENDING_PER_USER . ' pengajuan gerakan yang sedang menunggu ACC Admin. Tunggu hingga diproses sebelum mengajukan lagi.'
                    );
                }
            }
        });
    }
}
