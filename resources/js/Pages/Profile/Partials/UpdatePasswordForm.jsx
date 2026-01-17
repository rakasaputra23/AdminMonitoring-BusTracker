// resources/js/Pages/Profile/Partials/UpdatePasswordForm.jsx
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Update Password</h2>
                <p className="text-sm text-gray-600 mt-1">
                    Pastikan akun Anda menggunakan password yang kuat dan aman
                </p>
            </div>

            <div className="p-6">
                <div className="space-y-6">
                    {/* Current Password */}
                    <div className="space-y-2">
                        <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                            Password Saat Ini
                        </label>
                        <input
                            id="current_password"
                            ref={currentPasswordInput}
                            type="password"
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            autoComplete="current-password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.current_password && (
                            <p className="text-sm text-red-600">{errors.current_password}</p>
                        )}
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password Baru
                        </label>
                        <input
                            id="password"
                            ref={passwordInput}
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="new-password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.password && (
                            <p className="text-sm text-red-600">{errors.password}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                            Konfirmasi Password Baru
                        </label>
                        <input
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.password_confirmation && (
                            <p className="text-sm text-red-600">{errors.password_confirmation}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={updatePassword}
                            disabled={processing}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Menyimpan...' : 'Update Password'}
                        </button>

                        {recentlySuccessful && (
                            <div className="flex items-center gap-2 text-green-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-sm font-medium">Password berhasil diupdate!</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}