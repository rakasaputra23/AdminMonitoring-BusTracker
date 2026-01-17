<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rute', function (Blueprint $table) {
            $table->id();
            $table->string('nama_rute'); // Input manual oleh user
            $table->string('kota_asal'); // Kota asal
            $table->string('kota_tujuan'); // Kota tujuan
            $table->json('waypoints')->nullable(); // Titik waypoint untuk customize rute
            $table->text('polyline'); // Encoded polyline dari Google Maps
            $table->json('track_coordinates')->nullable(); // Array koordinat [{"lat": -7.6, "lng": 111.5}, ...]
            $table->decimal('jarak', 8, 2)->nullable(); // Jarak dalam km
            $table->integer('estimasi_waktu')->nullable(); // Estimasi waktu dalam menit
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->text('catatan')->nullable(); // Catatan (misal: "Via Tol", "Jalur Alternatif", dll)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rute');
    }
};