<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('Deal')) {
            return;
        }

        $conn = Schema::getConnection();
        $driver = $conn->getDriverName();

        if ($driver === 'sqlite') {
            $conn->statement(
                'CREATE INDEX IF NOT EXISTS deal_organization_stage_idx ON "Deal" ("organizationId", "stage")'
            );

            return;
        }

        try {
            if ($driver === 'pgsql') {
                $conn->statement('CREATE INDEX deal_organization_stage_idx ON "Deal" ("organizationId", "stage")');
            } else {
                $conn->statement('CREATE INDEX deal_organization_stage_idx ON Deal (organizationId, stage)');
            }
        } catch (\Throwable) {
            // Index may already exist on shared / replayed migrations.
        }
    }

    public function down(): void
    {
        //
    }
};
