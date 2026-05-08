<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan tiga kolom baru ke tabel perjalanan untuk mendukung
     * fitur Laporan Perjalanan dan Laporan Pendapatan.
     *
     * Kolom baru:
     * ─ tarif_snapshot         : harga tarif pada saat perjalanan dimulai (bukan FK ke tarif,
     *                            sengaja di-snapshot agar historis tidak berubah jika tarif diupdate).
     *
     * ─ total_penumpang_naik   : akumulasi penumpang yang NAIK sepanjang perjalanan.
     *                            Berbeda dengan total_penumpang (jumlah penumpang di akhir trip),
     *                            kolom ini hanya bertambah — tidak berkurang — setiap ada
     *                            penumpang boarding baru dari Firebase (totalPassengersBoarded).
     *
     * ─ total_pendapatan       : total_penumpang_naik × tarif_snapshot.
     *                            Dihitung dan disimpan saat perjalanan selesai (status = 'selesai')
     *                            agar query laporan tidak perlu join + kalkulasi setiap saat.
     */
    public function up(): void
    {
        Schema::table('perjalanan', function (Blueprint $table) {
            // Tarif yang berlaku saat perjalanan ini dibuat
            $table->decimal('tarif_snapshot', 12, 2)
                ->nullable()
                ->after('rute_id')
                ->comment('Snapshot harga tarif saat perjalanan dimulai (Rupiah)');

            // Total penumpang yang naik secara akumulatif dari Firebase
            $table->unsignedInteger('total_penumpang_naik')
                ->default(0)
                ->after('total_penumpang')
                ->comment('Akumulasi penumpang naik dari Firebase totalPassengersBoarded');

            // Total pendapatan yang dihitung saat perjalanan selesai
            $table->decimal('total_pendapatan', 12, 2)
                ->default(0)
                ->after('total_penumpang_naik')
                ->comment('total_penumpang_naik × tarif_snapshot (Rupiah)');
        });
    }

    public function down(): void
    {
        Schema::table('perjalanan', function (Blueprint $table) {
            $table->dropColumn([
                'tarif_snapshot',
                'total_penumpang_naik',
                'total_pendapatan',
            ]);
        });
    }
};  