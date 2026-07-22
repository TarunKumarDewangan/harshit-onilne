<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Requests\StoreVehicleRequest;
use App\Http\Requests\UpdateVehicleRequest;
use App\Models\Vehicle;
use App\Models\Citizen;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        // Ensure all write actions are protected
        $this->middleware(RoleMiddleware::class . ':admin,manager')->only(['storeForCitizen', 'update', 'destroy']);
    }

    // GET /api/citizens/{citizen}/vehicles
    public function indexByCitizen(Citizen $citizen)
    {
        $vehicles = Vehicle::where('citizen_id', $citizen->id)
            ->orderByDesc('id')
            ->get();

        return response()->json(['data' => $vehicles]);
    }

    // GET /api/search/vehicle?registration_no=..&chassis_no=..&engine_no=..
    public function search(Request $request)
    {
        $reg = trim((string) $request->query('registration_no', ''));
        $ch = trim((string) $request->query('chassis_no', ''));
        $en = trim((string) $request->query('engine_no', ''));
        $authUser = $request->user();

        $q = Vehicle::query()
            ->with('citizen:id,name,father_name,mobile')
            ->when($authUser->role === 'user', function (Builder $b) use ($authUser) {
                $b->whereHas('citizen', function (Builder $citizenQuery) use ($authUser) {
                    $citizenQuery->where('user_id', $authUser->id);
                });
            })
            ->when($reg !== '', fn(Builder $b) => $b->where('registration_no', 'like', "%{$reg}%"))
            ->when($ch !== '', fn(Builder $b) => $b->where('chassis_no', 'like', "%{$ch}%"))
            ->when($en !== '', fn(Builder $b) => $b->where('engine_no', 'like', "%{$en}%"))
            ->orderByDesc('id');

        return $q->paginate(10);
    }

    // POST /api/citizens/{citizen}/vehicles
    public function storeForCitizen(StoreVehicleRequest $request, Citizen $citizen)
    {
        $data = $request->validated();
        $data['citizen_id'] = $citizen->id;
        $rec = Vehicle::create($data);
        return response()->json($rec, 201);
    }

    // GET /api/vehicles/{vehicle}
    public function show(Vehicle $vehicle)
    {
        return $vehicle->load('citizen:id,name,mobile');
    }

    /**
     * START: New/Updated Methods
     */

    // PUT/PATCH /api/vehicles/{vehicle}
    public function update(UpdateVehicleRequest $request, Vehicle $vehicle)
    {
        $vehicle->update($request->validated());
        return $vehicle->fresh();
    }

    // DELETE /api/vehicles/{vehicle}
    public function destroy(Vehicle $vehicle)
    {
        $vehicle->delete();
        return response()->json(['message' => 'Vehicle record deleted successfully.']);
    }

    /**
     * END: New/Updated Methods
     */
}
