<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class LlRegistry extends Model
{
    use HasFactory;


    protected $fillable = [
        'name',
        'mobile',
        'given_by', // --- ADDED ---
        'application_no',
        'll_no',
        'dob',
        'start_date',
        'end_date',
        'payment_asked',
        'payment_paid',
        'aadhar_path' // --- ADDED ---
    ];


    protected $casts = [
        'dob' => 'date',
        'start_date' => 'date',
        'end_date' => 'date',
        'payment_asked' => 'decimal:2',
        'payment_paid' => 'decimal:2',
    ];

    // Accessors to format dates as DD-MM-YYYY for the API
    public function getDobAttribute($value)
    {
        return $value ? Carbon::parse($value)->format('d-m-Y') : null;
    }

    public function getStartDateAttribute($value)
    {
        return $value ? Carbon::parse($value)->format('d-m-Y') : null;
    }

    public function getEndDateAttribute($value)
    {
        return $value ? Carbon::parse($value)->format('d-m-Y') : null;
    }
}
