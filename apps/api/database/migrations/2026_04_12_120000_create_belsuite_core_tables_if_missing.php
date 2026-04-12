<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Additive core tables when absent (SQLite CI or fresh install).
 * When the database already has this schema from another source, this migration is a no-op.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('User')) {
            Schema::create('User', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('email', 255)->unique();
                $table->timestamp('emailVerified')->nullable();
                $table->string('passwordHash');
                $table->string('firstName')->nullable();
                $table->string('lastName')->nullable();
                $table->string('avatar')->nullable();
                $table->string('phoneNumber')->nullable();
                $table->string('timezone')->default('UTC');
                $table->string('preferredLanguage')->default('en');
                $table->string('status')->default('ACTIVE');
                $table->timestamp('lastLogin')->nullable();
                $table->timestamp('deletedAt')->nullable();
                $table->timestamp('createdAt')->useCurrent();
                $table->timestamp('updatedAt')->useCurrent();
            });
        }

        if (! Schema::hasTable('Organization')) {
            Schema::create('Organization', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('name', 255);
                $table->string('slug', 128)->unique();
                $table->string('email')->nullable();
                $table->string('status')->default('ACTIVE');
                $table->boolean('isActive')->default(true);
                $table->string('tier')->default('FREE');
                $table->timestamp('deletedAt')->nullable();
                $table->timestamp('createdAt')->useCurrent();
                $table->timestamp('updatedAt')->useCurrent();
            });
        }

        if (! Schema::hasTable('Role')) {
            Schema::create('Role', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('organizationId');
                $table->string('name', 128);
                $table->text('description')->nullable();
                $table->boolean('isSystem')->default(false);
                $table->timestamp('createdAt')->useCurrent();
                $table->timestamp('updatedAt')->useCurrent();
            });
        }

        if (! Schema::hasTable('OrganizationMember')) {
            Schema::create('OrganizationMember', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('organizationId');
                $table->string('userId');
                $table->string('roleId');
                $table->timestamp('joinedAt')->nullable();
                $table->string('status')->default('ACTIVE');
                $table->string('roleName')->nullable();
                $table->json('permissions')->nullable();
                $table->timestamp('createdAt')->useCurrent();
                $table->timestamp('updatedAt')->useCurrent();
                $table->unique(['organizationId', 'userId']);
            });
        }

        if (! Schema::hasTable('Deal')) {
            Schema::create('Deal', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('organizationId');
                $table->string('userId');
                $table->string('title', 255);
                $table->string('contactEmail')->nullable();
                $table->string('contactName')->nullable();
                $table->string('companyName')->nullable();
                $table->string('stage')->default('PROSPECTING');
                $table->string('priority')->default('MEDIUM');
                $table->double('value')->default(0);
                $table->string('currency', 8)->default('USD');
                $table->integer('probability')->default(20);
                $table->timestamp('expectedCloseAt')->nullable();
                $table->timestamp('closedAt')->nullable();
                $table->string('ownerId')->nullable();
                $table->string('sourceLeadId')->nullable();
                $table->string('pipelineName', 128)->default('Sales');
                $table->string('lostReason')->nullable();
                $table->text('tags')->nullable();
                $table->text('notes')->nullable();
                $table->integer('aiScore')->nullable();
                $table->text('aiNotes')->nullable();
                $table->text('properties')->nullable();
                $table->timestamp('createdAt')->useCurrent();
                $table->timestamp('updatedAt')->useCurrent();
            });
        }

        if (! Schema::hasTable('Content')) {
            Schema::create('Content', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('organizationId');
                $table->string('type');
                $table->string('title', 255);
                $table->text('description')->nullable();
                $table->string('slug', 255);
                $table->text('content')->nullable();
                $table->string('creatorId');
                $table->string('status')->default('DRAFT');
                $table->json('tags')->nullable();
                $table->string('thumbnail')->nullable();
                $table->integer('views')->default(0);
                $table->integer('likes')->default(0);
                $table->timestamp('publishedAt')->nullable();
                $table->timestamp('scheduledAt')->nullable();
                $table->timestamp('expiresAt')->nullable();
                $table->timestamp('createdAt')->useCurrent();
                $table->timestamp('updatedAt')->useCurrent();
                $table->unique(['organizationId', 'slug']);
            });
        }

        if (! Schema::hasTable('ScheduledPost')) {
            Schema::create('ScheduledPost', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('organizationId');
                $table->string('createdById');
                $table->text('content');
                $table->json('mediaUrls')->nullable();
                $table->json('mediaKeys')->nullable();
                $table->string('link')->nullable();
                $table->json('hashtags')->nullable();
                $table->string('status')->default('DRAFT');
                $table->timestamp('scheduledAt')->nullable();
                $table->timestamp('publishedAt')->nullable();
                $table->boolean('aiGenerated')->default(false);
                $table->text('aiPrompt')->nullable();
                $table->boolean('optimalTimeUsed')->default(false);
                $table->boolean('autoRepostEnabled')->default(false);
                $table->integer('repostIntervalDays')->nullable();
                $table->integer('maxReposts')->nullable();
                $table->integer('repostCount')->default(0);
                $table->timestamp('nextRepostAt')->nullable();
                $table->string('parentPostId')->nullable();
                $table->string('bulkBatchId')->nullable();
                $table->timestamp('createdAt')->useCurrent();
                $table->timestamp('updatedAt')->useCurrent();
            });
        }

        if (! Schema::hasTable('AutomationWorkflow')) {
            Schema::create('AutomationWorkflow', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('organizationId');
                $table->string('name', 255);
                $table->text('description')->nullable();
                $table->string('type')->nullable();
                $table->text('trigger')->nullable();
                $table->text('actions')->nullable();
                $table->boolean('isActive')->default(false);
                $table->timestamp('createdAt')->useCurrent();
                $table->timestamp('updatedAt')->useCurrent();
            });
        }

        if (! Schema::hasTable('VideoProject')) {
            Schema::create('VideoProject', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('organizationId');
                $table->string('createdById');
                $table->string('title', 255);
                $table->string('status')->default('DRAFT');
                $table->text('description')->nullable();
                $table->timestamp('createdAt')->useCurrent();
                $table->timestamp('updatedAt')->useCurrent();
            });
        }
    }

    public function down(): void
    {
        // Intentionally empty: avoid dropping live production tables on rollback.
    }
};
