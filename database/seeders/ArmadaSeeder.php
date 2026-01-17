<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Armada;

class ArmadaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $armadaData = [
            [
                'nama_bus' => 'STJ Express 01',
                'plat_nomor' => 'B 1234 STJ',
                'kelas' => 'Eksekutif',
                'kapasitas' => 40,
                'status' => 'aktif',
            ],
            [
                'nama_bus' => 'STJ Express 02',
                'plat_nomor' => 'B 5678 STJ',
                'kelas' => 'Eksekutif',
                'kapasitas' => 40,
                'status' => 'aktif',
            ],
            [
                'nama_bus' => 'STJ Bisnis 01',
                'plat_nomor' => 'B 9012 STJ',
                'kelas' => 'Bisnis',
                'kapasitas' => 45,
                'status' => 'aktif',
            ],
            [
                'nama_bus' => 'STJ Bisnis 02',
                'plat_nomor' => 'B 3456 STJ',
                'kelas' => 'Bisnis',
                'kapasitas' => 45,
                'status' => 'maintenance',
            ],
            [
                'nama_bus' => 'STJ Ekonomi 01',
                'plat_nomor' => 'B 7890 STJ',
                'kelas' => 'Ekonomi',
                'kapasitas' => 50,
                'status' => 'aktif',
            ],
            [
                'nama_bus' => 'STJ Ekonomi 02',
                'plat_nomor' => 'B 1111 STJ',
                'kelas' => 'Ekonomi',
                'kapasitas' => 50,
                'status' => 'aktif',
            ],
            [
                'nama_bus' => 'STJ Ekonomi 03',
                'plat_nomor' => 'B 2222 STJ',
                'kelas' => 'Ekonomi',
                'kapasitas' => 50,
                'status' => 'nonaktif',
            ],
            [
                'nama_bus' => 'STJ Premium 01',
                'plat_nomor' => 'B 3333 STJ',
                'kelas' => 'Eksekutif',
                'kapasitas' => 35,
                'status' => 'aktif',
            ],
        ];

        foreach ($armadaData as $armada) {
            Armada::create($armada);
        }

        $this->command->info('✅ Seeder Armada berhasil! 8 data armada telah ditambahkan.');
    }
}