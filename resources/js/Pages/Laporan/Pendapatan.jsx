import React, { useState } from 'react';
import SimpleLayout from '@/Layouts/SimpleLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/Card';
import { Badge } from '@/Components/ui/Badge';
import { Input } from '@/Components/ui/Input';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => 'Rp ' + Number(n ?? 0).toLocaleString('id-ID');

const fmtShort = (n) => {
    const num = Number(n ?? 0);
    if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}M`;
    if (num >= 1_000_000)     return `Rp ${(num / 1_000_000).toFixed(1)}jt`;
    if (num >= 1_000)         return `Rp ${(num / 1_000).toFixed(0)}rb`;
    return fmt(num);
};

const pct = (val, max) => (max > 0 ? Math.min(100, (val / max) * 100) : 0);

const namaBulanStr = (bulan) =>
    new Date(bulan + '-01').toLocaleString('id-ID', { month: 'long', year: 'numeric' });

// ─── Mini Bar Chart (pure Tailwind) ───────────────────────────────────────────
function BarChart({ data }) {
    const max = Math.max(...data.map((d) => d.pendapatan), 1);
    const last = data.length - 1;
    return (
        <div className="flex items-end gap-1.5 h-32 w-full pt-2">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {fmtShort(d.pendapatan)}
                    </span>
                    <div
                        className={`w-full rounded-t transition-all duration-500 ${
                            i === last ? 'bg-blue-600' : 'bg-blue-200 group-hover:bg-blue-300'
                        }`}
                        style={{
                            height: `${pct(d.pendapatan, max)}%`,
                            minHeight: d.pendapatan > 0 ? '4px' : '0',
                        }}
                        title={`${d.bulan}: ${fmt(d.pendapatan)}`}
                    />
                    <span className="text-[10px] text-gray-500 text-center w-full truncate">
                        {d.bulan}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Daily Bars ────────────────────────────────────────────────────────────────
function DailyChart({ data }) {
    if (!data?.length) {
        return (
            <p className="text-sm text-gray-500 text-center py-8">
                Tidak ada data harian untuk bulan ini.
            </p>
        );
    }
    const max = Math.max(...data.map((d) => d.pendapatan), 1);
    return (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {data.map((d, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500 w-16 flex-shrink-0 text-xs">
                        {new Date(d.tanggal).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short',
                        })}
                    </span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-green-500 transition-all duration-500"
                            style={{ width: `${pct(d.pendapatan, max)}%` }}
                        />
                    </div>
                    <span className="text-gray-700 font-medium w-24 text-right text-xs">
                        {fmtShort(d.pendapatan)}
                    </span>
                    <span className="text-gray-400 w-12 text-right text-xs">
                        {d.penumpang} org
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
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

    const totalPendapatan   = stats.total_pendapatan;
    const maxRutePendapatan = perRute.length
        ? Math.max(...perRute.map((r) => r.pendapatan))
        : 1;

    return (
        <SimpleLayout user={auth.user} pageTitle="Laporan Pendapatan">
            <Head title="Laporan Pendapatan" />

            <div className="space-y-6">

                {/* ── Header ────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Laporan Pendapatan</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Akumulasi pendapatan berdasarkan rute dan penumpang
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 shrink-0">Bulan:</label>
                        <input
                            type="month"
                            value={activeBulan}
                            onChange={handleBulanChange}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                    </div>
                </div>

                {/* ── Stat Cards ────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-green-600">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Total Pendapatan
                            </CardTitle>
                            {stats.growth !== undefined && stats.growth !== null && (
                                <Badge className={stats.growth >= 0 ? 'bg-green-500' : 'bg-red-500'}>
                                    {stats.growth >= 0 ? '↑' : '↓'}{Math.abs(stats.growth)}%
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {fmtShort(stats.total_pendapatan)}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{fmt(stats.total_pendapatan)}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-600">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Total Penumpang
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.total_penumpang.toLocaleString('id-ID')}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">penumpang bulan ini</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-600">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Total Trip
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {stats.total_trip.toLocaleString('id-ID')}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">perjalanan selesai</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                                Rata-rata / Trip
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-500">
                                {fmtShort(stats.rata_per_trip)}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                ≈ {stats.rata_penumpang} penumpang/trip
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Charts Row ────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    <Card>
                        <CardHeader className="border-b bg-slate-50">
                            <CardTitle className="text-base font-semibold">Tren Pendapatan</CardTitle>
                            <CardDescription className="text-xs mt-0.5">6 bulan terakhir</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                            {trend.length > 0 ? (
                                <>
                                    <BarChart data={trend} />
                                    <div className="mt-4 divide-y divide-gray-100">
                                        {trend.map((t, i) => (
                                            <div key={i} className="flex justify-between items-center py-1.5 text-xs">
                                                <span className="text-gray-500">{t.bulan}</span>
                                                <span className="text-gray-400">
                                                    {t.trip} trip · {t.penumpang.toLocaleString('id-ID')} org
                                                </span>
                                                <span className="font-semibold text-gray-800">
                                                    {fmtShort(t.pendapatan)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-10">Belum ada data</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b bg-slate-50">
                            <CardTitle className="text-base font-semibold">Pendapatan Harian</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                {namaBulanStr(activeBulan)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                            <DailyChart data={perHari} />
                        </CardContent>
                    </Card>
                </div>

                {/* ── Tabel Per Rute ────────────────────────────────────── */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-slate-50 flex justify-between items-center">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Pendapatan Per Rute</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {namaBulanStr(activeBulan)} · {perRute.length} rute
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rute</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Harga / Tiket</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Trip</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Penumpang</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[160px]">Kontribusi</th>
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
                                                <td className="px-6 py-4 text-gray-400 text-sm font-medium">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white flex-shrink-0">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{item.nama_rute ?? '-'}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {item.kota_asal} → {item.kota_tujuan}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-900 text-sm">{fmt(item.harga)}</td>
                                                <td className="px-6 py-4 text-gray-900 text-sm text-center">
                                                    {item.total_trip} trip
                                                </td>
                                                <td className="px-6 py-4 text-gray-900 text-sm text-center">
                                                    {Number(item.total_penumpang).toLocaleString('id-ID')} org
                                                </td>
                                                <td className="px-6 py-4">
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
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-semibold text-green-700">
                                                        {fmt(item.pendapatan)}
                                                    </span>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        ≈ {fmtShort(item.total_trip > 0 ? Math.round(item.pendapatan / item.total_trip) : 0)}/trip
                                                    </p>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            {perRute.length > 0 && (
                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-700">
                                            Total Bulan Ini
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 font-semibold text-center">
                                            {perRute.reduce((s, r) => s + r.total_trip, 0)} trip
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 font-semibold text-center">
                                            {perRute.reduce((s, r) => s + Number(r.total_penumpang), 0).toLocaleString('id-ID')} org
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-gray-400">100%</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-green-700 text-lg">
                                                {fmt(totalPendapatan)}
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                {/* ── Info Box ──────────────────────────────────────────── */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-blue-700">
                            Pendapatan dihitung dari <strong>harga tiket × total penumpang naik</strong> pada
                            setiap perjalanan berstatus <em>selesai</em>. Atur harga di{' '}
                            <strong>Data Master → Tarif</strong>.
                        </p>
                    </div>
                </div>

            </div>
        </SimpleLayout>
    );
}