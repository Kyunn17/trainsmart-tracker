<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RespondCoachingRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:accepted,rejected'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Keputusan wajib dipilih.',
            'status.in' => 'Status harus accepted atau rejected.',
        ];
    }
}
