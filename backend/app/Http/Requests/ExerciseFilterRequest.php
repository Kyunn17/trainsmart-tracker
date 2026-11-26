<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExerciseFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'muscle' => ['nullable', 'string', 'max:40'],
            'equipment' => ['nullable', 'string', 'max:40'],
            'difficulty' => ['nullable', 'in:beginner,intermediate,advanced'],
            'beginner_only' => ['nullable', 'boolean'],
            'session_type' => ['nullable', 'string', 'max:40'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'difficulty.in' => 'Tingkat kesulitan harus beginner, intermediate, atau advanced.',
            'per_page.integer' => 'Jumlah per halaman harus berupa angka.',
            'per_page.max' => 'Maksimal 50 gerakan per halaman.',
        ];
    }
}
