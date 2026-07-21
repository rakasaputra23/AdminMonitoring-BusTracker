import React, { useState } from 'react';
import SimpleLayout from '@/Layouts/SimpleLayout';
import { Head, router } from '@inertiajs/react';

export default function Kru({ auth, kru, filters }) {
  const [showModal, setShowModal]             = useState(false);
  const [editMode, setEditMode]               = useState(false);
  const [currentKru, setCurrentKru]           = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [kruToDelete, setKruToDelete]         = useState(null);
  const [errors, setErrors]                   = useState({});
  const [showPassword, setShowPassword]       = useState(false);

  const emptyForm = {
    driver   : '',
    username : '',
    password : '',
    status   : 'aktif',
  };

  const [formData, setFormData] = useState(emptyForm);

  const [searchTerm, setSearchTerm]     = useState(filters?.search || '');
  const [statusFilter, setStatusFilter] = useState(filters?.status || '');

  // ── Validasi frontend (mirror validasi backend) ──────────────────

  const DRIVER_REGEX   = /^[a-zA-Z\s.']+$/;
  const USERNAME_REGEX = /^[a-z0-9_]+$/;

  const getDriverError = (val) => {
    if (!val.trim()) return 'Nama driver wajib diisi';
    if (val.trim().length < 3) return 'Nama driver minimal 3 karakter';
    if (!DRIVER_REGEX.test(val)) return 'Nama driver hanya boleh berisi huruf dan spasi';
    return null;
  };

  const getUsernameError = (val) => {
    if (!val) return 'Username wajib diisi';
    if (val.length < 4) return 'Username minimal 4 karakter';
    if (!USERNAME_REGEX.test(val)) return 'Hanya huruf kecil, angka, dan underscore (_), tanpa spasi';
    return null;
  };

  const getPasswordError = (val) => {
    if (!editMode && !val) return 'Password wajib diisi';
    if (val && val.length < 6) return 'Password minimal 6 karakter';
    return null;
  };

  // ── Modal ──────────────────────────────────────────────────────────

  const handleOpenModal = (item = null) => {
    setErrors({});
    setShowPassword(false);
    if (item) {
      setEditMode(true);
      setCurrentKru(item);
      setFormData({ driver: item.driver, username: item.username, password: '', status: item.status });
    } else {
      setEditMode(false);
      setCurrentKru(null);
      setFormData(emptyForm);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentKru(null);
    setErrors({});
    setShowPassword(false);
    setFormData(emptyForm);
  };

  // ── Input handlers ─────────────────────────────────────────────────

  const handleDriverChange = (e) => {
    // biarkan huruf, spasi, titik, apostrof saja saat mengetik
    const val = e.target.value.replace(/[^a-zA-Z\s.']/g, '');
    setFormData((prev) => ({ ...prev, driver: val }));
  };

  const handleUsernameChange = (e) => {
    // otomatis lowercase, hanya huruf/angka/underscore, tanpa spasi
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData((prev) => ({ ...prev, username: val }));
  };

  // ── Submit ─────────────────────────────────────────────────────────

  const handleSubmit = (e) => {
    e.preventDefault();

    const driverError   = getDriverError(formData.driver);
    const usernameError = getUsernameError(formData.username);
    const passwordError = getPasswordError(formData.password);

    if (driverError || usernameError || passwordError) {
      setErrors({
        ...(driverError   ? { driver: driverError }     : {}),
        ...(usernameError ? { username: usernameError } : {}),
        ...(passwordError ? { password: passwordError } : {}),
      });
      return;
    }

    // Jangan kirim field password kosong saat edit (biar backend tidak menganggap ada perubahan)
    const payload = { ...formData };
    if (editMode && !payload.password) {
      delete payload.password;
    }

    if (editMode && currentKru) {
      router.put(`/data-master/kru/${currentKru.id}`, payload, {
        onSuccess : () => handleCloseModal(),
        onError   : (errs) => setErrors(errs),
      });
    } else {
      router.post('/data-master/kru', payload, {
        onSuccess : () => handleCloseModal(),
        onError   : (errs) => setErrors(errs),
      });
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────

  const handleDelete = (item) => {
    setKruToDelete(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (kruToDelete) {
      router.delete(`/data-master/kru/${kruToDelete.id}`, {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          setKruToDelete(null);
        },
      });
    }
  };

  // ── Search ─────────────────────────────────────────────────────────

  const handleSearch = (e) => {
    e.preventDefault();
    router.get('/data-master/kru', { search: searchTerm, status: statusFilter }, {
      preserveState  : true,
      preserveScroll : true,
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    router.get('/data-master/kru', {}, { preserveState: true, preserveScroll: true });
  };

  // ──────────────────────────────────────────────────────────────────
  return (
    <SimpleLayout user={auth.user} pageTitle="Data Kru">
      <Head title="Data Kru" />

      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Kru</h1>
            <p className="text-sm text-gray-600 mt-1">Kelola data kru bus untuk login aplikasi mobile</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Kru
          </button>
        </div>

        {/* ── Search & Filter ── */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <input
                type="text"
                placeholder="Cari nama driver atau username..."
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

        {/* ── Kru Table ── */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dibuat</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {kru.data.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      Tidak ada data kru
                    </td>
                  </tr>
                ) : (
                  kru.data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      {/* Nama Driver */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {item.driver.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{item.driver}</span>
                        </div>
                      </td>
                      {/* Username */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          {item.username}
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
                      {/* Dibuat */}
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      {/* Aksi */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Kru"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Kru"
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
          {kru.data.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Menampilkan {kru.from} - {kru.to} dari {kru.total} kru
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {kru.links.map((link, index) => (
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
          Modal Add / Edit Kru
      ══════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editMode ? 'Edit Kru' : 'Tambah Kru'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Nama Driver */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Driver <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.driver}
                  onChange={handleDriverChange}
                  required
                  minLength={3}
                  placeholder="Contoh: Budi Santoso"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.driver ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.driver ? (
                  <p className="text-red-600 text-xs mt-1">{errors.driver}</p>
                ) : (
                  <p className="text-gray-400 text-xs mt-1">Hanya huruf dan spasi, minimal 3 karakter</p>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={handleUsernameChange}
                  required
                  minLength={4}
                  placeholder="Contoh: budi123"
                  className={`w-full px-4 py-2 border rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.username ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.username ? (
                  <p className="text-red-600 text-xs mt-1">{errors.username}</p>
                ) : (
                  <p className="text-gray-400 text-xs mt-1">Huruf kecil, angka, underscore (_) saja, tanpa spasi, minimal 4 karakter</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password{' '}
                  {editMode
                    ? <span className="text-gray-400 font-normal">(kosongkan jika tidak ingin mengubah)</span>
                    : <span className="text-red-500">*</span>
                  }
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editMode}
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              {/* Footer Buttons */}
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
                  {editMode ? 'Simpan Perubahan' : 'Tambah Kru'}
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
                  Apakah Anda yakin ingin menghapus kru{' '}
                  <span className="font-semibold">{kruToDelete?.driver}</span>?
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