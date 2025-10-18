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
        Schema::table('vehicle_taxes', function (Blueprint $table) {
            // Modify the columns to allow them to be NULL (empty)
            $table->string('tax_mode')->nullable()->change();
            $table->date('tax_from')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicle_taxes', function (Blueprint $table) {
            // This is the reverse operation
            $table->string('tax_mode')->nullable(false)->change();
            $table->date('tax_from')->nullable(false)->change();
        });
    }
};
