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
        Schema::create('tarif', function (Blueprint $table) {
            $table->id();

            // Foreign key ke tabel rute — UNIQUE agar 1 rute hanya punya 1 tarif
            $table->foreignId('rute_id')
                  ->unique()
                  ->constrained('rute')
                  ->onDelete('cascade');

            // Harga flat per rute (dalam Rupiah)
            $table->decimal('harga', 12, 2)->comment('Harga tarif flat dalam Rupiah');

            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->string('catatan', 500)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tarif');
    }
};