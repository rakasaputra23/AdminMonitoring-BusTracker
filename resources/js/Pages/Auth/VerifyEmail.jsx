import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout title="Verifikasi Email" subtitle="Satu langkah lagi sebelum Anda bisa masuk">
            <Head title="Email Verification" />

            <p className="text-sm text-gray-600 mb-4">
                Terima kasih telah mendaftar! Sebelum memulai, mohon verifikasi
                alamat email Anda dengan mengklik tautan yang baru saja kami
                kirimkan. Jika Anda belum menerima email tersebut, kami akan
                dengan senang hati mengirimkan yang baru.
            </p>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    Tautan verifikasi baru telah dikirim ke alamat email yang Anda
                    daftarkan.
                </div>
            )}

            <form onSubmit={submit} className="flex items-center justify-between">
                <Button
                    type="submit"
                    disabled={processing}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 font-medium transition-colors"
                >
                    Kirim Ulang Email Verifikasi
                </Button>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                    Keluar
                </Link>
            </form>
        </GuestLayout>
    );
}