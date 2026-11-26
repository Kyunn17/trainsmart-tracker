<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RescheduleDailySessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'target_date' => ['required', 'date_format:Y-m-d'],
            'reason' => ['required', 'string', 'min:3', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'target_date.required' => 'Tanggal tujuan penggeseran wajib dipilih.',
            'target_date.date_format' => 'Format tanggal tujuan harus YYYY-MM-DD.',
            'reason.required' => 'Alasan geser jadwal wajib diisi (misal: sakit, lembur, atau pemulihan).',
            'reason.min' => 'Alasan minimal 3 karakter.',
            'reason.max' => 'Alasan maksimal 255 karakter.',
        ];
    }
}
