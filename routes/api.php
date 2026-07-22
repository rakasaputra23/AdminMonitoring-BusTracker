<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\KruController;

// Route existing (jika ada)
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ============================================
// ROUTE API KRU BUS - TAMBAHKAN INI
// ============================================

// Login (Public - No Auth)
Route::post('/kru/login', [KruController::class, 'login']);

// Protected Routes (Need Token)
Route::middleware('auth:sanctum')->prefix('kru')->group(function () {

    // Get Master Data
    Route::get('/armada', [KruController::class, 'getArmada']);
    Route::get('/rute', [KruController::class, 'getRute']);
    Route::get('/list', [KruController::class, 'listKru']);

    // Perjalanan Management
    Route::post('/perjalanan/mulai', [KruController::class, 'mulaiPerjalanan']);
    Route::post('/perjalanan/kondisi', [KruController::class, 'updateKondisi']);
    Route::post('/perjalanan/penumpang', [KruController::class, 'updatePenumpang']);
    Route::post('/perjalanan/selesai', [KruController::class, 'selesaiPerjalanan']);
    Route::post('/perjalanan/ganti-driver', [KruController::class, 'gantiDriver']);
    Route::get('/perjalanan/aktif', [KruController::class, 'getPerjalananAktif']);

    // ✅ BARU — ambil perjalanan by ID, dipakai untuk resume trip yang
    // sudah tersimpan lokal di device (perjalanId), tanpa terikat kru_id
    // yang sedang login. Taruh SETELAH /perjalanan/aktif supaya tidak
    // ada ambiguitas path (Laravel tetap resolve keduanya benar karena
    // "aktif" bukan angka, tapi urutan ini lebih aman dibaca).
    Route::get('/perjalanan/{id}', [KruController::class, 'getPerjalananById'])
        ->where('id', '[0-9]+');

    // Logout
    Route::post('/logout', [KruController::class, 'logout']);
});