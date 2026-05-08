<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kru;
use App\Models\Armada;
use App\Models\Rute;
use App\Models\Tarif;
use App\Models\Perjalanan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class KruController extends Controller
{
    /**
     * LOGIN
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

        $token = $kru->createToken('kru-mobile-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'kru' => [
                    'id'       => $kru->id,
                    'driver'   => $kru->driver,
                    'username' => $kru->username,
                    'status'   => $kru->status,
                ],
                'token' => $token
            ]
        ], 200);
    }

    /**
     * GET ARMADA - Armada aktif beserta firebase_bus_id
     * GET /api/kru/armada
     */
    public function getArmada()
    {
        $armada = Armada::aktif()->get([
            'id', 'nama_bus', 'plat_nomor', 'kelas',
            'kapasitas', 'status', 'firebase_bus_id',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data armada berhasil diambil',
            'data'    => $armada
        ], 200);
    }

    /**
     * GET RUTE - Rute aktif dengan tarif
     * GET /api/kru/rute
     */
    public function getRute()
    {
        $rute = Rute::where('status', 'aktif')
            ->select('id', 'nama_rute', 'kota_asal', 'kota_tujuan', 'polyline', 'track_coordinates', 'jarak', 'estimasi_waktu')
            ->with(['tarif:id,rute_id,harga'])
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Data rute berhasil diambil',
            'data'    => $rute
        ], 200);
    }

    /**
     * MULAI PERJALANAN
     * POST /api/kru/perjalanan/mulai
     *
     * Perubahan dari versi lama:
     * - Ambil tarif aktif untuk rute yang dipilih → simpan ke tarif_snapshot
     * - Response mengembalikan firebase_bus_id dan perjalanan_id agar kru app
     *   bisa set activePerjalananId + reset totalPassengersBoarded di Firebase
     */
    public function mulaiPerjalanan(Request $request)
    {
        $request->validate([
            'armada_id' => 'required|exists:armada,id',
            'rute_id'   => 'required|exists:rute,id',
        ]);

        $perjalananAktif = Perjalanan::where('kru_id', $request->user()->id)
            ->where('status', 'aktif')
            ->first();

        if ($perjalananAktif) {
            return response()->json([
                'success' => false,
                'message' => 'Anda masih memiliki perjalanan yang belum diselesaikan'
            ], 400);
        }

        // Ambil tarif aktif untuk rute ini — disimpan sebagai snapshot
        $tarif = Tarif::where('rute_id', $request->rute_id)
            ->where('status', 'aktif')
            ->first();

        $perjalanan = Perjalanan::create([
            'kru_id'           => $request->user()->id,
            'armada_id'        => $request->armada_id,
            'rute_id'          => $request->rute_id,
            'waktu_mulai'      => now(),
            'status'           => 'aktif',
            'kondisi_terakhir' => 'lancar',
            'tarif_snapshot'   => $tarif?->harga,
        ]);

        $perjalanan->load(['kru', 'armada', 'rute']);

        // firebase_bus_id dikirim balik ke kru app agar app tahu
        // node Firebase mana yang harus diupdate (set activePerjalananId)
        $firebaseBusId = $perjalanan->armada->firebase_bus_id;

        return response()->json([
            'success' => true,
            'message' => 'Perjalanan berhasil dimulai',
            'data'    => [
                'perjalanan'      => $perjalanan,
                'firebase_bus_id' => $firebaseBusId,
                'tarif_berlaku'   => $tarif?->harga,
            ]
        ], 201);
    }

    /**
     * UPDATE KONDISI
     * POST /api/kru/perjalanan/kondisi
     */
    public function updateKondisi(Request $request)
    {
        $request->validate([
            'perjalanan_id' => 'required|exists:perjalanan,id',
            'kondisi'       => 'required|in:lancar,macet,mogok',
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

        $perjalanan->update(['kondisi_terakhir' => $request->kondisi]);

        return response()->json([
            'success' => true,
            'message' => 'Kondisi bus berhasil diperbarui',
            'data'    => $perjalanan
        ], 200);
    }

    /**
     * UPDATE PENUMPANG (current count saja — untuk sinkron DB)
     * POST /api/kru/perjalanan/penumpang
     *
     * Catatan: total_penumpang_naik TIDAK diupdate di sini.
     * Akumulasi boarding dihitung di kru app via Firebase, lalu
     * dikirim sekali saat selesaiPerjalanan dipanggil.
     */
    public function updatePenumpang(Request $request)
    {
        $request->validate([
            'perjalanan_id'  => 'required|exists:perjalanan,id',
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

        $perjalanan->update(['total_penumpang' => $request->total_penumpang]);

        return response()->json([
            'success' => true,
            'message' => 'Jumlah penumpang berhasil diperbarui',
            'data'    => $perjalanan
        ], 200);
    }

    /**
     * SELESAI PERJALANAN
     * POST /api/kru/perjalanan/selesai
     *
     * Perubahan dari versi lama:
     * - Terima total_penumpang_naik (akumulasi dari Firebase totalPassengersBoarded)
     * - Hitung total_pendapatan = total_penumpang_naik × tarif_snapshot
     * - Response summary menambahkan info pendapatan
     */
    public function selesaiPerjalanan(Request $request)
    {
        $request->validate([
            'perjalanan_id'       => 'required|exists:perjalanan,id',
            'total_penumpang'     => 'required|integer|min:0',
            'total_penumpang_naik' => 'required|integer|min:0',
            'jarak_tempuh'        => 'required|numeric|min:0',
            'catatan'             => 'nullable|string',
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

        $waktuSelesai  = now();
        $durasiMenit   = (int) $perjalanan->waktu_mulai->diffInMinutes($waktuSelesai);
        $penumpangNaik = $request->total_penumpang_naik;
        $tarifSnapshot = (float) ($perjalanan->tarif_snapshot ?? 0);
        $totalPendapatan = $penumpangNaik * $tarifSnapshot;

        $perjalanan->update([
            'waktu_selesai'        => $waktuSelesai,
            'total_penumpang'      => $request->total_penumpang,
            'total_penumpang_naik' => $penumpangNaik,
            'total_pendapatan'     => $totalPendapatan,
            'jarak_tempuh'         => $request->jarak_tempuh,
            'durasi_menit'         => $durasiMenit,
            'status'               => 'selesai',
            'catatan'              => $request->catatan,
        ]);

        $perjalanan->load(['kru', 'armada', 'rute']);

        return response()->json([
            'success' => true,
            'message' => 'Perjalanan berhasil diselesaikan',
            'data'    => [
                'perjalanan' => $perjalanan,
                'summary'    => [
                    'durasi_jam'       => floor($durasiMenit / 60),
                    'durasi_menit'     => $durasiMenit % 60,
                    'total_penumpang'  => $perjalanan->total_penumpang,
                    'penumpang_naik'   => $penumpangNaik,
                    'jarak_km'         => $perjalanan->jarak_tempuh,
                    'tarif_per_orang'  => $tarifSnapshot,
                    'total_pendapatan' => $totalPendapatan,
                ]
            ]
        ], 200);
    }

    /**
     * GET PERJALANAN AKTIF
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
                'data'    => null
            ], 200);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data perjalanan aktif',
            'data'    => $perjalanan
        ], 200);
    }

    /**
     * LOGOUT
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