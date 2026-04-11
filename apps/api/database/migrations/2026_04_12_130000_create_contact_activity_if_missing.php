<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('ContactActivity')) {
            return;
        }

        Schema::create('ContactActivity', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('organizationId');
            $table->string('contactEmail', 255);
            $table->string('contactName')->nullable();
            $table->string('activityType', 64);
            $table->string('dealId')->nullable();
            $table->string('subject')->nullable();
            $table->text('body')->nullable();
            $table->text('metadata')->nullable();
            $table->string('performedBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
        });
    }

    public function down(): void
    {
        //
    }
};
