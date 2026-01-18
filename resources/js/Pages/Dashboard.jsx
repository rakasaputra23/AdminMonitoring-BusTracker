import React, { useEffect, useRef, useState } from 'react';
import SimpleLayout from '@/Layouts/SimpleLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Separator } from '@/Components/ui/Separator';
import { ScrollArea } from '@/Components/ui/ScrollArea';
import { X, MapPin, Users, Gauge, User, Clock, Navigation, Loader2 } from 'lucide-react';

export default function Dashboard({ auth, stats, buses, googleMapsApiKey, error }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});
    const infoWindowsRef = useRef({});
    const trailLinesRef = useRef({});
    const routePolylineRef = useRef(null);
    const lastKnownPositionsRef = useRef({});
    const allBusesDataRef = useRef({}); // Simpan semua data bus yang pernah ada
    
    const [currentStats, setCurrentStats] = useState(stats);
    const [currentBuses, setCurrentBuses] = useState(buses || {});
    const [selectedBus, setSelectedBus] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Load Google Maps Script
    useEffect(() => {
        if (!googleMapsApiKey) {
            console.error('Google Maps API Key is missing');
            return;
        }

        if (window.google?.maps) {
            initMap();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            console.log('✅ Google Maps loaded successfully');
            initMap();
        };
        script.onerror = () => {
            console.error('❌ Failed to load Google Maps');
        };

        document.head.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [googleMapsApiKey]);

    // Initialize map
    const initMap = () => {
        try {
            if (!mapRef.current || !window.google) return;

            const center = { lat: -7.6298, lng: 111.5239 };

            // Clean Default Style - Hijau Biru Natural
            const mapStyles = [
                // Hide POI (tidak perlu tempat wisata, restoran, dll)
                {
                    featureType: "poi",
                    stylers: [{ visibility: "off" }]
                },
                // Hide transit (bus stop, train station icons)
                {
                    featureType: "transit",
                    stylers: [{ visibility: "off" }]
                },
                // Hide administrative labels yang terlalu banyak
                {
                    featureType: "administrative.land_parcel",
                    stylers: [{ visibility: "off" }]
                },
                {
                    featureType: "administrative.neighborhood",
                    stylers: [{ visibility: "off" }]
                }
                // Biarkan warna default Google Maps (hijau, biru, dll)
            ];

            const map = new google.maps.Map(mapRef.current, {
                zoom: 12,
                center: center,
                
                // 100% CLEAN - NO CONTROLS AT ALL
                disableDefaultUI: true,
                
                // Disable EVERYTHING
                zoomControl: false,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                scaleControl: false,
                rotateControl: false,
                
                // Smooth interaction (scroll to zoom)
                gestureHandling: 'greedy',
                
                // Clean styles (default colors, cuma hide POI & transit)
                styles: mapStyles,
                
                // Disable clickable POI
                clickableIcons: false
            });

            mapInstanceRef.current = map;
            setMapLoaded(true);

            console.log('✅ 100% clean map initialized');
            
            // Simpan data awal
            allBusesDataRef.current = { ...buses };
            updateBusMarkers(buses);

        } catch (err) {
            console.error('❌ Error initializing map:', err);
        }
    };

    // Start real-time updates setiap 5 detik
    useEffect(() => {
        const interval = setInterval(() => {
            fetchLatestData(true); // silent update
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Auto-update floating card jika ada bus yang dipilih
    useEffect(() => {
        if (selectedBus && currentBuses[selectedBus.id]) {
            const updatedBus = currentBuses[selectedBus.id];
            const isOnline = hasValidGPS(updatedBus);
            setSelectedBus({ id: selectedBus.id, ...updatedBus, isOnline });
        }
    }, [currentBuses]);

    // Fetch latest data
    const fetchLatestData = async (silent = false) => {
        if (!silent) setIsRefreshing(true);

        try {
            const [statsRes, busesRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/buses')
            ]);

            const statsData = await statsRes.json();
            const busesData = await busesRes.json();

            if (statsData.success) {
                setCurrentStats(statsData.data);
            }

            if (busesData.success) {
                // Gabungkan data baru dengan data lama (jangan hilangkan bus yang offline)
                const mergedBuses = { ...allBusesDataRef.current, ...busesData.data };
                allBusesDataRef.current = mergedBuses;
                
                setCurrentBuses(mergedBuses);
                if (mapLoaded) {
                    updateBusMarkers(mergedBuses);
                }
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            if (!silent) {
                setTimeout(() => setIsRefreshing(false), 500);
            }
        }
    };

    // Calculate bearing
    const calculateBearing = (start, end) => {
        const startLat = start.lat * Math.PI / 180;
        const startLng = start.lng * Math.PI / 180;
        const endLat = end.lat * Math.PI / 180;
        const endLng = end.lng * Math.PI / 180;

        const dLng = endLng - startLng;
        const y = Math.sin(dLng) * Math.cos(endLat);
        const x = Math.cos(startLat) * Math.sin(endLat) -
                  Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
        
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    };

    // Create 3D bus icon (top view - memanjang)
    const createBusIcon = (isOnline, rotation = 0) => {
        // Bus 3D view dari atas - persegi panjang memanjang
        const busPath = 'M10,2 L14,2 L14,1 L10,1 Z M9,2 L9,22 L10,22 L10,2 Z M14,2 L14,22 L15,22 L15,2 Z M10,2 L14,2 L14,22 L10,22 Z M10,5 L14,5 M10,8 L14,8 M10,11 L14,11 M10,14 L14,14 M10,17 L14,17 M10,20 L14,20';
        
        return {
            path: busPath,
            fillColor: isOnline ? '#2563EB' : '#9CA3AF',
            fillOpacity: isOnline ? 1 : 0.6,
            strokeWeight: 2,
            strokeColor: '#ffffff',
            scale: 1.2,
            anchor: new google.maps.Point(12, 12),
            rotation: rotation
        };
    };

    // Smooth marker animation
    const animateMarker = (marker, startPos, endPos, duration = 1000) => {
        const start = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);

            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : -1 + (4 - 2 * progress) * progress;

            const lat = startPos.lat() + (endPos.lat - startPos.lat()) * easeProgress;
            const lng = startPos.lng() + (endPos.lng - startPos.lng()) * easeProgress;

            marker.setPosition({ lat, lng });

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    };

    // Check valid GPS
    const hasValidGPS = (bus) => {
        return bus.location && 
               bus.location.latitude && 
               bus.location.longitude && 
               bus.location.latitude !== 0 && 
               bus.location.longitude !== 0;
    };

    // Update bus markers
    const updateBusMarkers = (busesData) => {
        if (!mapInstanceRef.current || !busesData || !window.google) return;

        Object.entries(busesData).forEach(([busId, bus]) => {
            const isOnline = hasValidGPS(bus);
            
            let position;
            if (isOnline) {
                position = {
                    lat: parseFloat(bus.location.latitude),
                    lng: parseFloat(bus.location.longitude)
                };
                lastKnownPositionsRef.current[busId] = position;
            } else {
                position = lastKnownPositionsRef.current[busId];
                if (!position) {
                    console.log(`Bus ${busId} offline - no last known position`);
                    return;
                }
            }

            let rotation = 0;
            if (bus.track && bus.track.length >= 2) {
                const lastTwo = bus.track.slice(-2);
                const start = { lat: lastTwo[0].lat, lng: lastTwo[0].lng };
                const end = { lat: lastTwo[1].lat, lng: lastTwo[1].lng };
                rotation = calculateBearing(start, end);
            }

            const markerIcon = createBusIcon(isOnline, rotation);

            if (markersRef.current[busId]) {
                const marker = markersRef.current[busId];
                const oldPos = marker.getPosition();
                
                if (isOnline) {
                    animateMarker(marker, oldPos, position, 1000);
                }
                marker.setIcon(markerIcon);
                
                // Update info window content real-time
                if (infoWindowsRef.current[busId]) {
                    infoWindowsRef.current[busId].setContent(createInfoWindowContent(busId, bus));
                }
            } else {
                const marker = new google.maps.Marker({
                    position: position,
                    map: mapInstanceRef.current,
                    icon: markerIcon,
                    title: bus.plateNumber || busId,
                    animation: google.maps.Animation.DROP
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: createInfoWindowContent(busId, bus)
                });

                marker.addListener('click', () => {
                    closeAllInfoWindows();
                    infoWindow.open(mapInstanceRef.current, marker);
                    showBusDetails(busId, bus, isOnline);
                });

                markersRef.current[busId] = marker;
                infoWindowsRef.current[busId] = infoWindow;
            }
        });

        console.log('✅ Updated', Object.keys(markersRef.current).length, 'markers');
    };

    // Create compact info window (Popup 1)
    const createInfoWindowContent = (busId, bus) => {
        const occupancy = bus.currentPassengers || 0;
        const capacity = bus.capacity || 0;
        const percentage = capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;

        return `
            <div style="padding: 12px; min-width: 200px; font-family: system-ui;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <div style="background: #2563EB; padding: 6px; border-radius: 6px;">
                        <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
                        </svg>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 15px; font-weight: bold; color: #1F2937;">${bus.plateNumber || busId}</h4>
                        <p style="margin: 2px 0 0 0; font-size: 11px; color: #6B7280;">${bus.class || 'N/A'}</p>
                    </div>
                </div>
                <div style="font-size: 12px; color: #4B5563; line-height: 1.6;">
                    <div style="margin-bottom: 6px;">
                        <strong>Rute:</strong> ${bus.route || 'N/A'}
                    </div>
                    <div style="margin-bottom: 6px;">
                        <strong>Penumpang:</strong> ${occupancy}/${capacity} (${percentage}%)
                    </div>
                    <div>
                        <strong>Kecepatan:</strong> ${bus.location?.speed?.toFixed(1) || 0} km/jam
                    </div>
                </div>
            </div>
        `;
    };

    // Show bus details (Popup 2 + Polylines)
    const showBusDetails = (busId, bus, isOnline) => {
        setSelectedBus({ id: busId, ...bus, isOnline });

        clearPolylines();

        // Draw route polyline
        if (bus.routePolyline) {
            try {
                const path = google.maps.geometry.encoding.decodePath(bus.routePolyline);
                routePolylineRef.current = new google.maps.Polyline({
                    path: path,
                    geodesic: true,
                    strokeColor: '#F97316',
                    strokeOpacity: 0.7,
                    strokeWeight: 4,
                    map: mapInstanceRef.current,
                    icons: [{
                        icon: {
                            path: 'M 0,-1 0,1',
                            strokeOpacity: 1,
                            scale: 3
                        },
                        offset: '0',
                        repeat: '20px'
                    }]
                });
            } catch (e) {
                console.error('Error drawing route polyline:', e);
            }
        }

        // Draw track polyline
        if (bus.track && bus.track.length > 1) {
            const trailPath = bus.track.map(t => ({ lat: t.lat, lng: t.lng }));
            
            trailLinesRef.current[busId] = new google.maps.Polyline({
                path: trailPath,
                geodesic: true,
                strokeColor: '#10B981',
                strokeOpacity: 0.8,
                strokeWeight: 3,
                map: mapInstanceRef.current
            });
        }

        // Zoom ke posisi bus (BUKAN ke route)
        let busPosition;
        if (isOnline) {
            busPosition = {
                lat: parseFloat(bus.location.latitude),
                lng: parseFloat(bus.location.longitude)
            };
        } else {
            busPosition = lastKnownPositionsRef.current[busId];
        }

        if (busPosition) {
            mapInstanceRef.current.setCenter(busPosition);
            mapInstanceRef.current.setZoom(15); // Zoom ke bus
        }
    };

    // Clear all polylines
    const clearPolylines = () => {
        if (routePolylineRef.current) {
            routePolylineRef.current.setMap(null);
            routePolylineRef.current = null;
        }
        Object.values(trailLinesRef.current).forEach(line => {
            line.setMap(null);
        });
        trailLinesRef.current = {};
    };

    // Close all info windows
    const closeAllInfoWindows = () => {
        Object.values(infoWindowsRef.current).forEach(iw => iw.close());
    };

    // Close detail panel
    const closeDetailPanel = () => {
        setSelectedBus(null);
        clearPolylines();
        closeAllInfoWindows();
    };

    // Focus on bus
    const focusOnBus = (busId) => {
        const bus = currentBuses[busId];
        if (!bus) return;

        const isOnline = hasValidGPS(bus);
        let position;

        if (isOnline) {
            position = {
                lat: parseFloat(bus.location.latitude),
                lng: parseFloat(bus.location.longitude)
            };
        } else {
            position = lastKnownPositionsRef.current[busId];
            if (!position) return;
        }

        mapInstanceRef.current.setCenter(position);
        mapInstanceRef.current.setZoom(15);

        if (markersRef.current[busId]) {
            google.maps.event.trigger(markersRef.current[busId], 'click');
        }
    };

    // Time ago helper
    const timeAgo = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return `${seconds} detik lalu`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
        return `${Math.floor(seconds / 86400)} hari lalu`;
    };

    return (
        <SimpleLayout
            pageTitle="Dashboard Operasional"
            user={auth.user}
        >
            <div className="space-y-4">
                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-semibold">Firebase Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-l-4 border-l-blue-600">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">Total Armada</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{currentStats?.total_buses || 0}</div>
                            <p className="text-xs text-slate-500 mt-1">Bus terdaftar</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-600">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">Bus Beroperasi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{currentStats?.active_buses || 0}</div>
                            <p className="text-xs text-slate-500 mt-1">Sedang di rute</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-600">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">Total Penumpang</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{currentStats?.total_passengers || 0}</div>
                            <p className="text-xs text-slate-500 mt-1">dari {currentStats?.total_capacity || 0} kapasitas</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-600">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">Kecepatan Rata-rata</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{currentStats?.average_speed || 0}</div>
                            <p className="text-xs text-slate-500 mt-1">km/jam</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Map Section - FULL WIDTH dengan Floating Card */}
                <Card className="relative">
                    <CardHeader className="border-b bg-slate-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Peta Real-time Monitoring</CardTitle>
                                <CardDescription className="text-xs mt-1">
                                    Live tracking seluruh armada • Update otomatis setiap 5 detik
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium shadow-sm">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                                    </span>
                                    LIVE
                                </div>
                                <Button 
                                    onClick={() => fetchLatestData(false)}
                                    disabled={isRefreshing}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs shadow-sm"
                                >
                                    {isRefreshing ? (
                                        <>
                                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                            Refreshing...
                                        </>
                                    ) : (
                                        'Refresh'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 relative">
                        <div ref={mapRef} className="w-full h-[600px] bg-slate-100"></div>
                        
                        {/* Loading */}
                        {!mapLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
                                <div className="text-center">
                                    <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                                    <p className="text-sm font-medium text-slate-700">Loading map...</p>
                                </div>
                            </div>
                        )}

                        {/* Floating Detail Card (Popup 2) - Kanan Bawah */}
                        {selectedBus && (
                            <div className="absolute bottom-4 right-4 w-80 bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden z-10">
                                <div className="sticky top-0 bg-blue-600 text-white p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Navigation className="w-5 h-5" />
                                        <h3 className="font-bold text-sm">Detail Bus</h3>
                                    </div>
                                    <Button 
                                        onClick={closeDetailPanel}
                                        size="sm"
                                        variant="ghost"
                                        className="text-white hover:bg-blue-700 h-7 w-7 p-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                
                                <ScrollArea className="h-[440px]">
                                    <div className="p-4 space-y-4">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 pb-3 border-b">
                                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-base text-slate-900 truncate">{selectedBus.plateNumber || selectedBus.id}</h4>
                                                <p className="text-xs text-slate-500">{selectedBus.class || 'N/A'}</p>
                                            </div>
                                            <Badge className={selectedBus.isOnline ? 'bg-green-500' : 'bg-slate-400'}>
                                                {selectedBus.isOnline ? 'Online' : 'Offline'}
                                            </Badge>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-500">Rute</p>
                                                    <p className="font-semibold text-slate-900">{selectedBus.route || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="flex items-start gap-2">
                                                <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-500">Supir</p>
                                                    <p className="font-semibold text-slate-900">{selectedBus.driver || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="flex items-start gap-2">
                                                <Gauge className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-500">Kecepatan</p>
                                                    <p className="font-semibold text-slate-900">{selectedBus.location?.speed?.toFixed(1) || 0} km/jam</p>
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="border-t pt-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        Penumpang
                                                    </span>
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {selectedBus.currentPassengers || 0}/{selectedBus.capacity || 0}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                                        style={{ 
                                                            width: `${selectedBus.capacity > 0 ? (selectedBus.currentPassengers / selectedBus.capacity) * 100 : 0}%` 
                                                        }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {selectedBus.capacity > 0 ? Math.round((selectedBus.currentPassengers / selectedBus.capacity) * 100) : 0}% terisi
                                                </p>
                                            </div>

                                            {selectedBus.kondisi && (
                                                <>
                                                    <Separator />
                                                    <div className={`p-3 rounded-lg border ${
                                                        selectedBus.kondisi === 'lancar' 
                                                            ? 'bg-green-50 border-green-200' 
                                                            : 'bg-red-50 border-red-200'
                                                    }`}>
                                                        <p className="text-xs font-medium text-slate-600 mb-1">Kondisi Lalu Lintas</p>
                                                        <p className={`font-bold text-sm uppercase ${
                                                            selectedBus.kondisi === 'lancar' ? 'text-green-700' : 'text-red-700'
                                                        }`}>
                                                            {selectedBus.kondisi}
                                                        </p>
                                                    </div>
                                                </>
                                            )}

                                            {selectedBus.eta && (
                                                <>
                                                    <Separator />
                                                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                                        <p className="text-xs font-medium text-blue-900 mb-2 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Estimasi Kedatangan
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <p className="text-blue-700">Waktu</p>
                                                                <p className="font-semibold text-blue-900">
                                                                    {selectedBus.eta.estimatedArrival 
                                                                        ? new Date(selectedBus.eta.estimatedArrival).toLocaleTimeString('id-ID', { 
                                                                            hour: '2-digit', 
                                                                            minute: '2-digit' 
                                                                        })
                                                                        : 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-blue-700">Jarak</p>
                                                                <p className="font-semibold text-blue-900">
                                                                    {selectedBus.eta.remainingDistance?.toFixed(1) || 'N/A'} km
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            <Separator />

                                            <div className="text-xs text-center text-slate-400">
                                                {selectedBus.isOnline 
                                                    ? '🟢 Data real-time' 
                                                    : `🔴 Offline - ${timeAgo(selectedBus.location?.lastUpdate)}`
                                                }
                                            </div>
                                        </div>

                                        {/* Legend - Simple */}
                                        <Separator />
                                        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                                            <p className="text-xs font-semibold text-slate-700 mb-2">Legenda Peta</p>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <div className="w-10 h-1.5 bg-orange-500 rounded-sm" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #F97316 0px, #F97316 8px, transparent 8px, transparent 16px)' }}></div>
                                                    <span className="text-slate-600">Rute Utama (Planned)</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <div className="w-10 h-1.5 bg-green-500 rounded-sm"></div>
                                                    <span className="text-slate-600">Track Perjalanan (Actual)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bus List - Di bawah map */}
                <Card>
                    <CardHeader className="border-b bg-slate-50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">Daftar Armada</CardTitle>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                    {Object.keys(currentBuses).length} Total
                                </Badge>
                                <Badge className="bg-blue-600 font-mono text-xs">
                                    {Object.values(currentBuses).filter(b => hasValidGPS(b)).length} Online
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                            {Object.entries(currentBuses).map(([busId, bus]) => {
                                const isOnline = hasValidGPS(bus);
                                const occupancy = bus.currentPassengers || 0;
                                const capacity = bus.capacity || 0;
                                const percentage = capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;
                                
                                return (
                                    <Card 
                                        key={busId} 
                                        className={`cursor-pointer transition-all hover:shadow-md ${
                                            isOnline ? 'border-slate-200' : 'border-slate-200 bg-slate-50'
                                        } ${selectedBus?.id === busId ? 'ring-2 ring-blue-600' : ''}`}
                                        onClick={() => focusOnBus(busId)}
                                    >
                                        <CardContent className="p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isOnline ? 'bg-blue-600' : 'bg-slate-400'}`}>
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-xs text-slate-900 leading-tight">{bus.plateNumber || busId}</p>
                                                        <p className="text-xs text-slate-500">{bus.class || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                            </div>

                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Rute</span>
                                                    <span className="font-medium text-slate-900 text-right truncate ml-2">{bus.route || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-500">Penumpang</span>
                                                    <span className="font-semibold text-slate-900">{occupancy}/{capacity}</span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                                    <div 
                                                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            {Object.keys(currentBuses).length === 0 && (
                                <div className="col-span-full text-center py-12 text-slate-500">
                                    <p className="text-sm">Tidak ada bus aktif</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Detail Armada - Task List Style */}
                <Card>
                    <CardHeader className="border-b bg-slate-50">
                        <CardTitle className="text-base font-semibold">Detail Status Armada</CardTitle>
                        <CardDescription className="text-xs">Informasi lengkap setiap bus dalam mode detail</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-3">
                                {Object.entries(currentBuses).map(([busId, bus], index) => {
                                    const isOnline = hasValidGPS(bus);
                                    const occupancy = bus.currentPassengers || 0;
                                    const capacity = bus.capacity || 0;
                                    const percentage = capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;
                                    
                                    return (
                                        <div key={busId}>
                                            <div 
                                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                                    isOnline ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200'
                                                } ${selectedBus?.id === busId ? 'ring-2 ring-blue-600' : ''}`}
                                                onClick={() => focusOnBus(busId)}
                                            >
                                                {/* Checkbox-like indicator */}
                                                <div className="flex-shrink-0 mt-1">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                        isOnline ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-slate-100'
                                                    }`}>
                                                        {isOnline && (
                                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-sm text-slate-900">{bus.plateNumber || busId}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="outline" className="text-xs">{bus.class || 'N/A'}</Badge>
                                                                <Badge className={isOnline ? 'bg-green-500 text-xs' : 'bg-slate-400 text-xs'}>
                                                                    {isOnline ? 'Online' : 'Offline'}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs text-slate-500">Kecepatan</div>
                                                            <div className="font-bold text-sm text-blue-600">{bus.location?.speed?.toFixed(1) || 0} km/h</div>
                                                        </div>
                                                    </div>

                                                    <Separator className="my-2" />

                                                    {/* Details Grid */}
                                                    <div className="grid grid-cols-2 gap-3 text-xs mb-2">
                                                        <div>
                                                            <span className="text-slate-500">Rute:</span>
                                                            <p className="font-medium text-slate-900 truncate">{bus.route || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">Supir:</span>
                                                            <p className="font-medium text-slate-900 truncate">{bus.driver || 'N/A'}</p>
                                                        </div>
                                                    </div>

                                                    {/* Progress */}
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-slate-500">Okupansi</span>
                                                            <span className="font-semibold text-slate-900">{occupancy}/{capacity} ({percentage}%)</span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                                            <div 
                                                                className={`h-2 rounded-full transition-all ${
                                                                    percentage > 80 ? 'bg-red-500' : 
                                                                    percentage > 50 ? 'bg-yellow-500' : 
                                                                    'bg-green-500'
                                                                }`}
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    {/* Status badges */}
                                                    {bus.kondisi && (
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                Traffic: {bus.kondisi}
                                                            </Badge>
                                                            {bus.eta && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    ETA: {bus.eta.remainingTime ? `${Math.round(bus.eta.remainingTime / 60)} min` : 'N/A'}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {index < Object.keys(currentBuses).length - 1 && <Separator className="my-3" />}
                                        </div>
                                    );
                                })}

                                {Object.keys(currentBuses).length === 0 && (
                                    <div className="text-center py-12 text-slate-500">
                                        <p className="text-sm">Tidak ada data armada</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Performance Charts */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Occupancy Chart */}
                    <Card>
                        <CardHeader className="border-b bg-slate-50">
                            <CardTitle className="text-base font-semibold">Okupansi Armada</CardTitle>
                            <CardDescription className="text-xs">Persentase penumpang per bus</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                {Object.entries(currentBuses).slice(0, 5).map(([busId, bus]) => {
                                    const occupancy = bus.currentPassengers || 0;
                                    const capacity = bus.capacity || 0;
                                    const percentage = capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;
                                    
                                    return (
                                        <div key={busId} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-medium text-slate-700">{bus.plateNumber || busId}</span>
                                                <span className="font-bold text-slate-900">{percentage}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                                <div 
                                                    className={`h-3 rounded-full transition-all ${
                                                        percentage > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                                                        percentage > 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                                                        'bg-gradient-to-r from-green-500 to-green-600'
                                                    }`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Speed Chart */}
                    <Card>
                        <CardHeader className="border-b bg-slate-50">
                            <CardTitle className="text-base font-semibold">Kecepatan Real-time</CardTitle>
                            <CardDescription className="text-xs">Monitoring kecepatan armada (km/jam)</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                {Object.entries(currentBuses).slice(0, 5).map(([busId, bus]) => {
                                    const speed = bus.location?.speed || 0;
                                    const maxSpeed = 100; // Max speed untuk scale
                                    const speedPercentage = Math.min((speed / maxSpeed) * 100, 100);
                                    
                                    return (
                                        <div key={busId} className="flex items-center gap-3">
                                            <div className="w-24 text-xs font-medium text-slate-700 truncate">
                                                {bus.plateNumber || busId}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                                    <div 
                                                        className="h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                                                        style={{ width: `${speedPercentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="w-16 text-right">
                                                <span className="text-xs font-bold text-blue-600">{speed.toFixed(1)}</span>
                                                <span className="text-xs text-slate-500 ml-1">km/h</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </SimpleLayout>
    );
}