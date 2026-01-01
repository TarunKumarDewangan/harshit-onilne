<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Requests\StoreCitizenRequest;
use App\Http\Requests\UpdateCitizenRequest;
use App\Models\Citizen;
use App\Models\User;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


class CitizenController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware(RoleMiddleware::class . ':admin,manager')->only(['update', 'destroy']);
    }

    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $mob = trim((string) $request->query('mobile', ''));
        $per = (int) ($request->query('per_page', 10));
        $authUser = $request->user();

        // --- START OF THE FIX ---
        // Changed with('user:id,name') to with('creator:id,name') to load the creator's details.
        $query = Citizen::query()
            ->with(['creator:id,name', 'isPrimaryProfileForUser:id,citizen_id'])
            ->when($authUser->role === 'user', function (Builder $b) use ($authUser) {
                // --- END OF THE FIX ---
                $b->where('user_id', $authUser->id);
            })
            ->when($q !== '', function (Builder $b) use ($q) {
                $b->where(function (Builder $x) use ($q) {
                    $x->where('name', 'like', "%{$q}%")
                        ->orWhere('relation_name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%");
                });
            })
            ->when($mob !== '', fn(Builder $b) => $b->where('mobile', 'like', "%{$mob}%"));

        // This logic for branch managers should be added if you are using that feature.
        // If not, you can safely remove this 'if' block.
        if ($authUser->role === 'manager') {
            if ($authUser->branch_id && $authUser->branch?->name !== 'Dhamtari') {
                $branchUserIds = User::where('branch_id', $authUser->branch_id)->pluck('id');
                $query->whereIn('user_id', $branchUserIds);
            }
        }

        return $query->withCount(['learnerLicenses', 'drivingLicenses', 'vehicles'])
            ->orderByDesc('id')
            ->paginate($per);
    }

    public function store(StoreCitizenRequest $request)
    {
        $data = $request->validated();
        $loggedInUser = $request->user();
        $data['user_id'] = $loggedInUser->id;
        $citizen = Citizen::create($data);
        if ($request->input('is_self') === true && !$loggedInUser->citizen_id) {
            $loggedInUser->citizen_id = $citizen->id;
            $loggedInUser->save();
        }
        return response()->json($citizen, 201);
    }

    public function show(Citizen $citizen, Request $request)
    {
        $authUser = $request->user();
        if ($authUser->role === 'user' && $citizen->user_id !== $authUser->id) {
            abort(403, 'This action is unauthorized.');
        }

        // --- START OF THE FIX ---
        // Use loadCount to efficiently get the counts for the badges.
        // This will fix the "Veh 0" bug.
        $citizen->loadCount(['learnerLicenses', 'drivingLicenses', 'vehicles']);
        // --- END OF THE FIX ---

        return $citizen;
    }

    public function getAllDetails(Citizen $citizen, Request $request)
    {
        $authUser = $request->user();
        if ($authUser->role === 'user' && $citizen->user_id !== $authUser->id) {
            abort(403, 'This action is unauthorized.');
        }
        $citizen->load(['learnerLicenses', 'drivingLicenses', 'vehicles.insurances', 'vehicles.puccs', 'vehicles.fitnesses', 'vehicles.permits', 'vehicles.vltds', 'vehicles.speedGovernors', 'vehicles.taxes']);
        return $citizen;
    }

    public function update(UpdateCitizenRequest $request, Citizen $citizen)
    {
        $validatedData = $request->validated();

        DB::transaction(function () use ($citizen, $validatedData) {
            $citizen->update($validatedData);
            $user = User::where('citizen_id', $citizen->id)->first();
            if ($user) {
                $user->name = $validatedData['name'] ?? $user->name;
                $user->email = $validatedData['email'] ?? $user->email;
                if (isset($validatedData['mobile'])) {
                    $isPhoneTakenByAnotherUser = User::where('phone', $validatedData['mobile'])
                        ->where('id', '!=', $user->id)
                        ->exists();

                    if (!$isPhoneTakenByAnotherUser) {
                        $user->phone = $validatedData['mobile'];
                    }
                }
                $user->save();
            }
        });

        return $citizen->fresh();
    }

    public function destroy(Citizen $citizen)
    {
        $citizen->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function sendMessage(Request $request, Citizen $citizen, WhatsAppService $whatsAppService)
    {
        $data = $request->validate([
            'message' => 'required|string|min:1|max:1000',
        ]);

        if (!$citizen->mobile) {
            return response()->json(['message' => 'This citizen does not have a mobile number on file.'], 422);
        }

        $phoneNumber = '91' . $citizen->mobile;
        $message = $data['message'];
        $success = $whatsAppService->sendTextMessage($phoneNumber, $message);

        if ($success) {
            return response()->json(['message' => 'Message sent successfully to ' . $citizen->mobile]);
        } else {
            return response()->json(['message' => 'Failed to send message. Please check the server logs.'], 500);
        }
    }

    public function getExpiredDocuments(Citizen $citizen)
    {
        $today = Carbon::today();
        $expiredDocuments = [];

        // --- START OF MODIFIED LOGIC ---
        // We now include 'full_record' in the response so the frontend can open edit modals.

        $citizen->learnerLicenses()->whereDate('expiry_date', '<', $today)->get()->each(function ($ll) use (&$expiredDocuments) {
            $expiredDocuments[] = [
                'type' => 'Learner License',
                'identifier' => $ll->ll_no,
                'expiry_date' => $ll->expiry_date,
                'details' => "Office: {$ll->office}",
                'full_record' => $ll // Add full record
            ];
        });

        $citizen->drivingLicenses()->whereDate('expiry_date', '<', $today)->get()->each(function ($dl) use (&$expiredDocuments) {
            $expiredDocuments[] = [
                'type' => 'Driving License',
                'identifier' => $dl->dl_no,
                'expiry_date' => $dl->expiry_date,
                'details' => "Vehicle Class: {$dl->vehicle_class}",
                'full_record' => $dl // Add full record
            ];
        });

        $citizen->vehicles()->with(['insurances', 'puccs', 'fitnesses', 'taxes', 'permits', 'vltds', 'speedGovernors'])->get()->each(function ($vehicle) use (&$expiredDocuments, $today) {
            $regNo = $vehicle->registration_no;

            $vehicle->insurances()->whereDate('end_date', '<', $today)->get()->each(function ($ins) use (&$expiredDocuments, $regNo) {
                $expiredDocuments[] = [
                    'type' => 'Insurance',
                    'identifier' => $regNo,
                    'expiry_date' => $ins->end_date,
                    'details' => "Policy: {$ins->policy_number}",
                    'full_record' => $ins // Add full record
                ];
            });

            $vehicle->puccs()->whereDate('valid_until', '<', $today)->get()->each(function ($pucc) use (&$expiredDocuments, $regNo) {
                $expiredDocuments[] = [
                    'type' => 'PUCC',
                    'identifier' => $regNo,
                    'expiry_date' => $pucc->valid_until,
                    'details' => "Certificate: {$pucc->pucc_number}",
                    'full_record' => $pucc // Add full record
                ];
            });

            $vehicle->fitnesses()->whereDate('expiry_date', '<', $today)->get()->each(function ($fit) use (&$expiredDocuments, $regNo) {
                $expiredDocuments[] = [
                    'type' => 'Fitness',
                    'identifier' => $regNo,
                    'expiry_date' => $fit->expiry_date,
                    'details' => "Certificate: {$fit->certificate_number}",
                    'full_record' => $fit // Add full record
                ];
            });

            $vehicle->taxes()->whereDate('tax_upto', '<', $today)->get()->each(function ($tax) use (&$expiredDocuments, $regNo) {
                $expiredDocuments[] = [
                    'type' => 'Tax',
                    'identifier' => $regNo,
                    'expiry_date' => $tax->tax_upto,
                    'details' => "Mode: {$tax->tax_mode}",
                    'full_record' => $tax // Add full record
                ];
            });

            $vehicle->permits()->whereDate('expiry_date', '<', $today)->get()->each(function ($permit) use (&$expiredDocuments, $regNo) {
                $expiredDocuments[] = [
                    'type' => 'Permit',
                    'identifier' => $regNo,
                    'expiry_date' => $permit->expiry_date,
                    'details' => "Permit No: {$permit->permit_number}",
                    'full_record' => $permit // Add full record
                ];
            });

            $vehicle->vltds()->whereDate('expiry_date', '<', $today)->get()->each(function ($vltd) use (&$expiredDocuments, $regNo) {
                $expiredDocuments[] = [
                    'type' => 'VLTd',
                    'identifier' => $regNo,
                    'expiry_date' => $vltd->expiry_date,
                    'details' => "Certificate: {$vltd->certificate_number}",
                    'full_record' => $vltd // Add full record
                ];
            });

            $vehicle->speedGovernors()->whereDate('expiry_date', '<', $today)->get()->each(function ($sg) use (&$expiredDocuments, $regNo) {
                $expiredDocuments[] = [
                    'type' => 'Speed Governor',
                    'identifier' => $regNo,
                    'expiry_date' => $sg->expiry_date,
                    'details' => "Certificate: {$sg->certificate_number}",
                    'full_record' => $sg // Add full record
                ];
            });
        });
        // --- END OF MODIFIED LOGIC ---

        return response()->json([
            'citizen' => $citizen,
            'expired_documents' => $expiredDocuments,
        ]);
    }

}
