<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tarif extends Model
{
    use HasFactory;

    protected $table = 'tarif';

    protected $fillable = [
        'rute_id',
        'harga',
        'status',
        'catatan',
    ];

    protected $casts = [
        'harga'      => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ─── Relationships ──────────────────────────────────────────────

    /**
     * Tarif milik satu Rute
     */
    public function rute()
    {
        return $this->belongsTo(Rute::class, 'rute_id');
    }

    // ─── Helpers ────────────────────────────────────────────────────

    /**
     * Format harga ke format Rupiah
     * Contoh: 150000 → "Rp 150.000"
     */
    public function getFormattedHarga(): string
    {
        return 'Rp ' . number_format($this->harga, 0, ',', '.');
    }

    public function isAktif(): bool
    {
        return $this->status === 'aktif';
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
}