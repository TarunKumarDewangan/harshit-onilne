<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Citizen;
use App\Models\User;
use App\Models\LearnerLicense;
use App\Models\LlRegistry; // --- ADDED THIS IMPORT ---
use App\Models\VehicleTax;
use App\Models\VehicleInsurance;
use App\Models\VehicleFitness;
use App\Models\VehiclePermit;
use App\Models\VehiclePucc;
use App\Models\VehicleVltd;
use App\Models\VehicleSpeedGovernor;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function getStats(Request $request)
    {
        $authUser = $request->user()->load('branch');

        // 1. Determine Filtering Logic (for Managers)
        $branchUserIds = null;
        $isRestrictedManager = false;

        if ($authUser->role === 'manager') {
            if ($authUser->branch_id && $authUser->branch?->name !== 'Dhamtari') {
                $isRestrictedManager = true;
                $branchUserIds = User::where('branch_id', $authUser->branch_id)->pluck('id');
            }
        }

        // 2. Basic Counts
        $citizenQuery = Citizen::query();
        $userQuery = User::query();

        if ($isRestrictedManager) {
            $citizenQuery->whereIn('user_id', $branchUserIds);
            $userQuery->where('branch_id', $authUser->branch_id);
        }

        $totalUsers = $userQuery->count();
        $totalCitizens = $citizenQuery->count();

        // 3. LOGIC: LL Crossed 31 Days (Eligible for DL)
        $date31DaysAgo = Carbon::now()->subDays(31);

        // Count from OLD Table (Citizen Profiles)
        $llQuery = LearnerLicense::query();
        if ($isRestrictedManager) {
            $llQuery->whereHas('citizen', fn($q) => $q->whereIn('user_id', $branchUserIds));
        }
        $oldSystemCount = $llQuery->whereDate('issue_date', '<=', $date31DaysAgo)->count();

        // --- START OF THE FIX ---
        // Count from NEW Table (LL Registry)
        // Note: Start Date must be <= 31 days ago
        $newRegistryCount = LlRegistry::whereDate('start_date', '<=', $date31DaysAgo)->count();

        // Combine the counts
        $llEligibleForDl = $oldSystemCount + $newRegistryCount;
        // --- END OF THE FIX ---


        // 4. LOGIC: Documents Expiring in Next 10 Days
        $today = Carbon::now();
        $future10Days = Carbon::now()->addDays(10);

        $countExpiries = function ($model, $dateCol) use ($today, $future10Days, $isRestrictedManager, $branchUserIds) {
            $q = $model::query();
            if ($isRestrictedManager) {
                $q->whereHas('vehicle.citizen', fn($sq) => $sq->whereIn('user_id', $branchUserIds));
            }
            return $q->whereBetween($dateCol, [$today, $future10Days])->count();
        };

        $totalExpiringSoon =
            $countExpiries(VehicleTax::class, 'tax_upto') +
            $countExpiries(VehicleInsurance::class, 'end_date') +
            $countExpiries(VehicleFitness::class, 'expiry_date') +
            $countExpiries(VehiclePermit::class, 'expiry_date') +
            $countExpiries(VehiclePucc::class, 'valid_until') +
            $countExpiries(VehicleVltd::class, 'expiry_date') +
            $countExpiries(VehicleSpeedGovernor::class, 'expiry_date');


        return response()->json([
            'total_users' => $totalUsers,
            'total_citizens' => $totalCitizens,
            'll_eligible_for_dl' => $llEligibleForDl,
            'docs_expiring_soon' => $totalExpiringSoon,
        ]);
    }

    public function getUserStats(Request $request)
    {
        $user = $request->user();
        $citizen = $user->primaryCitizen;

        if (!$citizen) {
            return response()->json(['ll_count' => 0, 'dl_count' => 0, 'vehicle_count' => 0]);
        }

        return response()->json([
            'll_count' => $citizen->learnerLicenses()->count(),
            'dl_count' => $citizen->drivingLicenses()->count(),
            'vehicle_count' => $citizen->vehicles()->count(),
        ]);
    }
}
