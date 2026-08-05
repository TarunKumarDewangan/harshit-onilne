<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DrivingLicense;
use App\Models\LearnerLicense;
use App\Models\VehicleFitness;
use App\Models\VehicleInsurance;
use App\Models\VehiclePermit;
use App\Models\VehiclePucc;
use App\Models\VehicleSpeedGovernor;
use App\Models\VehicleTax;
use App\Models\VehicleVltd;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use App\Services\WhatsAppService;

class ExpiryReportController extends Controller
{
    public function index(Request $request)
    {
        // ... (this part of the method remains the same)
        $filters = $request->validate([
            'vehicle_no' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'owner_name' => 'nullable|string|max:255',
            'exact_date' => 'nullable|date',
            'doc_type' => 'nullable|string|max:255',
            'only_expired' => 'nullable|in:0,1,true,false',
        ]);
        $vehicleNo = $filters['vehicle_no'] ?? null;
        $ownerName = $filters['owner_name'] ?? null;
        $exactDate = isset($filters['exact_date']) ? Carbon::parse($filters['exact_date']) : null;
        $docType = $filters['doc_type'] ?? null;
        $onlyExpired = $request->boolean('only_expired');
        if ($exactDate) {
            $startDate = $exactDate->copy()->startOfDay();
            $endDate = $exactDate->copy()->endOfDay();
        } else {
            $startDate = isset($filters['start_date']) ? Carbon::parse($filters['start_date']) : null;
            $endDate = isset($filters['end_date']) ? Carbon::parse($filters['end_date']) : null;
        }
        if ($onlyExpired) {
            $todayEnd = Carbon::today()->endOfDay();
            $endDate = $endDate ? $endDate->min($todayEnd) : $todayEnd;
        }
        $page = $filters['page'] ?? 1;
        $perPage = $filters['per_page'] ?? 15;
        $allExpiries = new Collection();
        $authUser = $request->user()->load('branch');
        if (empty($vehicleNo)) {
            $this->fetchLicenseExpiries($allExpiries, $startDate, $endDate, $ownerName, $authUser, $docType);
        }
        $this->fetchVehicleDocumentExpiries($allExpiries, $vehicleNo, $startDate, $endDate, $ownerName, $authUser, $docType);
        $uniqueExpiries = $allExpiries->unique(function ($item) {
            return $item['type'] . '|' . $item['record_id']; // Use record_id for uniqueness
        });
        $sortedExpiries = $uniqueExpiries->sortBy(function ($item) {
            return Carbon::createFromFormat('d-m-Y', $item['expiry_date'])->format('Y-m-d');
        })->values();
        $paginatedItems = $sortedExpiries->slice(($page - 1) * $perPage, $perPage)->values();
        return new LengthAwarePaginator(
            $paginatedItems,
            $sortedExpiries->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );
    }

