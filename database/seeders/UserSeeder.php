<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Superadmin
        User::create([
            'name' => 'Super Administrator',
            'email' => 'superadmin@stj.ac.id',
            'role' => 'superadmin',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // Create Admin
        User::create([
            'name' => 'Administrator',
            'email' => 'admin@stj.ac.id',
            'role' => 'admin',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
    }
}