<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SendCreditReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:send-credits';
    protected $description = 'Scan for credits with outstanding balances and send WhatsApp reminders every 7 days.';

    /**
     * Execute the console command.
     */
    public function handle(\App\Services\WhatsAppService $whatsAppService): void
    {
        $this->info('Checking for outstanding credits requiring 7-day reminders...');
        \Illuminate\Support\Facades\Log::info('Running SendCreditReminders command.');

        $credits = \App\Models\Credit::where('balance_amount', '>', 0)
            ->whereNotNull('mobile')
            ->get();

        $sentCount = 0;

        foreach ($credits as $credit) {
            $createdAt = \Carbon\Carbon::parse($credit->created_at)->startOfDay();
            $today = \Carbon\Carbon::today();
            $days = $createdAt->diffInDays($today);

            // Send reminder on day 7, 14, 21, 28, etc. (multiples of 7 and > 0)
            if ($days > 0 && $days % 7 === 0) {
                $message = "प्रिय ग्राहक {$credit->name},\nआपके कार्य ({$credit->work_done}) की बकाया राशि ₹{$credit->balance_amount} लंबित है।\n\nकृपया जल्द से जल्द भुगतान करें।\n\nHARSHIT RTO & INSURANCE SERVICES\n7000175067 | 7999664014";
                
                $success = $whatsAppService->sendTextMessage('91' . $credit->mobile, $message);
                if ($success) {
                    $sentCount++;
                    $this->line("Sent reminder to {$credit->name} ({$credit->mobile}) - Day {$days}");
                }
            }
        }

        $this->info("Finished. Sent {$sentCount} credit reminders.");
        \Illuminate\Support\Facades\Log::info("Finished SendCreditReminders command. Sent {$sentCount} reminders.");
    }
}
