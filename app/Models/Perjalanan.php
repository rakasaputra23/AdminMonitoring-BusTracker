<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Perjalanan extends Model
{
    use HasFactory;

    protected $table = 'perjalanan';

    protected $fillable = [
        'kru_id',
        'armada_id',
        'rute_id',
        'waktu_mulai',
        'waktu_selesai',
        'total_penumpang',
        'total_penumpang_naik',
        'total_pendapatan',
        'tarif_snapshot',
        'jarak_tempuh',
        'durasi_menit',
        'status',
        'kondisi_terakhir',
        'catatan',
        'gps_track',          // ← kolom baru: jalur GPS aktual dari Firebase
    ];

    protected $casts = [
        'waktu_mulai'          => 'datetime',
        'waktu_selesai'        => 'datetime',
        'jarak_tempuh'         => 'decimal:2',
        'tarif_snapshot'       => 'decimal:2',
        'total_pendapatan'     => 'decimal:2',
        'total_penumpang'      => 'integer',
        'total_penumpang_naik' => 'integer',
        'durasi_menit'         => 'integer',
        'gps_track'            => 'array',   // ← otomatis encode/decode JSON
    ];

    // ──────────────────────────────────────────
    // Relasi
    // ──────────────────────────────────────────

    public function kru()
    {
        return $this->belongsTo(Kru::class);
    }

    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    public function rute()
    {
        return $this->belongsTo(Rute::class);
    }

    // ──────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────

    public function scopeAktif(Builder $query): Builder
    {
        return $query->where('perjalanan.status', 'aktif');
    }

    public function scopeSelesai(Builder $query): Builder
    {
        return $query->where('perjalanan.status', 'selesai');
    }

    public function scopePeriode(Builder $query, string $dari, string $sampai): Builder
    {
        return $query->whereBetween('waktu_mulai', [$dari, $sampai]);
    }

    public function scopeBulan(Builder $query, int $bulan, int $tahun): Builder
    {
        return $query->whereYear('waktu_mulai', $tahun)
                     ->whereMonth('waktu_mulai', $bulan);
    }

    // ──────────────────────────────────────────
    // Query Helpers untuk Laporan
    // ──────────────────────────────────────────

    public static function totalPendapatanPeriode(string $dari, string $sampai): float
    {
        return (float) static::selesai()->periode($dari, $sampai)->sum('total_pendapatan');
    }

    public static function totalPenumpangPeriode(string $dari, string $sampai): int
    {
        return (int) static::selesai()->periode($dari, $sampai)->sum('total_penumpang_naik');
    }

    public static function pendapatanPerHari(string $dari, string $sampai)
    {
        return static::selesai()
            ->periode($dari, $sampai)
            ->selectRaw('DATE(waktu_mulai) as tanggal,
                         SUM(total_pendapatan)     as pendapatan,
                         SUM(total_penumpang_naik) as penumpang,
                         COUNT(*)                  as jumlah_trip')
            ->groupByRaw('DATE(waktu_mulai)')
            ->orderBy('tanggal')
            ->get();
    }

    public static function pendapatanPerBulan(int $tahun)
    {
        return static::selesai()
            ->whereYear('waktu_mulai', $tahun)
            ->selectRaw('MONTH(waktu_mulai)         as bulan,
                         SUM(total_pendapatan)     as pendapatan,
                         SUM(total_penumpang_naik) as penumpang,
                         COUNT(*)                  as jumlah_trip')
            ->groupByRaw('MONTH(waktu_mulai)')
            ->orderBy('bulan')
            ->get();
    }

    public static function pendapatanPerRute(string $dari, string $sampai)
    {
        return static::selesai()
            ->periode($dari, $sampai)
            ->join('rute', 'perjalanan.rute_id', '=', 'rute.id')
            ->selectRaw('rute.nama_rute,
                         SUM(perjalanan.total_pendapatan)     as pendapatan,
                         SUM(perjalanan.total_penumpang_naik) as penumpang,
                         COUNT(*)                             as jumlah_trip')
            ->groupBy('rute.id', 'rute.nama_rute')
            ->orderByDesc('pendapatan')
            ->get();
    }
}