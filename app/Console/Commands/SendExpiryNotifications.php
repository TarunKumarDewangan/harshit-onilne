<?php

namespace App\Console\Commands;

use App\Models\DrivingLicense;
use App\Models\LearnerLicense;
use App\Models\VehicleFitness;
use App\Models\VehicleInsurance;
use App\Models\VehiclePermit;
use App\Models\VehiclePucc;
use App\Models\VehicleSpeedGovernor;
use App\Models\VehicleVltd;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use App\Models\VehicleTax;

class SendExpiryNotifications extends Command
{
    protected $signature = 'notifications:send-expiries';
    protected $description = 'Scan for all expiring documents and send WhatsApp notifications.';

    public function handle(WhatsAppService $whatsAppService): void
    {
        // --- START OF THE FIX ---
        $this->info('Starting to check for expiring documents...');
        // --- END OF THE FIX ---
        Log::info('Running SendExpiryNotifications command.');

        $notificationDays = 10;
        $expiryTargetDate = Carbon::today()->addDays($notificationDays);

        $this->checkLearnerLicenses($whatsAppService, $expiryTargetDate);
        $this->checkDrivingLicenses($whatsAppService, $expiryTargetDate);
        $this->checkVehicleInsurances($whatsAppService, $expiryTargetDate);
        $this->checkVehiclePuccs($whatsAppService, $expiryTargetDate);
        $this->checkVehicleFitnesses($whatsAppService, $expiryTargetDate);
        $this->checkVehicleTaxes($whatsAppService, $expiryTargetDate);
        $this->checkVehiclePermits($whatsAppService, $expiryTargetDate);
        $this->checkVehicleVltds($whatsAppService, $expiryTargetDate);
        $this->checkVehicleSpeedGovernors($whatsAppService, $expiryTargetDate);

        // --- START OF THE FIX ---
        $this->info('Finished checking for expiring documents.');
        // --- END OF THE FIX ---
        Log::info('Finished SendExpiryNotifications command.');
    }

    private function checkLearnerLicenses(WhatsAppService $service, Carbon $targetDate)
    {
        $licenses = LearnerLicense::whereDate('expiry_date', $targetDate)
            ->with('citizen:id,name,mobile')->get();

        foreach ($licenses as $ll) {
            $citizen = $ll->citizen;
            if ($citizen && $citizen->mobile) {
                $expiryDate = $ll->expiry_date->format('d-m-Y');
                $message = "प्रिय ग्राहक\nआपके लर्नर लाइसेंस ({$ll->ll_no}) की वैधता\n{$expiryDate} को समाप्त हो जाएगा।\n\nसमय पर नवीनीकरण कराएं और\nचालान/क्लेम रिजेक्शन से बचें\n\nHARSHIT RTO & INSURANCE SERVICES\n7000175067 | 7999664014";
                $service->sendTextMessage('91' . $citizen->mobile, $message);
            }
        }
    }

    private function checkDrivingLicenses(WhatsAppService $service, Carbon $targetDate)
    {
        $licenses = DrivingLicense::whereDate('expiry_date', $targetDate)
            ->with('citizen:id,name,mobile')->get();

        foreach ($licenses as $dl) {
            $citizen = $dl->citizen;
            if ($citizen && $citizen->mobile) {
                $expiryDate = $dl->expiry_date->format('d-m-Y');
                $message = "प्रिय ग्राहक\nआपके ड्राइविंग लाइसेंस ({$dl->dl_no}) की वैधता\n{$expiryDate} को समाप्त हो जाएगा।\n\nसमय पर नवीनीकरण कराएं और\nचालान/क्लेम रिजेक्शन से बचें\n\nHARSHIT RTO & INSURANCE SERVICES\n7000175067 | 7999664014";
                $service->sendTextMessage('91' . $citizen->mobile, $message);
            }
        }
    }

    private function checkVehicleInsurances(WhatsAppService $service, Carbon $targetDate)
    {
        $insurances = VehicleInsurance::whereDate('end_date', $targetDate)
            ->with('vehicle.citizen:id,name,mobile')->get();

        foreach ($insurances as $ins) {
            $citizen = $ins->vehicle?->citizen;
            if ($citizen && $citizen->mobile) {
                $expiryDate = $ins->end_date->format('d-m-Y');
                $message = "प्रिय ग्राहक\nआपके वाहन {$ins->vehicle->registration_no} के बीमा (Insurance) की वैधता\n{$expiryDate} को समाप्त हो जाएगा।\n\nसमय पर नवीनीकरण कराएं और\nचालान/क्लेम रिजेक्शन से बचें\n\nHARSHIT RTO & INSURANCE SERVICES\n7000175067 | 7999664014";
                $service->sendTextMessage('91' . $citizen->mobile, $message);
            }
        }
    }

    private function checkVehiclePuccs(WhatsAppService $service, Carbon $targetDate)
    {
        $puccs = VehiclePucc::whereDate('valid_until', $targetDate)
            ->with('vehicle.citizen:id,name,mobile')->get();

        foreach ($puccs as $pucc) {
            $citizen = $pucc->vehicle?->citizen;
            if ($citizen && $citizen->mobile) {
                $expiryDate = $pucc->valid_until->format('d-m-Y');
                $message = "प्रिय ग्राहक\nआपके वाहन {$pucc->vehicle->registration_no} के पी.यू.सी.सी. (PUCC) की वैधता\n{$expiryDate} को समाप्त हो जाएगा।\n\nसमय पर नवीनीकरण कराएं और\nचालान/क्लेम रिजेक्शन से बचें\n\nHARSHIT RTO & INSURANCE SERVICES\n7000175067 | 7999664014";
                $service->sendTextMessage('91' . $citizen->mobile, $message);
            }
        }
    }

