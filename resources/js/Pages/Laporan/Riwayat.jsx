import React, { useState, useEffect } from 'react';
import SimpleLayout from '@/Layouts/SimpleLayout';
import { Head, router } from '@inertiajs/react';

// ─── Helpers ──────────────────────────────────────────────
const formatRupiah = (n) =>
    'Rp ' + Number(n ?? 0).toLocaleString('id-ID');

const formatDurasi = (menit) => {
    if (!menit) return 'N/A';
    const h = Math.floor(menit / 60);
    const m = menit % 60;
    return h > 0 ? `${h}j ${m}m` : `${m} menit`;
};

const formatDateTime = (dt) => {
    if (!dt) return '-';
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

// ─── Main ─────────────────────────────────────────────────
export default function Riwayat({ auth, perjalanan, ruteList, stats, filters, firebaseConfig }) {
    const [search, setSearch]               = useState(filters?.search || '');
    const [status, setStatus]               = useState(filters?.status || '');
    const [kondisi, setKondisi]             = useState(filters?.kondisi || '');
    const [ruteId, setRuteId]               = useState(filters?.rute_id || '');
    const [tanggalDari, setTanggalDari]     = useState(filters?.tanggal_dari || '');
    const [tanggalSampai, setTanggalSampai] = useState(filters?.tanggal_sampai || '');
    const [detailItem, setDetailItem]       = useState(null);
    const [liveTrips, setLiveTrips]         = useState({});

    // Firebase polling untuk trip aktif (opsional)
    useEffect(() => {
        const dbUrl = firebaseConfig?.databaseURL;
        if (!dbUrl) return;
        let mounted = true;
        const poll = async () => {
            try {
                const res  = await fetch(`${dbUrl}/perjalanan_aktif.json`);
                const data = await res.json();
                if (mounted && data) setLiveTrips(data);
            } catch (_) {}
        };
        poll();
        const iv = setInterval(poll, 10000);
        return () => { mounted = false; clearInterval(iv); };
    }, [firebaseConfig]);

    const getLiveInfo = (id) =>
        Object.values(liveTrips).find(t => t.perjalanan_id === id) || null;

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

    const hasFilter = search || status || kondisi || ruteId || tanggalDari || tanggalSampai;

    return (
        <SimpleLayout user={auth.user} pageTitle="Riwayat Perjalanan">
            <Head title="Riwayat Perjalanan" />

            <div className="space-y-6">

                {/* ── Header ── */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Riwayat Perjalanan</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Rekap seluruh perjalanan bus yang telah dilakukan
                        </p>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'Total Perjalanan',
                            value: stats.total_perjalanan,
                            iconBg: 'from-blue-400 to-blue-600',
                            icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l.01 0M16 17l.01 0M5 7h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2zm0 0V5a2 2 0 012-2h10a2 2 0 012 2v2M9 17a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
                                </svg>
                            ),
                        },
                        {
                            label: 'Perjalanan Selesai',
                            value: stats.total_selesai,
                            iconBg: 'from-green-400 to-green-600',
                            icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ),
                        },
                        {
                            label: 'Sedang Berjalan',
                            value: stats.total_aktif,
                            iconBg: 'from-yellow-400 to-orange-500',
                            icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            ),
                        },
                        {
                            label: 'Total Penumpang',
                            value: stats.total_penumpang.toLocaleString('id-ID'),
                            sub: 'dari trip selesai',
                            iconBg: 'from-purple-400 to-purple-600',
                            icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            ),
                        },
                    ].map((card, i) => (
                        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.iconBg} flex items-center justify-center text-white flex-shrink-0`}>
                                {card.icon}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">{card.label}</p>
                                <p className="text-2xl font-bold text-gray-900 leading-tight">{card.value}</p>
                                {card.sub && <p className="text-xs text-gray-400">{card.sub}</p>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Filter ── */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="flex gap-3 flex-wrap">
                            <div className="flex-1 min-w-[220px]">
                                <input
                                    type="text"
                                    placeholder="Cari nama driver atau bus..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Semua Status</option>
                                <option value="aktif">Aktif</option>
                                <option value="selesai">Selesai</option>
                            </select>
                            <select
                                value={kondisi}
                                onChange={(e) => setKondisi(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Semua Kondisi</option>
                                <option value="lancar">Lancar</option>
                                <option value="macet">Macet</option>
                                <option value="mogok">Mogok</option>
                            </select>
                            <select
                                value={ruteId}
                                onChange={(e) => setRuteId(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Semua Rute</option>
                                {ruteList.map(r => (
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
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Cari
                            </button>
                            {hasFilter && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* ── Tabel ── */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Driver & Bus</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rute</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Waktu Mulai</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Durasi</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Penumpang</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pendapatan</th>
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
                                    perjalanan.data.map((item) => {
                                        const live = getLiveInfo(item.id);
                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                {/* Driver & Bus */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                            {item.kru?.driver?.charAt(0) ?? '?'}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-900">{item.kru?.driver ?? '-'}</span>
                                                            <p className="text-xs text-gray-500">
                                                                {item.armada?.nama_bus} · {item.armada?.plat_nomor}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Rute */}
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-gray-900">{item.rute?.nama_rute ?? '-'}</span>
                                                    <p className="text-xs text-gray-500">
                                                        {item.jarak_tempuh ? `${Number(item.jarak_tempuh).toFixed(1)} km` : '-'}
                                                    </p>
                                                </td>
                                                {/* Waktu */}
                                                <td className="px-6 py-4 text-gray-900 text-sm">
                                                    {formatDateTime(item.waktu_mulai)}
                                                    {live && (
                                                        <p className="flex items-center gap-1 text-xs text-blue-600 mt-0.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
                                                            Live
                                                        </p>
                                                    )}
                                                </td>
                                                {/* Durasi */}
                                                <td className="px-6 py-4 text-gray-900">
                                                    {formatDurasi(item.durasi_menit)}
                                                </td>
                                                {/* Penumpang */}
                                                <td className="px-6 py-4 text-gray-900">
                                                    {item.total_penumpang} orang
                                                </td>
                                                {/* Pendapatan */}
                                                <td className="px-6 py-4">
                                                    {item.status === 'selesai' ? (
                                                        <span className="font-medium text-green-700">
                                                            {formatRupiah(item.pendapatan)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Belum selesai</span>
                                                    )}
                                                    {item.rute?.harga > 0 && (
                                                        <p className="text-xs text-gray-400">
                                                            @{formatRupiah(item.rute.harga)}/org
                                                        </p>
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
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {perjalanan.data.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600">
                                Menampilkan {perjalanan.from} - {perjalanan.to} dari {perjalanan.total} data
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

            {/* ── Modal Detail ── */}
            {detailItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-gray-900">Detail Perjalanan</h2>
                            <button onClick={() => setDetailItem(null)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {[
                                { label: 'Driver',           value: detailItem.kru?.driver },
                                { label: 'Bus',              value: `${detailItem.armada?.nama_bus} (${detailItem.armada?.plat_nomor})` },
                                { label: 'Kelas',            value: detailItem.armada?.kelas },
                                { label: 'Rute',             value: detailItem.rute?.nama_rute },
                                { label: 'Asal → Tujuan',    value: `${detailItem.rute?.kota_asal} → ${detailItem.rute?.kota_tujuan}` },
                                { label: 'Waktu Mulai',      value: formatDateTime(detailItem.waktu_mulai) },
                                { label: 'Waktu Selesai',    value: formatDateTime(detailItem.waktu_selesai) },
                                { label: 'Durasi',           value: formatDurasi(detailItem.durasi_menit) },
                                { label: 'Jarak Tempuh',     value: detailItem.jarak_tempuh ? `${Number(detailItem.jarak_tempuh).toFixed(2)} km` : '-' },
                                { label: 'Total Penumpang',  value: `${detailItem.total_penumpang} orang` },
                                { label: 'Harga / Tiket',    value: formatRupiah(detailItem.rute?.harga) },
                                { label: 'Total Pendapatan', value: formatRupiah(detailItem.pendapatan), highlight: true },
                                { label: 'Kondisi',          value: detailItem.kondisi_terakhir },
                                { label: 'Catatan',          value: detailItem.catatan || '-' },
                            ].map(({ label, value, highlight }) => (
                                <div key={label} className="flex justify-between items-start gap-4 text-sm border-b border-gray-100 pb-2 last:border-0">
                                    <span className="text-gray-500 flex-shrink-0">{label}</span>
                                    <span className={`text-right font-medium ${highlight ? 'text-green-700' : 'text-gray-900'}`}>
                                        {value ?? '-'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 flex gap-3">
                            <button
                                onClick={() => setDetailItem(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
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