<?php

namespace App\Http\Controllers;

use App\Services\WeeklyEvaluationService;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    public function __construct(
        private readonly WeeklyEvaluationService $evaluationService
    ) {
    }

    /**
     * Return weekly evaluation summary + 1-2 rule-based suggestions.
     */
    public function weekly(Request $request)
    {
        $period = $request->query('period', 'last_week');
        if (!in_array($period, ['last_week', 'current_week'], true)) {
            $period = 'last_week';
        }

        $result = $this->evaluationService->evaluate($request->user(), $period);

        return response()->json([
            'status' => 'success',
            'data' => $result,
        ]);
    }
}