    private function checkVehicleFitnesses(WhatsAppService $service, Carbon $targetDate)
    {
        $fitnesses = VehicleFitness::whereDate('expiry_date', $targetDate)
            ->with('vehicle.citizen:id,name,mobile')->get();

        foreach ($fitnesses as $fitness) {
            $citizen = $fitness->vehicle?->citizen;
            if ($citizen && $citizen->mobile) {
                $expiryDate = $fitness->expiry_date->format('d-m-Y');
                $message = "प्रिय ग्राहक\nआपके वाहन {$fitness->vehicle->registration_no} के फिटनेस सर्टिफिकेट (Fitness) की वैधता\n{$expiryDate} को समाप्त हो जाएगा।\n\nसमय पर नवीनीकरण कराएं और\nचालान/क्लेम रिजेक्शन से बचें\n\nHARSHIT RTO & INSURANCE SERVICES\n7000175067 | 7999664014";
                $service->sendTextMessage('91' . $citizen->mobile, $message);
            }
        }
    }

    private function checkVehicleTaxes(WhatsAppService $service, Carbon $targetDate)
    {
        $taxes = VehicleTax::whereDate('tax_upto', $targetDate)
            ->with('vehicle.citizen:id,name,mobile')->get();

        foreach ($taxes as $tax) {
            $citizen = $tax->vehicle?->citizen;
            if ($citizen && $citizen->mobile) {
                $expiryDate = $tax->tax_upto->format('d-m-Y');
                $message = "प्रिय ग्राहक\nआपके वाहन {$tax->vehicle->registration_no} के रोड टैक्स (Road Tax) की वैधता\n{$expiryDate} को समाप्त हो जाएगा।\n\nसमय पर नवीनीकरण कराएं और\nचालान/क्लेम रिजेक्शन से बचें\n\nHARSHIT RTO & INSURANCE SERVICES\n7000175067 | 7999664014";
                $service->sendTextMessage('91' . $citizen->mobile, $message);
            }
        }
    }

    private function checkVehiclePermits(WhatsAppService $service, Carbon $targetDate)
    {
        $permits = VehiclePermit::whereDate('expiry_date', $targetDate)
            ->with('vehicle.citizen:id,name,mobile')->get();

        foreach ($permits as $permit) {
            $citizen = $permit->vehicle?->citizen;
            if ($citizen && $citizen->mobile) {
                $expiryDate = $permit->expiry_date->format('d-m-Y');
                $message = "प्रिय ग्राहक\nआपके वाहन {$permit->vehicle->registration_no} के परमिट (Permit) की वैधता\n{$expiryDate} को समाप्त हो जाएगा।\n\nसमय पर नवीनीकरण कराएं और\nचालान/क्लेम रिजेक्शन से बचें\n\nHARSHIT RTO & INSURANCE SERVICES\n7000175067 | 7999664014";
                $service->sendTextMessage('91' . $citizen->mobile, $message);
            }
        }
    }

    private function checkVehicleVltds(WhatsAppService $service, Carbon $targetDate)
    {
        $vltds = VehicleVltd::whereDate('expiry_date', $targetDate)
            ->with('vehicle.citizen:id,name,mobile')->get();

        foreach ($vltds as $vltd) {
            $citizen = $vltd->vehicle?->citizen;
            if ($citizen && $citizen->mobile) {
                $expiryDate = $vltd->expiry_date->format('d-m-Y');
                $message = "प्रिय ग्राहक\nआपके वाहन {$vltd->vehicle->registration_no} के वी.एल.टी.डी. सर्टिफिकेट (VLTd) की वैधता\n{$expiryDate} को समाप्त हो जाएगा।\n\nसमय पर नवीनीकरण कराएं और\nचालान/क्लेम रिजेक्शन से बचें\n\nHARSHIT RTO & INSURANCE SERVICES\n7000175067 | 7999664014";
                $service->sendTextMessage('91' . $citizen->mobile, $message);
            }
        }
    }

    private function checkVehicleSpeedGovernors(WhatsAppService $service, Carbon $targetDate)
    {
        $sgs = VehicleSpeedGovernor::whereDate('expiry_date', $targetDate)
            ->with('vehicle.citizen:id,name,mobile')->get();

        foreach ($sgs as $sg) {
            $citizen = $sg->vehicle?->citizen;
            if ($citizen && $citizen->mobile) {
                $expiryDate = $sg->expiry_date->format('d-m-Y');
                $message = "प्रिय ग्राहक\nआपके वाहन {$sg->vehicle->registration_no} के स्पीड गवर्नर सर्टिफिकेट (Speed Governor) की वैधता\n{$expiryDate} को समाप्त हो जाएगा।\n\nसमय पर नवीनीकरण कराएं और\nचालान/क्लेम रिजेक्शन से बचें\n\nHARSHIT RTO & INSURANCE SERVICES\n7000175067 | 7999664014";
                $service->sendTextMessage('91' . $citizen->mobile, $message);
            }
        }
    }
}
