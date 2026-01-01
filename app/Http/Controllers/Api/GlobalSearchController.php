<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Citizen;
use App\Models\LearnerLicense;
use App\Models\DrivingLicense;
use App\Models\Vehicle;
use App\Models\LlRegistry; // --- ADD THIS IMPORT ---
use App\Http\Middleware\RoleMiddleware;

class GlobalSearchController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware(RoleMiddleware::class . ':admin,manager');
    }

    public function search(Request $request)
    {
        $query = $request->validate(['query' => 'required|string|min:2'])['query'];

        $results = [];

        // 1. Search New LL Registry (The new feature)
        // --- START OF NEW CODE ---
        $registries = LlRegistry::query()
            ->where('name', 'LIKE', "%{$query}%")
            ->orWhere('mobile', 'LIKE', "%{$query}%")
            ->orWhere('application_no', 'LIKE', "%{$query}%")
            ->orWhere('ll_no', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get();

        foreach ($registries as $reg) {
            $results[] = [
                'unique_key' => 'll-reg-' . $reg->id,
                'type' => 'LL Registry',
                'title' => $reg->name . ($reg->application_no ? " (App: {$reg->application_no})" : ""),
                'description' => "Mobile: {$reg->mobile}" . ($reg->ll_no ? " | LL: {$reg->ll_no}" : ""),
                // Clicking this will take them to the LL Registry page
                'url' => '/ll-registry',
            ];
        }
        // --- END OF NEW CODE ---

        // 2. Search Citizens
        $citizens = Citizen::where('name', 'LIKE', "%{$query}%")
            ->orWhere('mobile', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get();

        foreach ($citizens as $citizen) {
            $results[] = [
                'unique_key' => 'citizen-' . $citizen->id,
                'type' => 'Citizen Profile',
                'title' => $citizen->name,
                'description' => 'Mobile: ' . $citizen->mobile,
                'url' => '/citizens/' . $citizen->id,
            ];
        }

        // 3. Search Old Learner Licenses
        $lls = LearnerLicense::with('citizen:id,name')
            ->where('ll_no', 'LIKE', "%{$query}%")
            ->orWhere('application_no', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get();

        foreach ($lls as $ll) {
            $results[] = [
                'unique_key' => 'll-' . $ll->id,
                'type' => 'Learner License (Old)',
                'title' => $ll->ll_no . ($ll->application_no ? " / " . $ll->application_no : ""),
                'description' => 'Holder: ' . ($ll->citizen->name ?? 'Unknown'),
                'url' => '/citizens/' . $ll->citizen_id,
            ];
        }

        // 4. Search Driving Licenses
        $dls = DrivingLicense::with('citizen:id,name')
            ->where('dl_no', 'LIKE', "%{$query}%")
            ->orWhere('application_no', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get();

        foreach ($dls as $dl) {
            $results[] = [
                'unique_key' => 'dl-' . $dl->id,
                'type' => 'Driving License',
                'title' => $dl->dl_no . ($dl->application_no ? " / " . $dl->application_no : ""),
                'description' => 'Holder: ' . ($ll->citizen->name ?? 'Unknown'),
                'url' => '/citizens/' . $dl->citizen_id,
            ];
        }

        // 5. Search Vehicles
        $vehicles = Vehicle::with('citizen:id,name')
            ->where('registration_no', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get();

        foreach ($vehicles as $vehicle) {
            $results[] = [
                'unique_key' => 'vehicle-' . $vehicle->id,
                'type' => 'Vehicle',
                'title' => $vehicle->registration_no,
                'description' => 'Owner: ' . ($vehicle->citizen->name ?? 'Unknown'),
                'url' => '/citizens/' . $vehicle->citizen_id,
            ];
        }

        // Deduplicate and return
        $uniqueResults = collect($results)->unique('unique_key')->values()->all();

        return response()->json($uniqueResults);
    }
}
