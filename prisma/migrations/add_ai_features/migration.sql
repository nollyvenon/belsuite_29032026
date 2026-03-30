-- AI Features Migration
-- Adds AIUsage and PromptTemplate models for AI content generation

-- Create AIUsage table
CREATE TABLE "AIUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "model" VARCHAR(128) NOT NULL,
    "provider" VARCHAR(64) NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contentType" VARCHAR(128),
    "promptTemplateId" TEXT,
    "usedCache" BOOLEAN NOT NULL DEFAULT false,
    "cacheHitTimestamp" TIMESTAMP(3),
    "responseTime" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
    CONSTRAINT "AIUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE,
    CONSTRAINT "AIUsage_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "PromptTemplate" ("id") ON DELETE SET NULL
);

-- Create PromptTemplate table
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(128) NOT NULL,
    "prompt" TEXT NOT NULL,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "averageTokens" INTEGER,
    "averageCost" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
    CONSTRAINT "PromptTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL,
    CONSTRAINT "PromptTemplate_organizationId_name_key" UNIQUE("organizationId", "name")
);

-- Add AI relations to Organization
ALTER TABLE "Organization" ADD COLUMN "updatedAt" TIMESTAMP(3);

-- Add AI relations to User
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3);

-- Create indexes for performance
CREATE INDEX "AIUsage_organizationId_idx" ON "AIUsage"("organizationId");
CREATE INDEX "AIUsage_userId_idx" ON "AIUsage"("userId");
CREATE INDEX "AIUsage_model_idx" ON "AIUsage"("model");
CREATE INDEX "AIUsage_provider_idx" ON "AIUsage"("provider");
CREATE INDEX "AIUsage_contentType_idx" ON "AIUsage"("contentType");
CREATE INDEX "AIUsage_createdAt_idx" ON "AIUsage"("createdAt");

CREATE INDEX "PromptTemplate_organizationId_idx" ON "PromptTemplate"("organizationId");
CREATE INDEX "PromptTemplate_category_idx" ON "PromptTemplate"("category");
CREATE INDEX "PromptTemplate_isBuiltIn_idx" ON "PromptTemplate"("isBuiltIn");
CREATE INDEX "PromptTemplate_createdAt_idx" ON "PromptTemplate"("createdAt");
