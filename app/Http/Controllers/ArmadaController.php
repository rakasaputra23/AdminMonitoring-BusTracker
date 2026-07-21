<?php

namespace App\Http\Controllers;

use App\Models\Armada;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class ArmadaController extends Controller
{
    /**
     * Pola resmi plat nomor kendaraan Indonesia:
     * - 1-2 huruf kode wilayah (contoh: B, AG, DK)
     * - spasi
     * - 1-4 angka nomor polisi
     * - spasi
     * - 1-3 huruf seri belakang (opsional secara umum, tapi di sini diwajibkan
     *   minimal 1 huruf agar konsisten dengan input 3 kolom di frontend)
     *
     * Contoh valid: "B 1234 XYZ", "AG 9 K", "DK 1234 AB"
     */
    private const PLAT_REGEX = '/^[A-Z]{1,2} [0-9]{1,4} [A-Z]{1,3}$/';

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
     * Normalisasi plat nomor: uppercase + rapikan spasi ganda,
     * dipanggil sebelum validasi agar "b  1234  xyz" tetap lolos jadi "B 1234 XYZ"
     */
    private function normalizePlat(Request $request): void
    {
        if ($request->filled('plat_nomor')) {
            $plat = strtoupper(trim($request->input('plat_nomor')));
            $plat = preg_replace('/\s+/', ' ', $plat);
            $request->merge(['plat_nomor' => $plat]);
        }
    }

    /**
     * Store a newly created armada
     */
    public function store(Request $request)
    {
        $this->normalizePlat($request);

        $validated = $request->validate([
            'nama_bus'   => 'required|string|max:255|min:3',
            'plat_nomor' => [
                'required',
                'string',
                'max:20',
                'regex:' . self::PLAT_REGEX,
                'unique:armada,plat_nomor',
            ],
            'kelas'     => 'required|in:Ekonomi,Bisnis,Eksekutif',
            'kapasitas' => 'required|integer|min:1|max:100',
            'status'    => 'required|in:aktif,nonaktif,maintenance',
            'firebase_bus_id' => [
                'nullable',
                'string',
                'max:100',
                'regex:/^[A-Za-z0-9\-_]+$/', // tanpa spasi/karakter aneh
                'unique:armada,firebase_bus_id',
            ],
        ], [
            'nama_bus.required'       => 'Nama bus wajib diisi',
            'nama_bus.min'            => 'Nama bus minimal 3 karakter',
            'plat_nomor.required'     => 'Plat nomor wajib diisi',
            'plat_nomor.regex'        => 'Format plat nomor tidak valid. Contoh: B 1234 XYZ (kode wilayah 1-2 huruf, nomor 1-4 angka, seri 1-3 huruf)',
            'plat_nomor.unique'       => 'Plat nomor sudah terdaftar',
            'kelas.required'          => 'Kelas wajib dipilih',
            'kapasitas.required'      => 'Kapasitas wajib diisi',
            'kapasitas.min'           => 'Kapasitas minimal 1 penumpang',
            'kapasitas.max'           => 'Kapasitas maksimal 100 penumpang',
            'status.required'         => 'Status wajib dipilih',
            'firebase_bus_id.regex'   => 'Firebase Bus ID hanya boleh huruf, angka, tanda hubung (-), dan garis bawah (_), tanpa spasi',
            'firebase_bus_id.unique'  => 'Firebase Bus ID sudah digunakan armada lain',
            'firebase_bus_id.max'     => 'Firebase Bus ID maksimal 100 karakter',
        ]);

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
        $this->normalizePlat($request);

        $validated = $request->validate([
            'nama_bus'   => 'required|string|max:255|min:3',
            'plat_nomor' => [
                'required',
                'string',
                'max:20',
                'regex:' . self::PLAT_REGEX,
                Rule::unique('armada', 'plat_nomor')->ignore($armada->id),
            ],
            'kelas'     => 'required|in:Ekonomi,Bisnis,Eksekutif',
            'kapasitas' => 'required|integer|min:1|max:100',
            'status'    => 'required|in:aktif,nonaktif,maintenance',
            'firebase_bus_id' => [
                'nullable',
                'string',
                'max:100',
                'regex:/^[A-Za-z0-9\-_]+$/',
                Rule::unique('armada', 'firebase_bus_id')->ignore($armada->id),
            ],
        ], [
            'nama_bus.required'       => 'Nama bus wajib diisi',
            'nama_bus.min'            => 'Nama bus minimal 3 karakter',
            'plat_nomor.required'     => 'Plat nomor wajib diisi',
            'plat_nomor.regex'        => 'Format plat nomor tidak valid. Contoh: B 1234 XYZ (kode wilayah 1-2 huruf, nomor 1-4 angka, seri 1-3 huruf)',
            'plat_nomor.unique'       => 'Plat nomor sudah terdaftar',
            'kelas.required'          => 'Kelas wajib dipilih',
            'kapasitas.required'      => 'Kapasitas wajib diisi',
            'kapasitas.min'           => 'Kapasitas minimal 1 penumpang',
            'kapasitas.max'           => 'Kapasitas maksimal 100 penumpang',
            'status.required'         => 'Status wajib dipilih',
            'firebase_bus_id.regex'   => 'Firebase Bus ID hanya boleh huruf, angka, tanda hubung (-), dan garis bawah (_), tanpa spasi',
            'firebase_bus_id.unique'  => 'Firebase Bus ID sudah digunakan armada lain',
            'firebase_bus_id.max'     => 'Firebase Bus ID maksimal 100 karakter',
        ]);

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