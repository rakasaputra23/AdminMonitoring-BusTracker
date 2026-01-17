<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Kru;
use Illuminate\Support\Facades\Hash;

class KruSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $kruData = [
            [
                'driver' => 'Budi Santoso',
                'username' => 'budi123',
                'password' => 'password', // akan otomatis di-hash oleh model
                'status' => 'aktif',
            ],
            [
                'driver' => 'Ahmad Rifai',
                'username' => 'ahmad456',
                'password' => 'password',
                'status' => 'aktif',
            ],
            [
                'driver' => 'Sutrisno',
                'username' => 'sutris789',
                'password' => 'password',
                'status' => 'aktif',
            ],
            [
                'driver' => 'Dwi Prasetyo',
                'username' => 'dwi321',
                'password' => 'password',
                'status' => 'nonaktif',
            ],
            [
                'driver' => 'Joko Widodo',
                'username' => 'joko999',
                'password' => 'password',
                'status' => 'aktif',
            ],
        ];

        foreach ($kruData as $kru) {
            Kru::create($kru);
        }

        $this->command->info('✅ Seeder Kru berhasil! 5 data kru telah ditambahkan.');
    }
}