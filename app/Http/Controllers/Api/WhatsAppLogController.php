<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WhatsAppLog;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class WhatsAppLogController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        // Ensure only admin or manager roles can view the logs
        $this->middleware(\App\Http\Middleware\RoleMiddleware::class . ':admin,manager');
    }

    /**
     * Get list of logged WhatsApp messages.
     */
    public function index(Request $request)
    {
        $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
            'category' => 'nullable|string|in:all,Credit,Vehicle INC,LL,DL,Other',
            'search' => 'nullable|string|max:100',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $dateStr = $request->query('date', Carbon::today()->toDateString());
        $category = $request->query('category', 'all');
        $search = $request->query('search');
        $perPage = (int) $request->query('per_page', 30);

        $query = WhatsAppLog::with('user:id,name')
            ->whereDate('created_at', $dateStr)
            ->orderBy('id', 'desc');

        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('phone_number', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($perPage));
    }
}
