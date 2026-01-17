<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Armada extends Model
{
    use HasFactory;

    /**
     * Nama tabel database
     */
    protected $table = 'armada';

    /**
     * Field yang bisa diisi mass assignment
     */
    protected $fillable = [
        'nama_bus',
        'plat_nomor',
        'kelas',
        'kapasitas',
        'status',
    ];

    /**
     * Casting tipe data
     */
    protected $casts = [
        'kapasitas' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Scope untuk filter armada aktif
     */
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    /**
     * Scope untuk filter armada nonaktif
     */
    public function scopeNonaktif($query)
    {
        return $query->where('status', 'nonaktif');
    }

    /**
     * Scope untuk filter armada maintenance
     */
    public function scopeMaintenance($query)
    {
        return $query->where('status', 'maintenance');
    }

    /**
     * Scope untuk filter by kelas
     */
    public function scopeByKelas($query, $kelas)
    {
        return $query->where('kelas', $kelas);
    }

    /**
     * Check apakah armada aktif
     */
    public function isAktif(): bool
    {
        return $this->status === 'aktif';
    }

    /**
     * Check apakah armada dalam maintenance
     */
    public function isMaintenance(): bool
    {
        return $this->status === 'maintenance';
    }

    /**
     * Get badge color berdasarkan kelas
     */
    public function getKelasBadgeColor(): string
    {
        return match($this->kelas) {
            'Ekonomi' => 'bg-gray-100 text-gray-700',
            'Bisnis' => 'bg-blue-100 text-blue-700',
            'Eksekutif' => 'bg-purple-100 text-purple-700',
            default => 'bg-gray-100 text-gray-700',
        };
    }

    /**
     * Get badge color berdasarkan status
     */
    public function getStatusBadgeColor(): string
    {
        return match($this->status) {
            'aktif' => 'bg-green-100 text-green-700',
            'nonaktif' => 'bg-red-100 text-red-700',
            'maintenance' => 'bg-yellow-100 text-yellow-700',
            default => 'bg-gray-100 text-gray-700',
        };
    }
}