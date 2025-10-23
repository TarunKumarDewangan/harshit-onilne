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
        Schema::table('vehicle_insurances', function (Blueprint $table) {
            // Modify the start_date column to allow it to be NULL
            $table->date('start_date')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicle_insurances', function (Blueprint $table) {
            // This is the reverse operation
            $table->date('start_date')->nullable(false)->change();
        });
    }
};
