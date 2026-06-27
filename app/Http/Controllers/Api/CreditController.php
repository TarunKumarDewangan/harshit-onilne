<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Credit;
use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;

class CreditController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Display a listing of credits with search capabilities and role restrictions.
     */
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = (int) ($request->query('per_page', 15));
        $authUser = $request->user();

        $sortBy = $request->query('sort_by', 'id');
        $sortOrder = $request->query('sort_order', 'desc');
        $onlyBalance = $request->query('only_balance');

        $allowedSort = ['id', 'name', 'total_amount', 'given_amount', 'balance_amount', 'created_at'];
        if (!in_array($sortBy, $allowedSort)) {
            $sortBy = 'id';
        }
        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) {
            $sortOrder = 'desc';
        }

        $query = Credit::query()
            ->with('user:id,name')
            ->when($authUser->role === 'user', function (Builder $b) use ($authUser) {
                $b->where('user_id', $authUser->id);
            });

        // Filter for managers (by branch users, unless the branch name is 'Dhamtari')
        if ($authUser->role === 'manager') {
            $authUser->loadMissing('branch');
            if ($authUser->branch_id && $authUser->branch?->name !== 'Dhamtari') {
                $branchUserIds = User::where('branch_id', $authUser->branch_id)->pluck('id');
                $query->whereIn('user_id', $branchUserIds);
            }
        }

        // Search filter
        if ($search !== '') {
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%")
                  ->orWhere('work_done', 'like', "%{$search}%");
            });
        }

        // Only Pending Balance filter
        if ($onlyBalance === 'true') {
            $query->where('balance_amount', '>', 0);
        }

        // Calculate totals on the filtered query BEFORE grouping
        $totals = [
            'total_amount' => (float) $query->sum('total_amount'),
            'given_amount' => (float) $query->sum('given_amount'),
            'balance_amount' => (float) $query->sum('balance_amount'),
        ];

        // Now apply grouping to avoid repeating same person multiple times
        $query->select([
            \DB::raw("MIN(id) as id"),
            \DB::raw("MAX(name) as name"),
            'mobile',
            \DB::raw("GROUP_CONCAT(DISTINCT NULLIF(work_done, '') ORDER BY id DESC SEPARATOR ', ') as work_done"),
            \DB::raw("SUM(total_amount) as total_amount"),
            \DB::raw("SUM(given_amount) as given_amount"),
            \DB::raw("SUM(balance_amount) as balance_amount"),
            \DB::raw("MAX(created_at) as created_at"),
            \DB::raw("MIN(user_id) as user_id"),
        ])
        ->groupBy([
            'mobile',
            \DB::raw("COALESCE(NULLIF(mobile, ''), CONCAT('empty_', id))")
        ]);

        $paginated = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'from' => $paginated->firstItem(),
                'to' => $paginated->lastItem(),
            ],
            'totals' => $totals,
        ]);
    }

    /**
     * Store a newly created credit record in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'nullable|string|max:20',
            'work_done' => 'nullable|string',
            'total_amount' => 'nullable|numeric|min:0',
            'given_amount' => 'nullable|numeric|min:0',
        ]);

        $data['user_id'] = $request->user()->id;
        $data['total_amount'] = $data['total_amount'] ?? 0;
        $data['given_amount'] = $data['given_amount'] ?? 0;
        $data['balance_amount'] = $data['total_amount'] - $data['given_amount'];

        $credit = Credit::create($data);

        return response()->json($credit->load('user:id,name'), 201);
    }

    /**
     * Display the specified credit record.
     */
    public function show(Credit $credit, Request $request)
    {
        $this->authorizeAccess($credit, $request->user());
        return $credit->load('user:id,name');
    }

    /**
     * Update the specified credit record in storage.
     */
    public function update(Request $request, Credit $credit)
    {
        $this->authorizeAccess($credit, $request->user());

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'nullable|string|max:20',
            'work_done' => 'nullable|string',
            'total_amount' => 'nullable|numeric|min:0',
            'given_amount' => 'nullable|numeric|min:0',
        ]);

        $data['total_amount'] = $data['total_amount'] ?? 0;
        $data['given_amount'] = $data['given_amount'] ?? 0;
        $data['balance_amount'] = $data['total_amount'] - $data['given_amount'];

        $credit->update($data);

        return response()->json($credit->load('user:id,name'));
    }

    /**
     * Remove the specified credit record from storage.
     */
    public function destroy(Credit $credit, Request $request)
    {
        $this->authorizeAccess($credit, $request->user());
        $credit->delete();
        return response()->json(['message' => 'Credit record deleted successfully.']);
    }

    /**
     * Send a WhatsApp reminder for an outstanding credit.
     */
    public function sendMessage(Credit $credit, Request $request, WhatsAppService $whatsAppService)
    {
        $this->authorizeAccess($credit, $request->user());

        if (!$credit->mobile) {
            return response()->json(['message' => 'No mobile number associated with this record.'], 400);
        }

        $message = "प्रिय ग्राहक {$credit->name},\nआपके कार्य ({$credit->work_done}) की बकाया राशि ₹{$credit->balance_amount} लंबित है।\n\nकृपया जल्द से जल्द भुगतान करें।\n\nHARSHIT RTO & INSURANCE SERVICES\n7000175067 | 7999664014";

        $success = $whatsAppService->sendTextMessage('91' . $credit->mobile, $message);

        if ($success) {
            return response()->json(['message' => 'WhatsApp reminder sent successfully.']);
        }

        return response()->json(['message' => 'Failed to send WhatsApp message. Please check logs.'], 500);
    }

    /**
     * Retrieve transaction history for a customer.
     */
    public function history(Credit $credit, Request $request)
    {
        $this->authorizeAccess($credit, $request->user());

        $query = Credit::query()
            ->with('user:id,name')
            ->where(function($q) use ($credit) {
                if ($credit->mobile) {
                    $q->where('mobile', $credit->mobile);
                } else {
                    $q->where('name', $credit->name);
                }
            })
            ->orderByDesc('id');

        return response()->json($query->get());
    }

    /**
     * Authorize whether a user has access to view/edit/delete a credit record.
     */
    protected function authorizeAccess(Credit $credit, User $user)
    {
        if ($user->role === 'admin') {
            return;
        }

        if ($user->role === 'user' && $credit->user_id !== $user->id) {
            abort(403, 'This action is unauthorized.');
        }

        if ($user->role === 'manager') {
            $user->loadMissing('branch');
            if ($user->branch_id && $user->branch?->name !== 'Dhamtari') {
                $creator = User::find($credit->user_id);
                if (!$creator || $creator->branch_id !== $user->branch_id) {
                    abort(403, 'This action is unauthorized.');
                }
            }
        }
    }
}
