<?php

namespace App\Http\Controllers;

use App\Models\Kru;
use Illuminate\Http\Request;
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

        // Search by driver name or username
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('driver', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Get paginated results
        $kru = $query->orderBy('created_at', 'desc')
                     ->paginate(10)
                     ->withQueryString(); // Preserve query parameters

        return Inertia::render('DataMaster/Kru', [
            'kru' => $kru,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
            ],
        ]);
    }

    /**
     * Store a newly created kru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'driver' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:kru,username',
            'password' => 'required|string|min:6',
            'status' => 'required|in:aktif,nonaktif',
        ], [
            'driver.required' => 'Nama driver wajib diisi',
            'username.required' => 'Username wajib diisi',
            'username.unique' => 'Username sudah digunakan',
            'password.required' => 'Password wajib diisi',
            'password.min' => 'Password minimal 6 karakter',
            'status.required' => 'Status wajib dipilih',
        ]);

        Kru::create($validated);

        return redirect()->route('data-master.kru')
                         ->with('success', 'Data kru berhasil ditambahkan');
    }

    /**
     * Update the specified kru
     */
    public function update(Request $request, Kru $kru)
    {
        $validated = $request->validate([
            'driver' => 'required|string|max:255',
            'username' => [
                'required',
                'string',
                'max:255',
                Rule::unique('kru', 'username')->ignore($kru->id),
            ],
            'password' => 'nullable|string|min:6', // Password optional saat edit
            'status' => 'required|in:aktif,nonaktif',
        ], [
            'driver.required' => 'Nama driver wajib diisi',
            'username.required' => 'Username wajib diisi',
            'username.unique' => 'Username sudah digunakan',
            'password.min' => 'Password minimal 6 karakter',
            'status.required' => 'Status wajib dipilih',
        ]);

        // Jika password kosong, hapus dari array validated
        if (empty($validated['password'])) {
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