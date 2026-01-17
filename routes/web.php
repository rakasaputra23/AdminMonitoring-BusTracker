<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\KruController;
use App\Http\Controllers\ArmadaController;
use App\Http\Controllers\RuteController; // TAMBAHKAN INI
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Root Redirect - LANGSUNG KE LOGIN
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
| Profile Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Data Master Routes
    // ✅ ROUTE ARMADA - CRUD
    Route::get('/data-master/armada', [ArmadaController::class, 'index'])->name('data-master.armada');
    Route::post('/data-master/armada', [ArmadaController::class, 'store'])->name('data-master.armada.store');
    Route::put('/data-master/armada/{armada}', [ArmadaController::class, 'update'])->name('data-master.armada.update');
    Route::delete('/data-master/armada/{armada}', [ArmadaController::class, 'destroy'])->name('data-master.armada.destroy');
    
    // ✅ ROUTE RUTE - CRUD
    Route::get('/data-master/rute', [RuteController::class, 'index'])->name('data-master.rute');
    Route::post('/data-master/rute', [RuteController::class, 'store'])->name('data-master.rute.store');
    Route::put('/data-master/rute/{rute}', [RuteController::class, 'update'])->name('data-master.rute.update');
    Route::delete('/data-master/rute/{rute}', [RuteController::class, 'destroy'])->name('data-master.rute.destroy');
    
    Route::get('/data-master/tarif', function () {
        return Inertia::render('ComingSoon', ['feature' => 'Data Tarif']);
    })->name('data-master.tarif');
    
    // ✅ ROUTE KRU - GANTI COMING SOON JADI CRUD
    Route::get('/data-master/kru', [KruController::class, 'index'])->name('data-master.kru');
    Route::post('/data-master/kru', [KruController::class, 'store'])->name('data-master.kru.store');
    Route::put('/data-master/kru/{kru}', [KruController::class, 'update'])->name('data-master.kru.update');
    Route::delete('/data-master/kru/{kru}', [KruController::class, 'destroy'])->name('data-master.kru.destroy');
    
    // Laporan Routes (Placeholder)
    Route::get('/laporan/riwayat', function () {
        return Inertia::render('ComingSoon', ['feature' => 'Riwayat Perjalanan']);
    })->name('laporan.riwayat');
    
    Route::get('/laporan/pendapatan', function () {
        return Inertia::render('ComingSoon', ['feature' => 'Laporan Pendapatan']);
    })->name('laporan.pendapatan');
});

/*
|--------------------------------------------------------------------------
| User Management Routes (SUPERADMIN ONLY)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'superadmin'])->group(function () {
    Route::get('/user-management', [UserManagementController::class, 'index'])->name('user-management');
    Route::post('/user-management', [UserManagementController::class, 'store'])->name('user-management.store');
    Route::put('/user-management/{user}', [UserManagementController::class, 'update'])->name('user-management.update');
    Route::delete('/user-management/{user}', [UserManagementController::class, 'destroy'])->name('user-management.destroy');
});

/*
|--------------------------------------------------------------------------
| API Routes (Real-time Updates)
|--------------------------------------------------------------------------
*/
Route::prefix('api')->middleware(['auth'])->group(function () {
    Route::get('/admin/stats', [DashboardController::class, 'getStats'])->name('api.admin.stats');
    Route::get('/admin/buses', [DashboardController::class, 'getBusesData'])->name('api.admin.buses');
    Route::get('/admin/buses/{busId}', [DashboardController::class, 'getBusDetail'])->name('api.admin.bus.detail');
});

require __DIR__.'/auth.php';