<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewCustomExerciseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'action' => ['required', 'string', 'in:approve,reject'],
            'rejection_reason' => ['nullable', 'string', 'max:500', 'required_if:action,reject'],
        ];
    }

    public function messages(): array
    {
        return [
            'action.required' => 'Tindakan review wajib dipilih (approve atau reject).',
            'action.in' => 'Tindakan review harus approve atau reject.',
            'rejection_reason.required_if' => 'Alasan penolakan wajib diisi saat menolak gerakan custom.',
            'rejection_reason.max' => 'Alasan penolakan maksimal 500 karakter.',
        ];
    }
}
