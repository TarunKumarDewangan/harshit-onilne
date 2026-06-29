<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WhatsAppLog extends Model
{
    use HasFactory;

    protected $table = 'whatsapp_logs';

    protected $fillable = [
        'user_id',
        'phone_number',
        'message',
        'category',
        'status',
        'error_message',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    /**
     * Get the user that triggered the WhatsApp message (if any).
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
