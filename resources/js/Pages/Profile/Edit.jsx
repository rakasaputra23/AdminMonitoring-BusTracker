// resources/js/Pages/Profile/Edit.jsx
import SimpleLayout from '@/Layouts/SimpleLayout';
import { Head } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import DeleteUserForm from './Partials/DeleteUserForm';

export default function Edit({ auth, mustVerifyEmail, status }) {
    return (
        <SimpleLayout user={auth.user} pageTitle="Profile Settings">
            <Head title="Profile" />

            {/* Header Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Kelola informasi profil dan keamanan akun Anda
                </p>
            </div>

            {/* Content */}
            <div className="space-y-6">
                <UpdateProfileInformationForm
                    mustVerifyEmail={mustVerifyEmail}
                    status={status}
                />

                <UpdatePasswordForm />

                <DeleteUserForm />
            </div>
        </SimpleLayout>
    );
}