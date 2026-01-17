<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rute extends Model
{
    use HasFactory;

    /**
     * Nama tabel database
     */
    protected $table = 'rute';

    /**
     * Field yang bisa diisi mass assignment
     */
    protected $fillable = [
        'nama_rute',
        'kota_asal',
        'kota_tujuan',
        'waypoints',
        'polyline',
        'track_coordinates',
        'jarak',
        'estimasi_waktu',
        'status',
        'catatan',
    ];

    /**
     * Casting tipe data
     */
    protected $casts = [
        'waypoints' => 'array', // Auto convert JSON to array
        'track_coordinates' => 'array', // Auto convert JSON to array
        'jarak' => 'decimal:2',
        'estimasi_waktu' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Scope untuk filter rute aktif
     */
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    /**
     * Scope untuk filter rute nonaktif
     */
    public function scopeNonaktif($query)
    {
        return $query->where('status', 'nonaktif');
    }

    /**
     * Check apakah rute aktif
     */
    public function isAktif(): bool
    {
        return $this->status === 'aktif';
    }

    /**
     * Get formatted jarak (dengan km)
     */
    public function getFormattedJarak(): string
    {
        return $this->jarak ? number_format($this->jarak, 2) . ' km' : 'N/A';
    }

    /**
     * Get formatted estimasi waktu (jam & menit)
     */
    public function getFormattedEstimasiWaktu(): string
    {
        if (!$this->estimasi_waktu) return 'N/A';
        
        $hours = floor($this->estimasi_waktu / 60);
        $minutes = $this->estimasi_waktu % 60;
        
        if ($hours > 0) {
            return $hours . 'j ' . $minutes . 'm';
        }
        return $minutes . ' menit';
    }

    /**
     * Decode polyline menjadi array koordinat
     * (Jika butuh decode polyline di backend)
     */
    public function decodePolyline(): array
    {
        // Implementasi decode polyline algorithm
        // Atau bisa pakai package seperti: https://github.com/emcconville/google-map-polyline-encoding-tool
        return $this->track_coordinates ?? [];
    }
}