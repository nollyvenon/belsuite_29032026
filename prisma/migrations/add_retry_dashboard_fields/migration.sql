-- Migration: Add dismissedAt to PostPublishResult and metadata to SocialAccount
-- Date: 2026-03-31

-- Allow users to acknowledge / dismiss failed publish results
ALTER TABLE "PostPublishResult" ADD COLUMN IF NOT EXISTS "dismissedAt" TIMESTAMP(3);

-- Index for efficient filtering of un-dismissed failures
CREATE INDEX IF NOT EXISTS "PostPublishResult_dismissedAt_idx"
  ON "PostPublishResult"("dismissedAt");

-- Extra JSON metadata for social accounts (e.g., WhatsApp recipients list)
ALTER TABLE "SocialAccount" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
