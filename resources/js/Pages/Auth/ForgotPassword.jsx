import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout title="Lupa Password" subtitle="Masukkan email Anda dan kami akan mengirimkan tautan reset password">
            <Head title="Forgot Password" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1.5"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <Button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium transition-colors"
                >
                    Kirim Tautan Reset Password
                </Button>
            </form>
        </GuestLayout>
    );
}