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
        Schema::create('perjalanan', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('kru_id');
            $table->unsignedBigInteger('armada_id');
            $table->unsignedBigInteger('rute_id');
            $table->dateTime('waktu_mulai');
            $table->dateTime('waktu_selesai')->nullable();
            $table->integer('total_penumpang')->default(0);
            $table->decimal('jarak_tempuh', 8, 2)->nullable();
            $table->integer('durasi_menit')->nullable();
            $table->enum('status', ['aktif', 'selesai'])->default('aktif');
            $table->enum('kondisi_terakhir', ['lancar', 'macet', 'mogok'])->default('lancar');
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('kru_id')->references('id')->on('kru')->onDelete('cascade');
            $table->foreign('armada_id')->references('id')->on('armada')->onDelete('cascade');
            $table->foreign('rute_id')->references('id')->on('rute')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('perjalanan');
    }
};