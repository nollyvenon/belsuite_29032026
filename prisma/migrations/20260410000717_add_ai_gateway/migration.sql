-- CreateEnum
CREATE TYPE "public"."ContentActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'RESTORE', 'COMMENT', 'SCHEDULE', 'AUTOSAVE', 'OTHER');

-- CreateTable
CREATE TABLE "public"."ContentActivityLog" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "public"."ContentActionType" NOT NULL,
    "message" TEXT,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIGatewayModel" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiIdentifier" TEXT NOT NULL,
    "taskTypes" TEXT[],
    "capabilities" TEXT[],
    "costPerInputToken" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costPerOutputToken" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "speedScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "maxContextTokens" INTEGER NOT NULL DEFAULT 4096,
    "maxOutputTokens" INTEGER NOT NULL DEFAULT 1024,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIGatewayModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIGatewayRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "failoverUsed" BOOLEAN NOT NULL DEFAULT false,
    "failoverFrom" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "promptHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIGatewayRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIBudgetConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "dailyLimitUsd" DOUBLE PRECISION,
    "monthlyLimitUsd" DOUBLE PRECISION,
    "perRequestLimitUsd" DOUBLE PRECISION,
    "alertThresholdPct" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "blockOnExceed" BOOLEAN NOT NULL DEFAULT false,
    "notifyEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIBudgetConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIProviderHealth" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "isHealthy" BOOLEAN NOT NULL DEFAULT true,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "successRatePct" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "avgLatencyMs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "p95LatencyMs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "totalFailures" INTEGER NOT NULL DEFAULT 0,
    "circuitBreakerState" TEXT NOT NULL DEFAULT 'CLOSED',
    "circuitOpenedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIProviderHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIFeatureModelAssignment" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "primaryModelId" TEXT NOT NULL,
    "fallbackModelId" TEXT,
    "routingStrategy" TEXT NOT NULL DEFAULT 'balanced',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIFeatureModelAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentActivityLog_contentId_idx" ON "public"."ContentActivityLog"("contentId");

-- CreateIndex
CREATE INDEX "ContentActivityLog_organizationId_idx" ON "public"."ContentActivityLog"("organizationId");

-- CreateIndex
CREATE INDEX "ContentActivityLog_userId_idx" ON "public"."ContentActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ContentActivityLog_action_idx" ON "public"."ContentActivityLog"("action");

-- CreateIndex
CREATE INDEX "ContentActivityLog_createdAt_idx" ON "public"."ContentActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "AIGatewayModel_provider_idx" ON "public"."AIGatewayModel"("provider");

-- CreateIndex
CREATE INDEX "AIGatewayModel_isEnabled_idx" ON "public"."AIGatewayModel"("isEnabled");

-- CreateIndex
CREATE INDEX "AIGatewayRequest_organizationId_idx" ON "public"."AIGatewayRequest"("organizationId");

-- CreateIndex
CREATE INDEX "AIGatewayRequest_modelId_idx" ON "public"."AIGatewayRequest"("modelId");

-- CreateIndex
CREATE INDEX "AIGatewayRequest_feature_idx" ON "public"."AIGatewayRequest"("feature");

-- CreateIndex
CREATE INDEX "AIGatewayRequest_taskType_idx" ON "public"."AIGatewayRequest"("taskType");

-- CreateIndex
CREATE INDEX "AIGatewayRequest_createdAt_idx" ON "public"."AIGatewayRequest"("createdAt");

-- CreateIndex
CREATE INDEX "AIGatewayRequest_success_idx" ON "public"."AIGatewayRequest"("success");

-- CreateIndex
CREATE INDEX "AIGatewayRequest_cacheHit_idx" ON "public"."AIGatewayRequest"("cacheHit");

-- CreateIndex
CREATE UNIQUE INDEX "AIBudgetConfig_organizationId_key" ON "public"."AIBudgetConfig"("organizationId");

-- CreateIndex
CREATE INDEX "AIBudgetConfig_organizationId_idx" ON "public"."AIBudgetConfig"("organizationId");

-- CreateIndex
CREATE INDEX "AIBudgetConfig_isActive_idx" ON "public"."AIBudgetConfig"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AIProviderHealth_modelId_key" ON "public"."AIProviderHealth"("modelId");

-- CreateIndex
CREATE INDEX "AIProviderHealth_isHealthy_idx" ON "public"."AIProviderHealth"("isHealthy");

-- CreateIndex
CREATE INDEX "AIProviderHealth_circuitBreakerState_idx" ON "public"."AIProviderHealth"("circuitBreakerState");

-- CreateIndex
CREATE UNIQUE INDEX "AIFeatureModelAssignment_feature_key" ON "public"."AIFeatureModelAssignment"("feature");

-- CreateIndex
CREATE INDEX "AIFeatureModelAssignment_feature_idx" ON "public"."AIFeatureModelAssignment"("feature");

-- CreateIndex
CREATE INDEX "AIFeatureModelAssignment_isActive_idx" ON "public"."AIFeatureModelAssignment"("isActive");

-- AddForeignKey
ALTER TABLE "public"."ContentActivityLog" ADD CONSTRAINT "ContentActivityLog_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentActivityLog" ADD CONSTRAINT "ContentActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIGatewayRequest" ADD CONSTRAINT "AIGatewayRequest_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "public"."AIGatewayModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIProviderHealth" ADD CONSTRAINT "AIProviderHealth_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "public"."AIGatewayModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIFeatureModelAssignment" ADD CONSTRAINT "AIFeatureModelAssignment_primaryModelId_fkey" FOREIGN KEY ("primaryModelId") REFERENCES "public"."AIGatewayModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIFeatureModelAssignment" ADD CONSTRAINT "AIFeatureModelAssignment_fallbackModelId_fkey" FOREIGN KEY ("fallbackModelId") REFERENCES "public"."AIGatewayModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
