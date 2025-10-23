<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleInsurance;
use Illuminate\Http\Request;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class VehicleInsuranceController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware(RoleMiddleware::class . ':admin,manager')->except(['indexByVehicle']);
    }

    // --- START OF NEW CODE ---
    /**
     * Display a listing of the insurances for a specific vehicle.
     * GET /api/vehicles/{vehicle}/insurances
     */
    public function indexByVehicle(Vehicle $vehicle)
    {
        return $vehicle->insurances()->orderBy('end_date', 'desc')->paginate(10);
    }
    // --- END OF NEW CODE ---

    /**
     * Store a newly created insurance for a specific vehicle.
     * POST /api/vehicles/{vehicle}/insurances
     */
    public function storeForVehicle(Request $request, Vehicle $vehicle)
    {
        $data = $request->validate([
            'insurance_type' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'policy_number' => 'nullable|string|max:255|unique:vehicle_insurances,policy_number',
            'start_date' => 'sometimes|nullable|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'nullable|string|in:active,expired',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('insurance_documents', 'public');
            $data['file_path'] = $path;
        }

        $insurance = $vehicle->insurances()->create($data);

        return response()->json($insurance, 201);
    }

    /**
     * Update the specified insurance record in storage.
     * PUT /api/insurances/{insurance}
     */
    public function update(Request $request, VehicleInsurance $insurance)
    {
        $data = $request->validate([
            'insurance_type' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'policy_number' => ['nullable', 'string', 'max:255', Rule::unique('vehicle_insurances')->ignore($insurance->id)],
            'start_date' => 'sometimes|nullable|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'nullable|string|in:active,expired',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('file')) {
            if ($insurance->file_path) {
                Storage::disk('public')->delete($insurance->file_path);
            }
            $path = $request->file('file')->store('insurance_documents', 'public');
            $data['file_path'] = $path;
        }

        $insurance->update($data);

        return $insurance->fresh();
    }

    /**
     * Remove the specified insurance record from storage.
     * DELETE /api/insurances/{insurance}
     */
    public function destroy(VehicleInsurance $insurance)
    {
        if ($insurance->file_path) {
            Storage::disk('public')->delete($insurance->file_path);
        }
        $insurance->delete();

        return response()->json(['message' => 'Insurance record deleted successfully.']);
    }
}
