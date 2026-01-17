// resources/js/Pages/Dashboard.jsx
import React from 'react';
import SimpleLayout from '@/Layouts/SimpleLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Badge } from '@/Components/ui/Badge';

export default function Dashboard({ auth }) {
    return (
        <SimpleLayout
            pageTitle="Dashboard Operasional"
            userRole="superadmin"
            user={auth.user}
        >
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Total Armada */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Armada
                            </CardTitle>
                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">12</div>
                            <p className="text-xs text-gray-500">Bus terdaftar</p>
                        </CardContent>
                    </Card>

                    {/* Bus Beroperasi */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Bus Beroperasi
                            </CardTitle>
                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">8</div>
                            <p className="text-xs text-gray-500">Sedang di rute</p>
                        </CardContent>
                    </Card>

                    {/* Total Penumpang */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Penumpang
                            </CardTitle>
                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">156</div>
                            <p className="text-xs text-gray-500">dari 240 kapasitas</p>
                        </CardContent>
                    </Card>

                    {/* Kecepatan Rata-rata */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Kecepatan Rata-rata
                            </CardTitle>
                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">42</div>
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
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="w-full h-[600px] bg-gray-100 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p className="text-lg font-semibold mb-2">Google Maps akan muncul di sini</p>
                                <p className="text-sm">Integrasi Google Maps API + Firebase</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bus List / Activity */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Bus Aktif Terbaru</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                L 1234 AB
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Rute Madiun - Surabaya
                                            </p>
                                        </div>
                                        <Badge variant="success">Aktif</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Okupansi Tertinggi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { plate: 'L 5678 CD', occupancy: 95 },
                                    { plate: 'L 9101 EF', occupancy: 88 },
                                    { plate: 'L 1213 GH', occupancy: 82 }
                                ].map((bus, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{bus.plate}</span>
                                            <span className="text-gray-500">{bus.occupancy}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                style={{ width: `${bus.occupancy}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Aktivitas Terkini</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { action: 'Bus berangkat', time: '2 menit lalu', bus: 'L 1234 AB' },
                                    { action: 'Penumpang naik', time: '5 menit lalu', bus: 'L 5678 CD' },
                                    { action: 'Bus tiba', time: '12 menit lalu', bus: 'L 9101 EF' }
                                ].map((activity, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                {activity.action}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {activity.bus} • {activity.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </SimpleLayout>
    );
}