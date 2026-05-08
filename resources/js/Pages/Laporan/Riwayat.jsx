import React, { useState } from 'react';
import SimpleLayout from '@/Layouts/SimpleLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/Card';
import { Badge } from '@/Components/ui/Badge';
import { Separator } from '@/Components/ui/Separator';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => 'Rp ' + Number(n ?? 0).toLocaleString('id-ID');

const fmtDurasi = (menit) => {
    if (!menit) return '—';
    const h = Math.floor(menit / 60);
    const m = menit % 60;
    return h > 0 ? `${h}j ${m}m` : `${m} mnt`;
};

const fmtDT = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const KONDISI_CLASS = {
    lancar: 'bg-green-100 text-green-700',
    macet:  'bg-yellow-100 text-yellow-700',
    mogok:  'bg-red-100 text-red-700',
};

const STATUS_CLASS = {
    aktif:   'bg-blue-100 text-blue-700',
    selesai: 'bg-gray-100 text-gray-600',
};

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Riwayat({ auth, perjalanan, ruteList, stats, filters }) {
    const [search,        setSearch]        = useState(filters?.search        || '');
    const [status,        setStatus]        = useState(filters?.status        || '');
    const [kondisi,       setKondisi]       = useState(filters?.kondisi       || '');
    const [ruteId,        setRuteId]        = useState(filters?.rute_id       || '');
    const [tanggalDari,   setTanggalDari]   = useState(filters?.tanggal_dari  || '');
    const [tanggalSampai, setTanggalSampai] = useState(filters?.tanggal_sampai || '');
    const [detailItem,    setDetailItem]    = useState(null);

    const hasFilter = search || status || kondisi || ruteId || tanggalDari || tanggalSampai;

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/laporan/riwayat', {
            search, status, kondisi,
            rute_id: ruteId,
            tanggal_dari: tanggalDari,
            tanggal_sampai: tanggalSampai,
        }, { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        setSearch(''); setStatus(''); setKondisi('');
        setRuteId(''); setTanggalDari(''); setTanggalSampai('');
        router.get('/laporan/riwayat', {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <SimpleLayout user={auth.user} pageTitle="Riwayat Perjalanan">
            <Head title="Riwayat Perjalanan" />

            <div className="space-y-6">

                {/* ── Header ────────────────────────────────────────────── */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Riwayat Perjalanan</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Rekap seluruh perjalanan bus yang telah dilakukan
                        </p>
                    </div>
                </div>

                {/* ── Stat Cards ────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-blue-600">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Total Perjalanan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.total_perjalanan}</div>
                            <p className="text-xs text-slate-500 mt-1">semua perjalanan</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-600">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Perjalanan Selesai
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.total_selesai}</div>
                            <p className="text-xs text-slate-500 mt-1">trip selesai</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-yellow-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Sedang Berjalan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-500">{stats.total_aktif}</div>
                            <p className="text-xs text-slate-500 mt-1">trip aktif</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-600">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Total Penumpang
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {stats.total_penumpang.toLocaleString('id-ID')}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">dari trip selesai</p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Filter ────────────────────────────────────────────── */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="flex gap-3 flex-wrap">
                            {/* Search */}
                            <div className="flex-1 min-w-[220px]">
                                <input
                                    type="text"
                                    placeholder="Cari nama driver atau bus..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>

                            {/* Status */}
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                                <option value="">Semua Status</option>
                                <option value="aktif">Aktif</option>
                                <option value="selesai">Selesai</option>
                            </select>

                            {/* Kondisi */}
                            <select
                                value={kondisi}
                                onChange={(e) => setKondisi(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                                <option value="">Semua Kondisi</option>
                                <option value="lancar">Lancar</option>
                                <option value="macet">Macet</option>
                                <option value="mogok">Mogok</option>
                            </select>

                            {/* Rute */}
                            <select
                                value={ruteId}
                                onChange={(e) => setRuteId(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                                <option value="">Semua Rute</option>
                                {ruteList.map((r) => (
                                    <option key={r.id} value={r.id}>{r.nama_rute}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3 flex-wrap items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Dari</span>
                                <input
                                    type="date"
                                    value={tanggalDari}
                                    onChange={(e) => setTanggalDari(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Sampai</span>
                                <input
                                    type="date"
                                    value={tanggalSampai}
                                    onChange={(e) => setTanggalSampai(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors text-sm"
                            >
                                Cari
                            </button>
                            {hasFilter && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors text-sm"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* ── Tabel ─────────────────────────────────────────────── */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
                        <h2 className="text-base font-semibold text-gray-900">Daftar Perjalanan</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{perjalanan.total} data ditemukan</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Driver & Bus</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rute</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Waktu Mulai</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Durasi</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Penumpang</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Pendapatan</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kondisi</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {perjalanan.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                            Tidak ada data riwayat perjalanan
                                        </td>
                                    </tr>
                                ) : (
                                    perjalanan.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            {/* Driver & Bus */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                        {item.kru?.driver?.charAt(0)?.toUpperCase() ?? '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">
                                                            {item.kru?.driver ?? '—'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {item.armada?.nama_bus} · {item.armada?.plat_nomor}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Rute */}
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 text-sm">
                                                    {item.rute?.nama_rute ?? '—'}
                                                </p>
                                                {item.jarak_tempuh > 0 && (
                                                    <p className="text-xs text-gray-500">
                                                        {Number(item.jarak_tempuh).toFixed(1)} km
                                                    </p>
                                                )}
                                            </td>

                                            {/* Waktu */}
                                            <td className="px-6 py-4 text-gray-900 text-sm">
                                                {fmtDT(item.waktu_mulai)}
                                            </td>

                                            {/* Durasi */}
                                            <td className="px-6 py-4 text-gray-900 text-sm">
                                                {fmtDurasi(item.durasi_menit)}
                                            </td>

                                            {/* Penumpang */}
                                            <td className="px-6 py-4 text-gray-900 text-sm text-center">
                                                {item.total_penumpang} org
                                            </td>

                                            {/* Pendapatan */}
                                            <td className="px-6 py-4 text-right">
                                                {item.status === 'selesai' ? (
                                                    <span className="font-semibold text-green-700 text-sm">
                                                        {fmt(item.pendapatan)}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Belum selesai</span>
                                                )}
                                            </td>

                                            {/* Kondisi */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${KONDISI_CLASS[item.kondisi_terakhir] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {item.kondisi_terakhir}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_CLASS[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {item.status === 'aktif' ? 'Aktif' : 'Selesai'}
                                                </span>
                                            </td>

                                            {/* Aksi */}
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setDetailItem(item)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Lihat Detail"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {perjalanan.data.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600">
                                Menampilkan {perjalanan.from}–{perjalanan.to} dari {perjalanan.total} data
                            </div>
                            <div className="flex gap-2 flex-wrap justify-center">
                                {perjalanan.links.map((link, i) => (
                                    <button
                                        key={i}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`px-3 py-1 rounded text-sm ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : link.url
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* ══════════════════════════════════════════════════════════
                Modal Detail Perjalanan
            ══════════════════════════════════════════════════════════ */}
            {detailItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-gray-900">Detail Perjalanan</h2>
                            <button
                                onClick={() => setDetailItem(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-0 divide-y divide-gray-100">
                            {[
                                { label: 'Driver',           value: detailItem.kru?.driver },
                                { label: 'Bus',              value: `${detailItem.armada?.nama_bus ?? ''} (${detailItem.armada?.plat_nomor ?? ''})` },
                                { label: 'Kelas',            value: detailItem.armada?.kelas },
                                { label: 'Rute',             value: detailItem.rute?.nama_rute },
                                { label: 'Asal → Tujuan',   value: `${detailItem.rute?.kota_asal ?? ''} → ${detailItem.rute?.kota_tujuan ?? ''}` },
                                { label: 'Waktu Mulai',      value: fmtDT(detailItem.waktu_mulai) },
                                { label: 'Waktu Selesai',    value: fmtDT(detailItem.waktu_selesai) },
                                { label: 'Durasi',           value: fmtDurasi(detailItem.durasi_menit) },
                                { label: 'Jarak Tempuh',     value: detailItem.jarak_tempuh ? `${Number(detailItem.jarak_tempuh).toFixed(2)} km` : '—' },
                                { label: 'Total Penumpang',  value: `${detailItem.total_penumpang} orang` },
                                { label: 'Total Pendapatan', value: fmt(detailItem.pendapatan), highlight: true },
                                { label: 'Kondisi',          value: detailItem.kondisi_terakhir },
                                { label: 'Catatan',          value: detailItem.catatan || '—' },
                            ].map(({ label, value, highlight }) => (
                                <div key={label} className="flex justify-between items-start py-2.5 text-sm gap-4">
                                    <span className="text-gray-500 shrink-0">{label}</span>
                                    <span className={`text-right font-medium ${highlight ? 'text-green-700' : 'text-gray-900'}`}>
                                        {value ?? '—'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5">
                            <button
                                onClick={() => setDetailItem(null)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </SimpleLayout>
    );
}