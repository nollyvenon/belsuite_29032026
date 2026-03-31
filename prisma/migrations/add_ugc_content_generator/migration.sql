CREATE TYPE "UGCProjectStatus" AS ENUM ('DRAFT', 'SCRIPTING', 'RENDERING', 'READY', 'PUBLISHED', 'FAILED');
CREATE TYPE "AvatarStyle" AS ENUM ('INFLUENCER', 'PROFESSIONAL', 'CASUAL', 'PRESENTER', 'NARRATOR');
CREATE TYPE "AvatarProvider" AS ENUM ('HEYGEN', 'DID', 'TAVUS', 'SYNTHESIA', 'MOCK');
CREATE TYPE "VoiceGender" AS ENUM ('MALE', 'FEMALE', 'NEUTRAL');
CREATE TYPE "RenderStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETE', 'FAILED');

CREATE TABLE "UGCAvatar" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "style" "AvatarStyle" NOT NULL DEFAULT 'INFLUENCER',
  "provider" "AvatarProvider" NOT NULL DEFAULT 'HEYGEN',
  "externalId" VARCHAR(255),
  "thumbnailUrl" TEXT,
  "previewVideoUrl" TEXT,
  "gender" "VoiceGender" NOT NULL DEFAULT 'FEMALE',
  "ethnicityHint" VARCHAR(128),
  "ageRange" VARCHAR(64),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UGCAvatar_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceClone" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "provider" VARCHAR(64) NOT NULL DEFAULT 'elevenlabs',
  "externalVoiceId" VARCHAR(255),
  "sampleAudioUrl" TEXT,
  "gender" "VoiceGender" NOT NULL DEFAULT 'FEMALE',
  "language" VARCHAR(16) NOT NULL DEFAULT 'en',
  "accent" VARCHAR(64),
  "stability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "similarityBoost" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
  "styleExaggeration" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VoiceClone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UGCProject" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "brandContext" TEXT,
  "avatarId" TEXT,
  "voiceCloneId" TEXT,
  "status" "UGCProjectStatus" NOT NULL DEFAULT 'DRAFT',
  "aspectRatio" VARCHAR(16) NOT NULL DEFAULT '9:16',
  "durationSeconds" INTEGER,
  "platform" VARCHAR(64),
  "outputUrl" TEXT,
  "thumbnailUrl" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UGCProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UGCScript" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
  "prompt" TEXT,
  "model" VARCHAR(128),
  "scenesJson" TEXT,
  "wordCount" INTEGER,
  "estimatedSecs" INTEGER,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UGCScript_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UGCRender" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "status" "RenderStatus" NOT NULL DEFAULT 'QUEUED',
  "provider" VARCHAR(64) NOT NULL DEFAULT 'heygen',
  "externalJobId" VARCHAR(255),
  "progress" INTEGER NOT NULL DEFAULT 0,
  "videoUrl" TEXT,
  "thumbnailUrl" TEXT,
  "durationSeconds" DOUBLE PRECISION,
  "fileSizeBytes" BIGINT,
  "settingsJson" TEXT,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UGCRender_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UGCScript_projectId_key" ON "UGCScript"("projectId");
CREATE INDEX "UGCAvatar_organizationId_idx" ON "UGCAvatar"("organizationId");
CREATE INDEX "UGCAvatar_style_idx" ON "UGCAvatar"("style");
CREATE INDEX "UGCAvatar_provider_idx" ON "UGCAvatar"("provider");
CREATE INDEX "UGCAvatar_isSystem_idx" ON "UGCAvatar"("isSystem");
CREATE INDEX "VoiceClone_organizationId_idx" ON "VoiceClone"("organizationId");
CREATE INDEX "VoiceClone_provider_idx" ON "VoiceClone"("provider");
CREATE INDEX "VoiceClone_isDefault_idx" ON "VoiceClone"("isDefault");
CREATE INDEX "UGCProject_organizationId_idx" ON "UGCProject"("organizationId");
CREATE INDEX "UGCProject_createdById_idx" ON "UGCProject"("createdById");
CREATE INDEX "UGCProject_status_idx" ON "UGCProject"("status");
CREATE INDEX "UGCProject_createdAt_idx" ON "UGCProject"("createdAt");
CREATE INDEX "UGCScript_projectId_idx" ON "UGCScript"("projectId");
CREATE INDEX "UGCRender_projectId_idx" ON "UGCRender"("projectId");
CREATE INDEX "UGCRender_status_idx" ON "UGCRender"("status");
CREATE INDEX "UGCRender_createdAt_idx" ON "UGCRender"("createdAt");

ALTER TABLE "UGCAvatar"
  ADD CONSTRAINT "UGCAvatar_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceClone"
  ADD CONSTRAINT "VoiceClone_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UGCProject"
  ADD CONSTRAINT "UGCProject_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UGCProject"
  ADD CONSTRAINT "UGCProject_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UGCProject"
  ADD CONSTRAINT "UGCProject_avatarId_fkey"
  FOREIGN KEY ("avatarId") REFERENCES "UGCAvatar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UGCProject"
  ADD CONSTRAINT "UGCProject_voiceCloneId_fkey"
  FOREIGN KEY ("voiceCloneId") REFERENCES "VoiceClone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UGCScript"
  ADD CONSTRAINT "UGCScript_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "UGCProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UGCRender"
  ADD CONSTRAINT "UGCRender_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "UGCProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;