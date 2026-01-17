<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Perjalanan extends Model
{
    use HasFactory;

    protected $table = 'perjalanan';

    protected $fillable = [
        'kru_id',
        'armada_id',
        'rute_id',
        'waktu_mulai',
        'waktu_selesai',
        'total_penumpang',
        'jarak_tempuh',
        'durasi_menit',
        'status',
        'kondisi_terakhir',
        'catatan',
    ];

    protected $casts = [
        'waktu_mulai' => 'datetime',
        'waktu_selesai' => 'datetime',
        'jarak_tempuh' => 'decimal:2',
    ];

    public function kru()
    {
        return $this->belongsTo(Kru::class);
    }

    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }

    public function rute()
    {
        return $this->belongsTo(Rute::class);
    }
}