<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Credit extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'mobile',
        'work_done',
        'total_amount',
        'given_amount',
        'balance_amount',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'given_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
    ];

    /**
     * Get the user who owns this credit record.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
