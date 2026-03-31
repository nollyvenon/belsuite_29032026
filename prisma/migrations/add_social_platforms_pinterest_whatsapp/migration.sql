-- Migration: Add PINTEREST and WHATSAPP to SocialPlatform enum
-- Date: 2026-03-31

-- Step 1: Add new enum values (PostgreSQL requires ALTER TYPE for enum additions)
ALTER TYPE "SocialPlatform" ADD VALUE IF NOT EXISTS 'PINTEREST';
ALTER TYPE "SocialPlatform" ADD VALUE IF NOT EXISTS 'WHATSAPP';
