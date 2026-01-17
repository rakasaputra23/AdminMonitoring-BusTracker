<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kru;
use App\Models\Armada;
use App\Models\Rute;
use App\Models\Perjalanan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class KruController extends Controller
{
    /**
     * LOGIN - Endpoint untuk login kru bus
     * POST /api/kru/login
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $kru = Kru::where('username', $request->username)->first();

        if (!$kru || !Hash::check($request->password, $kru->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Username atau password salah'
            ], 401);
        }

        if ($kru->status !== 'aktif') {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak aktif. Hubungi admin.'
            ], 403);
        }

        // Generate token
        $token = $kru->createToken('kru-mobile-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'kru' => [
                    'id' => $kru->id,
                    'driver' => $kru->driver,
                    'username' => $kru->username,
                    'status' => $kru->status,
                ],
                'token' => $token
            ]
        ], 200);
    }

    /**
     * GET ARMADA - Ambil list armada yang aktif
     * GET /api/kru/armada
     */
    public function getArmada()
    {
        $armada = Armada::where('status', 'aktif')->get();

        return response()->json([
            'success' => true,
            'message' => 'Data armada berhasil diambil',
            'data' => $armada
        ], 200);
    }

    /**
     * GET RUTE - Ambil list rute yang aktif dengan track coordinates
     * GET /api/kru/rute
     */
    public function getRute()
    {
        $rute = Rute::where('status', 'aktif')
            ->select('id', 'nama_rute', 'kota_asal', 'kota_tujuan', 'polyline', 'track_coordinates', 'jarak', 'estimasi_waktu')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Data rute berhasil diambil',
            'data' => $rute
        ], 200);
    }

    /**
     * MULAI PERJALANAN - Buat record perjalanan baru
     * POST /api/kru/perjalanan/mulai
     */
    public function mulaiPerjalanan(Request $request)
    {
        $request->validate([
            'armada_id' => 'required|exists:armada,id',
            'rute_id' => 'required|exists:rute,id',
        ]);

        // Cek apakah kru masih punya perjalanan aktif
        $perjalananAktif = Perjalanan::where('kru_id', $request->user()->id)
            ->where('status', 'aktif')
            ->first();

        if ($perjalananAktif) {
            return response()->json([
                'success' => false,
                'message' => 'Anda masih memiliki perjalanan yang belum diselesaikan'
            ], 400);
        }

        // Buat perjalanan baru
        $perjalanan = Perjalanan::create([
            'kru_id' => $request->user()->id,
            'armada_id' => $request->armada_id,
            'rute_id' => $request->rute_id,
            'waktu_mulai' => now(),
            'status' => 'aktif',
            'kondisi_terakhir' => 'lancar',
        ]);

        // Load relasi
        $perjalanan->load(['kru', 'armada', 'rute']);

        return response()->json([
            'success' => true,
            'message' => 'Perjalanan berhasil dimulai',
            'data' => $perjalanan
        ], 201);
    }

    /**
     * UPDATE KONDISI - Update kondisi bus (lancar/macet/mogok)
     * POST /api/kru/perjalanan/kondisi
     */
    public function updateKondisi(Request $request)
    {
        $request->validate([
            'perjalanan_id' => 'required|exists:perjalanan,id',
            'kondisi' => 'required|in:lancar,macet,mogok',
        ]);

        $perjalanan = Perjalanan::where('id', $request->perjalanan_id)
            ->where('kru_id', $request->user()->id)
            ->where('status', 'aktif')
            ->first();

        if (!$perjalanan) {
            return response()->json([
                'success' => false,
                'message' => 'Perjalanan tidak ditemukan atau sudah selesai'
            ], 404);
        }

        $perjalanan->update([
            'kondisi_terakhir' => $request->kondisi
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kondisi bus berhasil diperbarui',
            'data' => $perjalanan
        ], 200);
    }

    /**
     * UPDATE PENUMPANG - Update jumlah penumpang
     * POST /api/kru/perjalanan/penumpang
     */
    public function updatePenumpang(Request $request)
    {
        $request->validate([
            'perjalanan_id' => 'required|exists:perjalanan,id',
            'total_penumpang' => 'required|integer|min:0',
        ]);

        $perjalanan = Perjalanan::where('id', $request->perjalanan_id)
            ->where('kru_id', $request->user()->id)
            ->where('status', 'aktif')
            ->first();

        if (!$perjalanan) {
            return response()->json([
                'success' => false,
                'message' => 'Perjalanan tidak ditemukan atau sudah selesai'
            ], 404);
        }

        $perjalanan->update([
            'total_penumpang' => $request->total_penumpang
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jumlah penumpang berhasil diperbarui',
            'data' => $perjalanan
        ], 200);
    }

    /**
     * SELESAI PERJALANAN - Akhiri perjalanan dan simpan laporan
     * POST /api/kru/perjalanan/selesai
     */
    public function selesaiPerjalanan(Request $request)
    {
        $request->validate([
            'perjalanan_id' => 'required|exists:perjalanan,id',
            'total_penumpang' => 'required|integer|min:0',
            'jarak_tempuh' => 'required|numeric|min:0',
            'catatan' => 'nullable|string',
        ]);

        $perjalanan = Perjalanan::where('id', $request->perjalanan_id)
            ->where('kru_id', $request->user()->id)
            ->where('status', 'aktif')
            ->first();

        if (!$perjalanan) {
            return response()->json([
                'success' => false,
                'message' => 'Perjalanan tidak ditemukan atau sudah selesai'
            ], 404);
        }

        $waktuSelesai = now();
        $durasiMenit = $perjalanan->waktu_mulai->diffInMinutes($waktuSelesai);

        $perjalanan->update([
            'waktu_selesai' => $waktuSelesai,
            'total_penumpang' => $request->total_penumpang,
            'jarak_tempuh' => $request->jarak_tempuh,
            'durasi_menit' => $durasiMenit,
            'status' => 'selesai',
            'catatan' => $request->catatan,
        ]);

        // Load relasi
        $perjalanan->load(['kru', 'armada', 'rute']);

        return response()->json([
            'success' => true,
            'message' => 'Perjalanan berhasil diselesaikan',
            'data' => [
                'perjalanan' => $perjalanan,
                'summary' => [
                    'durasi_jam' => floor($durasiMenit / 60),
                    'durasi_menit' => $durasiMenit % 60,
                    'total_penumpang' => $perjalanan->total_penumpang,
                    'jarak_km' => $perjalanan->jarak_tempuh,
                ]
            ]
        ], 200);
    }

    /**
     * GET PERJALANAN AKTIF - Cek apakah kru punya perjalanan aktif
     * GET /api/kru/perjalanan/aktif
     */
    public function getPerjalananAktif(Request $request)
    {
        $perjalanan = Perjalanan::where('kru_id', $request->user()->id)
            ->where('status', 'aktif')
            ->with(['armada', 'rute'])
            ->first();

        if (!$perjalanan) {
            return response()->json([
                'success' => true,
                'message' => 'Tidak ada perjalanan aktif',
                'data' => null
            ], 200);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data perjalanan aktif',
            'data' => $perjalanan
        ], 200);
    }

    /**
     * LOGOUT - Hapus token
     * POST /api/kru/logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil'
        ], 200);
    }
}