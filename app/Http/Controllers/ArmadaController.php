<?php

namespace App\Http\Controllers;

use App\Models\Armada;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class ArmadaController extends Controller
{
    /**
     * Display a listing of armada with search & filter
     */
    public function index(Request $request)
    {
        $query = Armada::query();

        // Search by nama bus or plat nomor
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nama_bus', 'like', "%{$search}%")
                  ->orWhere('plat_nomor', 'like', "%{$search}%");
            });
        }

        // Filter by kelas
        if ($request->filled('kelas')) {
            $query->where('kelas', $request->input('kelas'));
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Get paginated results
        $armada = $query->orderBy('created_at', 'desc')
                        ->paginate(10)
                        ->withQueryString();

        return Inertia::render('DataMaster/Armada', [
            'armada' => $armada,
            'filters' => [
                'search' => $request->input('search'),
                'kelas' => $request->input('kelas'),
                'status' => $request->input('status'),
            ],
        ]);
    }

    /**
     * Store a newly created armada
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_bus' => 'required|string|max:255',
            'plat_nomor' => 'required|string|max:255|unique:armada,plat_nomor',
            'kelas' => 'required|in:Ekonomi,Bisnis,Eksekutif',
            'kapasitas' => 'required|integer|min:1|max:100',
            'status' => 'required|in:aktif,nonaktif,maintenance',
        ], [
            'nama_bus.required' => 'Nama bus wajib diisi',
            'plat_nomor.required' => 'Plat nomor wajib diisi',
            'plat_nomor.unique' => 'Plat nomor sudah terdaftar',
            'kelas.required' => 'Kelas wajib dipilih',
            'kapasitas.required' => 'Kapasitas wajib diisi',
            'kapasitas.min' => 'Kapasitas minimal 1 penumpang',
            'kapasitas.max' => 'Kapasitas maksimal 100 penumpang',
            'status.required' => 'Status wajib dipilih',
        ]);

        Armada::create($validated);

        return redirect()->route('data-master.armada')
                         ->with('success', 'Data armada berhasil ditambahkan');
    }

    /**
     * Update the specified armada
     */
    public function update(Request $request, Armada $armada)
    {
        $validated = $request->validate([
            'nama_bus' => 'required|string|max:255',
            'plat_nomor' => [
                'required',
                'string',
                'max:255',
                Rule::unique('armada', 'plat_nomor')->ignore($armada->id),
            ],
            'kelas' => 'required|in:Ekonomi,Bisnis,Eksekutif',
            'kapasitas' => 'required|integer|min:1|max:100',
            'status' => 'required|in:aktif,nonaktif,maintenance',
        ], [
            'nama_bus.required' => 'Nama bus wajib diisi',
            'plat_nomor.required' => 'Plat nomor wajib diisi',
            'plat_nomor.unique' => 'Plat nomor sudah terdaftar',
            'kelas.required' => 'Kelas wajib dipilih',
            'kapasitas.required' => 'Kapasitas wajib diisi',
            'kapasitas.min' => 'Kapasitas minimal 1 penumpang',
            'kapasitas.max' => 'Kapasitas maksimal 100 penumpang',
            'status.required' => 'Status wajib dipilih',
        ]);

        $armada->update($validated);

        return redirect()->route('data-master.armada')
                         ->with('success', 'Data armada berhasil diperbarui');
    }

    /**
     * Remove the specified armada
     */
    public function destroy(Armada $armada)
    {
        $armada->delete();

        return redirect()->route('data-master.armada')
                         ->with('success', 'Data armada berhasil dihapus');
    }
}