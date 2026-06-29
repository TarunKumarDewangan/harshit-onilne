<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $apiKey;
    protected string $apiEndpoint;

    public function __construct()
    {
        // --- START OF THE FIX ---
        // Add a fallback to an empty string ('') to prevent TypeError if config is not loaded.
        $host = config('services.conic.host', '');
        $this->apiKey = config('services.conic.key', '');
        // --- END OF THE FIX ---

        $this->apiEndpoint = "https://{$host}/wapp/api/send/json";
    }

    /**
     * Sends a plain text message via the Conic Solution JSON API and logs it.
     */
    public function sendTextMessage(string $phoneNumber, string $message, string $category = 'Other'): bool
    {
        if (!$this->apiKey || empty(config('services.conic.host'))) {
            Log::error('Conic Solution WhatsApp API credentials are not configured or found.');
            $this->createLog($phoneNumber, $message, $category, false, 'API credentials are not configured or found.');
            return false;
        }

        try {
            $response = Http::withHeaders([
                'X-API-KEY' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiEndpoint, [
                        'mobile' => $phoneNumber,
                        'msg' => $message,
                    ]);

            $responseData = $response->json();

            if ($response->successful() && isset($responseData['status']) && $responseData['status'] !== 'ERROR') {
                Log::info("Successfully sent WhatsApp notification to {$phoneNumber}.", $responseData);
                $this->createLog($phoneNumber, $message, $category, true);
                return true;
            } else {
                $errorMsg = "Status: " . $response->status() . " Response: " . json_encode($responseData);
                Log::error("Failed to send WhatsApp notification to {$phoneNumber}. " . $errorMsg);
                $this->createLog($phoneNumber, $message, $category, false, $errorMsg);
                return false;
            }
        } catch (\Exception $e) {
            $errorMsg = $e->getMessage();
            Log::error("Exception while sending WhatsApp notification: " . $errorMsg);
            $this->createLog($phoneNumber, $message, $category, false, $errorMsg);
            return false;
        }
    }

    /**
     * Create a log entry in the database.
     */
    protected function createLog(string $phoneNumber, string $message, string $category, bool $status, ?string $errorMessage = null): void
    {
        try {
            \App\Models\WhatsAppLog::create([
                'user_id' => auth()->id(),
                'phone_number' => $phoneNumber,
                'message' => $message,
                'category' => $category,
                'status' => $status,
                'error_message' => $errorMessage,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to create WhatsApp log in database: " . $e->getMessage());
        }
    }
}
