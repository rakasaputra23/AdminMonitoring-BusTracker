<?php

namespace App\Http\Controllers;

use App\Models\Kru;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class KruController extends Controller
{
    /**
     * Display a listing of kru with search & filter
     */
    public function index(Request $request)
    {
        $query = Kru::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('driver', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $kru = $query->orderBy('created_at', 'desc')
                     ->paginate(10)
                     ->withQueryString();

        return Inertia::render('DataMaster/Kru', [
            'kru' => $kru,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
            ],
        ]);
    }

    /**
     * Normalisasi username: lowercase + trim, dipanggil sebelum validasi
     */
    private function normalizeUsername(Request $request): void
    {
        if ($request->filled('username')) {
            $request->merge(['username' => strtolower(trim($request->input('username')))]);
        }
    }

    /**
     * Store a newly created kru
     */
    public function store(Request $request)
    {
        $this->normalizeUsername($request);

        $validated = $request->validate([
            'driver' => [
                'required',
                'string',
                'min:3',
                'max:255',
                'regex:/^[a-zA-Z\s\.\']+$/', // huruf, spasi, titik, apostrof (gelar/nama majemuk)
            ],
            'username' => [
                'required',
                'string',
                'min:4',
                'max:50',
                'regex:/^[a-z0-9_]+$/', // huruf kecil, angka, underscore saja, tanpa spasi
                'unique:kru,username',
            ],
            'password' => [
                'required',
                'string',
                'min:6',
                'max:255',
            ],
            'status' => 'required|in:aktif,nonaktif',
        ], [
            'driver.required'   => 'Nama driver wajib diisi',
            'driver.min'        => 'Nama driver minimal 3 karakter',
            'driver.regex'      => 'Nama driver hanya boleh berisi huruf dan spasi',
            'username.required' => 'Username wajib diisi',
            'username.min'      => 'Username minimal 4 karakter',
            'username.regex'    => 'Username hanya boleh huruf kecil, angka, dan underscore (_), tanpa spasi',
            'username.unique'   => 'Username sudah digunakan',
            'password.required' => 'Password wajib diisi',
            'password.min'      => 'Password minimal 6 karakter',
            'status.required'   => 'Status wajib dipilih',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        Kru::create($validated);

        return redirect()->route('data-master.kru')
                         ->with('success', 'Data kru berhasil ditambahkan');
    }

    /**
     * Update the specified kru
     */
    public function update(Request $request, Kru $kru)
    {
        $this->normalizeUsername($request);

        $validated = $request->validate([
            'driver' => [
                'required',
                'string',
                'min:3',
                'max:255',
                'regex:/^[a-zA-Z\s\.\']+$/',
            ],
            'username' => [
                'required',
                'string',
                'min:4',
                'max:50',
                'regex:/^[a-z0-9_]+$/',
                Rule::unique('kru', 'username')->ignore($kru->id),
            ],
            'password' => [
                'nullable', // opsional saat edit
                'string',
                'min:6',
                'max:255',
            ],
            'status' => 'required|in:aktif,nonaktif',
        ], [
            'driver.required'   => 'Nama driver wajib diisi',
            'driver.min'        => 'Nama driver minimal 3 karakter',
            'driver.regex'      => 'Nama driver hanya boleh berisi huruf dan spasi',
            'username.required' => 'Username wajib diisi',
            'username.min'      => 'Username minimal 4 karakter',
            'username.regex'    => 'Username hanya boleh huruf kecil, angka, dan underscore (_), tanpa spasi',
            'username.unique'   => 'Username sudah digunakan',
            'password.min'      => 'Password minimal 6 karakter',
            'status.required'   => 'Status wajib dipilih',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $kru->update($validated);

        return redirect()->route('data-master.kru')
                         ->with('success', 'Data kru berhasil diperbarui');
    }

    /**
     * Remove the specified kru
     */
    public function destroy(Kru $kru)
    {
        $kru->delete();

        return redirect()->route('data-master.kru')
                         ->with('success', 'Data kru berhasil dihapus');
    }
}