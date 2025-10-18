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
            // The ->nullable() method makes the column optional.
            // The ->change() method applies the modification to the existing column.
            $table->string('insurance_type')->nullable()->change();
            $table->string('company_name')->nullable()->change();
            $table->string('policy_number')->nullable()->change();
            $table->string('status')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicle_insurances', function (Blueprint $table) {
            // This is the reverse operation, to make them required again if needed.
            // Note: Reverting a nullable column to non-nullable can fail if there is
            // already NULL data in the table.
            $table->string('insurance_type')->nullable(false)->change();
            $table->string('company_name')->nullable(false)->change();
            $table->string('policy_number')->nullable(false)->change();
            $table->string('status')->nullable(false)->change();
        });
    }
};
