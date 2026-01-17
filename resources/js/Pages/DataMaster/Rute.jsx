import React, { useState, useEffect, useRef, useCallback } from 'react';
import SimpleLayout from '@/Layouts/SimpleLayout';
import { Head, router } from '@inertiajs/react';

// Custom Hook untuk Load Google Maps
const useGoogleMaps = (apiKey) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!apiKey) {
      setLoadError('API Key tidak ditemukan');
      return;
    }

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      existingScript.addEventListener('error', () => setLoadError('Gagal memuat Google Maps'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;

    window.initMap = () => {
      setIsLoaded(true);
      delete window.initMap;
    };

    script.onerror = () => {
      setLoadError('Gagal memuat Google Maps');
    };

    document.head.appendChild(script);
  }, [apiKey]);

  return { isLoaded, loadError };
};

export default function Rute({ auth, rute, filters, googleMapsApiKey }) {
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRute, setCurrentRute] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ruteToDelete, setRuteToDelete] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // State untuk multiple routes
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  
  const [formData, setFormData] = useState({
    nama_rute: '',
    kota_asal: '',
    kota_tujuan: '',
    polyline: '',
    track_coordinates: '',
    jarak: '',
    estimasi_waktu: '',
    status: 'aktif',
    catatan: '',
  });

  const [searchTerm, setSearchTerm] = useState(filters?.search || '');
  const [statusFilter, setStatusFilter] = useState(filters?.status || '');

  // Google Maps Refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const polylineRefs = useRef([]);
  const originAutocompleteRef = useRef(null);
  const destinationAutocompleteRef = useRef(null);
  const originInputRef = useRef(null);
  const destinationInputRef = useRef(null);

  const { isLoaded: mapsLoaded, loadError } = useGoogleMaps(googleMapsApiKey);

  // Initialize Map
  const initializeMap = useCallback(() => {
    if (!mapsLoaded || !window.google || !mapContainerRef.current) return;

    try {
      if (mapRef.current) {
        mapRef.current = null;
      }

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: -7.629, lng: 111.523 },
        zoom: 9,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapRef.current = map;
      directionsServiceRef.current = new window.google.maps.DirectionsService();

      // Setup Autocomplete for Origin
      if (originInputRef.current) {
        const originAutocomplete = new window.google.maps.places.Autocomplete(originInputRef.current, {
          componentRestrictions: { country: 'id' },
          fields: ['formatted_address', 'geometry', 'name'],
        });

        originAutocomplete.addListener('place_changed', () => {
          const place = originAutocomplete.getPlace();
          if (place && place.formatted_address) {
            setFormData(prev => ({ ...prev, kota_asal: place.formatted_address }));
          }
        });

        originAutocompleteRef.current = originAutocomplete;
      }

      // Setup Autocomplete for Destination
      if (destinationInputRef.current) {
        const destinationAutocomplete = new window.google.maps.places.Autocomplete(destinationInputRef.current, {
          componentRestrictions: { country: 'id' },
          fields: ['formatted_address', 'geometry', 'name'],
        });

        destinationAutocomplete.addListener('place_changed', () => {
          const place = destinationAutocomplete.getPlace();
          if (place && place.formatted_address) {
            setFormData(prev => ({ ...prev, kota_tujuan: place.formatted_address }));
          }
        });

        destinationAutocompleteRef.current = destinationAutocomplete;
      }

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [mapsLoaded]);

  // Initialize map when modal opens
  useEffect(() => {
    if (showModal && mapsLoaded) {
      const timer = setTimeout(() => {
        initializeMap();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showModal, mapsLoaded, initializeMap]);

  // Auto-calculate route when both origin and destination are filled
  useEffect(() => {
    if (formData.kota_asal && formData.kota_tujuan && mapsLoaded && directionsServiceRef.current) {
      calculateMultipleRoutes();
    }
  }, [formData.kota_asal, formData.kota_tujuan, mapsLoaded]);

  // Calculate Multiple Routes (Via Tol & Non-Tol)
  const calculateMultipleRoutes = useCallback(() => {
    if (!formData.kota_asal || !formData.kota_tujuan || !directionsServiceRef.current || !mapRef.current) {
      return;
    }

    setIsCalculating(true);

    // Clear previous polylines
    polylineRefs.current.forEach(polyline => polyline.setMap(null));
    polylineRefs.current = [];

    const allRoutes = [];
    let completedRequests = 0;

    // Request 1: Route with tolls (default)
    const requestWithTolls = {
      origin: formData.kota_asal,
      destination: formData.kota_tujuan,
      travelMode: window.google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true,
    };

    // Request 2: Route without tolls
    const requestWithoutTolls = {
      origin: formData.kota_asal,
      destination: formData.kota_tujuan,
      travelMode: window.google.maps.TravelMode.DRIVING,
      avoidTolls: true,
      provideRouteAlternatives: false,
    };

    const processResults = () => {
      if (completedRequests === 2) {
        setIsCalculating(false);

        if (allRoutes.length === 0) {
          alert('Tidak dapat menghitung rute');
          setAvailableRoutes([]);
          return;
        }

        // Remove duplicate routes (same distance)
        const uniqueRoutes = [];
        allRoutes.forEach(route => {
          const isDuplicate = uniqueRoutes.some(existing => {
            const existingDistance = existing.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
            const routeDistance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
            return Math.abs(existingDistance - routeDistance) < 100;
          });
          if (!isDuplicate) {
            uniqueRoutes.push(route);
          }
        });

        setAvailableRoutes(uniqueRoutes);
        setSelectedRouteIndex(0);

        // Render each unique route as polyline
        uniqueRoutes.forEach((route, index) => {
          const path = route.overview_path;
          
          const polyline = new window.google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: index === 0 ? '#1E40AF' : '#93C5FD',
            strokeOpacity: index === 0 ? 0.8 : 0.5,
            strokeWeight: index === 0 ? 6 : 4,
            map: mapRef.current,
          });

          // Add click listener
          polyline.addListener('click', () => {
            selectRoute(index);
          });

          polylineRefs.current.push(polyline);
        });

        // Fit bounds to show all routes
        const bounds = new window.google.maps.LatLngBounds();
        uniqueRoutes[0].overview_path.forEach(point => {
          bounds.extend(point);
        });
        mapRef.current.fitBounds(bounds);

        // Set first route data as default
        updateFormDataFromRoute(uniqueRoutes[0]);
      }
    };

    // Execute request with tolls
    directionsServiceRef.current.route(requestWithTolls, (result, status) => {
      if (status === 'OK' && result) {
        result.routes.slice(0, 2).forEach(route => {
          allRoutes.push({ ...route, routeType: 'via_tol' });
        });
      }
      completedRequests++;
      processResults();
    });

    // Execute request without tolls
    directionsServiceRef.current.route(requestWithoutTolls, (result, status) => {
      if (status === 'OK' && result) {
        allRoutes.push({ ...result.routes[0], routeType: 'non_tol' });
      }
      completedRequests++;
      processResults();
    });

  }, [formData.kota_asal, formData.kota_tujuan]);

  // Select a route
  const selectRoute = useCallback((index) => {
    if (index < 0 || index >= availableRoutes.length) return;

    setSelectedRouteIndex(index);

    // Update polyline styles
    polylineRefs.current.forEach((polyline, i) => {
      polyline.setOptions({
        strokeColor: i === index ? '#1E40AF' : '#93C5FD',
        strokeWeight: i === index ? 6 : 4,
        strokeOpacity: i === index ? 0.8 : 0.5,
      });
    });

    // Update form data with selected route
    updateFormDataFromRoute(availableRoutes[index]);
  }, [availableRoutes]);

  // Update form data from selected route
  const updateFormDataFromRoute = useCallback((route) => {
    const legs = route.legs;

    let totalDistance = 0;
    let totalDuration = 0;
    legs.forEach(leg => {
      totalDistance += leg.distance.value;
      totalDuration += leg.duration.value;
    });

    const polyline = route.overview_polyline;
    const jarak = (totalDistance / 1000).toFixed(2);
    const estimasiWaktu = Math.round(totalDuration / 60);

    const path = route.overview_path;
    const trackCoordinates = path.map(point => ({
      lat: point.lat(),
      lng: point.lng(),
    }));

    setFormData(prev => ({
      ...prev,
      polyline: polyline,
      track_coordinates: JSON.stringify(trackCoordinates),
      jarak: jarak,
      estimasi_waktu: estimasiWaktu,
    }));
  }, []);

  // Handle Open Modal
  const handleOpenModal = (rute = null) => {
    if (rute) {
      setEditMode(true);
      setCurrentRute(rute);
      setFormData({
        nama_rute: rute.nama_rute,
        kota_asal: rute.kota_asal,
        kota_tujuan: rute.kota_tujuan,
        polyline: rute.polyline,
        track_coordinates: JSON.stringify(rute.track_coordinates),
        jarak: rute.jarak,
        estimasi_waktu: rute.estimasi_waktu,
        status: rute.status,
        catatan: rute.catatan || '',
      });
    } else {
      setEditMode(false);
      setCurrentRute(null);
      setFormData({
        nama_rute: '',
        kota_asal: '',
        kota_tujuan: '',
        polyline: '',
        track_coordinates: '',
        jarak: '',
        estimasi_waktu: '',
        status: 'aktif',
        catatan: '',
      });
    }
    setAvailableRoutes([]);
    setSelectedRouteIndex(0);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentRute(null);
    
    // Clear polylines
    polylineRefs.current.forEach(polyline => polyline.setMap(null));
    polylineRefs.current = [];
    
    mapRef.current = null;
    setAvailableRoutes([]);
    setSelectedRouteIndex(0);
    
    setFormData({
      nama_rute: '',
      kota_asal: '',
      kota_tujuan: '',
      polyline: '',
      track_coordinates: '',
      jarak: '',
      estimasi_waktu: '',
      status: 'aktif',
      catatan: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.polyline) {
      alert('Silakan pilih kota asal dan tujuan untuk generate rute');
      return;
    }

    if (editMode && currentRute) {
      router.put(`/data-master/rute/${currentRute.id}`, formData, {
        onSuccess: () => handleCloseModal(),
      });
    } else {
      router.post('/data-master/rute', formData, {
        onSuccess: () => handleCloseModal(),
      });
    }
  };

  const handleDelete = (rute) => {
    setRuteToDelete(rute);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (ruteToDelete) {
      router.delete(`/data-master/rute/${ruteToDelete.id}`, {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          setRuteToDelete(null);
        },
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.get('/data-master/rute', { search: searchTerm, status: statusFilter }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    router.get('/data-master/rute', {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const formatEstimasiWaktu = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}j ${mins}m` : `${mins} menit`;
  };

  if (loadError) {
    return (
      <SimpleLayout user={auth.user} pageTitle="Data Rute">
        <Head title="Data Rute" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 font-semibold">{loadError}</p>
            <p className="text-gray-600 mt-2">Periksa API Key dan koneksi internet Anda</p>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout user={auth.user} pageTitle="Data Rute">
      <Head title="Data Rute" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Rute</h1>
            <p className="text-sm text-gray-600 mt-1">Kelola jalur rute perjalanan bus dengan Google Maps</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Rute
          </button>
        </div>

        {/* Search & Filter */}
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

        {/* Rute Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Rute</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jarak</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estimasi</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Catatan</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rute.data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      Tidak ada data rute
                    </td>
                  </tr>
                ) : (
                  rute.data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{item.nama_rute}</span>
                            <p className="text-xs text-gray-500">
                              {item.kota_asal} → {item.kota_tujuan}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {item.jarak ? `${Number(item.jarak).toFixed(2)} km` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {formatEstimasiWaktu(item.estimasi_waktu)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'aktif' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {item.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{item.catatan || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Rute"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Rute"
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
          {rute.data.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Menampilkan {rute.from} - {rute.to} dari {rute.total} rute
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {rute.links.map((link, index) => (
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

      {/* Modal Add/Edit Rute - OPTIMIZED & STICKY */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 py-8 flex items-start justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl my-auto">
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editMode ? 'Edit Rute' : 'Tambah Rute'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Loading Indicator */}
                {!mapsLoaded && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-blue-700 font-medium">⏳ Memuat Google Maps...</p>
                    <p className="text-sm text-blue-600 mt-1">Mohon tunggu sebentar</p>
                  </div>
                )}

                {/* Nama Rute */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Rute <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nama_rute}
                    onChange={(e) => setFormData({ ...formData, nama_rute: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: Madiun - Surabaya"
                  />
                </div>

                {/* Route Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kota Asal <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={originInputRef}
                      type="text"
                      defaultValue={formData.kota_asal}
                      disabled={!mapsLoaded}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Cari kota asal..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kota Tujuan <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={destinationInputRef}
                      type="text"
                      defaultValue={formData.kota_tujuan}
                      disabled={!mapsLoaded}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Cari kota tujuan..."
                    />
                  </div>
                </div>

                {/* Route Info */}
                {isCalculating && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-blue-700 font-medium">Menghitung alternatif rute...</span>
                    </div>
                  </div>
                )}

                {/* Available Routes Selector */}
                {availableRoutes.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold text-green-800">
                        {availableRoutes.length} Alternatif Rute Tersedia
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mb-3">Klik rute di peta atau pilih di bawah untuk memilih jalur</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {availableRoutes.map((route, index) => {
                        const legs = route.legs;
                        let totalDistance = 0;
                        let totalDuration = 0;
                        legs.forEach(leg => {
                          totalDistance += leg.distance.value;
                          totalDuration += leg.duration.value;
                        });
                        const jarak = (totalDistance / 1000).toFixed(2);
                        const waktu = Math.round(totalDuration / 60);

                        const routeLabel = index === 0 ? 'Rute Rekomendasi' : 
                                         route.routeType === 'non_tol' ? 'Rute Tanpa Tol' : 
                                         `Alternatif ${index}`;

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => selectRoute(index)}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                              selectedRouteIndex === index
                                ? 'border-blue-600 bg-blue-50 shadow-md'
                                : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-3 h-3 rounded-full ${
                                selectedRouteIndex === index ? 'bg-blue-600' : 'bg-gray-400'
                              }`}></div>
                              <span className="font-semibold text-gray-900 text-sm">
                                {routeLabel}
                              </span>
                              {selectedRouteIndex === index && (
                                <svg className="w-4 h-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-gray-900">{jarak} km</span> · {formatEstimasiWaktu(waktu)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {route.summary || (route.routeType === 'non_tol' ? 'Menghindari jalan tol' : 'Via jalur standar')}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Google Maps Container */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peta Rute {availableRoutes.length > 0 && '(Klik rute untuk memilih)'}
                  </label>
                  <div 
                    ref={mapContainerRef}
                    className="w-full h-96 rounded-lg border-2 border-gray-300 bg-gray-50"
                    style={{ minHeight: '384px' }}
                  />
                </div>

                {/* Route Info Display */}
                {formData.jarak && formData.estimasi_waktu && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Jarak Tempuh</p>
                        <p className="text-3xl font-bold text-blue-600">{formData.jarak} km</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Estimasi Waktu</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {formatEstimasiWaktu(formData.estimasi_waktu)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Catatan (Opsional)</label>
                    <input
                      type="text"
                      value={formData.catatan}
                      onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Contoh: Via Tol, Jalur Alternatif"
                    />
                  </div>
                </div>

                {/* Sticky Footer Buttons */}
                <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 -mx-6 px-6 pb-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={!formData.polyline}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      {editMode ? 'Simpan Perubahan' : 'Tambah Rute'}
                    </button>
                  </div>
                  {!formData.polyline && (
                    <p className="text-xs text-red-600 text-center mt-2">
                      Pilih kota asal dan tujuan untuk generate rute
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
                  Apakah Anda yakin ingin menghapus rute <span className="font-semibold">{ruteToDelete?.nama_rute}</span>?
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