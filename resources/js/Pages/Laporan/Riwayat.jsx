import React, { useState, useEffect, useRef } from 'react';
import SimpleLayout from '@/Layouts/SimpleLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';

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

// ─── Map Styles: sama persis dengan Dashboard (Light & Soft) ─────────────────
const MAP_STYLES = [
    { featureType: 'all',                         elementType: 'geometry',         stylers: [{ color: '#f5f5f5' }] },
    { featureType: 'water',                        elementType: 'geometry',         stylers: [{ color: '#c9e9f6' }] },
    { featureType: 'water',                        elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'road',                         elementType: 'geometry',         stylers: [{ color: '#ffffff' }] },
    { featureType: 'road',                         elementType: 'geometry.stroke',  stylers: [{ color: '#d9d9d9' }] },
    { featureType: 'road.highway',                 elementType: 'geometry',         stylers: [{ color: '#fef5e0' }] },
    { featureType: 'road.highway',                 elementType: 'geometry.stroke',  stylers: [{ color: '#f5d89f' }] },
    { featureType: 'poi',                                                            stylers: [{ visibility: 'off' }] },
    { featureType: 'transit',                                                        stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.land_parcel',                                     stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.neighborhood',                                    stylers: [{ visibility: 'off' }] },
    { featureType: 'landscape.man_made',           elementType: 'geometry.fill',    stylers: [{ color: '#f0f0f0' }] },
    { featureType: 'landscape.natural',            elementType: 'geometry.fill',    stylers: [{ color: '#e8f5e9' }] },
];

