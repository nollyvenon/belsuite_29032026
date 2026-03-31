-- AddMarketingEngine: Ad platform accounts, campaigns, ads, A/B tests, performance, conversions, funnels

-- Enums
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "CampaignObjective" AS ENUM ('AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS', 'CONVERSIONS', 'APP_INSTALLS', 'VIDEO_VIEWS');
CREATE TYPE "AdPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'GOOGLE_SEARCH', 'GOOGLE_DISPLAY', 'GOOGLE_YOUTUBE', 'TIKTOK_ADS', 'LINKEDIN_ADS', 'TWITTER_ADS');
CREATE TYPE "AdFormat" AS ENUM ('SINGLE_IMAGE', 'CAROUSEL', 'VIDEO', 'COLLECTION', 'STORY', 'RESPONSIVE_SEARCH', 'RESPONSIVE_DISPLAY');
CREATE TYPE "AdStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'ACTIVE', 'PAUSED', 'REJECTED', 'COMPLETED');
CREATE TYPE "ABTestStatus" AS ENUM ('DRAFT', 'RUNNING', 'CONCLUDED', 'ARCHIVED');
CREATE TYPE "FunnelStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ConversionEventType" AS ENUM ('PAGE_VIEW', 'CLICK', 'FORM_SUBMIT', 'PURCHASE', 'SIGNUP', 'DOWNLOAD', 'PHONE_CALL', 'VIDEO_PLAY', 'CUSTOM');

-- AdPlatformAccount
CREATE TABLE "AdPlatformAccount" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid(),
  "organizationId"  TEXT NOT NULL,
  "platform"        "AdPlatform" NOT NULL,
  "accountId"       VARCHAR(128) NOT NULL,
  "accountName"     VARCHAR(255) NOT NULL,
  "currencyCode"    VARCHAR(8) NOT NULL DEFAULT 'USD',
  "timezone"        TEXT NOT NULL DEFAULT 'UTC',
  "accessToken"     TEXT NOT NULL,
  "refreshToken"    TEXT,
  "tokenExpiresAt"  TIMESTAMP(3),
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "syncedAt"        TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "AdPlatformAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdPlatformAccount_orgId_platform_accountId_key" ON "AdPlatformAccount"("organizationId", "platform", "accountId");
CREATE INDEX "AdPlatformAccount_organizationId_idx" ON "AdPlatformAccount"("organizationId");
CREATE INDEX "AdPlatformAccount_platform_idx" ON "AdPlatformAccount"("platform");
ALTER TABLE "AdPlatformAccount" ADD CONSTRAINT "AdPlatformAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

