<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Hash;

class Kru extends Authenticatable
{
    use HasFactory, HasApiTokens;

    protected $table = 'kru';

    protected $fillable = [
        'driver',
        'username',
        'password',
        'status',
    ];

    protected $hidden = [
        'password',
    ];

    /**
     * Automatically hash password when setting
     */
    protected function setPasswordAttribute($value): void
    {
        if (!empty($value)) {
            $this->attributes['password'] = Hash::make($value);
        }
    }

    public function perjalanan()
    {
        return $this->hasMany(Perjalanan::class);
    }

    public function isAktif()
    {
        return $this->status === 'aktif';
    }
}