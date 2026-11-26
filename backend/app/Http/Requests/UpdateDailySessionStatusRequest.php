<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDailySessionStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:pending,done,skipped,rest'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status sesi latihan wajib diisi.',
            'status.in' => 'Status sesi harus salah satu dari: pending, done, skipped, atau rest.',
        ];
    }
}