    private function fetchLicenseExpiries(Collection &$allExpiries, ?Carbon $startDate, ?Carbon $endDate, ?string $ownerName, User $authUser, ?string $docType)
    {
        $branchUserIds = null;
        if ($authUser->role === 'manager' && $authUser->branch_id && $authUser->branch?->name !== 'Dhamtari') {
            $branchUserIds = User::where('branch_id', $authUser->branch_id)->pluck('id');
        }

        if (!$docType || $docType === 'Learner License') {
            $learnerLicenses = LearnerLicense::with('citizen:id,name,mobile')
                ->when($branchUserIds, fn($q) => $q->whereHas('citizen.creator', fn($subQ) => $subQ->whereIn('id', $branchUserIds)))
                ->when($ownerName, fn($q) => $q->whereHas('citizen', fn($subQ) => $subQ->where('name', 'like', "%{$ownerName}%")))
                ->when($startDate, fn($q) => $q->whereDate('expiry_date', '>=', $startDate))
                ->when($endDate, fn($q) => $q->whereDate('expiry_date', '<=', $endDate))
                ->whereNotNull('expiry_date')->get();

            foreach ($learnerLicenses as $ll) {
                if ($ll->citizen && $ll->expiry_date && $ll->ll_no) {
                    // --- START OF THE FIX ---
                    // Add the record_id and owner_mobile to the data sent to the frontend
                    $allExpiries->push([
                        'record_id' => $ll->id, // Add the ID of the license record
                        'type' => 'Learner License',
                        'owner_name' => $ll->citizen->name,
                        'owner_mobile' => $ll->citizen->mobile, // Add the mobile number
                        'identifier' => $ll->ll_no,
                        'expiry_date' => $ll->expiry_date,
                        'citizen_id' => $ll->citizen_id,
                    ]);
                    // --- END OF THE FIX ---
                }
            }
        }

        if (!$docType || $docType === 'Driving License') {
            $drivingLicenses = DrivingLicense::with('citizen:id,name,mobile')
                ->when($branchUserIds, fn($q) => $q->whereHas('citizen.creator', fn($subQ) => $subQ->whereIn('id', $branchUserIds)))
                ->when($ownerName, fn($q) => $q->whereHas('citizen', fn($subQ) => $subQ->where('name', 'like', "%{$ownerName}%")))
                ->when($startDate, fn($q) => $q->whereDate('expiry_date', '>=', $startDate))
                ->when($endDate, fn($q) => $q->whereDate('expiry_date', '<=', $endDate))
                ->whereNotNull('expiry_date')->get();

            foreach ($drivingLicenses as $dl) {
                if ($dl->citizen && $dl->expiry_date && $dl->dl_no) {
                    // --- START OF THE FIX ---
                    $allExpiries->push([
                        'record_id' => $dl->id, // Add the ID
                        'type' => 'Driving License',
                        'owner_name' => $dl->citizen->name,
                        'owner_mobile' => $dl->citizen->mobile, // Add the mobile number
                        'identifier' => $dl->dl_no,
                        'expiry_date' => $dl->expiry_date,
                        'citizen_id' => $dl->citizen_id,
                    ]);
                    // --- END OF THE FIX ---
                }
            }
        }
    }

