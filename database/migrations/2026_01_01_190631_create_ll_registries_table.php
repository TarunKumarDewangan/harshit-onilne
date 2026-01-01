<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ll_registries', function (Blueprint $table) {
            $table->id();

            // Core Details
            $table->string('name');
            $table->string('mobile');
            $table->string('application_no')->nullable();
            $table->date('dob')->nullable();
            $table->string('ll_no')->nullable(); // Added LL No here

            // Dates
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            // Payments
            $table->decimal('payment_asked', 10, 2)->default(0);
            $table->decimal('payment_paid', 10, 2)->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ll_registries');
    }
};
