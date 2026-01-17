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
        Schema::create('kru', function (Blueprint $table) {
            $table->id();
            $table->string('driver'); // Nama driver
            $table->string('username')->unique(); // Username untuk login APK
            $table->string('password'); // Password (akan di-hash)
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif'); // Status driver
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kru');
    }
};