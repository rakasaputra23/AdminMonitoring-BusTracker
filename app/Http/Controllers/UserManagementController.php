<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    /**
     * Display a listing of users
     */
    public function index(Request $request): Response
    {
        $query = User::query();

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->has('role') && $request->role) {
            $query->where('role', $request->role);
        }

        // Get users with pagination
        $users = $query->orderBy('created_at', 'desc')->paginate(10);

        return Inertia::render('UserManagement', [
            'users' => $users,
            'filters' => [
                'search' => $request->search,
                'role' => $request->role,
            ],
        ]);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => ['required', Rule::in(['admin', 'superadmin'])],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'email_verified_at' => now(), // Auto verify
        ]);

        return redirect()->route('user-management')->with('success', 'User berhasil ditambahkan!');
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, User $user)
    {
        // Prevent superadmin from changing their own role
        if ($user->id === auth()->id() && $request->role !== 'superadmin') {
            return back()->withErrors(['role' => 'Anda tidak dapat mengubah role Anda sendiri!']);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', Rule::in(['admin', 'superadmin'])],
            'password' => 'nullable|string|min:6',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
        ]);

        // Update password only if provided
        if ($request->filled('password')) {
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);
        }

        return redirect()->route('user-management')->with('success', 'User berhasil diupdate!');
    }

    /**
     * Remove the specified user
     */
    public function destroy(User $user)
    {
        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return back()->withErrors(['delete' => 'Anda tidak dapat menghapus akun Anda sendiri!']);
        }

        // Prevent deleting the last superadmin
        if ($user->isSuperAdmin()) {
            $superadminCount = User::where('role', 'superadmin')->count();
            if ($superadminCount <= 1) {
                return back()->withErrors(['delete' => 'Tidak dapat menghapus superadmin terakhir!']);
            }
        }

        $user->delete();

        return redirect()->route('user-management')->with('success', 'User berhasil dihapus!');
    }
}