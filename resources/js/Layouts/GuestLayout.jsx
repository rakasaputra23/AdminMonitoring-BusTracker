import { Link } from '@inertiajs/react';

export default function GuestLayout({ children, title, subtitle }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
            <div className="w-full max-w-md">

                {/* Brand */}
                <div className="flex flex-col items-center mb-6">
                    <Link href="/" className="flex items-center gap-3 mb-2">
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-base font-bold">ST</span>
                        </div>
                        <div className="text-left">
                            <h1 className="font-semibold text-base text-gray-900 leading-tight">STJ Tracker</h1>
                            <p className="text-xs text-gray-500 leading-tight">Admin Portal</p>
                        </div>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
                    {(title || subtitle) && (
                        <div className="mb-6">
                            {title && (
                                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                            )}
                            {subtitle && (
                                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                            )}
                        </div>
                    )}
                    {children}
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    &copy; {new Date().getFullYear()} STJ Tracker — PO Sudiro Tungga Jaya
                </p>
            </div>
        </div>
    );
}