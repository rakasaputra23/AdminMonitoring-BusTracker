<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

class Kru extends Model
{
    use HasFactory;

    /**
     * Nama tabel database
     */
    protected $table = 'kru';

    /**
     * Field yang bisa diisi mass assignment
     */
    protected $fillable = [
        'driver',
        'username',
        'password',
        'status',
    ];

    /**
     * Hidden attributes (tidak ditampilkan di response JSON)
     */
    protected $hidden = [
        'password',
    ];

    /**
     * Casting tipe data
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Auto hash password saat create/update
     */
    public function setPasswordAttribute($value)
    {
        // Hanya hash jika password tidak kosong
        if (!empty($value)) {
            $this->attributes['password'] = Hash::make($value);
        }
    }

    /**
     * Scope untuk filter kru aktif
     */
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    /**
     * Scope untuk filter kru nonaktif
     */
    public function scopeNonaktif($query)
    {
        return $query->where('status', 'nonaktif');
    }

    /**
     * Check apakah kru aktif
     */
    public function isAktif(): bool
    {
        return $this->status === 'aktif';
    }
}