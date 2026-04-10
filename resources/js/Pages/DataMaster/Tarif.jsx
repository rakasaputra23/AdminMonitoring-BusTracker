import React, { useState } from 'react';
import SimpleLayout from '@/Layouts/SimpleLayout';
import { Head, router } from '@inertiajs/react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatRupiah = (value) => {
    if (!value && value !== 0) return 'N/A';
    return 'Rp ' + Number(value).toLocaleString('id-ID');
};

const formatEstimasi = (minutes) => {
    if (!minutes) return 'N/A';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}j ${m}m` : `${m} menit`;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Tarif({ auth, tarif, ruteAvailable, filters }) {
    const [showModal, setShowModal]             = useState(false);
    const [editMode, setEditMode]               = useState(false);
    const [currentTarif, setCurrentTarif]       = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [tarifToDelete, setTarifToDelete]     = useState(null);

    const [formData, setFormData] = useState({
        rute_id : '',
        harga   : '',
        status  : 'aktif',
        catatan : '',
    });

    const [errors, setErrors]         = useState({});
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');

    // ── Helpers Input ──────────────────────────────────────────────

    // Saat user ketik harga — simpan angka mentah, tampilkan terformat
    const [rawHarga, setRawHarga] = useState('');

    const handleHargaChange = (e) => {
        // Hapus semua karakter non-digit
        const digits = e.target.value.replace(/\D/g, '');
        setRawHarga(digits);
        setFormData(prev => ({ ...prev, harga: digits }));
    };

    const displayHarga = rawHarga
        ? Number(rawHarga).toLocaleString('id-ID')
        : '';

    // ── Modal ──────────────────────────────────────────────────────

    const handleOpenModal = (item = null) => {
        setErrors({});
        if (item) {
            setEditMode(true);
            setCurrentTarif(item);
            const hargaStr = String(Math.round(Number(item.harga)));
            setRawHarga(hargaStr);
            setFormData({
                rute_id : item.rute_id,
                harga   : hargaStr,
                status  : item.status,
                catatan : item.catatan || '',
            });
        } else {
            setEditMode(false);
            setCurrentTarif(null);
            setRawHarga('');
            setFormData({ rute_id: '', harga: '', status: 'aktif', catatan: '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditMode(false);
        setCurrentTarif(null);
        setRawHarga('');
        setFormData({ rute_id: '', harga: '', status: 'aktif', catatan: '' });
        setErrors({});
    };

    // ── Submit ─────────────────────────────────────────────────────

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = { ...formData };

        if (editMode && currentTarif) {
            router.put(`/data-master/tarif/${currentTarif.id}`, payload, {
                onSuccess : () => handleCloseModal(),
                onError   : (errs) => setErrors(errs),
            });
        } else {
            router.post('/data-master/tarif', payload, {
                onSuccess : () => handleCloseModal(),
                onError   : (errs) => setErrors(errs),
            });
        }
    };

    // ── Delete ─────────────────────────────────────────────────────

    const handleDelete = (item) => {
        setTarifToDelete(item);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (tarifToDelete) {
            router.delete(`/data-master/tarif/${tarifToDelete.id}`, {
                onSuccess: () => {
                    setShowDeleteConfirm(false);
                    setTarifToDelete(null);
                },
            });
        }
    };

    // ── Search ─────────────────────────────────────────────────────

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/data-master/tarif', { search: searchTerm, status: statusFilter }, {
            preserveState  : true,
            preserveScroll : true,
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        router.get('/data-master/tarif', {}, { preserveState: true, preserveScroll: true });
    };

    // ── Rute terpilih (untuk tampil di form edit) ──────────────────
    const selectedRuteInfo = editMode && currentTarif ? currentTarif.rute : null;

    // ─────────────────────────────────────────────────────────────────
    return (
        <SimpleLayout user={auth.user} pageTitle="Data Tarif">
            <Head title="Data Tarif" />

            <div className="space-y-6">

                {/* ── Header ── */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Data Tarif</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Kelola tarif flat per rute perjalanan bus
                        </p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        disabled={ruteAvailable.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        title={ruteAvailable.length === 0 ? 'Semua rute sudah memiliki tarif' : 'Tambah tarif baru'}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Tarif
                    </button>
                </div>

                {/* ── Info jika semua rute sudah punya tarif ── */}
                {ruteAvailable.length === 0 && tarif.total > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-green-700">
                            Semua rute aktif sudah memiliki tarif. Tambahkan rute baru di <strong>Data Master → Rute</strong> untuk menambah tarif baru.
                        </p>
                    </div>
                )}

                {/* ── Search & Filter ── */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
                        <div className="flex-1 min-w-[250px]">
                            <input
                                type="text"
                                placeholder="Cari nama rute atau kota..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Semua Status</option>
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                        </select>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Cari
                        </button>
                        {(searchTerm || statusFilter) && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </form>
                </div>

                {/* ── Tarif Table ── */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rute</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jarak</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estimasi</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Harga Tarif</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Catatan</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {tarif.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                            Belum ada data tarif
                                        </td>
                                    </tr>
                                ) : (
                                    tarif.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            {/* Rute */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
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
                                            {/* Jarak */}
                                            <td className="px-6 py-4 text-gray-700 text-sm">
                                                {item.rute?.jarak
                                                    ? `${Number(item.rute.jarak).toFixed(2)} km`
                                                    : 'N/A'}
                                            </td>
                                            {/* Estimasi */}
                                            <td className="px-6 py-4 text-gray-700 text-sm">
                                                {formatEstimasi(item.rute?.estimasi_waktu)}
                                            </td>
                                            {/* Harga */}
                                            <td className="px-6 py-4">
                                                <span className="text-lg font-bold text-blue-600">
                                                    {formatRupiah(item.harga)}
                                                </span>
                                            </td>
                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                    item.status === 'aktif'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {item.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            {/* Catatan */}
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {item.catatan || '-'}
                                            </td>
                                            {/* Aksi */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(item)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit Tarif"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Hapus Tarif"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {tarif.data.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600">
                                Menampilkan {tarif.from} - {tarif.to} dari {tarif.total} tarif
                            </div>
                            <div className="flex gap-2 flex-wrap justify-center">
                                {tarif.links.map((link, index) => (
                                    <button
                                        key={index}
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
                Modal Add / Edit Tarif
            ══════════════════════════════════════════════════════════ */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {editMode ? 'Edit Tarif' : 'Tambah Tarif'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">

                            {/* ── Pilih Rute (hanya saat tambah) ── */}
                            {!editMode ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rute <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.rute_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, rute_id: e.target.value }))}
                                        required
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.rute_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="">-- Pilih Rute --</option>
                                        {ruteAvailable.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.nama_rute} ({r.kota_asal} → {r.kota_tujuan})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.rute_id && (
                                        <p className="text-red-600 text-xs mt-1">{errors.rute_id}</p>
                                    )}
                                    {/* Preview info rute terpilih */}
                                    {formData.rute_id && (() => {
                                        const r = ruteAvailable.find(x => String(x.id) === String(formData.rute_id));
                                        return r ? (
                                            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-4 text-sm">
                                                <span className="text-blue-700">
                                                    📍 <strong>{r.jarak ? Number(r.jarak).toFixed(2) + ' km' : 'N/A'}</strong>
                                                </span>
                                                <span className="text-blue-700">
                                                    ⏱ <strong>{formatEstimasi(r.estimasi_waktu)}</strong>
                                                </span>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            ) : (
                                /* Saat edit — tampilkan info rute, tidak bisa diubah */
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Rute</label>
                                    <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                                        <p className="font-medium">{selectedRuteInfo?.nama_rute ?? '-'}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {selectedRuteInfo?.kota_asal} → {selectedRuteInfo?.kota_tujuan}
                                            {selectedRuteInfo?.jarak && ` · ${Number(selectedRuteInfo.jarak).toFixed(2)} km`}
                                            {selectedRuteInfo?.estimasi_waktu && ` · ${formatEstimasi(selectedRuteInfo.estimasi_waktu)}`}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Rute tidak dapat diubah setelah tarif dibuat</p>
                                </div>
                            )}

                            {/* ── Harga ── */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Harga Tarif <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm select-none">
                                        Rp
                                    </span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={displayHarga}
                                        onChange={handleHargaChange}
                                        required
                                        placeholder="0"
                                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right font-semibold text-gray-900 ${
                                            errors.harga ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                        }`}
                                    />
                                </div>
                                {errors.harga && (
                                    <p className="text-red-600 text-xs mt-1">{errors.harga}</p>
                                )}
                                {rawHarga && (
                                    <p className="text-xs text-blue-600 mt-1 text-right">
                                        {formatRupiah(rawHarga)}
                                    </p>
                                )}
                            </div>

                            {/* ── Status & Catatan ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="aktif">Aktif</option>
                                        <option value="nonaktif">Nonaktif</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Catatan (Opsional)</label>
                                    <input
                                        type="text"
                                        value={formData.catatan}
                                        onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
                                        placeholder="Contoh: Tarif normal"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* ── Footer Buttons ── */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    {editMode ? 'Simpan Perubahan' : 'Tambah Tarif'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                Delete Confirmation Modal
            ══════════════════════════════════════════════════════════ */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Hapus</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Hapus tarif untuk rute{' '}
                                    <span className="font-semibold">{tarifToDelete?.rute?.nama_rute}</span>?
                                    <br />
                                    <span className="text-blue-600 font-semibold">{formatRupiah(tarifToDelete?.harga)}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SimpleLayout>
    );
}