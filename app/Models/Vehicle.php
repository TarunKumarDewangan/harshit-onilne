<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'citizen_id',
        'registration_no',
        'type',
        'make_model',
        'chassis_no',
        'engine_no'
    ];

    // --- START OF THE FIX (1/2) ---
    // Append these new calculated attributes to the JSON response for this model.
    protected $appends = [
        'latest_insurance_expiry',
        'latest_tax_expiry',
        'latest_pucc_expiry',
        'latest_fitness_expiry',
        'latest_permit_expiry',
    ];
    // --- END OF THE FIX ---

    public function citizen()
    {
        return $this->belongsTo(Citizen::class);
    }

    public function taxes()
    {
        return $this->hasMany(VehicleTax::class);
    }

    public function insurances()
    {
        return $this->hasMany(VehicleInsurance::class);
    }

    public function puccs()
    {
        return $this->hasMany(VehiclePucc::class);
    }

    public function fitnesses()
    {
        return $this->hasMany(VehicleFitness::class);
    }

    public function vltds()
    {
        return $this->hasMany(VehicleVltd::class);
    }

    public function permits()
    {
        return $this->hasMany(VehiclePermit::class);
    }

    public function speedGovernors()
    {
        return $this->hasMany(VehicleSpeedGovernor::class);
    }

    // --- START OF THE FIX (2/2) ---
    // These functions automatically find the latest date from the related documents.
    public function getLatestInsuranceExpiryAttribute()
    {
        // Use 'end_date' for insurance
        return $this->insurances()->latest('end_date')->first()?->end_date;
    }

    public function getLatestTaxExpiryAttribute()
    {
        // Use 'tax_upto' for tax
        return $this->taxes()->latest('tax_upto')->first()?->tax_upto;
    }

    public function getLatestPuccExpiryAttribute()
    {
        // Use 'valid_until' for pucc
        return $this->puccs()->latest('valid_until')->first()?->valid_until;
    }

    public function getLatestFitnessExpiryAttribute()
    {
        // Use 'expiry_date' for fitness
        return $this->fitnesses()->latest('expiry_date')->first()?->expiry_date;
    }

    public function getLatestPermitExpiryAttribute()
    {
        // Use 'expiry_date' for permit
        return $this->permits()->latest('expiry_date')->first()?->expiry_date;
    }
    // --- END OF THE FIX ---
}
