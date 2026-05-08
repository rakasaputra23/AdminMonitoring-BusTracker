<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan kolom firebase_bus_id ke tabel armada.
     *
     * Kolom ini digunakan untuk menghubungkan data armada di MySQL
     * dengan node bus di Firebase Realtime Database.
     * Contoh nilai: "bus_41" → mengarah ke /buses/bus_41 di Firebase.
     */
    public function up(): void
    {
        Schema::table('armada', function (Blueprint $table) {
            $table->string('firebase_bus_id', 50)
                ->nullable()
                ->unique()
                ->after('status')
                ->comment('Key node Firebase Realtime DB, contoh: bus_41');
        });
    }

    public function down(): void
    {
        Schema::table('armada', function (Blueprint $table) {
            $table->dropUnique(['firebase_bus_id']);
            $table->dropColumn('firebase_bus_id');
        });
    }
};