<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class ReviewController extends Controller
{
    #[OA\Get(
        path: '/api/reviews',
        summary: 'Show all reviews',
        tags: ['Reviews'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Succes to get all data reviews'
            )
        ]
    )]

    #[OA\Post(
    path: '/api/reviews',
    summary: 'Make a new review',
    tags: ['Reviews'],
    requestBody: new OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['nama', 'review'],
            properties: [
                new OA\Property(
                    property: 'nama',
                    type: 'string',
                    example: 'Budi'
                ),
                new OA\Property(
                    property: 'review',
                    type: 'string',
                    example: 'Game-nya bagus'
                )
            ]
        )
    ),
    responses: [
        new OA\Response(
            response: 201,
            description: 'Review has been create succesfully'
        ),
        new OA\Response(
            response: 400,
            description: 'Data is not valid'
        )
    ]
)]
public function store(Request $request)
{
    if (!$request->filled('nama') || !$request->filled('review')) {
        return response()->json([
            'message' => 'Nama dan review wajib diisi'
        ], 400);
    }

    return response()->json([
        'message' => 'Review berhasil dibuat',
        'data' => [
            'nama' => $request->nama,
            'review' => $request->review
        ]
    ], 201);
}
    public function index()
    {
        return response()->json([
            [
                'id' => 1,
                'nama' => 'Budi',
                'review' => 'Game-nya bagus'
            ],
            [
                'id' => 2,
                'nama' => 'Andi',
                'review' => 'Lumayan seru'
            ]
        ]);
    }
}