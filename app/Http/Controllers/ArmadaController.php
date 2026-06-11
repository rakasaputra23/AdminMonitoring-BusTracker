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

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nama_bus', 'like', "%{$search}%")
                  ->orWhere('plat_nomor', 'like', "%{$search}%");
            });
        }

        if ($request->filled('kelas')) {
            $query->where('kelas', $request->input('kelas'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $armada = $query->orderBy('created_at', 'desc')
                        ->paginate(10)
                        ->withQueryString();

        return Inertia::render('DataMaster/Armada', [
            'armada'  => $armada,
            'filters' => [
                'search' => $request->input('search'),
                'kelas'  => $request->input('kelas'),
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
            'nama_bus'        => 'required|string|max:255',
            'plat_nomor'      => 'required|string|max:255|unique:armada,plat_nomor',
            'kelas'           => 'required|in:Ekonomi,Bisnis,Eksekutif',
            'kapasitas'       => 'required|integer|min:1|max:100',
            'status'          => 'required|in:aktif,nonaktif,maintenance',
            // ✅ TAMBAH: nullable, unik, format bebas spasi/karakter khusus tidak disarankan
            'firebase_bus_id' => 'nullable|string|max:100|unique:armada,firebase_bus_id',
        ], [
            'nama_bus.required'          => 'Nama bus wajib diisi',
            'plat_nomor.required'        => 'Plat nomor wajib diisi',
            'plat_nomor.unique'          => 'Plat nomor sudah terdaftar',
            'kelas.required'             => 'Kelas wajib dipilih',
            'kapasitas.required'         => 'Kapasitas wajib diisi',
            'kapasitas.min'              => 'Kapasitas minimal 1 penumpang',
            'kapasitas.max'              => 'Kapasitas maksimal 100 penumpang',
            'status.required'            => 'Status wajib dipilih',
            'firebase_bus_id.unique'     => 'Firebase Bus ID sudah digunakan armada lain',
            'firebase_bus_id.max'        => 'Firebase Bus ID maksimal 100 karakter',
        ]);

        // Ubah string kosong jadi null agar kolom DB tidak terisi string ""
        $validated['firebase_bus_id'] = $validated['firebase_bus_id'] ?: null;

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
            'nama_bus'   => 'required|string|max:255',
            'plat_nomor' => [
                'required',
                'string',
                'max:255',
                Rule::unique('armada', 'plat_nomor')->ignore($armada->id),
            ],
            'kelas'     => 'required|in:Ekonomi,Bisnis,Eksekutif',
            'kapasitas' => 'required|integer|min:1|max:100',
            'status'    => 'required|in:aktif,nonaktif,maintenance',
            // ✅ TAMBAH: nullable, unique ignore self
            'firebase_bus_id' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('armada', 'firebase_bus_id')->ignore($armada->id),
            ],
        ], [
            'nama_bus.required'      => 'Nama bus wajib diisi',
            'plat_nomor.required'    => 'Plat nomor wajib diisi',
            'plat_nomor.unique'      => 'Plat nomor sudah terdaftar',
            'kelas.required'         => 'Kelas wajib dipilih',
            'kapasitas.required'     => 'Kapasitas wajib diisi',
            'kapasitas.min'          => 'Kapasitas minimal 1 penumpang',
            'kapasitas.max'          => 'Kapasitas maksimal 100 penumpang',
            'status.required'        => 'Status wajib dipilih',
            'firebase_bus_id.unique' => 'Firebase Bus ID sudah digunakan armada lain',
            'firebase_bus_id.max'    => 'Firebase Bus ID maksimal 100 karakter',
        ]);

        // Ubah string kosong jadi null
        $validated['firebase_bus_id'] = $validated['firebase_bus_id'] ?: null;

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