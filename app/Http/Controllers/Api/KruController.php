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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class KruController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    // Helper: Ambil track history dari Firebase RTDB
    // Node: buses/{firebase_bus_id}/track
    // Format di RTDB: { "-NxABC": { lat: -7.6, lng: 111.5, timestamp: 1700000 }, ... }
    // Output: [ { lat, lng, timestamp }, ... ] urut berdasarkan timestamp
    // ─────────────────────────────────────────────────────────────────────────
    private function fetchGpsTrackFromFirebase(string $firebaseBusId): array
    {
        try {
            $databaseUrl = rtrim(config('services.firebase.database_url'), '/');
            $secret      = config('services.firebase.secret'); // legacy secret / service account token

            $url = "{$databaseUrl}/buses/{$firebaseBusId}/track.json";

            $response = Http::timeout(10)
                ->get($url, $secret ? ['auth' => $secret] : []);

            if (!$response->successful()) {
                Log::warning("Firebase track fetch failed for bus {$firebaseBusId}", [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return [];
            }

            $raw = $response->json();

            if (!is_array($raw) || empty($raw)) {
                return [];
            }

            // Konversi object Firebase ke array flat, lalu sort by timestamp
            $points = array_values($raw);

            usort($points, fn ($a, $b) => ($a['timestamp'] ?? 0) <=> ($b['timestamp'] ?? 0));

            // Pastikan hanya field yang diperlukan
            return array_map(fn ($p) => [
                'lat'       => (float) ($p['lat']       ?? 0),
                'lng'       => (float) ($p['lng']       ?? 0),
                'timestamp' => (int)   ($p['timestamp'] ?? 0),
            ], $points);

        } catch (\Throwable $e) {
            Log::error("Exception saat fetch GPS track dari Firebase: " . $e->getMessage(), [
                'firebase_bus_id' => $firebaseBusId,
            ]);
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper: Hapus node track di Firebase setelah disimpan ke MySQL
    // ─────────────────────────────────────────────────────────────────────────
    private function clearFirebaseTrack(string $firebaseBusId): void
    {
        try {
            $databaseUrl = rtrim(config('services.firebase.database_url'), '/');
            $secret      = config('services.firebase.secret');

            $url = "{$databaseUrl}/buses/{$firebaseBusId}/track.json";

            Http::timeout(5)
                ->delete($url, $secret ? ['auth' => $secret] : []);

        } catch (\Throwable $e) {
            Log::warning("Gagal clear Firebase track untuk bus {$firebaseBusId}: " . $e->getMessage());
            // Non-fatal — tidak perlu throw
        }
    }

    // =========================================================================

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
                'message' => 'Username atau password salah',
            ], 401);
        }

        if ($kru->status !== 'aktif') {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak aktif. Hubungi admin.',
            ], 403);
        }

        $token = $kru->createToken('kru-mobile-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data'    => [
                'kru' => [
                    'id'       => $kru->id,
                    'driver'   => $kru->driver,
                    'username' => $kru->username,
                    'status'   => $kru->status,
                ],
                'token' => $token,
            ],
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
            'data'    => $armada,
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
            'data'    => $rute,
        ], 200);
    }

    /**
     * MULAI PERJALANAN
     * POST /api/kru/perjalanan/mulai
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
                'message' => 'Anda masih memiliki perjalanan yang belum diselesaikan',
            ], 400);
        }

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

        $firebaseBusId = $perjalanan->armada->firebase_bus_id;

        return response()->json([
            'success' => true,
            'message' => 'Perjalanan berhasil dimulai',
            'data'    => [
                'perjalanan'      => $perjalanan,
                'firebase_bus_id' => $firebaseBusId,
                'tarif_berlaku'   => $tarif?->harga,
            ],
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
                'message' => 'Perjalanan tidak ditemukan atau sudah selesai',
            ], 404);
        }

        $perjalanan->update(['kondisi_terakhir' => $request->kondisi]);

        return response()->json([
            'success' => true,
            'message' => 'Kondisi bus berhasil diperbarui',
            'data'    => $perjalanan,
        ], 200);
    }

    /**
     * UPDATE PENUMPANG
     * POST /api/kru/perjalanan/penumpang
     */
    public function updatePenumpang(Request $request)
    {
        $request->validate([
            'perjalanan_id'   => 'required|exists:perjalanan,id',
            'total_penumpang' => 'required|integer|min:0',
        ]);

        $perjalanan = Perjalanan::where('id', $request->perjalanan_id)
            ->where('kru_id', $request->user()->id)
            ->where('status', 'aktif')
            ->first();

        if (!$perjalanan) {
            return response()->json([
                'success' => false,
                'message' => 'Perjalanan tidak ditemukan atau sudah selesai',
            ], 404);
        }

        $perjalanan->update(['total_penumpang' => $request->total_penumpang]);

        return response()->json([
            'success' => true,
            'message' => 'Jumlah penumpang berhasil diperbarui',
            'data'    => $perjalanan,
        ], 200);
    }

    /**
     * SELESAI PERJALANAN
     * POST /api/kru/perjalanan/selesai
     *
     * ✅ NEW: Tarik gps_track dari Firebase RTDB → simpan ke MySQL
     *        sebelum node track dihapus dari Firebase
     */
    public function selesaiPerjalanan(Request $request)
    {
        $request->validate([
            'perjalanan_id'        => 'required|exists:perjalanan,id',
            'total_penumpang'      => 'required|integer|min:0',
            'total_penumpang_naik' => 'required|integer|min:0',
            'jarak_tempuh'         => 'required|numeric|min:0',
            'catatan'              => 'nullable|string',
        ]);

        $perjalanan = Perjalanan::where('id', $request->perjalanan_id)
            ->where('kru_id', $request->user()->id)
            ->where('status', 'aktif')
            ->with('armada')
            ->first();

        if (!$perjalanan) {
            return response()->json([
                'success' => false,
                'message' => 'Perjalanan tidak ditemukan atau sudah selesai',
            ], 404);
        }

        $waktuSelesai    = now();
        $durasiMenit     = (int) $perjalanan->waktu_mulai->diffInMinutes($waktuSelesai);
        $penumpangNaik   = $request->total_penumpang_naik;
        $tarifSnapshot   = (float) ($perjalanan->tarif_snapshot ?? 0);
        $totalPendapatan = $penumpangNaik * $tarifSnapshot;

        // ── Ambil GPS track dari Firebase RTDB ───────────────────────────
        $firebaseBusId = $perjalanan->armada?->firebase_bus_id;
        $gpsTrack      = [];

        if ($firebaseBusId) {
            $gpsTrack = $this->fetchGpsTrackFromFirebase($firebaseBusId);

            // Hapus node track di Firebase supaya tidak menumpuk untuk trip berikutnya
            if (!empty($gpsTrack)) {
                $this->clearFirebaseTrack($firebaseBusId);
            }
        }
        // ─────────────────────────────────────────────────────────────────

        $perjalanan->update([
            'waktu_selesai'        => $waktuSelesai,
            'total_penumpang'      => $request->total_penumpang,
            'total_penumpang_naik' => $penumpangNaik,
            'total_pendapatan'     => $totalPendapatan,
            'jarak_tempuh'         => $request->jarak_tempuh,
            'durasi_menit'         => $durasiMenit,
            'status'               => 'selesai',
            'catatan'              => $request->catatan,
            'gps_track'            => !empty($gpsTrack) ? $gpsTrack : null, // ✅ simpan ke MySQL
        ]);

        $perjalanan->load(['kru', 'armada', 'rute']);

        return response()->json([
            'success' => true,
            'message' => 'Perjalanan berhasil diselesaikan',
            'data'    => [
                'perjalanan' => $perjalanan,
                'summary'    => [
                    'durasi_jam'        => floor($durasiMenit / 60),
                    'durasi_menit'      => $durasiMenit % 60,
                    'total_penumpang'   => $perjalanan->total_penumpang,
                    'penumpang_naik'    => $penumpangNaik,
                    'jarak_km'          => $perjalanan->jarak_tempuh,
                    'tarif_per_orang'   => $tarifSnapshot,
                    'total_pendapatan'  => $totalPendapatan,
                    'gps_track_points'  => count($gpsTrack), // berapa titik yang tersimpan
                ],
            ],
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
            ->with(['armada', 'rute', 'kru']) // ✅ tambahkan 'kru' di sini
            ->first();

        if (!$perjalanan) {
            return response()->json([
                'success' => true,
                'message' => 'Tidak ada perjalanan aktif',
                'data'    => null,
            ], 200);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data perjalanan aktif',
            'data'    => $perjalanan,
        ], 200);
    }

    /**
     * LIST KRU AKTIF (untuk dropdown ganti driver)
     * GET /api/kru/list
     */
    public function listKru()
    {
        $daftarKru = Kru::where('status', 'aktif')
            ->select('id', 'driver', 'username', 'status') // tanpa password, aman
            ->orderBy('driver')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar kru berhasil diambil',
            'data'    => $daftarKru,
        ], 200);
    }

    /**
     * GANTI DRIVER PADA PERJALANAN AKTIF
     * POST /api/kru/perjalanan/ganti-driver
     */
    public function gantiDriver(Request $request)
    {
        $request->validate([
            'perjalanan_id' => 'required|exists:perjalanan,id',
            'kru_id_baru'   => 'required|exists:kru,id',
        ]);

        // Hanya kru yang sedang jadi driver aktif di perjalanan ini yang boleh ganti
        $perjalanan = Perjalanan::where('id', $request->perjalanan_id)
            ->where('kru_id', $request->user()->id)
            ->where('status', 'aktif')
            ->with('armada')
            ->first();

        if (!$perjalanan) {
            return response()->json([
                'success' => false,
                'message' => 'Perjalanan tidak ditemukan, sudah selesai, atau bukan milik Anda',
            ], 404);
        }

        $kruBaru = Kru::where('status', 'aktif')->find($request->kru_id_baru);

        if (!$kruBaru) {
            return response()->json([
                'success' => false,
                'message' => 'Kru pengganti tidak ditemukan atau tidak aktif',
            ], 404);
        }

        $perjalanan->update(['kru_id' => $kruBaru->id]);
        $perjalanan->load(['kru', 'armada', 'rute']); // ✅ password sudah aman karena $hidden di model Kru

        return response()->json([
            'success' => true,
            'message' => "Driver berhasil diganti ke {$kruBaru->driver}",
            'data'    => [
                'perjalanan'      => $perjalanan,
                'firebase_bus_id' => $perjalanan->armada->firebase_bus_id,
                'driver_baru'     => $kruBaru->driver,
                'kru_id_baru'     => $kruBaru->id,
            ],
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
            'message' => 'Logout berhasil',
        ], 200);
    }
}