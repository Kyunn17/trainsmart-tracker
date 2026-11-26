<?php

namespace App\Http\Requests;

use App\Models\SplitSession;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SaveUserPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'split_id' => ['required', 'integer', 'exists:splits,id'],
            'days_per_week' => ['required', 'integer', 'min:2', 'max:6'],
            'schedule' => ['required', 'array', 'size:7'],
            'schedule.*.day_of_week' => ['required', 'integer', 'min:1', 'max:7', 'distinct'],
            'schedule.*.split_session_id' => ['nullable', 'integer', 'exists:split_sessions,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'split_id.required' => 'Program split wajib dipilih.',
            'split_id.exists' => 'Program split yang dipilih tidak ditemukan.',
            'days_per_week.required' => 'Jumlah hari latihan wajib diisi.',
            'days_per_week.min' => 'Minimal pilih 2 hari latihan per minggu.',
            'days_per_week.max' => 'Maksimal pilih 6 hari latihan per minggu.',
            'schedule.required' => 'Jadwal mingguan Senin–Minggu wajib dikirim.',
            'schedule.size' => 'Jadwal mingguan harus terdiri dari tepat 7 hari (Senin–Minggu).',
            'schedule.*.day_of_week.distinct' => 'Setiap hari dalam seminggu (1–7) tidak boleh duplikat.',
            'schedule.*.split_session_id.exists' => 'Sesi latihan yang dipilih tidak valid.',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $splitId = (int) $this->input('split_id');
                $schedule = $this->input('schedule', []);

                if (!$splitId || !is_array($schedule)) {
                    return;
                }

                $sessionIds = collect($schedule)
                    ->pluck('split_session_id')
                    ->filter()
                    ->map(fn ($id) => (int) $id)
                    ->unique()
                    ->values()
                    ->all();

                if (empty($sessionIds)) {
                    return;
                }

                $validCount = SplitSession::query()
                    ->where('split_id', $splitId)
                    ->whereIn('id', $sessionIds)
                    ->count();

                if ($validCount !== count($sessionIds)) {
                    $validator->errors()->add(
                        'schedule',
                        'Terdapat sesi latihan yang tidak termasuk dalam split yang dipilih.'
                    );
                }
            },
        ];
    }
}
