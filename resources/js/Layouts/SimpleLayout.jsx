import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function SimpleLayout({ children, pageTitle = "Dashboard", user = null }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dataMasterOpen, setDataMasterOpen] = useState(true);
  const [laporanOpen, setLaporanOpen] = useState(true);
  const { url, props } = usePage();
  
  // ✅ Ambil userRole dari props.auth.user.role
  const userRole = props.auth?.user?.role || user?.role || 'admin';

  const handleLogout = () => {
    router.post('/logout');
  };

  const isActive = (path) => {
    return url === path || url.startsWith(path);
  };

  // Fungsi untuk mendapatkan breadcrumb
  const getBreadcrumb = () => {
    if (url === '/dashboard') {
        return [{ label: 'Dashboard', href: '/dashboard' }];
    }
    
    const breadcrumbs = [{ label: 'Dashboard', href: '/dashboard' }];
    
    if (url.startsWith('/data-master/')) {
        breadcrumbs.push({ label: 'Data Master', href: '#' });
        if (url.includes('/armada')) breadcrumbs.push({ label: 'Data Armada', href: '/data-master/armada' });
        if (url.includes('/rute')) breadcrumbs.push({ label: 'Data Rute', href: '/data-master/rute' });
        if (url.includes('/tarif')) breadcrumbs.push({ label: 'Data Tarif', href: '/data-master/tarif' });
        if (url.includes('/kru')) breadcrumbs.push({ label: 'Data Kru', href: '/data-master/kru' });
    } else if (url.startsWith('/laporan/')) {
        breadcrumbs.push({ label: 'Laporan', href: '#' });
        if (url.includes('/riwayat')) breadcrumbs.push({ label: 'Riwayat Perjalanan', href: '/laporan/riwayat' });
        if (url.includes('/pendapatan')) breadcrumbs.push({ label: 'Laporan Pendapatan', href: '/laporan/pendapatan' });
    } else if (url.startsWith('/user-management')) {
        breadcrumbs.push({ label: 'User Management', href: '/user-management' });
    } else if (url.startsWith('/profile')) {
        breadcrumbs.push({ label: 'Profile Settings', href: '/profile' });
    }
    
    return breadcrumbs;
    };

  const breadcrumbs = getBreadcrumb();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col flex-shrink-0 overflow-hidden`}>
        {/* Sidebar Header - STICKY */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-gray-200 flex-shrink-0">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">ST</span>
                </div>
                <div className="min-w-0">
                  <h1 className="font-semibold text-sm text-gray-900 truncate">STJ Tracker</h1>
                  <p className="text-xs text-gray-500 truncate">Admin Portal</p>
                </div>
              </div>
            </>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white text-sm font-bold">ST</span>
            </div>
          )}
        </div>

        {/* Sidebar Content - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          
          {/* Platform / Menu Utama */}
          <div className="mb-4">
            {!sidebarCollapsed && (
              <p className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform</p>
            )}
            
            <Link 
              href="/dashboard"
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/dashboard') && url === '/dashboard'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={sidebarCollapsed ? "Dashboard" : ""}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {!sidebarCollapsed && <span>Dashboard</span>}
            </Link>
          </div>

          {/* Data Master - COLLAPSIBLE */}
          {!sidebarCollapsed ? (
            <Collapsible open={dataMasterOpen} onOpenChange={setDataMasterOpen} className="mb-4">
              <div>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 rounded-md transition-colors">
                  <span>Data Master</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${dataMasterOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-1 space-y-1">
                  <Link 
                    href="/data-master/armada"
                    className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors ${
                      isActive('/data-master/armada') 
                        ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Data Armada</span>
                  </Link>

                  <Link 
                    href="/data-master/rute"
                    className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors ${
                      isActive('/data-master/rute') 
                        ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span>Data Rute</span>
                  </Link>

                  <Link 
                    href="/data-master/tarif"
                    className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors ${
                      isActive('/data-master/tarif') 
                        ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Data Tarif</span>
                  </Link>

                  <Link 
                    href="/data-master/kru"
                    className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors ${
                      isActive('/data-master/kru') 
                        ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Data Kru</span>
                  </Link>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ) : (
            <div className="mb-4 space-y-1">
              <Link 
                href="/data-master/armada"
                className={`flex items-center justify-center px-2 py-2 rounded-md text-sm transition-colors ${
                  isActive('/data-master/armada') 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title="Data Armada"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </Link>

              <Link 
                href="/data-master/rute"
                className={`flex items-center justify-center px-2 py-2 rounded-md text-sm transition-colors ${
                  isActive('/data-master/rute') 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title="Data Rute"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </Link>

              <Link 
                href="/data-master/tarif"
                className={`flex items-center justify-center px-2 py-2 rounded-md text-sm transition-colors ${
                  isActive('/data-master/tarif') 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title="Data Tarif"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>

              <Link 
                href="/data-master/kru"
                className={`flex items-center justify-center px-2 py-2 rounded-md text-sm transition-colors ${
                  isActive('/data-master/kru') 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title="Data Kru"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </Link>
            </div>
          )}

          {/* Laporan - COLLAPSIBLE */}
          {!sidebarCollapsed ? (
            <Collapsible open={laporanOpen} onOpenChange={setLaporanOpen} className="mb-4">
              <div>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 rounded-md transition-colors">
                  <span>Laporan</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${laporanOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-1 space-y-1">
                  <Link 
                    href="/laporan/riwayat"
                    className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors ${
                      isActive('/laporan/riwayat') 
                        ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Riwayat Perjalanan</span>
                  </Link>

                  <Link 
                    href="/laporan/pendapatan"
                    className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors ${
                      isActive('/laporan/pendapatan') 
                        ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>Laporan Pendapatan</span>
                  </Link>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ) : (
            <div className="mb-4 space-y-1">
              <Link 
                href="/laporan/riwayat"
                className={`flex items-center justify-center px-2 py-2 rounded-md text-sm transition-colors ${
                  isActive('/laporan/riwayat') 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title="Riwayat Perjalanan"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>

              <Link 
                href="/laporan/pendapatan"
                className={`flex items-center justify-center px-2 py-2 rounded-md text-sm transition-colors ${
                  isActive('/laporan/pendapatan') 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title="Laporan Pendapatan"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </Link>
            </div>
          )}

          {/* System / User Management (Superadmin Only) */}
          {userRole === 'superadmin' && (
            <div className="mb-4">
              {!sidebarCollapsed && (
                <p className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">System</p>
              )}
              
              <Link 
                href="/user-management"
                className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/user-management') 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={sidebarCollapsed ? "User Management" : ""}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {!sidebarCollapsed && <span>User Management</span>}
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Footer - STICKY */}
        <div className="border-t border-gray-200 p-3 flex-shrink-0">
          <div className="relative group">
            <button className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} w-full p-2 rounded-md hover:bg-gray-50 transition-colors`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@stj.ac.id'}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </>
              )}
            </button>

            {/* Dropdown Menu */}
            <div className={`absolute bottom-full ${sidebarCollapsed ? 'left-full ml-2' : 'left-0 right-0'} mb-2 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${sidebarCollapsed ? 'w-48' : ''} z-50`}>
              <Link 
                href="/profile" 
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-lg w-full text-left whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          
          <div className="flex items-center gap-4">
            
            {/* 1. Tombol Collapse */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18" />
              </svg>
            </button>

            {/* 2. Garis Pemisah Vertikal */}
            <div className="h-5 w-px bg-gray-300"></div>

            {/* 3. Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-gray-900">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="text-gray-500 hover:text-gray-700">
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-md border border-green-200">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-semibold text-green-700">Online</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto bg-white p-6">
          {children}
        </main>
      </div>
    </div>
  );
}