<?php

namespace App\Http\Requests;

use App\Models\Exercise;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateCustomExerciseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:120'],
            'primary_muscle' => ['sometimes', 'required', 'string', 'in:' . implode(',', StoreCustomExerciseRequest::ALLOWED_MUSCLES)],
            'muscle_region' => ['nullable', 'string', 'in:' . implode(',', StoreCustomExerciseRequest::ALLOWED_REGIONS)],
            'equipment' => ['sometimes', 'required', 'string', 'in:' . implode(',', StoreCustomExerciseRequest::ALLOWED_EQUIPMENT)],
            'movement_pattern' => ['nullable', 'string', 'in:push,pull,squat,hinge,core,other'],
            'difficulty' => ['nullable', 'string', 'in:beginner,intermediate,advanced'],
            'instructions' => ['nullable', 'array', 'max:8'],
            'instructions.*' => ['string', 'max:300'],
            'common_mistakes' => ['nullable', 'array', 'max:5'],
            'common_mistakes.*' => ['string', 'max:300'],
            'notes' => ['nullable', 'string', 'max:600'],
            'session_types' => ['nullable', 'array', 'max:13'],
            'session_types.*' => ['string', 'in:' . implode(',', StoreCustomExerciseRequest::ALLOWED_SESSIONS)],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama gerakan tidak boleh kosong.',
            'name.min' => 'Nama gerakan minimal 2 karakter.',
            'name.max' => 'Nama gerakan maksimal 120 karakter.',
            'primary_muscle.in' => 'Kelompok otot utama tidak valid.',
            'muscle_region.in' => 'Sub-bagian otot tidak valid.',
            'equipment.in' => 'Jenis alat tidak valid.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $user = $this->user();
            $name = trim((string) $this->input('name', ''));
            $exerciseId = (int) $this->route('id');

            if (!$user || $name === '') {
                return;
            }

            $duplicateExists = Exercise::query()
                ->where('user_id', $user->id)
                ->where('is_custom', true)
                ->where('id', '!=', $exerciseId)
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                ->exists();

            if ($duplicateExists) {
                $validator->errors()->add(
                    'name',
                    'Anda sudah memiliki gerakan custom lain dengan nama yang sama.'
                );
            }
        });
    }
}
