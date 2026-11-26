<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateCoachingRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'trainer_id' => ['required', 'integer', 'exists:users,id'],
            'message' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'trainer_id.required' => 'Personal Trainer wajib dipilih.',
            'trainer_id.exists' => 'Personal Trainer tidak ditemukan.',
            'message.max' => 'Pesan maksimal 500 karakter.',
        ];
    }
}
