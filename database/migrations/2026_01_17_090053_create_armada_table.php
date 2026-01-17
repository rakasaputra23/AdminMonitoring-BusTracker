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
        Schema::create('armada', function (Blueprint $table) {
            $table->id();
            $table->string('nama_bus'); // Nama bus (contoh: STJ Express 01)
            $table->string('plat_nomor')->unique(); // Plat nomor kendaraan
            $table->enum('kelas', ['Ekonomi', 'Bisnis', 'Eksekutif'])->default('Ekonomi'); // Kelas bus
            $table->integer('kapasitas'); // Jumlah kapasitas penumpang
            $table->enum('status', ['aktif', 'nonaktif', 'maintenance'])->default('aktif'); // Status armada
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('armada');
    }
};