<?php

namespace App\Http\Controllers;

use App\Models\Tarif;
use App\Models\Rute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TarifController extends Controller
{
    /**
     * Display a listing of tarif with search & filter.
     */
    public function index(Request $request)
    {
        $query = Tarif::with('rute');

        // Search by nama rute / kota
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('rute', function ($q) use ($search) {
                $q->where('nama_rute', 'like', "%{$search}%")
                  ->orWhere('kota_asal',   'like', "%{$search}%")
                  ->orWhere('kota_tujuan', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $tarif = $query->orderBy('created_at', 'desc')
                       ->paginate(10)
                       ->withQueryString();

        // Rute yang BELUM punya tarif — untuk dropdown tambah
        $ruteAvailable = Rute::whereDoesntHave('tarif')
                             ->where('status', 'aktif')
                             ->orderBy('nama_rute')
                             ->get(['id', 'nama_rute', 'kota_asal', 'kota_tujuan', 'jarak', 'estimasi_waktu']);

        return Inertia::render('DataMaster/Tarif', [
            'tarif'          => $tarif,
            'ruteAvailable'  => $ruteAvailable,
            'filters'        => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
            ],
        ]);
    }

    /**
     * Store a newly created tarif.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'rute_id' => 'required|exists:rute,id|unique:tarif,rute_id',
            'harga'   => 'required|numeric|min:0',
            'status'  => 'required|in:aktif,nonaktif',
            'catatan' => 'nullable|string|max:500',
        ], [
            'rute_id.required' => 'Rute wajib dipilih',
            'rute_id.exists'   => 'Rute tidak ditemukan',
            'rute_id.unique'   => 'Rute ini sudah memiliki tarif',
            'harga.required'   => 'Harga tarif wajib diisi',
            'harga.numeric'    => 'Harga harus berupa angka',
            'harga.min'        => 'Harga tidak boleh negatif',
            'status.required'  => 'Status wajib dipilih',
        ]);

        Tarif::create($validated);

        return redirect()->route('data-master.tarif')
                         ->with('success', 'Data tarif berhasil ditambahkan');
    }

    /**
     * Update the specified tarif.
     * Note: rute_id tidak bisa diubah setelah dibuat.
     */
    public function update(Request $request, Tarif $tarif)
    {
        $validated = $request->validate([
            'harga'   => 'required|numeric|min:0',
            'status'  => 'required|in:aktif,nonaktif',
            'catatan' => 'nullable|string|max:500',
        ], [
            'harga.required'  => 'Harga tarif wajib diisi',
            'harga.numeric'   => 'Harga harus berupa angka',
            'harga.min'       => 'Harga tidak boleh negatif',
            'status.required' => 'Status wajib dipilih',
        ]);

        $tarif->update($validated);

        return redirect()->route('data-master.tarif')
                         ->with('success', 'Data tarif berhasil diperbarui');
    }

    /**
     * Remove the specified tarif.
     */
    public function destroy(Tarif $tarif)
    {
        $tarif->delete();

        return redirect()->route('data-master.tarif')
                         ->with('success', 'Data tarif berhasil dihapus');
    }
}