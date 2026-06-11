<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('perjalanan', function (Blueprint $table) {
            // Menyimpan array koordinat GPS aktual yang dilewati bus selama perjalanan
            // Format JSON: [{"lat": -7.629, "lng": 111.523, "timestamp": 1700000000}, ...]
            // Diambil dari Firebase RTDB node buses/bus_{firebase_bus_id}/track saat trip selesai
            $table->json('gps_track')
                  ->nullable()
                  ->after('catatan')
                  ->comment('Array koordinat GPS aktual dari Firebase track history');
        });
    }

    public function down(): void
    {
        Schema::table('perjalanan', function (Blueprint $table) {
            $table->dropColumn('gps_track');
        });
    }
};