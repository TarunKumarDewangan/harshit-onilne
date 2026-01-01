<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LlRegistry;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;

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

        $query = LlRegistry::query()->orderBy('id', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                    ->orWhere('mobile', 'like', "%$search%")
                    ->orWhere('application_no', 'like', "%$search%")
                    ->orWhere('ll_no', 'like', "%$search%"); // Added search by LL No
            });
        }

        if ($showUnpaid === 'true') {
            $query->whereColumn('payment_asked', '>', 'payment_paid');
        }

        return $query->paginate(15);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|max:20',
            'application_no' => 'nullable|string|max:100',
            'dob' => 'nullable|date',
            'll_no' => 'nullable|string|max:100', // Added
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'payment_asked' => 'nullable|numeric',
            'payment_paid' => 'nullable|numeric',
        ]);

        $data['payment_asked'] = $data['payment_asked'] ?? 0;
        $data['payment_paid'] = $data['payment_paid'] ?? 0;

        $record = LlRegistry::create($data);
        return response()->json($record, 201);
    }

    public function update(Request $request, $id)
    {
        $record = LlRegistry::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|max:20',
            'application_no' => 'nullable|string|max:100',
            'dob' => 'nullable|date',
            'll_no' => 'nullable|string|max:100', // Added
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'payment_asked' => 'nullable|numeric',
            'payment_paid' => 'nullable|numeric',
        ]);

        $data['payment_asked'] = $data['payment_asked'] ?? 0;
        $data['payment_paid'] = $data['payment_paid'] ?? 0;

        $record->update($data);
        return response()->json($record);
    }

    public function destroy($id)
    {
        $record = LlRegistry::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    public function sendMessage($id, WhatsAppService $whatsAppService)
    {
        $record = LlRegistry::findOrFail($id);

        // --- YOUR SPECIFIC MESSAGE ---
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
