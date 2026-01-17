import React, { useEffect, useRef, useState } from 'react';
import SimpleLayout from '@/Layouts/SimpleLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Badge } from '@/Components/ui/Badge';

export default function Dashboard({ auth, stats, buses, googleMapsApiKey, error }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});
    const infoWindowsRef = useRef({});
    const [currentStats, setCurrentStats] = useState(stats);
    const [currentBuses, setCurrentBuses] = useState(buses || {});
    const [selectedBus, setSelectedBus] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Load Google Maps Script
    useEffect(() => {
        if (!googleMapsApiKey) {
            console.error('Google Maps API Key is missing');
            return;
        }

        // Check if already loaded
        if (window.google?.maps) {
            initMap();
            return;
        }

        // Load script dynamically
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
            // Cleanup script on unmount
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [googleMapsApiKey]);

    // Initialize map
    const initMap = () => {
        try {
            if (!mapRef.current || !window.google) return;

            // Center on East Java (Madiun area)
            const center = { lat: -7.6298, lng: 111.5239 };

            const map = new google.maps.Map(mapRef.current, {
                zoom: 10,
                center: center,
                mapTypeControl: true,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                    position: google.maps.ControlPosition.TOP_RIGHT
                },
                fullscreenControl: true,
                streetViewControl: false,
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_CENTER
                },
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                    }
                ]
            });

            mapInstanceRef.current = map;
            setMapLoaded(true);

            console.log('✅ Map initialized with', Object.keys(currentBuses).length, 'buses');
            
            // Add markers for initial buses
            updateBusMarkers(currentBuses);

        } catch (err) {
            console.error('❌ Error initializing map:', err);
        }
    };

    // Start real-time updates
    useEffect(() => {
        const interval = setInterval(fetchLatestData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Fetch latest data from API
    const fetchLatestData = async () => {
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
                setCurrentBuses(busesData.data);
                if (mapLoaded) {
                    updateBusMarkers(busesData.data);
                }
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    // Update bus markers on map
    const updateBusMarkers = (busesData) => {
        if (!mapInstanceRef.current || !busesData || !window.google) return;

        Object.entries(busesData).forEach(([busId, bus]) => {
            if (!bus.location?.latitude || !bus.location?.longitude) return;

            const position = {
                lat: parseFloat(bus.location.latitude),
                lng: parseFloat(bus.location.longitude)
            };

            // Determine marker color based on speed
            const speed = bus.location.speed || 0;
            let markerColor = '#10B981'; // Green - normal
            if (speed < 5) markerColor = '#EF4444'; // Red - stopped
            else if (speed < 30) markerColor = '#F59E0B'; // Orange - slow

            // Create custom marker icon
            const markerIcon = {
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                fillColor: markerColor,
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#ffffff',
                scale: 1.5,
                anchor: new google.maps.Point(12, 22)
            };

            if (markersRef.current[busId]) {
                // Update existing marker
                markersRef.current[busId].setPosition(position);
                markersRef.current[busId].setIcon(markerIcon);
            } else {
                // Create new marker
                const marker = new google.maps.Marker({
                    position: position,
                    map: mapInstanceRef.current,
                    icon: markerIcon,
                    title: bus.plateNumber || busId,
                    animation: google.maps.Animation.DROP
                });

                // Create info window
                const infoWindow = new google.maps.InfoWindow({
                    content: createInfoWindowContent(busId, bus)
                });

                // Add click listener
                marker.addListener('click', () => {
                    closeAllInfoWindows();
                    infoWindow.open(mapInstanceRef.current, marker);
                    setSelectedBus({ id: busId, ...bus });
                });

                markersRef.current[busId] = marker;
                infoWindowsRef.current[busId] = infoWindow;
            }
        });

        console.log('✅ Updated', Object.keys(markersRef.current).length, 'markers');
    };

    // Create info window HTML content
    const createInfoWindowContent = (busId, bus) => {
        const occupancy = bus.currentPassengers || 0;
        const capacity = bus.capacity || 0;
        const percentage = capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;

        return `
            <div class="p-3 min-w-[250px]">
                <div class="flex items-center gap-2 mb-3">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01" />
                    </svg>
                    <h3 class="font-bold text-gray-900">${bus.plateNumber || busId}</h3>
                </div>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Rute:</span>
                        <span class="font-semibold text-gray-900">${bus.route || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Kelas:</span>
                        <span class="font-semibold text-gray-900">${bus.class || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Penumpang:</span>
                        <span class="font-semibold text-gray-900">${occupancy}/${capacity} (${percentage}%)</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Kecepatan:</span>
                        <span class="font-semibold text-gray-900">${bus.location?.speed || 0} km/jam</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Supir:</span>
                        <span class="font-semibold text-gray-900">${bus.driver || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
    };

    // Close all info windows
    const closeAllInfoWindows = () => {
        Object.values(infoWindowsRef.current).forEach(iw => iw.close());
    };

    // Focus on specific bus
    const focusOnBus = (busId) => {
        const bus = currentBuses[busId];
        if (!bus?.location || !mapInstanceRef.current) return;

        const position = {
            lat: parseFloat(bus.location.latitude),
            lng: parseFloat(bus.location.longitude)
        };

        mapInstanceRef.current.setCenter(position);
        mapInstanceRef.current.setZoom(14);

        // Trigger marker click
        if (markersRef.current[busId]) {
            google.maps.event.trigger(markersRef.current[busId], 'click');
        }

        setSelectedBus({ id: busId, ...bus });
    };

    return (
        <SimpleLayout
            pageTitle="Dashboard Operasional"
            userRole="superadmin"
            user={auth.user}
        >
            <div className="space-y-6">
                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-semibold">Firebase Connection Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Armada</CardTitle>
                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{currentStats?.total_buses || 0}</div>
                            <p className="text-xs text-gray-500">Bus terdaftar</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Bus Beroperasi</CardTitle>
                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{currentStats?.active_buses || 0}</div>
                            <p className="text-xs text-gray-500">Sedang di rute</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Penumpang</CardTitle>
                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{currentStats?.total_passengers || 0}</div>
                            <p className="text-xs text-gray-500">dari {currentStats?.total_capacity || 0} kapasitas</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Kecepatan Rata-rata</CardTitle>
                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{currentStats?.average_speed || 0}</div>
                            <p className="text-xs text-gray-500">km/jam</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Google Maps Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Peta Real-time Monitoring</CardTitle>
                                <CardDescription>Live tracking seluruh armada aktif</CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                                    </span>
                                    <span className="text-xs font-semibold text-green-700">Live Update</span>
                                </div>
                                <button 
                                    onClick={fetchLatestData}
                                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div ref={mapRef} className="w-full h-[600px] bg-gray-100"></div>
                        {!mapLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
                                <div className="text-center">
                                    <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="text-sm text-gray-600">Loading map...</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bus List */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(currentBuses).map(([busId, bus]) => (
                        <Card 
                            key={busId} 
                            className="cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all" 
                            onClick={() => focusOnBus(busId)}
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01" />
                                        </svg>
                                        <CardTitle className="text-base">{bus.plateNumber || busId}</CardTitle>
                                    </div>
                                    <Badge variant={bus.status === 'active' ? 'success' : 'default'}>
                                        {bus.status === 'active' ? 'Aktif' : 'Non-aktif'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Rute:</span>
                                        <span className="font-medium truncate ml-2">{bus.route || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Kelas:</span>
                                        <span className="font-medium">{bus.class || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Penumpang:</span>
                                        <span className="font-medium">{bus.currentPassengers || 0}/{bus.capacity || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Kecepatan:</span>
                                        <span className="font-medium">{bus.location?.speed || 0} km/jam</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {Object.keys(currentBuses).length === 0 && (
                        <div className="col-span-full bg-white rounded-lg border border-gray-200 p-12 text-center">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01" />
                            </svg>
                            <p className="text-gray-500 font-medium">Tidak ada bus aktif saat ini</p>
                            <p className="text-gray-400 text-sm mt-1">Bus akan muncul ketika driver mengaktifkan tracking</p>
                        </div>
                    )}
                </div>
            </div>
        </SimpleLayout>
    );
}