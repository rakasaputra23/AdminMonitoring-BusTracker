import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout title="Konfirmasi Password" subtitle="Ini adalah area aman. Mohon konfirmasi password Anda untuk melanjutkan">
            <Head title="Confirm Password" />

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1.5"
                        autoFocus
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <Button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium transition-colors"
                >
                    Konfirmasi
                </Button>
            </form>
        </GuestLayout>
    );
}