    private function fetchVehicleDocumentExpiries(Collection &$allExpiries, ?string $vehicleNo, ?Carbon $startDate, ?Carbon $endDate, ?string $ownerName, User $authUser, ?string $docType)
    {
        $branchUserIds = null;
        if ($authUser->role === 'manager' && $authUser->branch_id && $authUser->branch?->name !== 'Dhamtari') {
            $branchUserIds = User::where('branch_id', $authUser->branch_id)->pluck('id');
        }

        $documentTypes = [
            ['model' => VehicleInsurance::class, 'date_col' => 'end_date', 'type_name' => 'Insurance'],
            ['model' => VehiclePucc::class, 'date_col' => 'valid_until', 'type_name' => 'PUCC'],
            ['model' => VehicleFitness::class, 'date_col' => 'expiry_date', 'type_name' => 'Fitness'],
            ['model' => VehiclePermit::class, 'date_col' => 'expiry_date', 'type_name' => 'Permit'],
            ['model' => VehicleVltd::class, 'date_col' => 'expiry_date', 'type_name' => 'VLTd'],
            ['model' => VehicleSpeedGovernor::class, 'date_col' => 'expiry_date', 'type_name' => 'Speed Gov.'],
            ['model' => VehicleTax::class, 'date_col' => 'tax_upto', 'type_name' => 'Tax'],
        ];

        foreach ($documentTypes as $doc) {
            if ($docType && $doc['type_name'] !== $docType) {
                continue;
            }

            $query = $doc['model']::query()->with('vehicle.citizen:id,name,mobile')
                ->when($branchUserIds, fn($q) => $q->whereHas('vehicle.citizen.creator', fn($subQ) => $subQ->whereIn('id', $branchUserIds)))
                ->when($vehicleNo, fn($q) => $q->whereHas('vehicle', fn($subQ) => $subQ->where('registration_no', 'like', "%{$vehicleNo}%")))
                ->when($ownerName, fn($q) => $q->whereHas('vehicle.citizen', fn($subQ) => $subQ->where('name', 'like', "%{$ownerName}%")))
                ->when($startDate, fn($q) => $q->whereDate($doc['date_col'], '>=', $startDate))
                ->when($endDate, fn($q) => $q->whereDate($doc['date_col'], '<=', $endDate))
                ->whereNotNull($doc['date_col'])->get();

            foreach ($query as $item) {
                if ($item->vehicle && $item->vehicle->citizen && $item->{$doc['date_col']} && $item->vehicle->registration_no) {
                    // --- START OF THE FIX ---
                    $allExpiries->push([
                        'record_id' => $item->id, // Add the ID of the document record
                        'type' => $doc['type_name'],
                        'owner_name' => $item->vehicle->citizen->name,
                        'owner_mobile' => $item->vehicle->citizen->mobile, // Add the mobile number
                        'identifier' => $item->vehicle->registration_no,
                        'expiry_date' => $item->{$doc['date_col']},
                        'citizen_id' => $item->vehicle->citizen_id,
                        // Pass the full record to the frontend so the modal has all the data it needs
                        'full_record' => $item->load('vehicle'),
                    ]);
                    // --- END OF THE FIX ---
                }
            }
        }
    }
    public function sendManualNotification(Request $request, WhatsAppService $whatsAppService)
    {
        $data = $request->validate([
            'type' => 'required|string',
            'owner_mobile' => 'required|string',
            'identifier' => 'required|string',
            'expiry_date' => 'required|string', // The date is already a 'd-m-Y' string
        ]);

        $docType = $data['type'];
        $identifier = $data['identifier'];
        $expiryDate = $data['expiry_date'];
        $phoneNumber = '91' . $data['owner_mobile'];

        $docName = '';
        $messagePrefix = '';

        // Determine the correct message template based on the document type
        switch ($docType) {
            case 'Insurance':
                $docName = 'बीमा (Insurance)';
                $messagePrefix = "आपके वाहन {$identifier} के ";
                break;
            case 'PUCC':
                $docName = 'पी.यू.सी.सी. (PUCC)';
                $messagePrefix = "आपके वाहन {$identifier} के ";
                break;
            case 'Fitness':
                $docName = 'फिटनेस सर्टिफिकेट (Fitness)';
                $messagePrefix = "आपके वाहन {$identifier} के ";
                break;
            case 'Permit':
                $docName = 'परमिट (Permit)';
                $messagePrefix = "आपके वाहन {$identifier} के ";
                break;
            case 'Tax':
                $docName = 'रोड टैक्स (Road Tax)';
                $messagePrefix = "आपके वाहन {$identifier} के ";
                break;
            case 'VLTd':
                $docName = 'वी.एल.टी.डी. सर्टिफिकेट (VLTd)';
                $messagePrefix = "आपके वाहन {$identifier} के ";
                break;
            case 'Speed Gov.':
                $docName = 'स्पीड गवर्नर सर्टिफिकेट (Speed Governor)';
                $messagePrefix = "आपके वाहन {$identifier} के ";
                break;
            case 'Learner License':
                $messagePrefix = "आपके लर्नर लाइसेंस ({$identifier}) की वैधता";
                break;
            case 'Driving License':
                $messagePrefix = "आपके ड्राइविंग लाइसेंस ({$identifier}) की वैधता";
                break;
            default:
                return response()->json(['message' => 'Invalid document type provided.'], 422);
        }

        // Construct the final message
        if ($docName) {
            $message = "प्रिय ग्राहक\n" . $messagePrefix . $docName . " की वैधता\n{$expiryDate} को समाप्त हो जाएगा।";
        } else {
            $message = "प्रिय ग्राहक\n" . $messagePrefix . "\n{$expiryDate} को समाप्त हो जाएगा।";
        }

        $message .= "\n\nसमय पर नवीनीकरण कराएं और\nचालान/क्लेम रिजेक्शन से बचें\n\nHARSHIT RTO & INSURANCE SERVICES\n7000175067 | 7999664014";

        // Determine category
        $category = 'Other';
        if ($docType === 'Learner License') {
            $category = 'LL';
        } elseif ($docType === 'Driving License') {
            $category = 'DL';
        } else {
            $category = 'Vehicle INC';
        }

        // Send the message
        $success = $whatsAppService->sendTextMessage($phoneNumber, $message, $category);

        if ($success) {
            return response()->json(['message' => 'Notification sent successfully.']);
        }

        return response()->json(['message' => 'Failed to send notification via WhatsApp service.'], 500);
    }
    // --- END: ADDED NEW METHOD ---
}
