<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tarif;
use App\Models\Rute;

class TarifSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil rute berdasarkan nama — aman meski id berubah
        $tarifData = [
            [
                'nama_rute' => 'Madiun - Surabaya',
                'harga'     => 85000,
                'status'    => 'aktif',
                'catatan'   => 'Tarif normal',
            ],
            [
                'nama_rute' => 'Surabaya - Madiun',
                'harga'     => 85000,
                'status'    => 'aktif',
                'catatan'   => 'Tarif normal',
            ],
        ];

        $inserted = 0;
        $skipped  = 0;

        foreach ($tarifData as $data) {
            $rute = Rute::where('nama_rute', $data['nama_rute'])->first();

            if (!$rute) {
                $this->command->warn("⚠️  Rute '{$data['nama_rute']}' tidak ditemukan, dilewati.");
                $skipped++;
                continue;
            }

            // Skip jika rute ini sudah punya tarif
            if ($rute->tarif()->exists()) {
                $this->command->warn("⚠️  Rute '{$data['nama_rute']}' sudah memiliki tarif, dilewati.");
                $skipped++;
                continue;
            }

            Tarif::create([
                'rute_id' => $rute->id,
                'harga'   => $data['harga'],
                'status'  => $data['status'],
                'catatan' => $data['catatan'],
            ]);

            $inserted++;
        }

        $this->command->info("✅ Seeder Tarif berhasil! {$inserted} tarif ditambahkan, {$skipped} dilewati.");
    }
}