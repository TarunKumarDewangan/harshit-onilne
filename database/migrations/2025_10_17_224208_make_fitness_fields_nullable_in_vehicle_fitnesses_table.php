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
        Schema::table('vehicle_fitnesses', function (Blueprint $table) {
            // Modify the columns to allow them to be NULL (empty)
            $table->string('certificate_number')->nullable()->change();
            $table->date('issue_date')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicle_fitnesses', function (Blueprint $table) {
            // This is the reverse operation
            $table->string('certificate_number')->nullable(false)->change();
            $table->date('issue_date')->nullable(false)->change();
        });
    }
};
