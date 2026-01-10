<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LlRegistry;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage; // Needed for file deletion

class LlRegistryController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request)
    {
        $search = $request->query('search');
        $showUnpaid = $request->query('show_unpaid');
        $expiryFrom = $request->query('expiry_from');
        $expiryTo = $request->query('expiry_to');

        // --- NEW FILTERS ---
        $cross31Days = $request->query('cross_31_days');
        $expiresInMonth = $request->query('expires_in_month');

        $query = LlRegistry::query()->orderBy('id', 'desc');

        // 1. Text Search
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                    ->orWhere('mobile', 'like', "%$search%")
                    ->orWhere('application_no', 'like', "%$search%")
                    ->orWhere('ll_no', 'like', "%$search%")
                    ->orWhere('given_by', 'like', "%$search%");
            });
        }

        // 2. Unpaid Filter
        if ($showUnpaid === 'true') {
            $query->whereColumn('payment_asked', '>', 'payment_paid');
        }

        // 3. Custom Date Range Filter
        if ($expiryFrom && $expiryTo) {
            $query->whereBetween('end_date', [$expiryFrom, $expiryTo]);
        }

        // --- START OF NEW LOGIC ---

        // 4. Crossed 31 Days (Eligible for DL)
        // Logic: Start Date was more than 31 days ago
        if ($cross31Days === 'true') {
            $date31DaysAgo = \Carbon\Carbon::now()->subDays(31)->format('Y-m-d');
            $query->whereDate('start_date', '<=', $date31DaysAgo);
        }

        // 5. Expires in 1 Month (Urgent Renewal)
        // Logic: End Date is between Today and Next 30 Days
        if ($expiresInMonth === 'true') {
            $today = \Carbon\Carbon::now()->format('Y-m-d');
            $nextMonth = \Carbon\Carbon::now()->addDays(30)->format('Y-m-d');
            $query->whereBetween('end_date', [$today, $nextMonth]);
        }

        // --- END OF NEW LOGIC ---

        // Change pagination to 30 as requested
        return $query->paginate(30);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|max:20',
            'given_by' => 'nullable|string|max:255', // Added Given By
            'application_no' => 'nullable|string|max:100',
            'dob' => 'nullable|date',
            'll_no' => 'nullable|string|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'payment_asked' => 'nullable|numeric',
            'payment_paid' => 'nullable|numeric',
            // File validation: Strict 300KB limit (max:300)
            'aadhar_file' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:300',
        ]);

        $data['payment_asked'] = $data['payment_asked'] ?? 0;
        $data['payment_paid'] = $data['payment_paid'] ?? 0;

        // Handle File Upload
        if ($request->hasFile('aadhar_file')) {
            $path = $request->file('aadhar_file')->store('aadhar_docs', 'public');
            $data['aadhar_path'] = $path;
        }

        $record = LlRegistry::create($data);
        return response()->json($record, 201);
    }

    public function update(Request $request, $id)
    {
        $record = LlRegistry::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|max:20',
            'given_by' => 'nullable|string|max:255', // Added Given By
            'application_no' => 'nullable|string|max:100',
            'dob' => 'nullable|date',
            'll_no' => 'nullable|string|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'payment_asked' => 'nullable|numeric',
            'payment_paid' => 'nullable|numeric',
            // File validation: Strict 300KB limit (max:300)
            'aadhar_file' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:300',
        ]);

        $data['payment_asked'] = $data['payment_asked'] ?? 0;
        $data['payment_paid'] = $data['payment_paid'] ?? 0;

        // Handle File Upload
        if ($request->hasFile('aadhar_file')) {
            // Delete old file if it exists
            if ($record->aadhar_path) {
                Storage::disk('public')->delete($record->aadhar_path);
            }
            // Store new file
            $path = $request->file('aadhar_file')->store('aadhar_docs', 'public');
            $data['aadhar_path'] = $path;
        }

        $record->update($data);
        return response()->json($record);
    }

    public function destroy($id)
    {
        $record = LlRegistry::findOrFail($id);

        // Delete associated file if it exists
        if ($record->aadhar_path) {
            Storage::disk('public')->delete($record->aadhar_path);
        }

        $record->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    public function sendMessage($id, WhatsAppService $whatsAppService)
    {
        $record = LlRegistry::findOrFail($id);

        $message = "प्रिय ग्राहक " . $record->name . ",\n\n";
        $message .= "आपके लर्निंग लाइसेंस की 31 दिन की अवधि पूर्ण हो चुकी है।\n";
        $message .= "ड्राइविंग लाइसेंस बनवाने हेतु कृपया संपर्क करें। \n\n\n";
        $message .= "HARSHIT RTO & INSURANCE SERVICES \n 7000175067 | 7999664014\n\n\n\n";
        $message .= "ड्राइविंग लाइसेंस बनाने का समय:बुधवार एवं गुरुवार \nसमय: सुबह 11 बजे से दोपहर 2 बजे तक";

        $success = $whatsAppService->sendTextMessage('91' . $record->mobile, $message);

        if ($success) {
            return response()->json(['message' => 'Message sent successfully']);
        }
        return response()->json(['message' => 'Failed to send message'], 500);
    }
}
