<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ll_registries', function (Blueprint $table) {
            $table->string('given_by')->nullable()->after('mobile');
            $table->string('aadhar_path')->nullable()->after('payment_paid');
        });
    }

    public function down(): void
    {
        Schema::table('ll_registries', function (Blueprint $table) {
            $table->dropColumn(['given_by', 'aadhar_path']);
        });
    }
};
