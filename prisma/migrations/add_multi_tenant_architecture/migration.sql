-- Multi-Tenant Architecture Migration
-- Adds domain mapping, tenant usage, rate limits, onboarding, and extends Organization

-- ============================================================================
-- ORGANIZATION: add multi-tenant fields
-- ============================================================================

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "email"                 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "isActive"              BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "encryptionKey"         VARCHAR(128),
  ADD COLUMN IF NOT EXISTS "metadata"              TEXT,
  ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Organization_isActive_idx" ON "Organization"("isActive");

-- ============================================================================
-- ENUM: DomainType
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "DomainType" AS ENUM ('SUBDOMAIN', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- ENUM: OnboardingStep
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "OnboardingStep" AS ENUM (
    'WELCOME', 'COMPANY_INFO', 'DOMAIN_SETUP',
    'TEAM_SETUP', 'PAYMENT_SETUP', 'FEATURE_SELECTION', 'COMPLETED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- TABLE: DomainMapping
-- ============================================================================

CREATE TABLE IF NOT EXISTS "DomainMapping" (
  "id"                   TEXT NOT NULL,
  "organizationId"       TEXT NOT NULL,
  "domain"               VARCHAR(255),
  "domainType"           "DomainType" NOT NULL DEFAULT 'SUBDOMAIN',
  "subdomain"            VARCHAR(128),
  "baseDomain"           VARCHAR(255),

  -- SSL / TLS
  "sslCertificate"       TEXT,
  "sslPrivateKey"        TEXT,
  "sslExpiresAt"         TIMESTAMP(3),
  "certificateProvider"  VARCHAR(64) NOT NULL DEFAULT 'letsencrypt',

  -- DNS verification
  "dnsCnameRecord"       VARCHAR(255),
  "dnsVerificationToken" VARCHAR(128),
  "dnsVerificationRecord" VARCHAR(255),
  "dnsVerified"          BOOLEAN NOT NULL DEFAULT false,
  "dnsVerifiedAt"        TIMESTAMP(3),
  "sslVerified"          BOOLEAN NOT NULL DEFAULT false,

  -- Status
  "isActive"             BOOLEAN NOT NULL DEFAULT true,
  "isPrimary"            BOOLEAN NOT NULL DEFAULT false,

  -- Redirects
  "redirectTo"           VARCHAR(255),
  "redirectUrl"          VARCHAR(255),

  -- Audit
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  "verifiedBy"           TEXT,
  "verifiedAt"           TIMESTAMP(3),

  CONSTRAINT "DomainMapping_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DomainMapping_domain_key" UNIQUE ("domain"),
  CONSTRAINT "DomainMapping_subdomain_key" UNIQUE ("subdomain"),
  CONSTRAINT "DomainMapping_organizationId_domainType_subdomain_key"
    UNIQUE ("organizationId", "domainType", "subdomain"),
  CONSTRAINT "DomainMapping_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "DomainMapping_organizationId_idx" ON "DomainMapping"("organizationId");
CREATE INDEX IF NOT EXISTS "DomainMapping_domain_idx"         ON "DomainMapping"("domain");
CREATE INDEX IF NOT EXISTS "DomainMapping_subdomain_idx"      ON "DomainMapping"("subdomain");
CREATE INDEX IF NOT EXISTS "DomainMapping_isActive_idx"       ON "DomainMapping"("isActive");
CREATE INDEX IF NOT EXISTS "DomainMapping_isPrimary_idx"      ON "DomainMapping"("isPrimary");

-- ============================================================================
-- TABLE: TenantUsage
-- ============================================================================

CREATE TABLE IF NOT EXISTS "TenantUsage" (
  "id"               TEXT NOT NULL,
  "organizationId"   TEXT NOT NULL,
  "period"           VARCHAR(10) NOT NULL,   -- YYYY-MM
  "startDate"        TIMESTAMP(3) NOT NULL,
  "endDate"          TIMESTAMP(3) NOT NULL,
  "aiTokensUsed"     INTEGER NOT NULL DEFAULT 0,
  "aiRequestsCount"  INTEGER NOT NULL DEFAULT 0,
  "storageUsedBytes" BIGINT NOT NULL DEFAULT 0,
  "apiCallsCount"    INTEGER NOT NULL DEFAULT 0,
  "apiErrorCount"    INTEGER NOT NULL DEFAULT 0,
  "emailsSent"       INTEGER NOT NULL DEFAULT 0,
  "emailsDelivered"  INTEGER NOT NULL DEFAULT 0,
  "emailsBounced"    INTEGER NOT NULL DEFAULT 0,
  "emailsOpened"     INTEGER NOT NULL DEFAULT 0,
  "emailsClicked"    INTEGER NOT NULL DEFAULT 0,
  "contentCount"     INTEGER NOT NULL DEFAULT 0,
  "activeUsers"      INTEGER NOT NULL DEFAULT 0,
  "estimatedCost"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "metadata"         TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TenantUsage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TenantUsage_organizationId_period_key" UNIQUE ("organizationId", "period"),
  CONSTRAINT "TenantUsage_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "TenantUsage_organizationId_idx" ON "TenantUsage"("organizationId");
CREATE INDEX IF NOT EXISTS "TenantUsage_period_idx"         ON "TenantUsage"("period");
CREATE INDEX IF NOT EXISTS "TenantUsage_startDate_idx"      ON "TenantUsage"("startDate");

-- ============================================================================
-- TABLE: TenantRateLimitQuota
-- ============================================================================

CREATE TABLE IF NOT EXISTS "TenantRateLimitQuota" (
  "id"                     TEXT NOT NULL,
  "organizationId"         TEXT NOT NULL,
  "apiRequestsPerMinute"   INTEGER NOT NULL DEFAULT 100,
  "apiRequestsPerHour"     INTEGER NOT NULL DEFAULT 10000,
  "apiRequestsPerDay"      INTEGER NOT NULL DEFAULT 1000000,
  "emailsPerMinute"        INTEGER NOT NULL DEFAULT 100,
  "emailsPerHour"          INTEGER NOT NULL DEFAULT 10000,
  "emailsPerDay"           INTEGER NOT NULL DEFAULT 1000000,
  "aiTokensPerMinute"      INTEGER NOT NULL DEFAULT 5000,
  "aiTokensPerHour"        INTEGER NOT NULL DEFAULT 500000,
  "aiTokensPerDay"         INTEGER NOT NULL DEFAULT 10000000,
  "maxStorageGB"           DOUBLE PRECISION NOT NULL DEFAULT 10,
  "maxConcurrentRequests"  INTEGER NOT NULL DEFAULT 100,
  "maxConcurrentUploads"   INTEGER NOT NULL DEFAULT 10,
  "customLimits"           TEXT,
  "enforceRateLimits"      BOOLEAN NOT NULL DEFAULT true,
  "softLimitNotifyAt"      INTEGER NOT NULL DEFAULT 80,
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP(3) NOT NULL,
  "effectiveFrom"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveUntil"         TIMESTAMP(3),

  CONSTRAINT "TenantRateLimitQuota_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TenantRateLimitQuota_organizationId_key" UNIQUE ("organizationId"),
  CONSTRAINT "TenantRateLimitQuota_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "TenantRateLimitQuota_organizationId_idx" ON "TenantRateLimitQuota"("organizationId");
CREATE INDEX IF NOT EXISTS "TenantRateLimitQuota_effectiveFrom_idx"  ON "TenantRateLimitQuota"("effectiveFrom");

-- ============================================================================
-- TABLE: TenantRateLimitUsage
-- ============================================================================

CREATE TABLE IF NOT EXISTS "TenantRateLimitUsage" (
  "id"                  TEXT NOT NULL,
  "organizationId"      TEXT NOT NULL,
  "period"              VARCHAR(20) NOT NULL,  -- MINUTE | HOUR | DAY
  "periodStart"         TIMESTAMP(3) NOT NULL,
  "periodEnd"           TIMESTAMP(3) NOT NULL,
  "apiRequestsUsed"     INTEGER NOT NULL DEFAULT 0,
  "emailsUsed"          INTEGER NOT NULL DEFAULT 0,
  "aiTokensUsed"        INTEGER NOT NULL DEFAULT 0,
  "storageUsedGB"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "concurrentRequests"  INTEGER NOT NULL DEFAULT 0,
  "concurrentUploads"   INTEGER NOT NULL DEFAULT 0,
  "limitExceededCount"  INTEGER NOT NULL DEFAULT 0,
  "lastExceededAt"      TIMESTAMP(3),
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TenantRateLimitUsage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TenantRateLimitUsage_organizationId_period_periodStart_key"
    UNIQUE ("organizationId", "period", "periodStart"),
  CONSTRAINT "TenantRateLimitUsage_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "TenantRateLimitUsage_organizationId_idx" ON "TenantRateLimitUsage"("organizationId");
CREATE INDEX IF NOT EXISTS "TenantRateLimitUsage_periodStart_idx"    ON "TenantRateLimitUsage"("periodStart");
CREATE INDEX IF NOT EXISTS "TenantRateLimitUsage_period_idx"         ON "TenantRateLimitUsage"("period");

-- ============================================================================
-- TABLE: TenantOnboarding
-- ============================================================================

CREATE TABLE IF NOT EXISTS "TenantOnboarding" (
  "id"                  TEXT NOT NULL,
  "organizationId"      TEXT NOT NULL,
  "step"                "OnboardingStep" NOT NULL DEFAULT 'WELCOME',
  "completed"           BOOLEAN NOT NULL DEFAULT false,
  "completedAt"         TIMESTAMP(3),
  "companyName"         TEXT,
  "companyWebsite"      TEXT,
  "companyLogo"         TEXT,
  "industry"            TEXT,
  "subdomainChosen"     TEXT,
  "customDomainChosen"  TEXT,
  "defaultLanguage"     TEXT NOT NULL DEFAULT 'en',
  "defaultTimezone"     TEXT NOT NULL DEFAULT 'UTC',
  "billingMethodAdded"  BOOLEAN NOT NULL DEFAULT false,
  "paymentMethodId"     TEXT,
  "teamMembersInvited"  BOOLEAN NOT NULL DEFAULT false,
  "invitedMembersCount" INTEGER NOT NULL DEFAULT 0,
  "featurePreferences"  TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,
  "startedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "abandonedAt"         TIMESTAMP(3),

  CONSTRAINT "TenantOnboarding_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TenantOnboarding_organizationId_key" UNIQUE ("organizationId"),
  CONSTRAINT "TenantOnboarding_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "TenantOnboarding_organizationId_idx" ON "TenantOnboarding"("organizationId");
CREATE INDEX IF NOT EXISTS "TenantOnboarding_step_idx"           ON "TenantOnboarding"("step");
CREATE INDEX IF NOT EXISTS "TenantOnboarding_completed_idx"      ON "TenantOnboarding"("completed");

-- ============================================================================
-- TABLE: ApiRateLimitState  (real-time in-flight tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ApiRateLimitState" (
  "id"               TEXT NOT NULL,
  "organizationId"   TEXT NOT NULL,
  "windowStart"      TIMESTAMP(3) NOT NULL,
  "windowEnd"        TIMESTAMP(3) NOT NULL,
  "requestCount"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ApiRateLimitState_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ApiRateLimitState_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ApiRateLimitState_organizationId_idx" ON "ApiRateLimitState"("organizationId");
CREATE INDEX IF NOT EXISTS "ApiRateLimitState_windowStart_idx"    ON "ApiRateLimitState"("windowStart");
