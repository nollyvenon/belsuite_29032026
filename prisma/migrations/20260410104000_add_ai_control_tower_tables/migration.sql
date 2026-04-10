-- AI Control Tower canonical tables

CREATE TABLE IF NOT EXISTS "public"."AITask" (
  "id" TEXT NOT NULL DEFAULT md5(random()::text || clock_timestamp()::text),
  "taskKey" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AITask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AITask_taskKey_key" ON "public"."AITask"("taskKey");
CREATE INDEX IF NOT EXISTS "AITask_isActive_idx" ON "public"."AITask"("isActive");

CREATE TABLE IF NOT EXISTS "public"."AIRoutingRule" (
  "id" TEXT NOT NULL DEFAULT md5(random()::text || clock_timestamp()::text),
  "taskKey" TEXT NOT NULL,
  "primaryModelId" TEXT NOT NULL,
  "fallbackModelIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "strategy" TEXT NOT NULL DEFAULT 'balanced',
  "maxCostUsdPerRequest" DOUBLE PRECISION,
  "maxLatencyMs" INTEGER,
  "qualityThreshold" DOUBLE PRECISION,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIRoutingRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AIRoutingRule_taskKey_idx" ON "public"."AIRoutingRule"("taskKey");
CREATE INDEX IF NOT EXISTS "AIRoutingRule_isActive_idx" ON "public"."AIRoutingRule"("isActive");

CREATE TABLE IF NOT EXISTS "public"."AIUsageLog" (
  "id" TEXT NOT NULL DEFAULT md5(random()::text || clock_timestamp()::text),
  "organizationId" TEXT NOT NULL,
  "userId" TEXT,
  "taskKey" TEXT NOT NULL,
  "featureKey" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "modelRef" TEXT NOT NULL,
  "requestId" TEXT,
  "inputTokens" INTEGER NOT NULL DEFAULT 0,
  "outputTokens" INTEGER NOT NULL DEFAULT 0,
  "totalTokens" INTEGER NOT NULL DEFAULT 0,
  "requestCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "requestRevenueUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "marginUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "latencyMs" INTEGER NOT NULL DEFAULT 0,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AIUsageLog_organizationId_idx" ON "public"."AIUsageLog"("organizationId");
CREATE INDEX IF NOT EXISTS "AIUsageLog_taskKey_idx" ON "public"."AIUsageLog"("taskKey");
CREATE INDEX IF NOT EXISTS "AIUsageLog_provider_idx" ON "public"."AIUsageLog"("provider");
CREATE INDEX IF NOT EXISTS "AIUsageLog_modelRef_idx" ON "public"."AIUsageLog"("modelRef");
CREATE INDEX IF NOT EXISTS "AIUsageLog_createdAt_idx" ON "public"."AIUsageLog"("createdAt");
