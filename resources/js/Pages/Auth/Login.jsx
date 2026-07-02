import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout title="Masuk ke Akun" subtitle="Kelola armada dan rute STJ Tracker Anda">
            <Head title="Log in" />

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
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1.5"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', checked)}
                        />
                        <span className="text-sm text-gray-600">Ingat saya</span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            Lupa password?
                        </Link>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium transition-colors"
                >
                    Masuk
                </Button>
            </form>
        </GuestLayout>
    );
}