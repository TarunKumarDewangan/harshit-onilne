<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\RoleMiddleware;
use App\Models\DocumentInquiry;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse; // Import for CSV export

class DocumentInquiryController extends Controller
{
    public function __construct()
    {
        // Protect the admin routes, but leave 'store' public
        $this->middleware('auth:sanctum')->only(['index', 'updateStatus', 'exportCsv']);
        $this->middleware(RoleMiddleware::class . ':admin,manager')->only(['index', 'updateStatus', 'exportCsv']);
    }

    public function index(Request $request)
    {
        $status = $request->query('status');
        $query = DocumentInquiry::query()
            ->when($status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc');
        return $query->paginate(15);
    }

    public function store(Request $request, WhatsAppService $whatsAppService)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'document_type' => 'required|array',
            'document_type.*' => 'string|max:255',
            'vehicle_no' => 'nullable|string|max:20',
        ]);

        $inquiry = DocumentInquiry::create($data);

        $recipient = config('services.inquiry.whatsapp_recipient');
        if ($recipient) {
            $documents = implode(', ', $inquiry->document_type);
            $vehicleNumber = $inquiry->vehicle_no ?: 'N/A';
            $message = "New Document Inquiry Received:\n\n" .
                "Name: " . $inquiry->name . "\n" .
                "Phone: " . $inquiry->phone . "\n" .
                "Vehicle No: " . $vehicleNumber . "\n" .
                "Documents: " . $documents;
            $whatsAppService->sendTextMessage($recipient, $message, 'Other');
        }

        return response()->json($inquiry, 201);
    }

    public function updateStatus(Request $request, DocumentInquiry $inquiry)
    {
        $data = $request->validate([
            'status' => 'required|string|in:new,contacted,resolved',
        ]);
        $inquiry->status = $data['status'];
        $inquiry->save();
        return response()->json($inquiry);
    }

    /**
     * For Admins: Export the filtered inquiries to a CSV file.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $status = $request->query('status');

        $query = DocumentInquiry::query()
            ->when($status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc');

        $filename = 'document-inquiries-export-' . now()->format('Y-m-d') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Name', 'Mobile Number', 'Vehicle No', 'Document Types', 'Status', 'Inquiry Date']);

            $query->chunk(500, function ($inquiries) use ($handle) {
                foreach ($inquiries as $inquiry) {
                    fputcsv($handle, [
                        $inquiry->id,
                        $inquiry->name,
                        $inquiry->phone ? '+91' . $inquiry->phone : '-',
                        $inquiry->vehicle_no,
                        implode(', ', $inquiry->document_type),
                        $inquiry->status,
                        $inquiry->created_at->format('Y-m-d H:i:s'),
                    ]);
                }
            });

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
