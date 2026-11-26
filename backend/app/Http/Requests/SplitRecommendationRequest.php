<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SplitRecommendationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'days' => ['required', 'integer', 'min:2', 'max:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'days.required' => 'Jumlah hari latihan per minggu wajib diisi.',
            'days.integer' => 'Jumlah hari latihan harus berupa angka bulat.',
            'days.min' => 'Minimal pilih 2 hari latihan per minggu.',
            'days.max' => 'Maksimal pilih 6 hari latihan per minggu agar tetap ada waktu istirahat.',
        ];
    }
}
