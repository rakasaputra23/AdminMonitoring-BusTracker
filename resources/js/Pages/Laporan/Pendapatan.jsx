import React, { useState } from 'react';
import SimpleLayout from '@/Layouts/SimpleLayout';
import { Head, router } from '@inertiajs/react';

// ─── Helpers ──────────────────────────────────────────────
const formatRupiah = (n) =>
    'Rp ' + Number(n ?? 0).toLocaleString('id-ID');

const formatRupiahShort = (n) => {
    const num = Number(n ?? 0);
    if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}jt`;
    if (num >= 1_000)     return `Rp ${(num / 1_000).toFixed(0)}rb`;
    return formatRupiah(num);
};

const pct = (val, max) => (max > 0 ? Math.min(100, (val / max) * 100) : 0);

// ─── Bar Chart (pure Tailwind, no library) ────────────────
const BarChart = ({ data }) => {
    const max = Math.max(...data.map(d => d.pendapatan), 1);
    const last = data.length - 1;
    return (
        <div className="flex items-end gap-1.5 h-36 w-full">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400 leading-none">
                        {formatRupiahShort(d.pendapatan)}
                    </span>
                    <div
                        className={`w-full rounded-t transition-all duration-500 ${
                            i === last ? 'bg-blue-600' : 'bg-blue-200'
                        }`}
                        style={{
                            height: `${pct(d.pendapatan, max)}%`,
                            minHeight: d.pendapatan > 0 ? '4px' : '0',
                        }}
                        title={`${d.bulan}: ${formatRupiah(d.pendapatan)}`}
                    />
                    <span className="text-[10px] text-gray-500 leading-none text-center w-full truncate">
                        {d.bulan}
                    </span>
                </div>
            ))}
        </div>
    );
};

// ─── Daily Bar ────────────────────────────────────────────
const DailyChart = ({ data }) => {
    if (!data?.length) {
        return <p className="text-sm text-gray-500 text-center py-8">Tidak ada data harian</p>;
    }
    const max = Math.max(...data.map(d => d.pendapatan), 1);
    return (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {data.map((d, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500 w-20 flex-shrink-0 text-xs">
                        {new Date(d.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-green-500 transition-all duration-500"
                            style={{ width: `${pct(d.pendapatan, max)}%` }}
                        />
                    </div>
                    <span className="text-gray-700 font-medium w-24 text-right text-xs">
                        {formatRupiahShort(d.pendapatan)}
                    </span>
                    <span className="text-gray-400 w-12 text-right text-xs">
                        {d.penumpang} org
                    </span>
                </div>
            ))}
        </div>
    );
};

// ─── Main ─────────────────────────────────────────────────
export default function Pendapatan({ auth, perRute, trend, perHari, stats, bulan }) {
    const [activeBulan, setActiveBulan] = useState(bulan);

    const handleBulanChange = (e) => {
        const val = e.target.value;
        setActiveBulan(val);
        router.get('/laporan/pendapatan', { bulan: val }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const totalPendapatan    = stats.total_pendapatan;
    const maxRutePendapatan  = perRute.length ? Math.max(...perRute.map(r => r.pendapatan)) : 1;
    const namaBulan = new Date(activeBulan + '-01').toLocaleString('id-ID', { month: 'long', year: 'numeric' });

    return (
        <SimpleLayout user={auth.user} pageTitle="Laporan Pendapatan">
            <Head title="Laporan Pendapatan" />

            <div className="space-y-6">

                {/* ── Header ── */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Laporan Pendapatan</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Akumulasi pendapatan berdasarkan rute dan jumlah penumpang
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Bulan:</label>
                        <input
                            type="month"
                            value={activeBulan}
                            onChange={handleBulanChange}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'Total Pendapatan',
                            value: formatRupiahShort(stats.total_pendapatan),
                            sub: formatRupiah(stats.total_pendapatan),
                            iconBg: 'from-green-400 to-green-600',
                            icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ),
                            growth: stats.growth,
                        },
                        {
                            label: 'Total Penumpang',
                            value: stats.total_penumpang.toLocaleString('id-ID'),
                            sub: 'penumpang bulan ini',
                            iconBg: 'from-blue-400 to-blue-600',
                            icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            ),
                        },
                        {
                            label: 'Total Trip',
                            value: stats.total_trip.toLocaleString('id-ID'),
                            sub: 'perjalanan selesai',
                            iconBg: 'from-purple-400 to-purple-600',
                            icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l.01 0M16 17l.01 0M5 7h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2zm0 0V5a2 2 0 012-2h10a2 2 0 012 2v2M9 17a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
                                </svg>
                            ),
                        },
                        {
                            label: 'Rata-rata / Trip',
                            value: formatRupiahShort(stats.rata_per_trip),
                            sub: `≈ ${stats.rata_penumpang} penumpang/trip`,
                            iconBg: 'from-orange-400 to-orange-500',
                            icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            ),
                        },
                    ].map((card, i) => (
                        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.iconBg} flex items-center justify-center text-white flex-shrink-0`}>
                                {card.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-1">
                                    <p className="text-xs text-gray-500">{card.label}</p>
                                    {card.growth !== undefined && card.growth !== null && (
                                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                            card.growth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {card.growth >= 0 ? '↑' : '↓'}{Math.abs(card.growth)}%
                                        </span>
                                    )}
                                </div>
                                <p className="text-2xl font-bold text-gray-900 leading-tight">{card.value}</p>
                                {card.sub && <p className="text-xs text-gray-400 truncate">{card.sub}</p>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Charts Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Tren 6 Bulan */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="mb-4">
                            <h2 className="font-semibold text-gray-900">Tren Pendapatan</h2>
                            <p className="text-sm text-gray-600 mt-0.5">6 bulan terakhir</p>
                        </div>
                        {trend.length > 0 ? (
                            <>
                                <BarChart data={trend} />
                                {/* Mini tabel tren */}
                                <div className="mt-4 divide-y divide-gray-100">
                                    {trend.map((t, i) => (
                                        <div key={i} className="flex justify-between items-center py-1.5 text-xs">
                                            <span className="text-gray-500">{t.bulan}</span>
                                            <span className="text-gray-400">{t.trip} trip · {t.penumpang.toLocaleString('id-ID')} org</span>
                                            <span className="font-medium text-gray-800">{formatRupiahShort(t.pendapatan)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-10">Belum ada data</p>
                        )}
                    </div>

                    {/* Pendapatan Harian */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="mb-4">
                            <h2 className="font-semibold text-gray-900">Pendapatan Harian</h2>
                            <p className="text-sm text-gray-600 mt-0.5">{namaBulan}</p>
                        </div>
                        <DailyChart data={perHari} />
                    </div>
                </div>

                {/* ── Tabel Per Rute ── */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h2 className="font-semibold text-gray-900">Pendapatan Per Rute</h2>
                            <p className="text-sm text-gray-600 mt-0.5">{namaBulan} · {perRute.length} rute</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rute</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Harga/Tiket</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Trip</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Penumpang</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kontribusi</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Pendapatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {perRute.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            Tidak ada data pendapatan bulan ini
                                        </td>
                                    </tr>
                                ) : (
                                    perRute.map((item, idx) => {
                                        const kontribusi = totalPendapatan > 0
                                            ? ((item.pendapatan / totalPendapatan) * 100).toFixed(1)
                                            : 0;
                                        return (
                                            <tr key={item.rute_id} className="hover:bg-gray-50 transition-colors">
                                                {/* Rank */}
                                                <td className="px-6 py-4 text-gray-400 text-sm font-medium">
                                                    {idx + 1}
                                                </td>
                                                {/* Rute */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white flex-shrink-0">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-900">{item.rute?.nama_rute ?? '-'}</span>
                                                            <p className="text-xs text-gray-500">
                                                                {item.rute?.kota_asal} → {item.rute?.kota_tujuan}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Harga */}
                                                <td className="px-6 py-4 text-gray-900">
                                                    {formatRupiah(item.harga)}
                                                </td>
                                                {/* Trip */}
                                                <td className="px-6 py-4 text-gray-900">
                                                    {item.total_trip} trip
                                                </td>
                                                {/* Penumpang */}
                                                <td className="px-6 py-4 text-gray-900">
                                                    {Number(item.total_penumpang).toLocaleString('id-ID')} orang
                                                </td>
                                                {/* Kontribusi */}
                                                <td className="px-6 py-4 min-w-[160px]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-green-500 transition-all duration-500"
                                                                style={{ width: `${pct(item.pendapatan, maxRutePendapatan)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-500 w-10 text-right">
                                                            {kontribusi}%
                                                        </span>
                                                    </div>
                                                </td>
                                                {/* Pendapatan */}
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-semibold text-green-700">
                                                        {formatRupiah(item.pendapatan)}
                                                    </span>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        ≈ {formatRupiahShort(item.total_trip > 0 ? Math.round(item.pendapatan / item.total_trip) : 0)}/trip
                                                    </p>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>

                            {/* Footer Total */}
                            {perRute.length > 0 && (
                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-700">
                                            Total Bulan Ini
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 font-semibold">
                                            {perRute.reduce((s, r) => s + r.total_trip, 0)} trip
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 font-semibold">
                                            {perRute.reduce((s, r) => s + Number(r.total_penumpang), 0).toLocaleString('id-ID')} orang
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-gray-400">100%</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-green-700 text-lg">
                                                {formatRupiah(totalPendapatan)}
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                {/* ── Info Box ── */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-blue-700">
                            Pendapatan dihitung dari <strong>harga tiket per rute × total penumpang</strong> pada setiap perjalanan berstatus <em>selesai</em>.
                            Atur harga tiket di menu <strong>Data Master → Rute</strong>.
                        </p>
                    </div>
                </div>

            </div>
        </SimpleLayout>
    );
}