<?php
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// (Kodingan bawaan yang udah ada di atas biarin aja)

Route::get('/menu-latihan', function () {
    // Ajaibnya ORM Laravel: Ambil semua kategori, sekalian bawa data gerakannya!
    $data = Category::with('exercises')->get();
    
    return response()->json([
        'status' => 'MANTAP',
        'pesan' => 'Data jadwal dan gerakan berhasil ditarik, bre!',
        'data' => $data
    ]);
});