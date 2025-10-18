<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleFitness;
use Illuminate\Http\Request;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class VehicleFitnessController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware(RoleMiddleware::class . ':admin,manager')->except(['indexByVehicle']);
    }

    public function indexByVehicle(Vehicle $vehicle)
    {
        return $vehicle->fitnesses()->orderBy('expiry_date', 'desc')->paginate(10);
    }

    public function storeForVehicle(Request $request, Vehicle $vehicle)
    {
        $data = $request->validate([
            'certificate_number' => 'nullable|string|max:255|unique:vehicle_fitnesses,certificate_number',
            'issue_date' => 'sometimes|nullable|date',
            'expiry_date' => 'required|date',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('fitness_documents', 'public');
            $data['file_path'] = $path;
        }

        $fitness = $vehicle->fitnesses()->create($data);
        return response()->json($fitness, 201);
    }

    public function update(Request $request, VehicleFitness $fitness)
    {
        $data = $request->validate([
            'certificate_number' => ['nullable', 'string', 'max:255', Rule::unique('vehicle_fitnesses')->ignore($fitness->id)],
            'issue_date' => 'sometimes|nullable|date',
            'expiry_date' => 'required|date',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('file')) {
            if ($fitness->file_path) {
                Storage::disk('public')->delete($fitness->file_path);
            }
            $path = $request->file('file')->store('fitness_documents', 'public');
            $data['file_path'] = $path;
        }

        $fitness->update($data);
        return $fitness->fresh();
    }

    public function destroy(VehicleFitness $fitness)
    {
        if ($fitness->file_path) {
            Storage::disk('public')->delete($fitness->file_path);
        }
        $fitness->delete();
        return response()->json(['message' => 'Fitness record deleted successfully.']);
    }
}
