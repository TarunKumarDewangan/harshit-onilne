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
        Schema::table('vehicle_puccs', function (Blueprint $table) {
            // Modify the columns to allow them to be NULL (empty)
            $table->string('pucc_number')->nullable()->change();
            $table->date('valid_from')->nullable()->change();
            $table->string('status')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicle_puccs', function (Blueprint $table) {
            // This is the reverse operation, to make them required again if needed.
            $table->string('pucc_number')->nullable(false)->change();
            $table->date('valid_from')->nullable(false)->change();
            $table->string('status')->nullable(false)->change();
        });
    }
};
