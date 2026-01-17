// resources/js/Pages/Profile/Partials/DeleteUserForm.jsx
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Button } from '@/Components/ui/Button';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-red-600">Delete Account</CardTitle>
                <CardDescription>
                    Once your account is deleted, all of its resources and data will be permanently deleted. 
                    Before deleting your account, please download any data or information that you wish to retain.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="destructive" onClick={confirmUserDeletion}>
                    Delete Account
                </Button>

                {/* Modal/Dialog */}
                {confirmingUserDeletion && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
                            <form onSubmit={deleteUser} className="p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">
                                    Are you sure you want to delete your account?
                                </h2>

                                <p className="text-sm text-gray-600 mb-6">
                                    Once your account is deleted, all of its resources and data will be permanently deleted. 
                                    Please enter your password to confirm you would like to permanently delete your account.
                                </p>

                                <div className="space-y-2 mb-6">
                                    <Label htmlFor="password" className="sr-only">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        ref={passwordInput}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Password"
                                        autoFocus
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={closeModal}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="destructive" disabled={processing}>
                                        Delete Account
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}