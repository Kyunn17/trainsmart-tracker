<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminUpdateExerciseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'primary_muscle' => ['nullable', 'string', 'max:40'],
            'secondary_muscles' => ['nullable', 'array'],
            'secondary_muscles.*' => ['string', 'max:40'],
            'equipment' => ['nullable', 'string', 'max:40'],
            'movement_pattern' => ['nullable', 'string', 'max:40'],
            'difficulty' => ['sometimes', 'in:beginner,intermediate,advanced'],
            'is_beginner_friendly' => ['sometimes', 'boolean'],
            'instructions' => ['nullable', 'array'],
            'instructions.*' => ['string', 'max:1000'],
            'common_mistakes' => ['nullable', 'array'],
            'common_mistakes.*' => ['string', 'max:500'],
            'tips' => ['nullable', 'array'],
            'tips.*' => ['string', 'max:500'],
            'video_url' => ['nullable', 'url', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'split_session_ids' => ['nullable', 'array'],
            'split_session_ids.*' => ['integer', 'exists:split_sessions,id'],
        ];
    }
}
