<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TrainerOverrideDailySessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:pending,done,skipped,rest'],
            'trainer_note' => ['required', 'string', 'min:3', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status harian wajib diisi.',
            'status.in' => 'Status harian harus pending, done, skipped, atau rest.',
            'trainer_note.required' => 'Catatan alasan dari trainer wajib diisi.',
            'trainer_note.min' => 'Catatan alasan minimal 3 karakter.',
        ];
    }
}
