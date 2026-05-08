<?php

namespace App\Http\Controllers;

use App\Models\Perjalanan;
use App\Models\Rute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LaporanRiwayatController extends Controller
{
    public function index(Request $request)
    {
        // ── Query utama ──────────────────────────────────────────────────
        $query = Perjalanan::with(['kru', 'armada', 'rute'])
            ->orderBy('waktu_mulai', 'desc');

        // Search: nama driver, nama bus, atau plat nomor
        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->whereHas('kru',    fn ($sq) => $sq->where('driver',     'like', "%{$s}%"))
                  ->orWhereHas('armada', fn ($sq) => $sq->where('nama_bus',   'like', "%{$s}%")
                                                        ->orWhere('plat_nomor', 'like', "%{$s}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('kondisi')) {
            $query->where('kondisi_terakhir', $request->input('kondisi'));
        }

        if ($request->filled('rute_id')) {
            $query->where('rute_id', $request->input('rute_id'));
        }

        if ($request->filled('tanggal_dari')) {
            $query->whereDate('waktu_mulai', '>=', $request->input('tanggal_dari'));
        }

        if ($request->filled('tanggal_sampai')) {
            $query->whereDate('waktu_mulai', '<=', $request->input('tanggal_sampai'));
        }

        // ── Paginate ─────────────────────────────────────────────────────
        $perjalanan = $query->paginate(15)->withQueryString();

        // Tambah alias pendapatan supaya konsisten di frontend
        $perjalanan->getCollection()->transform(function ($item) {
            $item->pendapatan = (float) $item->total_pendapatan;
            return $item;
        });

        // ── Stats overview (seluruh data, tidak terfilter) ───────────────
        $stats = [
            'total_perjalanan' => Perjalanan::count(),
            'total_selesai'    => Perjalanan::selesai()->count(),
            'total_aktif'      => Perjalanan::aktif()->count(),
            'total_penumpang'  => (int) Perjalanan::selesai()->sum('total_penumpang_naik'),
        ];

        // ── Daftar rute untuk filter ─────────────────────────────────────
        $ruteList = Rute::where('status', 'aktif')
            ->orderBy('nama_rute')
            ->get(['id', 'nama_rute']);

        return Inertia::render('Laporan/Riwayat', [
            'perjalanan' => $perjalanan,
            'ruteList'   => $ruteList,
            'stats'      => $stats,
            'filters'    => $request->only([
                'search', 'status', 'kondisi',
                'rute_id', 'tanggal_dari', 'tanggal_sampai',
            ]),
        ]);
    }
}