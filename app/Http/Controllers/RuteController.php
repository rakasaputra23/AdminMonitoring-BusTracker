<?php

namespace App\Http\Controllers;

use App\Models\Rute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RuteController extends Controller
{
    /**
     * Display a listing of rute with search & filter
     */
    public function index(Request $request)
    {
        $query = Rute::query();

        // Search by nama rute, kota asal, atau kota tujuan
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nama_rute', 'like', "%{$search}%")
                  ->orWhere('kota_asal', 'like', "%{$search}%")
                  ->orWhere('kota_tujuan', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Get paginated results
        $rute = $query->orderBy('created_at', 'desc')
                      ->paginate(10)
                      ->withQueryString();

        return Inertia::render('DataMaster/Rute', [
            'rute' => $rute,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
            ],
            'googleMapsApiKey' => env('GOOGLE_MAPS_API_KEY'), // Pass API Key ke frontend
        ]);
    }

    /**
     * Store a newly created rute
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_rute' => 'required|string|max:255',
            'kota_asal' => 'required|string|max:255',
            'kota_tujuan' => 'required|string|max:255',
            'waypoints' => 'nullable|json',
            'polyline' => 'required|string',
            'track_coordinates' => 'required|json',
            'jarak' => 'nullable|numeric|min:0',
            'estimasi_waktu' => 'nullable|integer|min:0',
            'status' => 'required|in:aktif,nonaktif',
            'catatan' => 'nullable|string|max:500',
        ], [
            'nama_rute.required' => 'Nama rute wajib diisi',
            'kota_asal.required' => 'Kota asal wajib diisi',
            'kota_tujuan.required' => 'Kota tujuan wajib diisi',
            'polyline.required' => 'Silakan hitung rute terlebih dahulu',
            'track_coordinates.required' => 'Track coordinates tidak valid',
            'status.required' => 'Status wajib dipilih',
        ]);

        // Decode JSON
        if (!empty($validated['waypoints'])) {
            $validated['waypoints'] = json_decode($validated['waypoints'], true);
        }
        $validated['track_coordinates'] = json_decode($validated['track_coordinates'], true);

        Rute::create($validated);

        return redirect()->route('data-master.rute')
                         ->with('success', 'Data rute berhasil ditambahkan');
    }

    /**
     * Update the specified rute
     */
    public function update(Request $request, Rute $rute)
    {
        $validated = $request->validate([
            'nama_rute' => 'required|string|max:255',
            'kota_asal' => 'required|string|max:255',
            'kota_tujuan' => 'required|string|max:255',
            'waypoints' => 'nullable|json',
            'polyline' => 'required|string',
            'track_coordinates' => 'required|json',
            'jarak' => 'nullable|numeric|min:0',
            'estimasi_waktu' => 'nullable|integer|min:0',
            'status' => 'required|in:aktif,nonaktif',
            'catatan' => 'nullable|string|max:500',
        ], [
            'nama_rute.required' => 'Nama rute wajib diisi',
            'kota_asal.required' => 'Kota asal wajib diisi',
            'kota_tujuan.required' => 'Kota tujuan wajib diisi',
            'polyline.required' => 'Silakan hitung rute terlebih dahulu',
            'track_coordinates.required' => 'Track coordinates tidak valid',
            'status.required' => 'Status wajib dipilih',
        ]);

        // Decode JSON
        if (!empty($validated['waypoints'])) {
            $validated['waypoints'] = json_decode($validated['waypoints'], true);
        }
        $validated['track_coordinates'] = json_decode($validated['track_coordinates'], true);

        $rute->update($validated);

        return redirect()->route('data-master.rute')
                         ->with('success', 'Data rute berhasil diperbarui');
    }

    /**
     * Remove the specified rute
     */
    public function destroy(Rute $rute)
    {
        $rute->delete();

        return redirect()->route('data-master.rute')
                         ->with('success', 'Data rute berhasil dihapus');
    }
}