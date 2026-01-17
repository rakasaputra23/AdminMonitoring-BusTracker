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
    
    // Perjalanan Management
    Route::post('/perjalanan/mulai', [KruController::class, 'mulaiPerjalanan']);
    Route::post('/perjalanan/kondisi', [KruController::class, 'updateKondisi']);
    Route::post('/perjalanan/penumpang', [KruController::class, 'updatePenumpang']);
    Route::post('/perjalanan/selesai', [KruController::class, 'selesaiPerjalanan']);
    Route::get('/perjalanan/aktif', [KruController::class, 'getPerjalananAktif']);
    
    // Logout
    Route::post('/logout', [KruController::class, 'logout']);
});