// ─── Custom Hook: Load Google Maps ────────────────────────────────────────────
const useGoogleMaps = (apiKey) => {
    const [isLoaded, setIsLoaded]   = useState(false);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        if (!apiKey) {
            setLoadError('Google Maps API Key tidak ditemukan');
            return;
        }
        if (window.google && window.google.maps) {
            setIsLoaded(true);
            return;
        }
        const existing = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existing) {
            const poll = setInterval(() => {
                if (window.google && window.google.maps) {
                    setIsLoaded(true);
                    clearInterval(poll);
                }
            }, 100);
            return () => clearInterval(poll);
        }
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places&callback=initMap`;
        script.async = true;
        script.defer = true;
        window.initMap = () => { setIsLoaded(true); delete window.initMap; };
        script.onerror = () => setLoadError('Gagal memuat Google Maps. Periksa API Key & koneksi internet.');
        document.head.appendChild(script);
    }, [apiKey]);

    return { isLoaded, loadError };
};

// ─── Komponen: Peta GPS Track ─────────────────────────────────────────────────
function GpsTrackMap({ gpsTrack, rutePolyline }) {
    const mapRef    = useRef(null);
    const mapObjRef = useRef(null);
    const linesRef  = useRef([]);

    useEffect(() => {
        if (!mapRef.current || !window.google) return;

        if (!mapObjRef.current) {
            mapObjRef.current = new window.google.maps.Map(mapRef.current, {
                center:            { lat: -7.629, lng: 111.523 },
                zoom:              10,
                disableDefaultUI:  true,
                zoomControl:       true,
                mapTypeControl:    false,
                streetViewControl: false,
                fullscreenControl: false,
                scaleControl:      false,
                gestureHandling:   'greedy',
                clickableIcons:    false,
                styles:            MAP_STYLES,
            });
        }

        const map    = mapObjRef.current;
        const bounds = new window.google.maps.LatLngBounds();
        let   hasPoints = false;

        linesRef.current.forEach(l => l.setMap(null));
        linesRef.current = [];

        // 1. Rute Rencana (biru, seperti Dashboard planned route)
        if (rutePolyline && window.google.maps.geometry) {
            try {
                const decodedPath = window.google.maps.geometry.encoding.decodePath(rutePolyline);
                if (decodedPath && decodedPath.length > 0) {
                    linesRef.current.push(new window.google.maps.Polyline({
                        path: decodedPath, geodesic: true,
                        strokeColor: '#3B82F6', strokeOpacity: 0.5, strokeWeight: 5, map,
                    }));
                    decodedPath.forEach(p => bounds.extend(p));
                    hasPoints = true;
                }
            } catch (_) {}
        }

        // 2. GPS Track Aktual (hijau, seperti Dashboard actual track)
        if (Array.isArray(gpsTrack) && gpsTrack.length > 1) {
            const path = gpsTrack.map(p => ({ lat: p.lat, lng: p.lng }));

            linesRef.current.push(new window.google.maps.Polyline({
                path, geodesic: true,
                strokeColor: '#10B981', strokeOpacity: 0.9, strokeWeight: 5, map,
            }));

            // Marker Mulai
            new window.google.maps.Marker({
                position: path[0], map, title: 'Mulai',
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 9, fillColor: '#16A34A', fillOpacity: 1,
                    strokeColor: '#fff', strokeWeight: 2.5,
                },
            });

            // Marker Selesai
            new window.google.maps.Marker({
                position: path[path.length - 1], map, title: 'Selesai',
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 9, fillColor: '#DC2626', fillOpacity: 1,
                    strokeColor: '#fff', strokeWeight: 2.5,
                },
            });

            path.forEach(p => bounds.extend(p));
            hasPoints = true;
        }

        if (hasPoints && !bounds.isEmpty()) {
            map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
        }
    }, [gpsTrack, rutePolyline]);

    return (
        <div className="space-y-2">
            {/* Legenda gaya Dashboard */}
            <div className="flex items-center gap-5 text-xs text-slate-600 flex-wrap bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700 mr-1">Legenda:</span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-7 h-1.5 rounded-sm bg-blue-500 opacity-60"></span>
                    Rute Rencana
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-7 h-1.5 rounded-sm bg-emerald-500"></span>
                    Jalur Aktual
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3.5 h-3.5 rounded-full bg-green-600 border-2 border-white shadow-sm"></span>
                    Mulai
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white shadow-sm"></span>
                    Selesai
                </span>
            </div>
            <div ref={mapRef} className="w-full rounded-lg border border-slate-200 bg-slate-100" style={{ height: '420px' }} />
        </div>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Riwayat({ auth, perjalanan, ruteList, stats, filters, googleMapsApiKey }) {
    const [search,        setSearch]        = useState(filters?.search         || '');
    const [status,        setStatus]        = useState(filters?.status         || '');
    const [kondisi,       setKondisi]       = useState(filters?.kondisi        || '');
    const [ruteId,        setRuteId]        = useState(filters?.rute_id        || '');
    const [tanggalDari,   setTanggalDari]   = useState(filters?.tanggal_dari   || '');
    const [tanggalSampai, setTanggalSampai] = useState(filters?.tanggal_sampai || '');
    const [detailItem,    setDetailItem]    = useState(null);
    const [detailTab,     setDetailTab]     = useState('info');

    const { isLoaded: mapsLoaded, loadError } = useGoogleMaps(googleMapsApiKey);
    const hasFilter = search || status || kondisi || ruteId || tanggalDari || tanggalSampai;

    useEffect(() => {
        if (detailItem) setDetailTab('info');
    }, [detailItem?.id]);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/laporan/riwayat', {
            search, status, kondisi,
            rute_id: ruteId, tanggal_dari: tanggalDari, tanggal_sampai: tanggalSampai,
        }, { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        setSearch(''); setStatus(''); setKondisi('');
        setRuteId(''); setTanggalDari(''); setTanggalSampai('');
        router.get('/laporan/riwayat', {}, { preserveState: true, preserveScroll: true });
    };

    const hasMapData = (item) =>
        (Array.isArray(item?.gps_track) && item.gps_track.length > 0) ||
        !!item?.rute?.polyline;

    return (
        <SimpleLayout user={auth.user} pageTitle="Riwayat Perjalanan">
            <Head title="Riwayat Perjalanan" />

            <div className="space-y-6">

                {/* ── Header ── */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Riwayat Perjalanan</h1>
                    <p className="text-sm text-gray-600 mt-1">Rekap seluruh perjalanan bus yang telah dilakukan</p>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-blue-600">
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">Total Perjalanan</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-blue-600">{stats.total_perjalanan}</div><p className="text-xs text-slate-500 mt-1">semua perjalanan</p></CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-600">
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">Perjalanan Selesai</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-green-600">{stats.total_selesai}</div><p className="text-xs text-slate-500 mt-1">trip selesai</p></CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-yellow-500">
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">Sedang Berjalan</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-yellow-500">{stats.total_aktif}</div><p className="text-xs text-slate-500 mt-1">trip aktif</p></CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-purple-600">
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">Total Penumpang</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-purple-600">{stats.total_penumpang.toLocaleString('id-ID')}</div><p className="text-xs text-slate-500 mt-1">dari trip selesai</p></CardContent>
                    </Card>
                </div>

                {/* ── Filter ── */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="flex gap-3 flex-wrap">
                            <div className="flex-1 min-w-[220px]">
                                <input type="text" placeholder="Cari nama driver atau bus..." value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                            </div>
                            <select value={status} onChange={(e) => setStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Semua Status</option>
                                <option value="aktif">Aktif</option>
                                <option value="selesai">Selesai</option>
                            </select>
                            <select value={kondisi} onChange={(e) => setKondisi(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Semua Kondisi</option>
                                <option value="lancar">Lancar</option>
                                <option value="macet">Macet</option>
                                <option value="mogok">Mogok</option>
                            </select>
                            <select value={ruteId} onChange={(e) => setRuteId(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Semua Rute</option>
                                {ruteList.map((r) => (
                                    <option key={r.id} value={r.id}>{r.nama_rute}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3 flex-wrap items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Dari</span>
                                <input type="date" value={tanggalDari} onChange={(e) => setTanggalDari(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Sampai</span>
                                <input type="date" value={tanggalSampai} onChange={(e) => setTanggalSampai(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm transition-colors">Cari</button>
                            {hasFilter && (
                                <button type="button" onClick={resetFilters}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm transition-colors">Reset</button>
                            )}
                        </div>
                    </form>
                </div>

                {/* ── Tabel ── */}
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
                                    <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500">Tidak ada data riwayat perjalanan</td></tr>
                                ) : (
                                    perjalanan.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                        {item.kru?.driver?.charAt(0)?.toUpperCase() ?? '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">{item.kru?.driver ?? '—'}</p>
                                                        <p className="text-xs text-gray-500">{item.armada?.nama_bus} · {item.armada?.plat_nomor}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 text-sm">{item.rute?.nama_rute ?? '—'}</p>
                                                {item.jarak_tempuh > 0 && <p className="text-xs text-gray-500">{Number(item.jarak_tempuh).toFixed(1)} km</p>}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 text-sm">{fmtDT(item.waktu_mulai)}</td>
                                            <td className="px-6 py-4 text-gray-900 text-sm">{fmtDurasi(item.durasi_menit)}</td>
                                            <td className="px-6 py-4 text-gray-900 text-sm text-center">{item.total_penumpang} org</td>
                                            <td className="px-6 py-4 text-right">
                                                {item.status === 'selesai'
                                                    ? <span className="font-semibold text-green-700 text-sm">{fmt(item.pendapatan)}</span>
                                                    : <span className="text-xs text-gray-400">Belum selesai</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${KONDISI_CLASS[item.kondisi_terakhir] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {item.kondisi_terakhir}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_CLASS[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {item.status === 'aktif' ? 'Aktif' : 'Selesai'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => setDetailItem(item)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat Detail">
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
                    {perjalanan.data.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600">
                                Menampilkan {perjalanan.from}–{perjalanan.to} dari {perjalanan.total} data
                            </div>
                            <div className="flex gap-2 flex-wrap justify-center">
                                {perjalanan.links.map((link, i) => (
                                    <button key={i} onClick={() => link.url && router.get(link.url)} disabled={!link.url}
                                        className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-blue-600 text-white' : link.url ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                Modal Detail — max-w-5xl, layout 2 kolom, header gradient
            ══════════════════════════════════════════════════════════════ */}
            {detailItem && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-auto">

                        {/* Header gradient biru seperti Dashboard detail panel */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                    {detailItem.kru?.driver?.charAt(0)?.toUpperCase() ?? '?'}
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white leading-tight">
                                        {detailItem.kru?.driver ?? 'Detail Perjalanan'}
                                    </h2>
                                    <p className="text-xs text-blue-200 mt-0.5">
                                        {detailItem.armada?.nama_bus} · {detailItem.armada?.plat_nomor}
                                        {detailItem.rute?.nama_rute ? ` · ${detailItem.rute.nama_rute}` : ''}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setDetailItem(null)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex border-b border-gray-200 px-6 bg-slate-50">
                            <button onClick={() => setDetailTab('info')}
                                className={`py-3 px-5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                                    detailTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Informasi
                            </button>
                            <button onClick={() => setDetailTab('peta')}
                                className={`py-3 px-5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                                    detailTab === 'peta' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                Peta GPS
                                {Array.isArray(detailItem.gps_track) && detailItem.gps_track.length > 0 && (
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-normal">
                                        {detailItem.gps_track.length} titik
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">

                            {/* ── Tab Informasi: 2 kolom ── */}
                            {detailTab === 'info' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Kiri: Data Perjalanan */}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <span className="inline-block w-1 h-4 bg-blue-500 rounded-sm"></span>
                                            Informasi Perjalanan
                                        </p>
                                        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                                            {[
                                                { label: 'Driver',         value: detailItem.kru?.driver },
                                                { label: 'Bus',            value: `${detailItem.armada?.nama_bus ?? ''} (${detailItem.armada?.plat_nomor ?? ''})` },
                                                { label: 'Kelas',          value: detailItem.armada?.kelas },
                                                { label: 'Rute',           value: detailItem.rute?.nama_rute },
                                                { label: 'Asal → Tujuan', value: `${detailItem.rute?.kota_asal ?? ''} → ${detailItem.rute?.kota_tujuan ?? ''}` },
                                                { label: 'Kondisi',        value: detailItem.kondisi_terakhir },
                                                { label: 'Status',         value: detailItem.status === 'aktif' ? 'Aktif' : 'Selesai' },
                                            ].map(({ label, value }) => (
                                                <div key={label} className="flex justify-between items-center px-4 py-2.5 text-sm bg-white hover:bg-slate-50 transition-colors">
                                                    <span className="text-gray-500 shrink-0">{label}</span>
                                                    <span className="font-medium text-gray-900 text-right ml-3">{value ?? '—'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Kanan: Waktu + Statistik */}
                                    <div className="space-y-5">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <span className="inline-block w-1 h-4 bg-green-500 rounded-sm"></span>
                                                Waktu &amp; Durasi
                                            </p>
                                            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                                                {[
                                                    { label: 'Waktu Mulai',   value: fmtDT(detailItem.waktu_mulai) },
                                                    { label: 'Waktu Selesai', value: fmtDT(detailItem.waktu_selesai) },
                                                    { label: 'Durasi',        value: fmtDurasi(detailItem.durasi_menit) },
                                                    { label: 'Jarak Tempuh',  value: detailItem.jarak_tempuh ? `${Number(detailItem.jarak_tempuh).toFixed(2)} km` : '—' },
                                                ].map(({ label, value }) => (
                                                    <div key={label} className="flex justify-between items-center px-4 py-2.5 text-sm bg-white hover:bg-slate-50 transition-colors">
                                                        <span className="text-gray-500 shrink-0">{label}</span>
                                                        <span className="font-medium text-gray-900 text-right ml-3">{value ?? '—'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <span className="inline-block w-1 h-4 bg-purple-500 rounded-sm"></span>
                                                Statistik &amp; GPS
                                            </p>
                                            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                                                {[
                                                    { label: 'Total Penumpang',  value: `${detailItem.total_penumpang} orang` },
                                                    { label: 'Total Pendapatan', value: fmt(detailItem.pendapatan), highlight: true },
                                                    {
                                                        label: 'GPS Track',
                                                        value: Array.isArray(detailItem.gps_track) && detailItem.gps_track.length > 0
                                                            ? `${detailItem.gps_track.length} titik tersimpan` : 'Tidak tersedia',
                                                    },
                                                    { label: 'Catatan', value: detailItem.catatan || '—' },
                                                ].map(({ label, value, highlight }) => (
                                                    <div key={label} className="flex justify-between items-center px-4 py-2.5 text-sm bg-white hover:bg-slate-50 transition-colors">
                                                        <span className="text-gray-500 shrink-0">{label}</span>
                                                        <span className={`font-medium text-right ml-3 ${highlight ? 'text-green-700' : 'text-gray-900'}`}>
                                                            {value ?? '—'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Tab Peta GPS ── */}
                            {detailTab === 'peta' && (
                                <div>
                                    {!hasMapData(detailItem) ? (
                                        <div className="flex flex-col items-center justify-center h-80 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                            <svg className="w-14 h-14 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                            </svg>
                                            <p className="text-sm font-semibold text-slate-500">Data GPS tidak tersedia</p>
                                            <p className="text-xs text-slate-400 mt-1">Perjalanan ini tidak memiliki rekaman GPS track</p>
                                        </div>
                                    ) : loadError ? (
                                        <div className="flex flex-col items-center justify-center h-80 bg-red-50 rounded-xl border border-red-200">
                                            <svg className="w-10 h-10 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                            </svg>
                                            <p className="text-sm font-semibold text-red-600">{loadError}</p>
                                            <p className="text-xs text-red-400 mt-1">Periksa API Key dan koneksi internet</p>
                                        </div>
                                    ) : !mapsLoaded ? (
                                        <div className="flex flex-col items-center justify-center h-80 bg-slate-50 rounded-xl border border-slate-200">
                                            <svg className="animate-spin h-9 w-9 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <p className="text-sm text-slate-500">Memuat Google Maps...</p>
                                        </div>
                                    ) : (
                                        <GpsTrackMap
                                            gpsTrack={detailItem.gps_track}
                                            rutePolyline={detailItem.rute?.polyline}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                            <button onClick={() => setDetailItem(null)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </SimpleLayout>
    );
}