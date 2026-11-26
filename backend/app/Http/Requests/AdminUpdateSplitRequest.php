<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminUpdateSplitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'min_days' => ['sometimes', 'integer', 'min:2', 'max:6'],
            'max_days' => ['sometimes', 'integer', 'min:2', 'max:6', 'gte:min_days'],
            'pros' => ['sometimes', 'array'],
            'pros.*' => ['string', 'max:500'],
            'cons' => ['sometimes', 'array'],
            'cons.*' => ['string', 'max:500'],
            'suitable_for' => ['sometimes', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
