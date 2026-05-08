<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\KruController;
use App\Http\Controllers\ArmadaController;
use App\Http\Controllers\RuteController;
use App\Http\Controllers\TarifController; // ← TAMBAHKAN INI
use App\Http\Controllers\LaporanRiwayatController;
use App\Http\Controllers\LaporanPendapatanController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Root Redirect
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

/*
|--------------------------------------------------------------------------
| Dashboard (Protected)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

/*
|--------------------------------------------------------------------------
| Profile & Data Master Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ✅ ARMADA
    Route::get('/data-master/armada',                  [ArmadaController::class, 'index'])->name('data-master.armada');
    Route::post('/data-master/armada',                 [ArmadaController::class, 'store'])->name('data-master.armada.store');
    Route::put('/data-master/armada/{armada}',         [ArmadaController::class, 'update'])->name('data-master.armada.update');
    Route::delete('/data-master/armada/{armada}',      [ArmadaController::class, 'destroy'])->name('data-master.armada.destroy');

    // ✅ RUTE
    Route::get('/data-master/rute',                    [RuteController::class, 'index'])->name('data-master.rute');
    Route::post('/data-master/rute',                   [RuteController::class, 'store'])->name('data-master.rute.store');
    Route::put('/data-master/rute/{rute}',             [RuteController::class, 'update'])->name('data-master.rute.update');
    Route::delete('/data-master/rute/{rute}',          [RuteController::class, 'destroy'])->name('data-master.rute.destroy');

    // ✅ TARIF (1 tarif per rute, flat)
    Route::get('/data-master/tarif',                   [TarifController::class, 'index'])->name('data-master.tarif');
    Route::post('/data-master/tarif',                  [TarifController::class, 'store'])->name('data-master.tarif.store');
    Route::put('/data-master/tarif/{tarif}',           [TarifController::class, 'update'])->name('data-master.tarif.update');
    Route::delete('/data-master/tarif/{tarif}',        [TarifController::class, 'destroy'])->name('data-master.tarif.destroy');

    // ✅ KRU
    Route::get('/data-master/kru',                     [KruController::class, 'index'])->name('data-master.kru');
    Route::post('/data-master/kru',                    [KruController::class, 'store'])->name('data-master.kru.store');
    Route::put('/data-master/kru/{kru}',               [KruController::class, 'update'])->name('data-master.kru.update');
    Route::delete('/data-master/kru/{kru}',            [KruController::class, 'destroy'])->name('data-master.kru.destroy');

    // Laporan Routes (Placeholder)
    Route::get('/laporan/riwayat',    [LaporanRiwayatController::class,    'index'])->name('laporan.riwayat');
    Route::get('/laporan/pendapatan', [LaporanPendapatanController::class, 'index'])->name('laporan.pendapatan');
});

/*
|--------------------------------------------------------------------------
| User Management Routes (SUPERADMIN ONLY)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'superadmin'])->group(function () {
    Route::get('/user-management',              [UserManagementController::class, 'index'])->name('user-management');
    Route::post('/user-management',             [UserManagementController::class, 'store'])->name('user-management.store');
    Route::put('/user-management/{user}',       [UserManagementController::class, 'update'])->name('user-management.update');
    Route::delete('/user-management/{user}',    [UserManagementController::class, 'destroy'])->name('user-management.destroy');
});

/*
|--------------------------------------------------------------------------
| API Routes (Real-time Updates)
|--------------------------------------------------------------------------
*/
Route::prefix('api')->middleware(['auth'])->group(function () {
    Route::get('/admin/stats',          [DashboardController::class, 'getStats'])->name('api.admin.stats');
    Route::get('/admin/buses',          [DashboardController::class, 'getBusesData'])->name('api.admin.buses');
    Route::get('/admin/buses/{busId}',  [DashboardController::class, 'getBusDetail'])->name('api.admin.bus.detail');
});

require __DIR__.'/auth.php';