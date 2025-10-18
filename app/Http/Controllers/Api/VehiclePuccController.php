<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehiclePucc;
use Illuminate\Http\Request;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class VehiclePuccController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware(RoleMiddleware::class . ':admin,manager')->except(['indexByVehicle']);
    }

    // --- START OF THE FIX ---
    // This method was missing.
    public function indexByVehicle(Vehicle $vehicle)
    {
        return $vehicle->puccs()->orderBy('valid_until', 'desc')->paginate(10);
    }
    // --- END OF THE FIX ---

    public function storeForVehicle(Request $request, Vehicle $vehicle)
    {
        $data = $request->validate([
            'pucc_number' => 'nullable|string|max:255|unique:vehicle_puccs,pucc_number',
            'valid_from' => 'nullable|date',
            'valid_until' => 'required|date', // This remains required
            'status' => 'nullable|string|in:active,expired',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('pucc_documents', 'public');
            $data['file_path'] = $path;
        }

        $pucc = $vehicle->puccs()->create($data);

        return response()->json($pucc, 201);
    }

    public function update(Request $request, VehiclePucc $pucc)
    {
        $data = $request->validate([
            'pucc_number' => ['nullable', 'string', 'max:255', Rule::unique('vehicle_puccs')->ignore($pucc->id)],
            'valid_from' => 'nullable|date',
            'valid_until' => 'required|date', // This remains required
            'status' => 'nullable|string|in:active,expired',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('file')) {
            if ($pucc->file_path) {
                Storage::disk('public')->delete($pucc->file_path);
            }
            $path = $request->file('file')->store('pucc_documents', 'public');
            $data['file_path'] = $path;
        }

        $pucc->update($data);

        return $pucc->fresh();
    }

    public function destroy(VehiclePucc $pucc)
    {
        if ($pucc->file_path) {
            Storage::disk('public')->delete($pucc->file_path);
        }
        $pucc->delete();

        return response()->json(['message' => 'PUCC record deleted successfully.']);
    }
}
