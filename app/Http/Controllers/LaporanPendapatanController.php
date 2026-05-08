<?php

namespace App\Http\Controllers;

use App\Models\Perjalanan;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class LaporanPendapatanController extends Controller
{
    public function index(Request $request)
    {
        // ── Pilihan bulan (default: bulan ini) ──────────────────────────
        $bulan       = $request->input('bulan', now()->format('Y-m'));
        $carbonBulan = Carbon::createFromFormat('Y-m', $bulan)->startOfMonth();
        $dari        = $carbonBulan->copy()->startOfMonth()->toDateTimeString();
        $sampai      = $carbonBulan->copy()->endOfMonth()->toDateTimeString();

        // Bulan sebelumnya (untuk growth)
        $prevDari   = $carbonBulan->copy()->subMonth()->startOfMonth()->toDateTimeString();
        $prevSampai = $carbonBulan->copy()->subMonth()->endOfMonth()->toDateTimeString();

        // ── Stats bulan ini ──────────────────────────────────────────────
        $cur = Perjalanan::selesai()
            ->whereBetween('waktu_mulai', [$dari, $sampai])
            ->selectRaw('
                COALESCE(SUM(total_pendapatan), 0)     AS total_pendapatan,
                COALESCE(SUM(total_penumpang_naik), 0) AS total_penumpang,
                COUNT(*)                               AS total_trip
            ')
            ->first();

        $prev = Perjalanan::selesai()
            ->whereBetween('waktu_mulai', [$prevDari, $prevSampai])
            ->selectRaw('COALESCE(SUM(total_pendapatan), 0) AS total_pendapatan')
            ->first();

        $currPendapatan = (float) ($cur->total_pendapatan ?? 0);
        $prevPendapatan = (float) ($prev->total_pendapatan ?? 0);
        $totalTrip      = (int)   ($cur->total_trip       ?? 0);
        $totalPenumpang = (int)   ($cur->total_penumpang  ?? 0);

        $growth = $prevPendapatan > 0
            ? round((($currPendapatan - $prevPendapatan) / $prevPendapatan) * 100, 1)
            : null;

        $stats = [
            'total_pendapatan' => $currPendapatan,
            'total_penumpang'  => $totalPenumpang,
            'total_trip'       => $totalTrip,
            'rata_per_trip'    => $totalTrip > 0 ? round($currPendapatan / $totalTrip) : 0,
            'rata_penumpang'   => $totalTrip > 0 ? round($totalPenumpang / $totalTrip) : 0,
            'growth'           => $growth,
        ];

        // ── Pendapatan per rute ──────────────────────────────────────────
        $perRute = Perjalanan::selesai()
            ->whereBetween('waktu_mulai', [$dari, $sampai])
            ->join('rute',  'perjalanan.rute_id', '=', 'rute.id')
            ->leftJoin('tarif', 'rute.id', '=', 'tarif.rute_id')
            ->selectRaw('
                perjalanan.rute_id,
                rute.nama_rute,
                rute.kota_asal,
                rute.kota_tujuan,
                COALESCE(tarif.harga, 0)                        AS harga,
                COUNT(*)                                        AS total_trip,
                COALESCE(SUM(perjalanan.total_penumpang_naik), 0) AS total_penumpang,
                COALESCE(SUM(perjalanan.total_pendapatan), 0)    AS pendapatan
            ')
            ->groupBy(
                'perjalanan.rute_id',
                'rute.nama_rute',
                'rute.kota_asal',
                'rute.kota_tujuan',
                'tarif.harga'
            )
            ->orderByDesc('pendapatan')
            ->get();

        // ── Tren 6 bulan terakhir ────────────────────────────────────────
        $trend = collect(range(5, 0))->map(function ($i) {
            $m     = now()->subMonths($i);
            $mDari = $m->copy()->startOfMonth()->toDateTimeString();
            $mAkhr = $m->copy()->endOfMonth()->toDateTimeString();

            $row = Perjalanan::selesai()
                ->whereBetween('waktu_mulai', [$mDari, $mAkhr])
                ->selectRaw('
                    COALESCE(SUM(total_pendapatan), 0)     AS pendapatan,
                    COALESCE(SUM(total_penumpang_naik), 0) AS penumpang,
                    COUNT(*)                               AS trip
                ')
                ->first();

            return [
                'bulan'      => $m->locale('id')->isoFormat('MMM YYYY'),
                'pendapatan' => (float) ($row->pendapatan ?? 0),
                'penumpang'  => (int)   ($row->penumpang  ?? 0),
                'trip'       => (int)   ($row->trip        ?? 0),
            ];
        })->values();

        // ── Pendapatan per hari (bulan dipilih) ──────────────────────────
        $perHari = Perjalanan::selesai()
            ->whereBetween('waktu_mulai', [$dari, $sampai])
            ->selectRaw('
                DATE(waktu_mulai)                              AS tanggal,
                COALESCE(SUM(total_pendapatan), 0)            AS pendapatan,
                COALESCE(SUM(total_penumpang_naik), 0)        AS penumpang,
                COUNT(*)                                      AS jumlah_trip
            ')
            ->groupByRaw('DATE(waktu_mulai)')
            ->orderBy('tanggal')
            ->get();

        return Inertia::render('Laporan/Pendapatan', [
            'stats'   => $stats,
            'perRute' => $perRute,
            'trend'   => $trend,
            'perHari' => $perHari,
            'bulan'   => $bulan,
        ]);
    }
}