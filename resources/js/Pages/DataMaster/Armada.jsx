import React, { useState } from 'react';
import SimpleLayout from '@/Layouts/SimpleLayout';
import { Head, router } from '@inertiajs/react';

export default function Armada({ auth, armada, filters }) {
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentArmada, setCurrentArmada] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [armadaToDelete, setArmadaToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    nama_bus: '',
    plat_nomor: '',
    kelas: 'Ekonomi',
    kapasitas: '',
    status: 'aktif',
  });

  const [searchTerm, setSearchTerm] = useState(filters?.search || '');
  const [kelasFilter, setKelasFilter] = useState(filters?.kelas || '');
  const [statusFilter, setStatusFilter] = useState(filters?.status || '');

  const handleOpenModal = (armada = null) => {
    if (armada) {
      setEditMode(true);
      setCurrentArmada(armada);
      setFormData({
        nama_bus: armada.nama_bus,
        plat_nomor: armada.plat_nomor,
        kelas: armada.kelas,
        kapasitas: armada.kapasitas,
        status: armada.status,
      });
    } else {
      setEditMode(false);
      setCurrentArmada(null);
      setFormData({
        nama_bus: '',
        plat_nomor: '',
        kelas: 'Ekonomi',
        kapasitas: '',
        status: 'aktif',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentArmada(null);
    setFormData({
      nama_bus: '',
      plat_nomor: '',
      kelas: 'Ekonomi',
      kapasitas: '',
      status: 'aktif',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editMode && currentArmada) {
      router.put(`/data-master/armada/${currentArmada.id}`, formData, {
        onSuccess: () => handleCloseModal(),
      });
    } else {
      router.post('/data-master/armada', formData, {
        onSuccess: () => handleCloseModal(),
      });
    }
  };

  const handleDelete = (armada) => {
    setArmadaToDelete(armada);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (armadaToDelete) {
      router.delete(`/data-master/armada/${armadaToDelete.id}`, {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          setArmadaToDelete(null);
        },
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.get('/data-master/armada', { 
      search: searchTerm, 
      kelas: kelasFilter,
      status: statusFilter 
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setKelasFilter('');
    setStatusFilter('');
    router.get('/data-master/armada', {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const getKelasBadge = (kelas) => {
    const badges = {
      'Ekonomi': 'bg-gray-100 text-gray-700',
      'Bisnis': 'bg-blue-100 text-blue-700',
      'Eksekutif': 'bg-purple-100 text-purple-700',
    };
    return badges[kelas] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'aktif': 'bg-green-100 text-green-700',
      'nonaktif': 'bg-red-100 text-red-700',
      'maintenance': 'bg-yellow-100 text-yellow-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'aktif': 'Aktif',
      'nonaktif': 'Nonaktif',
      'maintenance': 'Maintenance',
    };
    return labels[status] || status;
  };

  return (
    <SimpleLayout user={auth.user} pageTitle="Data Armada">
      <Head title="Data Armada" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Armada</h1>
            <p className="text-sm text-gray-600 mt-1">Kelola data armada bus STJ Tracker</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Armada
          </button>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <input
                type="text"
                placeholder="Cari nama bus atau plat nomor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={kelasFilter}
              onChange={(e) => setKelasFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Kelas</option>
              <option value="Ekonomi">Ekonomi</option>
              <option value="Bisnis">Bisnis</option>
              <option value="Eksekutif">Eksekutif</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cari
            </button>
            {(searchTerm || kelasFilter || statusFilter) && (
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

        {/* Armada Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Bus</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plat Nomor</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kapasitas</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {armada.data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data armada
                  </td>
                </tr>
              ) : (
                armada.data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-900">{item.nama_bus}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {item.plat_nomor}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getKelasBadge(item.kelas)}`}>
                        {item.kelas}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-gray-900 font-medium">{item.kapasitas} seat</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Armada"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Armada"
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

          {/* Pagination */}
          {armada.data.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Menampilkan {armada.from} - {armada.to} dari {armada.total} armada
              </div>
              <div className="flex gap-2">
                {armada.links.map((link, index) => (
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

      {/* Modal Add/Edit Armada */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editMode ? 'Edit Armada' : 'Tambah Armada'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Bus</label>
                <input
                  type="text"
                  value={formData.nama_bus}
                  onChange={(e) => setFormData({ ...formData, nama_bus: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: STJ Express 01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plat Nomor</label>
                <input
                  type="text"
                  value={formData.plat_nomor}
                  onChange={(e) => setFormData({ ...formData, plat_nomor: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="Contoh: B 1234 XYZ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kelas Bus</label>
                <select
                  value={formData.kelas}
                  onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Ekonomi">Ekonomi</option>
                  <option value="Bisnis">Bisnis</option>
                  <option value="Eksekutif">Eksekutif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kapasitas Penumpang</label>
                <input
                  type="number"
                  value={formData.kapasitas}
                  onChange={(e) => setFormData({ ...formData, kapasitas: e.target.value })}
                  required
                  min="1"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: 40"
                />
              </div>

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
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editMode ? 'Simpan Perubahan' : 'Tambah Armada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                  Apakah Anda yakin ingin menghapus armada <span className="font-semibold">{armadaToDelete?.nama_bus}</span>?
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