<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Root Redirect
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return redirect()->route('dashboard');
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
    
    // Data Master Routes (Placeholder - Coming Soon)
    Route::get('/data-master/armada', function () {
        return Inertia::render('ComingSoon', ['feature' => 'Data Armada']);
    })->name('data-master.armada');
    
    Route::get('/data-master/rute', function () {
        return Inertia::render('ComingSoon', ['feature' => 'Data Rute']);
    })->name('data-master.rute');
    
    Route::get('/data-master/tarif', function () {
        return Inertia::render('ComingSoon', ['feature' => 'Data Tarif']);
    })->name('data-master.tarif');
    
    Route::get('/data-master/kru', function () {
        return Inertia::render('ComingSoon', ['feature' => 'Data Kru']);
    })->name('data-master.kru');
    
    // Laporan Routes (Placeholder)
    Route::get('/laporan/riwayat', function () {
        return Inertia::render('ComingSoon', ['feature' => 'Riwayat Perjalanan']);
    })->name('laporan.riwayat');
    
    Route::get('/laporan/pendapatan', function () {
        return Inertia::render('ComingSoon', ['feature' => 'Laporan Pendapatan']);
    })->name('laporan.pendapatan');
    
    // User Management (Superadmin only)
    Route::get('/user-management', function () {
        return Inertia::render('ComingSoon', ['feature' => 'User Management']);
    })->name('user-management');
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