-- MarketingCampaign
CREATE TABLE "MarketingCampaign" (
  "id"                   TEXT NOT NULL DEFAULT gen_random_uuid(),
  "organizationId"       TEXT NOT NULL,
  "adAccountId"          TEXT,
  "name"                 VARCHAR(255) NOT NULL,
  "description"          TEXT,
  "objective"            "CampaignObjective" NOT NULL,
  "status"               "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "dailyBudget"          DOUBLE PRECISION,
  "totalBudget"          DOUBLE PRECISION,
  "spentBudget"          DOUBLE PRECISION NOT NULL DEFAULT 0,
  "startDate"            TIMESTAMP(3),
  "endDate"              TIMESTAMP(3),
  "audienceJson"         TEXT,
  "platformCampaignId"   VARCHAR(255),
  "aiGenerated"          BOOLEAN NOT NULL DEFAULT false,
  "aiNotes"              TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MarketingCampaign_organizationId_idx" ON "MarketingCampaign"("organizationId");
CREATE INDEX "MarketingCampaign_status_idx" ON "MarketingCampaign"("status");
CREATE INDEX "MarketingCampaign_startDate_idx" ON "MarketingCampaign"("startDate");
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdPlatformAccount"("id") ON DELETE SET NULL;

-- Ad
CREATE TABLE "Ad" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid(),
  "campaignId"       TEXT NOT NULL,
  "name"             VARCHAR(255) NOT NULL,
  "format"           "AdFormat" NOT NULL,
  "status"           "AdStatus" NOT NULL DEFAULT 'DRAFT',
  "headline"         VARCHAR(512),
  "body"             TEXT,
  "callToAction"     VARCHAR(64),
  "destinationUrl"   TEXT,
  "creativeAssets"   TEXT,
  "aiGenerated"      BOOLEAN NOT NULL DEFAULT false,
  "aiPrompt"         TEXT,
  "aiScore"          DOUBLE PRECISION,
  "platformAdId"     VARCHAR(255),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Ad_campaignId_idx" ON "Ad"("campaignId");
CREATE INDEX "Ad_status_idx" ON "Ad"("status");
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE;

-- ABTest
CREATE TABLE "ABTest" (
  "id"                  TEXT NOT NULL DEFAULT gen_random_uuid(),
  "campaignId"          TEXT NOT NULL,
  "name"                VARCHAR(255) NOT NULL,
  "hypothesis"          TEXT,
  "metric"              VARCHAR(64) NOT NULL,
  "status"              "ABTestStatus" NOT NULL DEFAULT 'DRAFT',
  "confidenceLevel"     DOUBLE PRECISION NOT NULL DEFAULT 0.95,
  "minimumSampleSize"   INTEGER NOT NULL DEFAULT 1000,
  "trafficSplit"        TEXT NOT NULL,
  "winnerVariantId"     TEXT,
  "pValue"              DOUBLE PRECISION,
  "statisticalPower"    DOUBLE PRECISION,
  "conclusionNotes"     TEXT,
  "startedAt"           TIMESTAMP(3),
  "concludedAt"         TIMESTAMP(3),
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "ABTest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ABTest_campaignId_idx" ON "ABTest"("campaignId");
CREATE INDEX "ABTest_status_idx" ON "ABTest"("status");
ALTER TABLE "ABTest" ADD CONSTRAINT "ABTest_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE;

-- AdVariant
CREATE TABLE "AdVariant" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid(),
  "adId"             TEXT NOT NULL,
  "abTestId"         TEXT,
  "label"            VARCHAR(64) NOT NULL,
  "headline"         VARCHAR(512),
  "body"             TEXT,
  "callToAction"     VARCHAR(64),
  "creativeAssets"   TEXT,
  "impressions"      INTEGER NOT NULL DEFAULT 0,
  "clicks"           INTEGER NOT NULL DEFAULT 0,
  "conversions"      INTEGER NOT NULL DEFAULT 0,
  "spend"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isWinner"         BOOLEAN NOT NULL DEFAULT false,
  "isControl"        BOOLEAN NOT NULL DEFAULT false,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "AdVariant_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AdVariant_adId_idx" ON "AdVariant"("adId");
CREATE INDEX "AdVariant_abTestId_idx" ON "AdVariant"("abTestId");
ALTER TABLE "AdVariant" ADD CONSTRAINT "AdVariant_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE;
ALTER TABLE "AdVariant" ADD CONSTRAINT "AdVariant_abTestId_fkey" FOREIGN KEY ("abTestId") REFERENCES "ABTest"("id") ON DELETE SET NULL;

-- CampaignPerformance
CREATE TABLE "CampaignPerformance" (
  "id"                  TEXT NOT NULL DEFAULT gen_random_uuid(),
  "campaignId"          TEXT NOT NULL,
  "date"                DATE NOT NULL,
  "impressions"         INTEGER NOT NULL DEFAULT 0,
  "clicks"              INTEGER NOT NULL DEFAULT 0,
  "conversions"         INTEGER NOT NULL DEFAULT 0,
  "spend"               DOUBLE PRECISION NOT NULL DEFAULT 0,
  "revenue"             DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ctr"                 DOUBLE PRECISION NOT NULL DEFAULT 0,
  "cpc"                 DOUBLE PRECISION NOT NULL DEFAULT 0,
  "cpa"                 DOUBLE PRECISION NOT NULL DEFAULT 0,
  "roas"                DOUBLE PRECISION NOT NULL DEFAULT 0,
  "platformBreakdown"   TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "CampaignPerformance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CampaignPerformance_campaignId_date_key" ON "CampaignPerformance"("campaignId", "date");
CREATE INDEX "CampaignPerformance_campaignId_idx" ON "CampaignPerformance"("campaignId");
CREATE INDEX "CampaignPerformance_date_idx" ON "CampaignPerformance"("date");
ALTER TABLE "CampaignPerformance" ADD CONSTRAINT "CampaignPerformance_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE;

-- AdPerformance
CREATE TABLE "AdPerformance" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid(),
  "adId"             TEXT NOT NULL,
  "date"             DATE NOT NULL,
  "impressions"      INTEGER NOT NULL DEFAULT 0,
  "clicks"           INTEGER NOT NULL DEFAULT 0,
  "conversions"      INTEGER NOT NULL DEFAULT 0,
  "spend"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "revenue"          DOUBLE PRECISION NOT NULL DEFAULT 0,
  "frequency"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "AdPerformance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdPerformance_adId_date_key" ON "AdPerformance"("adId", "date");
CREATE INDEX "AdPerformance_adId_idx" ON "AdPerformance"("adId");
CREATE INDEX "AdPerformance_date_idx" ON "AdPerformance"("date");
ALTER TABLE "AdPerformance" ADD CONSTRAINT "AdPerformance_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE;

-- ConversionEvent
CREATE TABLE "ConversionEvent" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid(),
  "organizationId"   TEXT NOT NULL,
  "adId"             TEXT,
  "eventType"        "ConversionEventType" NOT NULL,
  "eventName"        VARCHAR(128),
  "funnelPageId"     VARCHAR(255),
  "utmSource"        VARCHAR(128),
  "utmMedium"        VARCHAR(128),
  "utmCampaign"      VARCHAR(255),
  "utmContent"       VARCHAR(255),
  "utmTerm"          VARCHAR(255),
  "clickId"          VARCHAR(255),
  "sessionId"        VARCHAR(255),
  "visitorId"        VARCHAR(255),
  "ipAddress"        VARCHAR(64),
  "userAgent"        TEXT,
  "referrer"         TEXT,
  "pageUrl"          TEXT,
  "value"            DOUBLE PRECISION,
  "currency"         VARCHAR(8),
  "metadataJson"     TEXT,
  "occurredAt"       TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "ConversionEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ConversionEvent_organizationId_idx" ON "ConversionEvent"("organizationId");
CREATE INDEX "ConversionEvent_adId_idx" ON "ConversionEvent"("adId");
CREATE INDEX "ConversionEvent_eventType_idx" ON "ConversionEvent"("eventType");
CREATE INDEX "ConversionEvent_occurredAt_idx" ON "ConversionEvent"("occurredAt");
CREATE INDEX "ConversionEvent_utmCampaign_idx" ON "ConversionEvent"("utmCampaign");
ALTER TABLE "ConversionEvent" ADD CONSTRAINT "ConversionEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;
ALTER TABLE "ConversionEvent" ADD CONSTRAINT "ConversionEvent_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE SET NULL;

-- Funnel
CREATE TABLE "Funnel" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid(),
  "organizationId"   TEXT NOT NULL,
  "name"             VARCHAR(255) NOT NULL,
  "description"      TEXT,
  "status"           "FunnelStatus" NOT NULL DEFAULT 'DRAFT',
  "slug"             VARCHAR(128) NOT NULL,
  "domain"           VARCHAR(255),
  "themeJson"        TEXT,
  "aiGenerated"      BOOLEAN NOT NULL DEFAULT false,
  "publishedAt"      TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "Funnel_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Funnel_orgId_slug_key" ON "Funnel"("organizationId", "slug");
CREATE INDEX "Funnel_organizationId_idx" ON "Funnel"("organizationId");
CREATE INDEX "Funnel_status_idx" ON "Funnel"("status");
ALTER TABLE "Funnel" ADD CONSTRAINT "Funnel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

-- FunnelPage
CREATE TABLE "FunnelPage" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid(),
  "funnelId"          TEXT NOT NULL,
  "order"             INTEGER NOT NULL,
  "pageType"          VARCHAR(64) NOT NULL,
  "title"             VARCHAR(255) NOT NULL,
  "slug"              VARCHAR(128) NOT NULL,
  "blocksJson"        TEXT,
  "ctaText"           VARCHAR(128),
  "ctaUrl"            TEXT,
  "nextPageId"        VARCHAR(255),
  "views"             INTEGER NOT NULL DEFAULT 0,
  "conversions"       INTEGER NOT NULL DEFAULT 0,
  "metaTitle"         VARCHAR(255),
  "metaDescription"   TEXT,
  "aiGenerated"       BOOLEAN NOT NULL DEFAULT false,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "FunnelPage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FunnelPage_funnelId_slug_key" ON "FunnelPage"("funnelId", "slug");
CREATE INDEX "FunnelPage_funnelId_idx" ON "FunnelPage"("funnelId");
CREATE INDEX "FunnelPage_order_idx" ON "FunnelPage"("order");
ALTER TABLE "FunnelPage" ADD CONSTRAINT "FunnelPage_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "Funnel"("id") ON DELETE CASCADE;

-- FunnelMetrics
CREATE TABLE "FunnelMetrics" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid(),
  "funnelId"         TEXT NOT NULL,
  "date"             DATE NOT NULL,
  "pageId"           VARCHAR(255),
  "views"            INTEGER NOT NULL DEFAULT 0,
  "uniqueVisitors"   INTEGER NOT NULL DEFAULT 0,
  "conversions"      INTEGER NOT NULL DEFAULT 0,
  "exits"            INTEGER NOT NULL DEFAULT 0,
  "bounces"          INTEGER NOT NULL DEFAULT 0,
  "avgTimeOnPage"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "FunnelMetrics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FunnelMetrics_funnelId_date_pageId_key" ON "FunnelMetrics"("funnelId", "date", "pageId");
CREATE INDEX "FunnelMetrics_funnelId_idx" ON "FunnelMetrics"("funnelId");
CREATE INDEX "FunnelMetrics_date_idx" ON "FunnelMetrics"("date");
ALTER TABLE "FunnelMetrics" ADD CONSTRAINT "FunnelMetrics_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "Funnel"("id") ON DELETE CASCADE;
