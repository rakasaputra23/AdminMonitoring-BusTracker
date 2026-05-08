<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Armada extends Model
{
    use HasFactory;

    protected $table = 'armada';

    protected $fillable = [
        'nama_bus',
        'plat_nomor',
        'kelas',
        'kapasitas',
        'status',
        'firebase_bus_id',
    ];

    protected $casts = [
        'kapasitas'   => 'integer',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];

    // ──────────────────────────────────────────
    // Relasi
    // ──────────────────────────────────────────

    public function perjalanans(): HasMany
    {
        return $this->hasMany(Perjalanan::class, 'armada_id');
    }

    public function perjalananAktif(): HasOne
    {
        return $this->hasOne(Perjalanan::class, 'armada_id')
            ->where('status', 'aktif')
            ->latestOfMany('waktu_mulai');
    }

    // ──────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeNonaktif($query)
    {
        return $query->where('status', 'nonaktif');
    }

    public function scopeMaintenance($query)
    {
        return $query->where('status', 'maintenance');
    }

    public function scopeByKelas($query, $kelas)
    {
        return $query->where('kelas', $kelas);
    }

    public function scopeLinkedToFirebase($query)
    {
        return $query->whereNotNull('firebase_bus_id');
    }

    // ──────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────

    public function isAktif(): bool
    {
        return $this->status === 'aktif';
    }

    public function isMaintenance(): bool
    {
        return $this->status === 'maintenance';
    }

    public function hasFirebaseLink(): bool
    {
        return ! empty($this->firebase_bus_id);
    }

    /**
     * Path node Firebase untuk armada ini. Contoh: "buses/bus_41"
     */
    public function firebasePath(): ?string
    {
        return $this->firebase_bus_id ? "buses/{$this->firebase_bus_id}" : null;
    }

    // ──────────────────────────────────────────
    // Badge Helpers (UI)
    // ──────────────────────────────────────────

    public function getKelasBadgeColor(): string
    {
        return match($this->kelas) {
            'Ekonomi'   => 'bg-gray-100 text-gray-700',
            'Bisnis'    => 'bg-blue-100 text-blue-700',
            'Eksekutif' => 'bg-purple-100 text-purple-700',
            default     => 'bg-gray-100 text-gray-700',
        };
    }

    public function getStatusBadgeColor(): string
    {
        return match($this->status) {
            'aktif'       => 'bg-green-100 text-green-700',
            'nonaktif'    => 'bg-red-100 text-red-700',
            'maintenance' => 'bg-yellow-100 text-yellow-700',
            default       => 'bg-gray-100 text-gray-700',
        };
    }
}