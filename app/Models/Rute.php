<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rute extends Model
{
    use HasFactory;

    protected $table = 'rute';

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

    protected $casts = [
        'waypoints'          => 'array',
        'track_coordinates'  => 'array',
        'jarak'              => 'decimal:2',
        'estimasi_waktu'     => 'integer',
        'created_at'         => 'datetime',
        'updated_at'         => 'datetime',
    ];

    // ─── Relationships ──────────────────────────────────────────────

    /**
     * Satu rute memiliki satu tarif
     */
    public function tarif()
    {
        return $this->hasOne(Tarif::class, 'rute_id');
    }

    // ─── Scopes ─────────────────────────────────────────────────────

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeNonaktif($query)
    {
        return $query->where('status', 'nonaktif');
    }

    // ─── Helpers ────────────────────────────────────────────────────

    public function isAktif(): bool
    {
        return $this->status === 'aktif';
    }

    public function getFormattedJarak(): string
    {
        return $this->jarak ? number_format($this->jarak, 2) . ' km' : 'N/A';
    }

    public function getFormattedEstimasiWaktu(): string
    {
        if (!$this->estimasi_waktu) return 'N/A';

        $hours   = floor($this->estimasi_waktu / 60);
        $minutes = $this->estimasi_waktu % 60;

        return $hours > 0 ? "{$hours}j {$minutes}m" : "{$minutes} menit";
    }

    public function decodePolyline(): array
    {
        return $this->track_coordinates ?? [];
    }
}