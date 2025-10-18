<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\RoleMiddleware;
use App\Models\Vehicle;
use App\Models\VehicleTax;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class VehicleTaxController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware(RoleMiddleware::class . ':admin,manager')->except(['indexByVehicle']);
    }

    // --- START OF THE FIX ---
    // The method name was incorrect. It should be indexByVehicle to match the route.
    public function indexByVehicle(Vehicle $vehicle)
    // --- END OF THE FIX ---
    {
        return VehicleTax::where('vehicle_id', $vehicle->id)
            ->orderByDesc('tax_upto')
            ->paginate(10);
    }

    public function storeForVehicle(Request $request, Vehicle $vehicle)
    {
        $data = $request->validate([
            'vehicle_type' => 'nullable|string|max:50',
            'tax_mode' => 'nullable|string|max:50',
            'tax_from' => 'sometimes|nullable|date',
            'tax_upto' => 'required|date', // This remains required
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
            'amount' => 'nullable|numeric|between:0,99999999.99',
        ]);

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('tax_documents', 'public');
            $data['file_path'] = $path;
        }

        $data['vehicle_id'] = $vehicle->id;
        $rec = VehicleTax::create($data);
        return response()->json($rec, 201);
    }

    public function update(Request $request, VehicleTax $tax)
    {
        $data = $request->validate([
            'vehicle_type' => 'nullable|string|max:50',
            'tax_mode' => 'nullable|string|max:50',
            'tax_from' => 'sometimes|nullable|date',
            'tax_upto' => 'required|date',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
            'amount' => 'nullable|numeric|between:0,99999999.99',
        ]);

        if ($request->hasFile('file')) {
            if ($tax->file_path) {
                Storage::disk('public')->delete($tax->file_path);
            }
            $path = $request->file('file')->store('tax_documents', 'public');
            $data['file_path'] = $path;
        }

        $tax->update($data);
        return $tax->fresh();
    }

    public function destroy(VehicleTax $tax)
    {
        try {
            if ($tax->file_path) {
                try {
                    Storage::disk('public')->delete($tax->file_path);
                } catch (\Exception $e) {
                    Log::error("Could not delete tax document file: {$tax->file_path}. Error: " . $e->getMessage());
                }
            }

            $tax->delete();

            return response()->json(['message' => 'Tax record deleted successfully.']);

        } catch (\Exception $e) {
            Log::error('Tax record delete failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete record. Please check server logs.'], 500);
        }
    }
}
