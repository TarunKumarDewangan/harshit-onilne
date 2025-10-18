<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehiclePermit;
use Illuminate\Http\Request;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class VehiclePermitController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware(RoleMiddleware::class . ':admin,manager')->except(['indexByVehicle']);
    }

    public function indexByVehicle(Vehicle $vehicle)
    {
        return $vehicle->permits()->orderBy('expiry_date', 'desc')->paginate(10);
    }

    public function storeForVehicle(Request $request, Vehicle $vehicle)
    {
        $data = $request->validate([
            'permit_number' => 'nullable|string|max:255|unique:vehicle_permits,permit_number',
            'issue_date' => 'sometimes|nullable|date',
            'expiry_date' => 'required|date', // This remains required
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('permit_documents', 'public');
            $data['file_path'] = $path;
        }

        $permit = $vehicle->permits()->create($data);
        return response()->json($permit, 201);
    }

    public function update(Request $request, VehiclePermit $permit)
    {
        $data = $request->validate([
            'permit_number' => ['nullable', 'string', 'max:255', Rule::unique('vehicle_permits')->ignore($permit->id)],
            'issue_date' => 'sometimes|nullable|date',
            'expiry_date' => 'required|date', // This remains required
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('file')) {
            if ($permit->file_path) {
                Storage::disk('public')->delete($permit->file_path);
            }
            $path = $request->file('file')->store('permit_documents', 'public');
            $data['file_path'] = $path;
        }

        $permit->update($data);
        return $permit->fresh();
    }

    public function destroy(VehiclePermit $permit)
    {
        if ($permit->file_path) {
            Storage::disk('public')->delete($permit->file_path);
        }
        $permit->delete();
        return response()->json(['message' => 'Permit record deleted successfully.']);
    }
}
