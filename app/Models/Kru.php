<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

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

    public function perjalanan()
    {
        return $this->hasMany(Perjalanan::class);
    }

    public function isAktif()
    {
        return $this->status === 'aktif';
    }
}