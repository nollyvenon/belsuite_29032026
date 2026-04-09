-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "public"."OAuthProvider" AS ENUM ('GOOGLE', 'APPLE', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "public"."TwoFactorMethod" AS ENUM ('TOTP', 'EMAIL');

-- CreateEnum
CREATE TYPE "public"."DeviceType" AS ENUM ('MOBILE', 'DESKTOP', 'TABLET', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."OrgStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INVITED', 'PENDING_ACCEPTANCE');

-- CreateEnum
CREATE TYPE "public"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'PAST_DUE', 'TRIAL');

-- CreateEnum
CREATE TYPE "public"."PaymentProvider" AS ENUM ('STRIPE', 'PAYSTACK', 'FLUTTERWAVE', 'PAYPAL', 'SOFORT', 'CRYPTO');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ContentType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL', 'STORY', 'REELS', 'AUTOMATION_TEMPLATE');

-- CreateEnum
CREATE TYPE "public"."ContentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'THUMBNAIL');

-- CreateEnum
CREATE TYPE "public"."WorkflowType" AS ENUM ('SCHEDULING', 'CONDITIONAL', 'SEQUENCE', 'TRIGGER_BASED', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "public"."RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "public"."EmailStatus" AS ENUM ('PENDING', 'QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'SPAM', 'OPENED');

-- CreateEnum
CREATE TYPE "public"."EmailProvider" AS ENUM ('SENDGRID', 'MAILGUN', 'SES', 'POSTMARK', 'SENDMAIL', 'SMTP');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('WELCOME', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_CANCELLED', 'SUBSCRIPTION_EXPIRING', 'CONTENT_PUBLISHED', 'SYSTEM_ALERT', 'MARKETING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."DomainType" AS ENUM ('SUBDOMAIN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."OnboardingStep" AS ENUM ('WELCOME', 'COMPANY_INFO', 'DOMAIN_SETUP', 'TEAM_SETUP', 'PAYMENT_SETUP', 'FEATURE_SELECTION', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."VideoStatus" AS ENUM ('DRAFT', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."VideoJobType" AS ENUM ('RENDER', 'GENERATE_SCENE', 'GENERATE_AUDIO', 'GENERATE_SUBS', 'TRANSCODE', 'THUMBNAIL');

-- CreateEnum
CREATE TYPE "public"."VideoJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."VideoMediaType" AS ENUM ('VIDEO_CLIP', 'AUDIO_CLIP', 'IMAGE', 'SUBTITLE_TRACK', 'VOICEOVER', 'BACKGROUND_MUSIC');

-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."CampaignObjective" AS ENUM ('AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS', 'CONVERSIONS', 'APP_INSTALLS', 'VIDEO_VIEWS');

-- CreateEnum
CREATE TYPE "public"."AdPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'GOOGLE_SEARCH', 'GOOGLE_DISPLAY', 'GOOGLE_YOUTUBE', 'TIKTOK_ADS', 'LINKEDIN_ADS', 'TWITTER_ADS');

-- CreateEnum
CREATE TYPE "public"."AdFormat" AS ENUM ('SINGLE_IMAGE', 'CAROUSEL', 'VIDEO', 'COLLECTION', 'STORY', 'RESPONSIVE_SEARCH', 'RESPONSIVE_DISPLAY');

-- CreateEnum
CREATE TYPE "public"."AdStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'ACTIVE', 'PAUSED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."ABTestStatus" AS ENUM ('DRAFT', 'RUNNING', 'CONCLUDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."FunnelStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ConversionEventType" AS ENUM ('PAGE_VIEW', 'CLICK', 'FORM_SUBMIT', 'PURCHASE', 'SIGNUP', 'DOWNLOAD', 'PHONE_CALL', 'VIDEO_PLAY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."SocialPlatform" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'PINTEREST', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "public"."PostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PublishStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "public"."BulkBatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."UGCProjectStatus" AS ENUM ('DRAFT', 'SCRIPTING', 'RENDERING', 'READY', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."AvatarStyle" AS ENUM ('INFLUENCER', 'PROFESSIONAL', 'CASUAL', 'PRESENTER', 'NARRATOR');

-- CreateEnum
CREATE TYPE "public"."AvatarProvider" AS ENUM ('HEYGEN', 'DID', 'TAVUS', 'SYNTHESIA', 'MOCK');

-- CreateEnum
CREATE TYPE "public"."VoiceGender" AS ENUM ('MALE', 'FEMALE', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "public"."RenderStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."DealStage" AS ENUM ('PROSPECTING', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "public"."DealPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('EMAIL_SENT', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'CALL_MADE', 'CALL_RECEIVED', 'NOTE_ADDED', 'DEAL_CREATED', 'DEAL_STAGE_CHANGED', 'MEETING_SCHEDULED', 'FORM_SUBMITTED', 'PAGE_VISITED', 'TASK_CREATED', 'TASK_COMPLETED', 'SMS_SENT', 'SEQUENCE_ENROLLED');

-- CreateEnum
CREATE TYPE "public"."InboundCallStatus" AS ENUM ('RINGING', 'ANSWERED', 'MISSED', 'VOICEMAIL', 'TRANSFERRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."ReferralStatus" AS ENUM ('PENDING', 'SIGNED_UP', 'CONVERTED', 'PAID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."TeamRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR', 'VIEWER', 'APPROVER');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TeamInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."ContentVersion" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "body" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "phoneNumber" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "refreshTokenHash" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" VARCHAR(64),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "public"."OAuthProvider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "avatar" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TwoFactorSecret" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "enabledAt" TIMESTAMP(3),
    "method" "public"."TwoFactorMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwoFactorSecret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TwoFactorBackupCode" (
    "id" TEXT NOT NULL,
    "twoFactorId" TEXT NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TwoFactorBackupCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeviceSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "deviceName" TEXT,
    "deviceType" "public"."DeviceType" NOT NULL,
    "osName" TEXT,
    "osVersion" TEXT,
    "browserName" TEXT,
    "browserVersion" TEXT,
    "ipAddress" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "userAgent" TEXT NOT NULL,
    "isTrusted" BOOLEAN NOT NULL DEFAULT false,
    "trustedAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "email" VARCHAR(255),
    "description" TEXT,
    "logo" TEXT,
    "website" TEXT,
    "status" "public"."OrgStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tier" "public"."SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "encryptionKey" VARCHAR(128),
    "metadata" TEXT,
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "maxMembers" INTEGER NOT NULL DEFAULT 5,
    "maxProjects" INTEGER NOT NULL DEFAULT 10,
    "maxStorageGB" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "usedStorageGB" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiCeoEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" TEXT,
    "status" "public"."MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "roleName" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invitedEmail" VARCHAR(255) NOT NULL,
    "roleId" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "status" "public"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "action" VARCHAR(128) NOT NULL,
    "resource" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT,
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "stripeSubscriptionId" TEXT,
    "paystackSubscriptionId" TEXT,
    "flutterSubscriptionId" TEXT,
    "paypalSubscriptionId" TEXT,
    "sofortSubscriptionId" TEXT,
    "primaryPaymentMethod" "public"."PaymentProvider" NOT NULL DEFAULT 'STRIPE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BillingPlan" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "tier" "public"."SubscriptionTier" NOT NULL,
    "description" TEXT,
    "pricePerMonth" DOUBLE PRECISION NOT NULL,
    "pricePerYear" DOUBLE PRECISION,
    "maxMembers" INTEGER NOT NULL,
    "maxProjects" INTEGER NOT NULL,
    "maxStorageGB" DOUBLE PRECISION NOT NULL,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BillingProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "paystackCustomerId" TEXT,
    "paystackAuthCode" TEXT,
    "flutterwaveCustomerId" TEXT,
    "paypalCustomerId" TEXT,
    "sofortCustomerId" TEXT,
    "cardLast4" TEXT,
    "cardBrand" TEXT,
    "billingEmail" TEXT NOT NULL,
    "billingName" TEXT,
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingZip" TEXT,
    "billingCountry" TEXT,
    "taxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "billingProfileId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Content" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "public"."ContentType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "slug" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "creatorId" TEXT NOT NULL,
    "status" "public"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnail" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Media" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "public"."MediaType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "duration" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "metadata" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SavedContent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "folder" TEXT DEFAULT 'saved',
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Workflow" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "public"."WorkflowType" NOT NULL,
    "trigger" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "contentId" TEXT,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkflowAction" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contentId" TEXT,
    "eventType" VARCHAR(128) NOT NULL,
    "userId" TEXT,
    "properties" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."APIKey" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "key" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "APIKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Webhook" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "secret" TEXT NOT NULL,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastFailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentMethod" (
    "id" TEXT NOT NULL,
    "billingProfileId" TEXT NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "stripePaymentMethodId" TEXT,
    "paystackAuthCode" TEXT,
    "flutterwaveTokenId" TEXT,
    "paypalTokenId" TEXT,
    "sofortToken" TEXT,
    "last4" TEXT,
    "brand" TEXT,
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "accountHolderName" TEXT,
    "accountLast4" TEXT,
    "bankCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "provider" "public"."PaymentProvider" NOT NULL,
    "externalPaymentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "providerResponse" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentRefund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "externalRefundId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."RefundStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "providerResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentWebhook" (
    "id" TEXT NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "externalWebhookId" TEXT,
    "eventType" VARCHAR(128) NOT NULL,
    "subscriptionId" TEXT,
    "paymentId" TEXT,
    "data" TEXT NOT NULL,
    "status" "public"."WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" VARCHAR(128) NOT NULL,
    "resource" VARCHAR(128) NOT NULL,
    "resourceId" TEXT,
    "changes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "inAppNotifications" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeatureFlag" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "flag" VARCHAR(128) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "htmlTemplate" TEXT NOT NULL,
    "textTemplate" TEXT,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" VARCHAR(64) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Email" (
    "id" TEXT NOT NULL,
    "toEmail" VARCHAR(255) NOT NULL,
    "toName" VARCHAR(255),
    "organizationId" TEXT NOT NULL,
    "templateId" TEXT,
    "subject" VARCHAR(255) NOT NULL,
    "htmlContent" TEXT,
    "textContent" TEXT,
    "status" "public"."EmailStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "public"."EmailProvider" NOT NULL DEFAULT 'SENDGRID',
    "externalEmailId" TEXT,
    "relationType" VARCHAR(64),
    "relationId" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "spamReportedAt" TIMESTAMP(3),
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "public"."NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "pushSent" BOOLEAN NOT NULL DEFAULT false,
    "inAppCreated" BOOLEAN NOT NULL DEFAULT true,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "relatedType" VARCHAR(64),
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailLog" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "event" VARCHAR(64) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminEmailSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "primaryProvider" VARCHAR(64) NOT NULL DEFAULT 'sendgrid',
    "sendgridApiKey" VARCHAR(1024),
    "sendgridWebhookSecret" VARCHAR(1024),
    "sendgridDomain" VARCHAR(255),
    "mailgunApiKey" VARCHAR(1024),
    "mailgunDomain" VARCHAR(255),
    "awsAccessKeyId" VARCHAR(1024),
    "awsSecretAccessKey" VARCHAR(1024),
    "awsRegion" VARCHAR(64) DEFAULT 'us-east-1',
    "postmarkApiKey" VARCHAR(1024),
    "postmarkDomain" VARCHAR(255),
    "smtpHost" VARCHAR(255),
    "smtpPort" INTEGER DEFAULT 587,
    "smtpSecure" BOOLEAN DEFAULT false,
    "smtpUser" VARCHAR(255),
    "smtpPassword" VARCHAR(1024),
    "sendmailPath" VARCHAR(255) DEFAULT '/usr/sbin/sendmail',
    "emailFrom" VARCHAR(255) NOT NULL DEFAULT 'noreply@belsuite.com',
    "emailFromName" VARCHAR(255) NOT NULL DEFAULT 'Belsuite',
    "replyTo" VARCHAR(255),
    "enableFailover" BOOLEAN NOT NULL DEFAULT true,
    "fallbackProviders" TEXT[] DEFAULT ARRAY['mailgun', 'seq', 'postmark']::TEXT[],
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "retryDelayMs" INTEGER NOT NULL DEFAULT 5000,
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 100,
    "rateLimitPerHour" INTEGER NOT NULL DEFAULT 10000,
    "trackingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "webhooksEnabled" BOOLEAN NOT NULL DEFAULT true,
    "attachmentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "testStatus" TEXT,

    CONSTRAINT "AdminEmailSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DomainMapping" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "domain" VARCHAR(255),
    "domainType" "public"."DomainType" NOT NULL DEFAULT 'SUBDOMAIN',
    "subdomain" VARCHAR(128),
    "baseDomain" VARCHAR(255),
    "sslCertificate" TEXT,
    "sslPrivateKey" TEXT,
    "sslExpiresAt" TIMESTAMP(3),
    "certificateProvider" VARCHAR(64) NOT NULL DEFAULT 'letsencrypt',
    "dnsCnameRecord" VARCHAR(255),
    "dnsVerificationToken" VARCHAR(128),
    "dnsVerificationRecord" VARCHAR(255),
    "dnsVerified" BOOLEAN NOT NULL DEFAULT false,
    "dnsVerifiedAt" TIMESTAMP(3),
    "sslVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "redirectTo" VARCHAR(255),
    "redirectUrl" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "DomainMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantUsage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "aiTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "aiRequestsCount" INTEGER NOT NULL DEFAULT 0,
    "storageUsedBytes" BIGINT NOT NULL DEFAULT 0,
    "apiCallsCount" INTEGER NOT NULL DEFAULT 0,
    "apiErrorCount" INTEGER NOT NULL DEFAULT 0,
    "emailsSent" INTEGER NOT NULL DEFAULT 0,
    "emailsDelivered" INTEGER NOT NULL DEFAULT 0,
    "emailsBounced" INTEGER NOT NULL DEFAULT 0,
    "emailsOpened" INTEGER NOT NULL DEFAULT 0,
    "emailsClicked" INTEGER NOT NULL DEFAULT 0,
    "contentCount" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantRateLimitQuota" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "apiRequestsPerMinute" INTEGER NOT NULL DEFAULT 100,
    "apiRequestsPerHour" INTEGER NOT NULL DEFAULT 10000,
    "apiRequestsPerDay" INTEGER NOT NULL DEFAULT 1000000,
    "emailsPerMinute" INTEGER NOT NULL DEFAULT 100,
    "emailsPerHour" INTEGER NOT NULL DEFAULT 10000,
    "emailsPerDay" INTEGER NOT NULL DEFAULT 1000000,
    "aiTokensPerMinute" INTEGER NOT NULL DEFAULT 5000,
    "aiTokensPerHour" INTEGER NOT NULL DEFAULT 500000,
    "aiTokensPerDay" INTEGER NOT NULL DEFAULT 10000000,
    "maxStorageGB" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "maxConcurrentRequests" INTEGER NOT NULL DEFAULT 100,
    "maxConcurrentUploads" INTEGER NOT NULL DEFAULT 10,
    "customLimits" TEXT,
    "enforceRateLimits" BOOLEAN NOT NULL DEFAULT true,
    "softLimitNotifyAt" INTEGER NOT NULL DEFAULT 80,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),

    CONSTRAINT "TenantRateLimitQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantRateLimitUsage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "period" VARCHAR(20) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "apiRequestsUsed" INTEGER NOT NULL DEFAULT 0,
    "emailsUsed" INTEGER NOT NULL DEFAULT 0,
    "aiTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "storageUsedGB" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "concurrentRequests" INTEGER NOT NULL DEFAULT 0,
    "concurrentUploads" INTEGER NOT NULL DEFAULT 0,
    "limitExceededCount" INTEGER NOT NULL DEFAULT 0,
    "lastExceededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantRateLimitUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantOnboarding" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "step" "public"."OnboardingStep" NOT NULL DEFAULT 'WELCOME',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "companyName" TEXT,
    "companyWebsite" TEXT,
    "companyLogo" TEXT,
    "industry" TEXT,
    "subdomainChosen" TEXT,
    "customDomainChosen" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "defaultTimezone" TEXT NOT NULL DEFAULT 'UTC',
    "billingMethodAdded" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethodId" TEXT,
    "teamMembersInvited" BOOLEAN NOT NULL DEFAULT false,
    "invitedMembersCount" INTEGER NOT NULL DEFAULT 0,
    "featurePreferences" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "abandonedAt" TIMESTAMP(3),

    CONSTRAINT "TenantOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApiRateLimitState" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "requestTimestamp" TIMESTAMP(3) NOT NULL,
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiRateLimitState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIUsage" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "AIUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PromptTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(128) NOT NULL,
    "prompt" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "averageTokens" INTEGER,
    "averageCost" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VideoProject" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "script" TEXT,
    "status" "public"."VideoStatus" NOT NULL DEFAULT 'DRAFT',
    "outputUrl" TEXT,
    "thumbnailUrl" TEXT,
    "durationMs" INTEGER,
    "fileSizeBytes" BIGINT,
    "timelineJson" TEXT,
    "width" INTEGER NOT NULL DEFAULT 1920,
    "height" INTEGER NOT NULL DEFAULT 1080,
    "fps" INTEGER NOT NULL DEFAULT 30,
    "format" VARCHAR(16) NOT NULL DEFAULT 'mp4',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MediaAsset" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "videoProjectId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "mediaType" "public"."VideoMediaType" NOT NULL,
    "mimeType" VARCHAR(128) NOT NULL,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT,
    "fileSizeBytes" BIGINT,
    "durationMs" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VideoScene" (
    "id" TEXT NOT NULL,
    "videoProjectId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "scriptSegment" TEXT,
    "durationMs" INTEGER NOT NULL DEFAULT 5000,
    "backgroundUrl" TEXT,
    "aiImagePrompt" TEXT,
    "voiceoverUrl" TEXT,
    "voiceoverText" TEXT,
    "ttsVoiceId" VARCHAR(128),
    "overlaysJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoScene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubtitleTrack" (
    "id" TEXT NOT NULL,
    "videoProjectId" TEXT NOT NULL,
    "language" VARCHAR(16) NOT NULL DEFAULT 'en',
    "srtContent" TEXT,
    "vttContent" TEXT,
    "storageKey" TEXT,
    "autoGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubtitleTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdPlatformAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "platform" "public"."AdPlatform" NOT NULL,
    "accountId" VARCHAR(128) NOT NULL,
    "accountName" VARCHAR(255) NOT NULL,
    "currencyCode" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPlatformAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketingCampaign" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "adAccountId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "objective" "public"."CampaignObjective" NOT NULL,
    "status" "public"."CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "dailyBudget" DOUBLE PRECISION,
    "totalBudget" DOUBLE PRECISION,
    "spentBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "audienceJson" TEXT,
    "platformCampaignId" VARCHAR(255),
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Ad" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "format" "public"."AdFormat" NOT NULL,
    "status" "public"."AdStatus" NOT NULL DEFAULT 'DRAFT',
    "headline" VARCHAR(512),
    "body" TEXT,
    "callToAction" VARCHAR(64),
    "destinationUrl" TEXT,
    "creativeAssets" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPrompt" TEXT,
    "aiScore" DOUBLE PRECISION,
    "platformAdId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdVariant" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "abTestId" TEXT,
    "label" VARCHAR(64) NOT NULL,
    "headline" VARCHAR(512),
    "body" TEXT,
    "callToAction" VARCHAR(64),
    "creativeAssets" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "isControl" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ABTest" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "hypothesis" TEXT,
    "metric" VARCHAR(64) NOT NULL,
    "status" "public"."ABTestStatus" NOT NULL DEFAULT 'DRAFT',
    "confidenceLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "minimumSampleSize" INTEGER NOT NULL DEFAULT 1000,
    "trafficSplit" TEXT NOT NULL,
    "winnerVariantId" TEXT,
    "pValue" DOUBLE PRECISION,
    "statisticalPower" DOUBLE PRECISION,
    "conclusionNotes" TEXT,
    "startedAt" TIMESTAMP(3),
    "concludedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ABTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CampaignPerformance" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platformBreakdown" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdPerformance" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "frequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConversionEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "adId" TEXT,
    "eventType" "public"."ConversionEventType" NOT NULL,
    "eventName" VARCHAR(128),
    "funnelPageId" TEXT,
    "utmSource" VARCHAR(128),
    "utmMedium" VARCHAR(128),
    "utmCampaign" VARCHAR(255),
    "utmContent" VARCHAR(255),
    "utmTerm" VARCHAR(255),
    "clickId" VARCHAR(255),
    "sessionId" VARCHAR(255),
    "visitorId" VARCHAR(255),
    "ipAddress" VARCHAR(64),
    "userAgent" TEXT,
    "referrer" TEXT,
    "pageUrl" TEXT,
    "value" DOUBLE PRECISION,
    "currency" VARCHAR(8),
    "metadataJson" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Funnel" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "public"."FunnelStatus" NOT NULL DEFAULT 'DRAFT',
    "slug" VARCHAR(128) NOT NULL,
    "domain" VARCHAR(255),
    "themeJson" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FunnelPage" (
    "id" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "pageType" VARCHAR(64) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "blocksJson" TEXT,
    "ctaText" VARCHAR(128),
    "ctaUrl" TEXT,
    "nextPageId" VARCHAR(255),
    "views" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" VARCHAR(255),
    "metaDescription" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FunnelPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FunnelMetrics" (
    "id" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "pageId" VARCHAR(255),
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "exits" INTEGER NOT NULL DEFAULT 0,
    "bounces" INTEGER NOT NULL DEFAULT 0,
    "avgTimeOnPage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunnelMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VideoJob" (
    "id" TEXT NOT NULL,
    "videoProjectId" TEXT NOT NULL,
    "jobType" "public"."VideoJobType" NOT NULL,
    "status" "public"."VideoJobStatus" NOT NULL DEFAULT 'QUEUED',
    "bullJobId" VARCHAR(255),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "inputJson" TEXT,
    "outputJson" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocialAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "public"."SocialPlatform" NOT NULL,
    "platformUserId" TEXT NOT NULL,
    "platformUsername" TEXT,
    "displayName" TEXT,
    "avatar" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "pageId" TEXT,
    "pageName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduledPost" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mediaKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "link" TEXT,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "public"."PostStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPrompt" TEXT,
    "optimalTimeUsed" BOOLEAN NOT NULL DEFAULT false,
    "autoRepostEnabled" BOOLEAN NOT NULL DEFAULT false,
    "repostIntervalDays" INTEGER,
    "maxReposts" INTEGER DEFAULT 0,
    "repostCount" INTEGER NOT NULL DEFAULT 0,
    "nextRepostAt" TIMESTAMP(3),
    "parentPostId" TEXT,
    "bulkBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduledPostAccount" (
    "postId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "ScheduledPostAccount_pkey" PRIMARY KEY ("postId","accountId")
);

-- CreateTable
CREATE TABLE "public"."PostPublishResult" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "platform" "public"."SocialPlatform" NOT NULL,
    "status" "public"."PublishStatus" NOT NULL DEFAULT 'PENDING',
    "platformPostId" TEXT,
    "platformUrl" TEXT,
    "errorMessage" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostPublishResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BulkBatch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "totalPosts" INTEGER NOT NULL DEFAULT 0,
    "scheduledPosts" INTEGER NOT NULL DEFAULT 0,
    "publishedPosts" INTEGER NOT NULL DEFAULT 0,
    "failedPosts" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."BulkBatchStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OptimalPostingTime" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "platform" "public"."SocialPlatform" NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "hour" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptimalPostingTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UGCAvatar" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "style" "public"."AvatarStyle" NOT NULL DEFAULT 'INFLUENCER',
    "provider" "public"."AvatarProvider" NOT NULL DEFAULT 'HEYGEN',
    "externalId" VARCHAR(255),
    "thumbnailUrl" TEXT,
    "previewVideoUrl" TEXT,
    "gender" "public"."VoiceGender" NOT NULL DEFAULT 'FEMALE',
    "ethnicityHint" VARCHAR(128),
    "ageRange" VARCHAR(64),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UGCAvatar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VoiceClone" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "provider" VARCHAR(64) NOT NULL DEFAULT 'elevenlabs',
    "externalVoiceId" VARCHAR(255),
    "sampleAudioUrl" TEXT,
    "gender" "public"."VoiceGender" NOT NULL DEFAULT 'FEMALE',
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

-- CreateTable
CREATE TABLE "public"."UGCProject" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "brandContext" TEXT,
    "avatarId" TEXT,
    "voiceCloneId" TEXT,
    "status" "public"."UGCProjectStatus" NOT NULL DEFAULT 'DRAFT',
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

-- CreateTable
CREATE TABLE "public"."Deal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "contactEmail" VARCHAR(255),
    "contactName" VARCHAR(255),
    "companyName" VARCHAR(255),
    "stage" "public"."DealStage" NOT NULL DEFAULT 'PROSPECTING',
    "priority" "public"."DealPriority" NOT NULL DEFAULT 'MEDIUM',
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "probability" INTEGER NOT NULL DEFAULT 20,
    "expectedCloseAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "ownerId" TEXT,
    "sourceLeadId" TEXT,
    "pipelineName" VARCHAR(128) NOT NULL DEFAULT 'Sales',
    "lostReason" VARCHAR(255),
    "tags" TEXT,
    "notes" TEXT,
    "aiScore" INTEGER,
    "aiNotes" TEXT,
    "properties" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContactActivity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contactEmail" VARCHAR(255) NOT NULL,
    "contactName" VARCHAR(255),
    "activityType" "public"."ActivityType" NOT NULL,
    "dealId" TEXT,
    "subject" VARCHAR(512),
    "body" TEXT,
    "metadata" TEXT,
    "performedBy" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KeywordRank" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "keyword" VARCHAR(512) NOT NULL,
    "domain" VARCHAR(255) NOT NULL,
    "position" INTEGER,
    "previousPos" INTEGER,
    "searchVolume" INTEGER,
    "difficulty" INTEGER,
    "url" VARCHAR(2048),
    "country" VARCHAR(8) NOT NULL DEFAULT 'us',
    "device" VARCHAR(16) NOT NULL DEFAULT 'desktop',
    "features" TEXT,
    "trackedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeywordRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InboundCall" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromNumber" VARCHAR(64) NOT NULL,
    "toNumber" VARCHAR(64) NOT NULL,
    "callerName" VARCHAR(255),
    "status" "public"."InboundCallStatus" NOT NULL DEFAULT 'RINGING',
    "agentId" TEXT,
    "queueName" VARCHAR(128),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "recordingUrl" TEXT,
    "transcription" TEXT,
    "aiSummary" TEXT,
    "sentiment" VARCHAR(32),
    "tags" TEXT,
    "notes" TEXT,
    "externalCallId" VARCHAR(255),
    "answeredAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReferralLink" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "campaignName" VARCHAR(128),
    "rewardType" VARCHAR(32) NOT NULL DEFAULT 'credit',
    "rewardValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxUses" INTEGER,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalSignups" INTEGER NOT NULL DEFAULT 0,
    "totalConverted" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Referral" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "referredEmail" VARCHAR(255),
    "referredUserId" TEXT,
    "status" "public"."ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "ipAddress" VARCHAR(64),
    "userAgent" TEXT,
    "rewardPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "convertedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UGCScript" (
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

-- CreateTable
CREATE TABLE "public"."UGCRender" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "public"."RenderStatus" NOT NULL DEFAULT 'QUEUED',
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

-- CreateTable
CREATE TABLE "public"."Team" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "memberCount" INTEGER NOT NULL DEFAULT 1,
    "maxMembers" INTEGER,
    "metadata" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."TeamRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedAt" TIMESTAMP(3),
    "invitedBy" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamInvitation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "invitedEmail" VARCHAR(255) NOT NULL,
    "role" "public"."TeamRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "invitedBy" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."TeamInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedAt" TIMESTAMP(3),
    "acceptedByUserId" TEXT,
    "declinedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamWorkflow" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "requiresApprovals" BOOLEAN NOT NULL DEFAULT true,
    "requiredApprovals" INTEGER NOT NULL DEFAULT 1,
    "allowRejectReason" BOOLEAN NOT NULL DEFAULT true,
    "applicableContentTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerConfig" TEXT,
    "notificationConfig" TEXT,
    "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
    "approvedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkflowApproval" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "contentId" VARCHAR(255) NOT NULL,
    "contentType" VARCHAR(128) NOT NULL,
    "submittedById" TEXT NOT NULL,
    "status" "public"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "rejectionReason" TEXT,
    "requiredApprovals" INTEGER NOT NULL DEFAULT 1,
    "receivedApprovals" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "contentSnapshot" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Approval" (
    "id" TEXT NOT NULL,
    "approvalRequestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decision" VARCHAR(32) NOT NULL,
    "decisionReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamAuditLog" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" VARCHAR(128) NOT NULL,
    "resourceType" VARCHAR(128) NOT NULL,
    "resourceId" TEXT,
    "changes" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIceoDecision" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "implementationSteps" JSONB NOT NULL,
    "estimatedImpact" JSONB NOT NULL,
    "actualImpact" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-4-turbo',
    "implemented" BOOLEAN NOT NULL DEFAULT false,
    "implementedAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIceoDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AICEOReport" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "period" JSONB NOT NULL,
    "metrics" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "decisions" JSONB NOT NULL,
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-4-turbo',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AICEOReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AICEOConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "riskTolerance" TEXT NOT NULL DEFAULT 'balanced',
    "growthTarget" DOUBLE PRECISION NOT NULL DEFAULT 1.2,
    "maxChurnRate" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "analysisFrequency" TEXT NOT NULL DEFAULT 'weekly',
    "sendNotifications" BOOLEAN NOT NULL DEFAULT true,
    "notificationEmail" TEXT,
    "autoGenerateReports" BOOLEAN NOT NULL DEFAULT true,
    "reportFrequency" TEXT NOT NULL DEFAULT 'weekly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AICEOConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentVersion_contentId_idx" ON "public"."ContentVersion"("contentId");

-- CreateIndex
CREATE INDEX "ContentVersion_createdBy_idx" ON "public"."ContentVersion"("createdBy");

-- CreateIndex
CREATE INDEX "ContentVersion_createdAt_idx" ON "public"."ContentVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "public"."User"("status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshTokenHash_key" ON "public"."Session"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "public"."Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Session_isRevoked_idx" ON "public"."Session"("isRevoked");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_providerUserId_key" ON "public"."OAuthAccount"("providerUserId");

-- CreateIndex
CREATE INDEX "OAuthAccount_provider_idx" ON "public"."OAuthAccount"("provider");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "public"."OAuthAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_userId_provider_key" ON "public"."OAuthAccount"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorSecret_userId_key" ON "public"."TwoFactorSecret"("userId");

-- CreateIndex
CREATE INDEX "TwoFactorSecret_userId_idx" ON "public"."TwoFactorSecret"("userId");

-- CreateIndex
CREATE INDEX "TwoFactorBackupCode_twoFactorId_idx" ON "public"."TwoFactorBackupCode"("twoFactorId");

-- CreateIndex
CREATE INDEX "DeviceSession_userId_idx" ON "public"."DeviceSession"("userId");

-- CreateIndex
CREATE INDEX "DeviceSession_sessionId_idx" ON "public"."DeviceSession"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceSession_userId_ipAddress_userAgent_key" ON "public"."DeviceSession"("userId", "ipAddress", "userAgent");

-- CreateIndex
CREATE INDEX "PasswordHistory_userId_idx" ON "public"."PasswordHistory"("userId");

-- CreateIndex
CREATE INDEX "PasswordHistory_createdAt_idx" ON "public"."PasswordHistory"("createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_idx" ON "public"."LoginAttempt"("email");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_idx" ON "public"."LoginAttempt"("ipAddress");

-- CreateIndex
CREATE INDEX "LoginAttempt_timestamp_idx" ON "public"."LoginAttempt"("timestamp");

-- CreateIndex
CREATE INDEX "LoginAttempt_success_idx" ON "public"."LoginAttempt"("success");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "public"."EmailVerificationToken"("token");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_idx" ON "public"."EmailVerificationToken"("userId");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_token_idx" ON "public"."EmailVerificationToken"("token");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "public"."EmailVerificationToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "public"."PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "public"."PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "public"."Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "public"."Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "public"."Organization"("status");

-- CreateIndex
CREATE INDEX "Organization_tier_idx" ON "public"."Organization"("tier");

-- CreateIndex
CREATE INDEX "Organization_createdAt_idx" ON "public"."Organization"("createdAt");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "public"."OrganizationMember"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "public"."OrganizationMember"("userId");

-- CreateIndex
CREATE INDEX "OrganizationMember_roleId_idx" ON "public"."OrganizationMember"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "public"."OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "public"."Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_organizationId_idx" ON "public"."Invitation"("organizationId");

-- CreateIndex
CREATE INDEX "Invitation_invitedEmail_idx" ON "public"."Invitation"("invitedEmail");

-- CreateIndex
CREATE INDEX "Invitation_token_idx" ON "public"."Invitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_organizationId_invitedEmail_key" ON "public"."Invitation"("organizationId", "invitedEmail");

-- CreateIndex
CREATE INDEX "Role_organizationId_idx" ON "public"."Role"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_organizationId_name_key" ON "public"."Role"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Permission_roleId_idx" ON "public"."Permission"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_roleId_action_resource_key" ON "public"."Permission"("roleId", "action", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "public"."Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_organizationId_idx" ON "public"."Subscription"("organizationId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "public"."Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_organizationId_key" ON "public"."Subscription"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingPlan_tier_key" ON "public"."BillingPlan"("tier");

-- CreateIndex
CREATE INDEX "BillingPlan_tier_idx" ON "public"."BillingPlan"("tier");

-- CreateIndex
CREATE INDEX "BillingProfile_organizationId_idx" ON "public"."BillingProfile"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingProfile_organizationId_key" ON "public"."BillingProfile"("organizationId");

-- CreateIndex
CREATE INDEX "Invoice_subscriptionId_idx" ON "public"."Invoice"("subscriptionId");

-- CreateIndex
CREATE INDEX "Invoice_billingProfileId_idx" ON "public"."Invoice"("billingProfileId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "public"."Invoice"("status");

-- CreateIndex
CREATE INDEX "Content_organizationId_idx" ON "public"."Content"("organizationId");

-- CreateIndex
CREATE INDEX "Content_creatorId_idx" ON "public"."Content"("creatorId");

-- CreateIndex
CREATE INDEX "Content_status_idx" ON "public"."Content"("status");

-- CreateIndex
CREATE INDEX "Content_type_idx" ON "public"."Content"("type");

-- CreateIndex
CREATE INDEX "Content_createdAt_idx" ON "public"."Content"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Content_organizationId_slug_key" ON "public"."Content"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "Media_contentId_idx" ON "public"."Media"("contentId");

-- CreateIndex
CREATE INDEX "Media_organizationId_idx" ON "public"."Media"("organizationId");

-- CreateIndex
CREATE INDEX "SavedContent_userId_idx" ON "public"."SavedContent"("userId");

-- CreateIndex
CREATE INDEX "SavedContent_contentId_idx" ON "public"."SavedContent"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedContent_userId_contentId_key" ON "public"."SavedContent"("userId", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "Workflow_contentId_key" ON "public"."Workflow"("contentId");

-- CreateIndex
CREATE INDEX "Workflow_organizationId_idx" ON "public"."Workflow"("organizationId");

-- CreateIndex
CREATE INDEX "Workflow_type_idx" ON "public"."Workflow"("type");

-- CreateIndex
CREATE INDEX "WorkflowAction_workflowId_idx" ON "public"."WorkflowAction"("workflowId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_organizationId_idx" ON "public"."AnalyticsEvent"("organizationId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_contentId_idx" ON "public"."AnalyticsEvent"("contentId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "public"."AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_timestamp_idx" ON "public"."AnalyticsEvent"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "APIKey_key_key" ON "public"."APIKey"("key");

-- CreateIndex
CREATE INDEX "APIKey_organizationId_idx" ON "public"."APIKey"("organizationId");

-- CreateIndex
CREATE INDEX "APIKey_userId_idx" ON "public"."APIKey"("userId");

-- CreateIndex
CREATE INDEX "Webhook_organizationId_idx" ON "public"."Webhook"("organizationId");

-- CreateIndex
CREATE INDEX "PaymentMethod_billingProfileId_idx" ON "public"."PaymentMethod"("billingProfileId");

-- CreateIndex
CREATE INDEX "PaymentMethod_provider_idx" ON "public"."PaymentMethod"("provider");

-- CreateIndex
CREATE INDEX "Payment_subscriptionId_idx" ON "public"."Payment"("subscriptionId");

-- CreateIndex
CREATE INDEX "Payment_provider_idx" ON "public"."Payment"("provider");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "public"."Payment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_externalPaymentId_key" ON "public"."Payment"("externalPaymentId");

-- CreateIndex
CREATE INDEX "PaymentRefund_paymentId_idx" ON "public"."PaymentRefund"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentRefund_status_idx" ON "public"."PaymentRefund"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentWebhook_externalWebhookId_key" ON "public"."PaymentWebhook"("externalWebhookId");

-- CreateIndex
CREATE INDEX "PaymentWebhook_provider_idx" ON "public"."PaymentWebhook"("provider");

-- CreateIndex
CREATE INDEX "PaymentWebhook_status_idx" ON "public"."PaymentWebhook"("status");

-- CreateIndex
CREATE INDEX "PaymentWebhook_createdAt_idx" ON "public"."PaymentWebhook"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "public"."AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "public"."AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_userId_key" ON "public"."NotificationSettings"("userId");

-- CreateIndex
CREATE INDEX "FeatureFlag_organizationId_idx" ON "public"."FeatureFlag"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_organizationId_flag_key" ON "public"."FeatureFlag"("organizationId", "flag");

-- CreateIndex
CREATE INDEX "EmailTemplate_organizationId_idx" ON "public"."EmailTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "EmailTemplate_category_idx" ON "public"."EmailTemplate"("category");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_organizationId_name_key" ON "public"."EmailTemplate"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Email_externalEmailId_key" ON "public"."Email"("externalEmailId");

-- CreateIndex
CREATE INDEX "Email_organizationId_idx" ON "public"."Email"("organizationId");

-- CreateIndex
CREATE INDEX "Email_status_idx" ON "public"."Email"("status");

-- CreateIndex
CREATE INDEX "Email_provider_idx" ON "public"."Email"("provider");

-- CreateIndex
CREATE INDEX "Email_toEmail_idx" ON "public"."Email"("toEmail");

-- CreateIndex
CREATE INDEX "Email_createdAt_idx" ON "public"."Email"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_organizationId_idx" ON "public"."Notification"("organizationId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "public"."Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "public"."Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_emailId_idx" ON "public"."EmailLog"("emailId");

-- CreateIndex
CREATE INDEX "EmailLog_organizationId_idx" ON "public"."EmailLog"("organizationId");

-- CreateIndex
CREATE INDEX "EmailLog_event_idx" ON "public"."EmailLog"("event");

-- CreateIndex
CREATE INDEX "EmailLog_timestamp_idx" ON "public"."EmailLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "AdminEmailSettings_organizationId_key" ON "public"."AdminEmailSettings"("organizationId");

-- CreateIndex
CREATE INDEX "AdminEmailSettings_organizationId_idx" ON "public"."AdminEmailSettings"("organizationId");

-- CreateIndex
CREATE INDEX "AdminEmailSettings_primaryProvider_idx" ON "public"."AdminEmailSettings"("primaryProvider");

-- CreateIndex
CREATE INDEX "AdminEmailSettings_updatedAt_idx" ON "public"."AdminEmailSettings"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DomainMapping_domain_key" ON "public"."DomainMapping"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "DomainMapping_subdomain_key" ON "public"."DomainMapping"("subdomain");

-- CreateIndex
CREATE INDEX "DomainMapping_organizationId_idx" ON "public"."DomainMapping"("organizationId");

-- CreateIndex
CREATE INDEX "DomainMapping_domain_idx" ON "public"."DomainMapping"("domain");

-- CreateIndex
CREATE INDEX "DomainMapping_subdomain_idx" ON "public"."DomainMapping"("subdomain");

-- CreateIndex
CREATE INDEX "DomainMapping_isActive_idx" ON "public"."DomainMapping"("isActive");

-- CreateIndex
CREATE INDEX "DomainMapping_isPrimary_idx" ON "public"."DomainMapping"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "DomainMapping_organizationId_domainType_subdomain_key" ON "public"."DomainMapping"("organizationId", "domainType", "subdomain");

-- CreateIndex
CREATE INDEX "TenantUsage_organizationId_idx" ON "public"."TenantUsage"("organizationId");

-- CreateIndex
CREATE INDEX "TenantUsage_period_idx" ON "public"."TenantUsage"("period");

-- CreateIndex
CREATE INDEX "TenantUsage_startDate_idx" ON "public"."TenantUsage"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "TenantUsage_organizationId_period_key" ON "public"."TenantUsage"("organizationId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "TenantRateLimitQuota_organizationId_key" ON "public"."TenantRateLimitQuota"("organizationId");

-- CreateIndex
CREATE INDEX "TenantRateLimitQuota_organizationId_idx" ON "public"."TenantRateLimitQuota"("organizationId");

-- CreateIndex
CREATE INDEX "TenantRateLimitQuota_effectiveFrom_idx" ON "public"."TenantRateLimitQuota"("effectiveFrom");

-- CreateIndex
CREATE INDEX "TenantRateLimitUsage_organizationId_idx" ON "public"."TenantRateLimitUsage"("organizationId");

-- CreateIndex
CREATE INDEX "TenantRateLimitUsage_periodStart_idx" ON "public"."TenantRateLimitUsage"("periodStart");

-- CreateIndex
CREATE INDEX "TenantRateLimitUsage_period_idx" ON "public"."TenantRateLimitUsage"("period");

-- CreateIndex
CREATE UNIQUE INDEX "TenantRateLimitUsage_organizationId_period_periodStart_key" ON "public"."TenantRateLimitUsage"("organizationId", "period", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "TenantOnboarding_organizationId_key" ON "public"."TenantOnboarding"("organizationId");

-- CreateIndex
CREATE INDEX "TenantOnboarding_organizationId_idx" ON "public"."TenantOnboarding"("organizationId");

-- CreateIndex
CREATE INDEX "TenantOnboarding_step_idx" ON "public"."TenantOnboarding"("step");

-- CreateIndex
CREATE INDEX "TenantOnboarding_completed_idx" ON "public"."TenantOnboarding"("completed");

-- CreateIndex
CREATE INDEX "ApiRateLimitState_organizationId_idx" ON "public"."ApiRateLimitState"("organizationId");

-- CreateIndex
CREATE INDEX "ApiRateLimitState_requestTimestamp_idx" ON "public"."ApiRateLimitState"("requestTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ApiRateLimitState_organizationId_requestTimestamp_key" ON "public"."ApiRateLimitState"("organizationId", "requestTimestamp");

-- CreateIndex
CREATE INDEX "AIUsage_organizationId_idx" ON "public"."AIUsage"("organizationId");

-- CreateIndex
CREATE INDEX "AIUsage_userId_idx" ON "public"."AIUsage"("userId");

-- CreateIndex
CREATE INDEX "AIUsage_model_idx" ON "public"."AIUsage"("model");

-- CreateIndex
CREATE INDEX "AIUsage_provider_idx" ON "public"."AIUsage"("provider");

-- CreateIndex
CREATE INDEX "AIUsage_contentType_idx" ON "public"."AIUsage"("contentType");

-- CreateIndex
CREATE INDEX "AIUsage_createdAt_idx" ON "public"."AIUsage"("createdAt");

-- CreateIndex
CREATE INDEX "PromptTemplate_organizationId_idx" ON "public"."PromptTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "PromptTemplate_category_idx" ON "public"."PromptTemplate"("category");

-- CreateIndex
CREATE INDEX "PromptTemplate_isBuiltIn_idx" ON "public"."PromptTemplate"("isBuiltIn");

-- CreateIndex
CREATE INDEX "PromptTemplate_createdAt_idx" ON "public"."PromptTemplate"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_organizationId_name_key" ON "public"."PromptTemplate"("organizationId", "name");

-- CreateIndex
CREATE INDEX "VideoProject_organizationId_idx" ON "public"."VideoProject"("organizationId");

-- CreateIndex
CREATE INDEX "VideoProject_createdById_idx" ON "public"."VideoProject"("createdById");

-- CreateIndex
CREATE INDEX "VideoProject_status_idx" ON "public"."VideoProject"("status");

-- CreateIndex
CREATE INDEX "VideoProject_createdAt_idx" ON "public"."VideoProject"("createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_organizationId_idx" ON "public"."MediaAsset"("organizationId");

-- CreateIndex
CREATE INDEX "MediaAsset_videoProjectId_idx" ON "public"."MediaAsset"("videoProjectId");

-- CreateIndex
CREATE INDEX "MediaAsset_mediaType_idx" ON "public"."MediaAsset"("mediaType");

-- CreateIndex
CREATE INDEX "VideoScene_videoProjectId_idx" ON "public"."VideoScene"("videoProjectId");

-- CreateIndex
CREATE INDEX "VideoScene_order_idx" ON "public"."VideoScene"("order");

-- CreateIndex
CREATE INDEX "AdPlatformAccount_organizationId_idx" ON "public"."AdPlatformAccount"("organizationId");

-- CreateIndex
CREATE INDEX "AdPlatformAccount_platform_idx" ON "public"."AdPlatformAccount"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "AdPlatformAccount_organizationId_platform_accountId_key" ON "public"."AdPlatformAccount"("organizationId", "platform", "accountId");

-- CreateIndex
CREATE INDEX "MarketingCampaign_organizationId_idx" ON "public"."MarketingCampaign"("organizationId");

-- CreateIndex
CREATE INDEX "MarketingCampaign_status_idx" ON "public"."MarketingCampaign"("status");

-- CreateIndex
CREATE INDEX "MarketingCampaign_startDate_idx" ON "public"."MarketingCampaign"("startDate");

-- CreateIndex
CREATE INDEX "Ad_campaignId_idx" ON "public"."Ad"("campaignId");

-- CreateIndex
CREATE INDEX "Ad_status_idx" ON "public"."Ad"("status");

-- CreateIndex
CREATE INDEX "AdVariant_adId_idx" ON "public"."AdVariant"("adId");

-- CreateIndex
CREATE INDEX "AdVariant_abTestId_idx" ON "public"."AdVariant"("abTestId");

-- CreateIndex
CREATE INDEX "ABTest_campaignId_idx" ON "public"."ABTest"("campaignId");

-- CreateIndex
CREATE INDEX "ABTest_status_idx" ON "public"."ABTest"("status");

-- CreateIndex
CREATE INDEX "CampaignPerformance_campaignId_idx" ON "public"."CampaignPerformance"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignPerformance_date_idx" ON "public"."CampaignPerformance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignPerformance_campaignId_date_key" ON "public"."CampaignPerformance"("campaignId", "date");

-- CreateIndex
CREATE INDEX "AdPerformance_adId_idx" ON "public"."AdPerformance"("adId");

-- CreateIndex
CREATE INDEX "AdPerformance_date_idx" ON "public"."AdPerformance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AdPerformance_adId_date_key" ON "public"."AdPerformance"("adId", "date");

-- CreateIndex
CREATE INDEX "ConversionEvent_organizationId_idx" ON "public"."ConversionEvent"("organizationId");

-- CreateIndex
CREATE INDEX "ConversionEvent_adId_idx" ON "public"."ConversionEvent"("adId");

-- CreateIndex
CREATE INDEX "ConversionEvent_eventType_idx" ON "public"."ConversionEvent"("eventType");

-- CreateIndex
CREATE INDEX "ConversionEvent_occurredAt_idx" ON "public"."ConversionEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "ConversionEvent_utmCampaign_idx" ON "public"."ConversionEvent"("utmCampaign");

-- CreateIndex
CREATE INDEX "Funnel_organizationId_idx" ON "public"."Funnel"("organizationId");

-- CreateIndex
CREATE INDEX "Funnel_status_idx" ON "public"."Funnel"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Funnel_organizationId_slug_key" ON "public"."Funnel"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "FunnelPage_funnelId_idx" ON "public"."FunnelPage"("funnelId");

-- CreateIndex
CREATE INDEX "FunnelPage_order_idx" ON "public"."FunnelPage"("order");

-- CreateIndex
CREATE UNIQUE INDEX "FunnelPage_funnelId_slug_key" ON "public"."FunnelPage"("funnelId", "slug");

-- CreateIndex
CREATE INDEX "FunnelMetrics_funnelId_idx" ON "public"."FunnelMetrics"("funnelId");

-- CreateIndex
CREATE INDEX "FunnelMetrics_date_idx" ON "public"."FunnelMetrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "FunnelMetrics_funnelId_date_pageId_key" ON "public"."FunnelMetrics"("funnelId", "date", "pageId");

-- CreateIndex
CREATE INDEX "VideoJob_videoProjectId_idx" ON "public"."VideoJob"("videoProjectId");

-- CreateIndex
CREATE INDEX "VideoJob_status_idx" ON "public"."VideoJob"("status");

-- CreateIndex
CREATE INDEX "VideoJob_jobType_idx" ON "public"."VideoJob"("jobType");

-- CreateIndex
CREATE INDEX "VideoJob_createdAt_idx" ON "public"."VideoJob"("createdAt");

-- CreateIndex
CREATE INDEX "SocialAccount_organizationId_idx" ON "public"."SocialAccount"("organizationId");

-- CreateIndex
CREATE INDEX "SocialAccount_userId_idx" ON "public"."SocialAccount"("userId");

-- CreateIndex
CREATE INDEX "SocialAccount_platform_idx" ON "public"."SocialAccount"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_organizationId_platform_platformUserId_key" ON "public"."SocialAccount"("organizationId", "platform", "platformUserId");

-- CreateIndex
CREATE INDEX "ScheduledPost_organizationId_idx" ON "public"."ScheduledPost"("organizationId");

-- CreateIndex
CREATE INDEX "ScheduledPost_createdById_idx" ON "public"."ScheduledPost"("createdById");

-- CreateIndex
CREATE INDEX "ScheduledPost_status_idx" ON "public"."ScheduledPost"("status");

-- CreateIndex
CREATE INDEX "ScheduledPost_scheduledAt_idx" ON "public"."ScheduledPost"("scheduledAt");

-- CreateIndex
CREATE INDEX "ScheduledPost_nextRepostAt_idx" ON "public"."ScheduledPost"("nextRepostAt");

-- CreateIndex
CREATE INDEX "ScheduledPost_bulkBatchId_idx" ON "public"."ScheduledPost"("bulkBatchId");

-- CreateIndex
CREATE INDEX "PostPublishResult_postId_idx" ON "public"."PostPublishResult"("postId");

-- CreateIndex
CREATE INDEX "PostPublishResult_accountId_idx" ON "public"."PostPublishResult"("accountId");

-- CreateIndex
CREATE INDEX "PostPublishResult_status_idx" ON "public"."PostPublishResult"("status");

-- CreateIndex
CREATE INDEX "PostPublishResult_nextRetryAt_idx" ON "public"."PostPublishResult"("nextRetryAt");

-- CreateIndex
CREATE INDEX "PostPublishResult_dismissedAt_idx" ON "public"."PostPublishResult"("dismissedAt");

-- CreateIndex
CREATE INDEX "BulkBatch_organizationId_idx" ON "public"."BulkBatch"("organizationId");

-- CreateIndex
CREATE INDEX "BulkBatch_status_idx" ON "public"."BulkBatch"("status");

-- CreateIndex
CREATE INDEX "OptimalPostingTime_organizationId_platform_idx" ON "public"."OptimalPostingTime"("organizationId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "OptimalPostingTime_organizationId_platform_dayOfWeek_hour_key" ON "public"."OptimalPostingTime"("organizationId", "platform", "dayOfWeek", "hour");

-- CreateIndex
CREATE INDEX "UGCAvatar_organizationId_idx" ON "public"."UGCAvatar"("organizationId");

-- CreateIndex
CREATE INDEX "UGCAvatar_style_idx" ON "public"."UGCAvatar"("style");

-- CreateIndex
CREATE INDEX "UGCAvatar_provider_idx" ON "public"."UGCAvatar"("provider");

-- CreateIndex
CREATE INDEX "UGCAvatar_isSystem_idx" ON "public"."UGCAvatar"("isSystem");

-- CreateIndex
CREATE INDEX "VoiceClone_organizationId_idx" ON "public"."VoiceClone"("organizationId");

-- CreateIndex
CREATE INDEX "VoiceClone_provider_idx" ON "public"."VoiceClone"("provider");

-- CreateIndex
CREATE INDEX "VoiceClone_isDefault_idx" ON "public"."VoiceClone"("isDefault");

-- CreateIndex
CREATE INDEX "UGCProject_organizationId_idx" ON "public"."UGCProject"("organizationId");

-- CreateIndex
CREATE INDEX "UGCProject_createdById_idx" ON "public"."UGCProject"("createdById");

-- CreateIndex
CREATE INDEX "UGCProject_status_idx" ON "public"."UGCProject"("status");

-- CreateIndex
CREATE INDEX "UGCProject_createdAt_idx" ON "public"."UGCProject"("createdAt");

-- CreateIndex
CREATE INDEX "Deal_organizationId_stage_idx" ON "public"."Deal"("organizationId", "stage");

-- CreateIndex
CREATE INDEX "Deal_organizationId_ownerId_idx" ON "public"."Deal"("organizationId", "ownerId");

-- CreateIndex
CREATE INDEX "Deal_organizationId_expectedCloseAt_idx" ON "public"."Deal"("organizationId", "expectedCloseAt");

-- CreateIndex
CREATE INDEX "ContactActivity_organizationId_contactEmail_idx" ON "public"."ContactActivity"("organizationId", "contactEmail");

-- CreateIndex
CREATE INDEX "ContactActivity_organizationId_activityType_idx" ON "public"."ContactActivity"("organizationId", "activityType");

-- CreateIndex
CREATE INDEX "ContactActivity_organizationId_createdAt_idx" ON "public"."ContactActivity"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ContactActivity_dealId_idx" ON "public"."ContactActivity"("dealId");

-- CreateIndex
CREATE INDEX "KeywordRank_organizationId_keyword_idx" ON "public"."KeywordRank"("organizationId", "keyword");

-- CreateIndex
CREATE INDEX "KeywordRank_organizationId_domain_idx" ON "public"."KeywordRank"("organizationId", "domain");

-- CreateIndex
CREATE INDEX "KeywordRank_organizationId_trackedAt_idx" ON "public"."KeywordRank"("organizationId", "trackedAt");

-- CreateIndex
CREATE INDEX "InboundCall_organizationId_status_idx" ON "public"."InboundCall"("organizationId", "status");

-- CreateIndex
CREATE INDEX "InboundCall_organizationId_agentId_idx" ON "public"."InboundCall"("organizationId", "agentId");

-- CreateIndex
CREATE INDEX "InboundCall_organizationId_createdAt_idx" ON "public"."InboundCall"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "InboundCall_fromNumber_idx" ON "public"."InboundCall"("fromNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralLink_code_key" ON "public"."ReferralLink"("code");

-- CreateIndex
CREATE INDEX "ReferralLink_organizationId_referrerId_idx" ON "public"."ReferralLink"("organizationId", "referrerId");

-- CreateIndex
CREATE INDEX "ReferralLink_code_idx" ON "public"."ReferralLink"("code");

-- CreateIndex
CREATE INDEX "Referral_organizationId_linkId_idx" ON "public"."Referral"("organizationId", "linkId");

-- CreateIndex
CREATE INDEX "Referral_organizationId_status_idx" ON "public"."Referral"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Referral_referredEmail_idx" ON "public"."Referral"("referredEmail");

-- CreateIndex
CREATE UNIQUE INDEX "UGCScript_projectId_key" ON "public"."UGCScript"("projectId");

-- CreateIndex
CREATE INDEX "UGCScript_projectId_idx" ON "public"."UGCScript"("projectId");

-- CreateIndex
CREATE INDEX "UGCRender_projectId_idx" ON "public"."UGCRender"("projectId");

-- CreateIndex
CREATE INDEX "UGCRender_status_idx" ON "public"."UGCRender"("status");

-- CreateIndex
CREATE INDEX "UGCRender_createdAt_idx" ON "public"."UGCRender"("createdAt");

-- CreateIndex
CREATE INDEX "Team_organizationId_idx" ON "public"."Team"("organizationId");

-- CreateIndex
CREATE INDEX "Team_createdById_idx" ON "public"."Team"("createdById");

-- CreateIndex
CREATE INDEX "Team_createdAt_idx" ON "public"."Team"("createdAt");

-- CreateIndex
CREATE INDEX "Team_archivedAt_idx" ON "public"."Team"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Team_organizationId_slug_key" ON "public"."Team"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_idx" ON "public"."TeamMember"("teamId");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "public"."TeamMember"("userId");

-- CreateIndex
CREATE INDEX "TeamMember_role_idx" ON "public"."TeamMember"("role");

-- CreateIndex
CREATE INDEX "TeamMember_isActive_idx" ON "public"."TeamMember"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "public"."TeamMember"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_token_key" ON "public"."TeamInvitation"("token");

-- CreateIndex
CREATE INDEX "TeamInvitation_teamId_idx" ON "public"."TeamInvitation"("teamId");

-- CreateIndex
CREATE INDEX "TeamInvitation_invitedEmail_idx" ON "public"."TeamInvitation"("invitedEmail");

-- CreateIndex
CREATE INDEX "TeamInvitation_token_idx" ON "public"."TeamInvitation"("token");

-- CreateIndex
CREATE INDEX "TeamInvitation_status_idx" ON "public"."TeamInvitation"("status");

-- CreateIndex
CREATE INDEX "TeamInvitation_expiresAt_idx" ON "public"."TeamInvitation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_teamId_invitedEmail_key" ON "public"."TeamInvitation"("teamId", "invitedEmail");

-- CreateIndex
CREATE INDEX "TeamWorkflow_teamId_idx" ON "public"."TeamWorkflow"("teamId");

-- CreateIndex
CREATE INDEX "TeamWorkflow_isActive_idx" ON "public"."TeamWorkflow"("isActive");

-- CreateIndex
CREATE INDEX "WorkflowApproval_workflowId_idx" ON "public"."WorkflowApproval"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowApproval_contentId_idx" ON "public"."WorkflowApproval"("contentId");

-- CreateIndex
CREATE INDEX "WorkflowApproval_submittedById_idx" ON "public"."WorkflowApproval"("submittedById");

-- CreateIndex
CREATE INDEX "WorkflowApproval_status_idx" ON "public"."WorkflowApproval"("status");

-- CreateIndex
CREATE INDEX "WorkflowApproval_submittedAt_idx" ON "public"."WorkflowApproval"("submittedAt");

-- CreateIndex
CREATE INDEX "WorkflowApproval_expiresAt_idx" ON "public"."WorkflowApproval"("expiresAt");

-- CreateIndex
CREATE INDEX "Approval_approvalRequestId_idx" ON "public"."Approval"("approvalRequestId");

-- CreateIndex
CREATE INDEX "Approval_approverId_idx" ON "public"."Approval"("approverId");

-- CreateIndex
CREATE INDEX "Approval_decision_idx" ON "public"."Approval"("decision");

-- CreateIndex
CREATE INDEX "Approval_expiresAt_idx" ON "public"."Approval"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Approval_approvalRequestId_approverId_key" ON "public"."Approval"("approvalRequestId", "approverId");

-- CreateIndex
CREATE INDEX "TeamAuditLog_teamId_idx" ON "public"."TeamAuditLog"("teamId");

-- CreateIndex
CREATE INDEX "TeamAuditLog_userId_idx" ON "public"."TeamAuditLog"("userId");

-- CreateIndex
CREATE INDEX "TeamAuditLog_action_idx" ON "public"."TeamAuditLog"("action");

-- CreateIndex
CREATE INDEX "TeamAuditLog_timestamp_idx" ON "public"."TeamAuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "TeamAuditLog_resourceType_idx" ON "public"."TeamAuditLog"("resourceType");

-- CreateIndex
CREATE INDEX "AIceoDecision_organizationId_idx" ON "public"."AIceoDecision"("organizationId");

-- CreateIndex
CREATE INDEX "AIceoDecision_type_idx" ON "public"."AIceoDecision"("type");

-- CreateIndex
CREATE INDEX "AIceoDecision_severity_idx" ON "public"."AIceoDecision"("severity");

-- CreateIndex
CREATE INDEX "AIceoDecision_expiresAt_idx" ON "public"."AIceoDecision"("expiresAt");

-- CreateIndex
CREATE INDEX "AIceoDecision_implemented_idx" ON "public"."AIceoDecision"("implemented");

-- CreateIndex
CREATE INDEX "AICEOReport_organizationId_idx" ON "public"."AICEOReport"("organizationId");

-- CreateIndex
CREATE INDEX "AICEOReport_frequency_idx" ON "public"."AICEOReport"("frequency");

-- CreateIndex
CREATE INDEX "AICEOReport_generatedAt_idx" ON "public"."AICEOReport"("generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AICEOConfig_organizationId_key" ON "public"."AICEOConfig"("organizationId");

-- CreateIndex
CREATE INDEX "AICEOConfig_organizationId_idx" ON "public"."AICEOConfig"("organizationId");

-- CreateIndex
CREATE INDEX "AICEOConfig_enabled_idx" ON "public"."AICEOConfig"("enabled");

-- AddForeignKey
ALTER TABLE "public"."ContentVersion" ADD CONSTRAINT "ContentVersion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TwoFactorSecret" ADD CONSTRAINT "TwoFactorSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TwoFactorBackupCode" ADD CONSTRAINT "TwoFactorBackupCode_twoFactorId_fkey" FOREIGN KEY ("twoFactorId") REFERENCES "public"."TwoFactorSecret"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeviceSession" ADD CONSTRAINT "DeviceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeviceSession" ADD CONSTRAINT "DeviceSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PasswordHistory" ADD CONSTRAINT "PasswordHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invitation" ADD CONSTRAINT "Invitation_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invitation" ADD CONSTRAINT "Invitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Role" ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Permission" ADD CONSTRAINT "Permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."BillingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BillingProfile" ADD CONSTRAINT "BillingProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_billingProfileId_fkey" FOREIGN KEY ("billingProfileId") REFERENCES "public"."BillingProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Content" ADD CONSTRAINT "Content_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Content" ADD CONSTRAINT "Content_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Media" ADD CONSTRAINT "Media_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedContent" ADD CONSTRAINT "SavedContent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedContent" ADD CONSTRAINT "SavedContent_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Workflow" ADD CONSTRAINT "Workflow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Workflow" ADD CONSTRAINT "Workflow_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowAction" ADD CONSTRAINT "WorkflowAction_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."APIKey" ADD CONSTRAINT "APIKey_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."APIKey" ADD CONSTRAINT "APIKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Webhook" ADD CONSTRAINT "Webhook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentMethod" ADD CONSTRAINT "PaymentMethod_billingProfileId_fkey" FOREIGN KEY ("billingProfileId") REFERENCES "public"."BillingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentRefund" ADD CONSTRAINT "PaymentRefund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationSettings" ADD CONSTRAINT "NotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeatureFlag" ADD CONSTRAINT "FeatureFlag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailTemplate" ADD CONSTRAINT "EmailTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Email" ADD CONSTRAINT "Email_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Email" ADD CONSTRAINT "Email_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailLog" ADD CONSTRAINT "EmailLog_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "public"."Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailLog" ADD CONSTRAINT "EmailLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminEmailSettings" ADD CONSTRAINT "AdminEmailSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DomainMapping" ADD CONSTRAINT "DomainMapping_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantUsage" ADD CONSTRAINT "TenantUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantRateLimitQuota" ADD CONSTRAINT "TenantRateLimitQuota_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantRateLimitUsage" ADD CONSTRAINT "TenantRateLimitUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantOnboarding" ADD CONSTRAINT "TenantOnboarding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApiRateLimitState" ADD CONSTRAINT "ApiRateLimitState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIUsage" ADD CONSTRAINT "AIUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIUsage" ADD CONSTRAINT "AIUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIUsage" ADD CONSTRAINT "AIUsage_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "public"."PromptTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromptTemplate" ADD CONSTRAINT "PromptTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromptTemplate" ADD CONSTRAINT "PromptTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoProject" ADD CONSTRAINT "VideoProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoProject" ADD CONSTRAINT "VideoProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaAsset" ADD CONSTRAINT "MediaAsset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaAsset" ADD CONSTRAINT "MediaAsset_videoProjectId_fkey" FOREIGN KEY ("videoProjectId") REFERENCES "public"."VideoProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoScene" ADD CONSTRAINT "VideoScene_videoProjectId_fkey" FOREIGN KEY ("videoProjectId") REFERENCES "public"."VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubtitleTrack" ADD CONSTRAINT "SubtitleTrack_videoProjectId_fkey" FOREIGN KEY ("videoProjectId") REFERENCES "public"."VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdPlatformAccount" ADD CONSTRAINT "AdPlatformAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "public"."AdPlatformAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ad" ADD CONSTRAINT "Ad_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdVariant" ADD CONSTRAINT "AdVariant_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdVariant" ADD CONSTRAINT "AdVariant_abTestId_fkey" FOREIGN KEY ("abTestId") REFERENCES "public"."ABTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ABTest" ADD CONSTRAINT "ABTest_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CampaignPerformance" ADD CONSTRAINT "CampaignPerformance_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdPerformance" ADD CONSTRAINT "AdPerformance_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversionEvent" ADD CONSTRAINT "ConversionEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversionEvent" ADD CONSTRAINT "ConversionEvent_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."Ad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Funnel" ADD CONSTRAINT "Funnel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FunnelPage" ADD CONSTRAINT "FunnelPage_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "public"."Funnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FunnelMetrics" ADD CONSTRAINT "FunnelMetrics_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "public"."Funnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoJob" ADD CONSTRAINT "VideoJob_videoProjectId_fkey" FOREIGN KEY ("videoProjectId") REFERENCES "public"."VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocialAccount" ADD CONSTRAINT "SocialAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocialAccount" ADD CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledPost" ADD CONSTRAINT "ScheduledPost_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledPost" ADD CONSTRAINT "ScheduledPost_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledPost" ADD CONSTRAINT "ScheduledPost_parentPostId_fkey" FOREIGN KEY ("parentPostId") REFERENCES "public"."ScheduledPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledPost" ADD CONSTRAINT "ScheduledPost_bulkBatchId_fkey" FOREIGN KEY ("bulkBatchId") REFERENCES "public"."BulkBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledPostAccount" ADD CONSTRAINT "ScheduledPostAccount_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."ScheduledPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledPostAccount" ADD CONSTRAINT "ScheduledPostAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostPublishResult" ADD CONSTRAINT "PostPublishResult_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."ScheduledPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostPublishResult" ADD CONSTRAINT "PostPublishResult_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BulkBatch" ADD CONSTRAINT "BulkBatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OptimalPostingTime" ADD CONSTRAINT "OptimalPostingTime_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UGCAvatar" ADD CONSTRAINT "UGCAvatar_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VoiceClone" ADD CONSTRAINT "VoiceClone_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UGCProject" ADD CONSTRAINT "UGCProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UGCProject" ADD CONSTRAINT "UGCProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UGCProject" ADD CONSTRAINT "UGCProject_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "public"."UGCAvatar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UGCProject" ADD CONSTRAINT "UGCProject_voiceCloneId_fkey" FOREIGN KEY ("voiceCloneId") REFERENCES "public"."VoiceClone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContactActivity" ADD CONSTRAINT "ContactActivity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "public"."Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Referral" ADD CONSTRAINT "Referral_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "public"."ReferralLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UGCScript" ADD CONSTRAINT "UGCScript_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."UGCProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UGCRender" ADD CONSTRAINT "UGCRender_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."UGCProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamInvitation" ADD CONSTRAINT "TeamInvitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamInvitation" ADD CONSTRAINT "TeamInvitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamWorkflow" ADD CONSTRAINT "TeamWorkflow_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowApproval" ADD CONSTRAINT "WorkflowApproval_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."TeamWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowApproval" ADD CONSTRAINT "WorkflowApproval_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Approval" ADD CONSTRAINT "Approval_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "public"."WorkflowApproval"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Approval" ADD CONSTRAINT "Approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamAuditLog" ADD CONSTRAINT "TeamAuditLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamAuditLog" ADD CONSTRAINT "TeamAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIceoDecision" ADD CONSTRAINT "AIceoDecision_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AICEOReport" ADD CONSTRAINT "AICEOReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AICEOConfig" ADD CONSTRAINT "AICEOConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
