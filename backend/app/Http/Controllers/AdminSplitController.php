<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminUpdateSplitRequest;
use App\Models\Split;

class AdminSplitController extends Controller
{
    public function index()
    {
        $splits = Split::query()
            ->with('sessions')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $splits,
        ]);
    }

    public function update(AdminUpdateSplitRequest $request, int $id)
    {
        $split = Split::findOrFail($id);
        $split->update($request->validated());
        $split->load('sessions');

        return response()->json([
            'status' => 'success',
            'message' => "Program split \"{$split->name}\" berhasil diperbarui.",
            'data' => $split,
        ]);
    }
}
