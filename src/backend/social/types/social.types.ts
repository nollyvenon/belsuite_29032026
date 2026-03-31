/**
 * Social Media Scheduler — shared TypeScript types
 */

import { SocialPlatform } from '@prisma/client';

// ── Publisher result ──────────────────────────────────────────────────────────

export interface PlatformPublishResult {
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
}

// ── BullMQ job payloads ───────────────────────────────────────────────────────

export interface PublishJobPayload {
  type: 'publish' | 'retry' | 'repost' | 'check-reposts';
  postId: string;
  organizationId: string;
  accountIds: string[];
  /** Used for retry jobs — which single result to retry */
  resultId?: string;
}

export interface AutoCreatorJobPayload {
  type: 'auto-create';
  organizationId: string;
  prompt: string;
  platforms: SocialPlatform[];
  scheduledAt?: string; // ISO datetime
}

// ── OAuth tokens ──────────────────────────────────────────────────────────────

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
}

export interface OAuthExchangeResult extends OAuthTokens {
  platformUserId: string;
  displayName?: string;
  avatar?: string;
  pageId?: string;
  pageName?: string;
}

// ── Platform-specific API response shapes ─────────────────────────────────────

/** Facebook / Instagram Graph API — page object from /me/accounts */
export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  tasks: string[];
}

export interface FacebookPagesResponse {
  data: FacebookPage[];
}

/** Instagram business account linked to a Facebook page */
export interface InstagramBusinessAccount {
  id: string;
  name?: string;
  username?: string;
  profile_picture_url?: string;
}

/** Instagram media container creation response */
export interface InstagramContainerResponse {
  id: string;
}

/** Generic Graph API post response */
export interface FacebookPostResponse {
  id: string;
  post_id?: string;
}

/** Twitter v2 tweet creation response */
export interface TwitterTweetResponse {
  data: {
    id: string;
    text: string;
  };
}

/** Twitter v1.1 media upload response */
export interface TwitterMediaUploadResponse {
  media_id_string: string;
  media_id: number;
  size?: number;
  expires_after_secs?: number;
  image?: { image_type: string; w: number; h: number };
  processing_info?: {
    state: 'pending' | 'in_progress' | 'failed' | 'succeeded';
    check_after_secs?: number;
    progress_percent?: number;
    error?: { code: number; name: string; message: string };
  };
}

/** TikTok video init response */
export interface TikTokInitResponse {
  data: {
    publish_id: string;
    upload_url?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/** TikTok publish status response */
export interface TikTokStatusResponse {
  data: {
    status: 'PROCESSING_UPLOAD' | 'SEND_TO_USER_INBOX' | 'FAILED' | 'PUBLISH_COMPLETE';
    fail_reason?: string;
    publicaly_available_post_id?: string;
  };
}

/** LinkedIn UGC post response */
export interface LinkedInPostResponse {
  id: string;
}

/** LinkedIn asset register response */
export interface LinkedInRegisterUploadResponse {
  value: {
    asset: string;
    uploadMechanism: {
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
        uploadUrl: string;
        headers: Record<string, string>;
      };
    };
  };
}

// ── Pinterest API types ───────────────────────────────────────────────────────

/** Pinterest Pin creation/response object */
export interface PinterestPinResponse {
  id: string;
  link?: string;
  title?: string;
  description?: string;
  board_id?: string;
  board_owner?: { username: string };
  media?: { media_type: string };
  created_at?: string;
}

/** Pinterest media upload registration response */
export interface PinterestMediaUploadResponse {
  media_id: string;
  media_type: string;
  upload_url: string;
  /** Headers required for the actual upload request */
  upload_parameters: Record<string, string>;
}

/** Pinterest board object */
export interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  owner?: { username: string };
  privacy: string;
}

// ── WhatsApp Business Cloud API types ────────────────────────────────────────

/** WhatsApp send message response */
export interface WhatsAppSendMessageResponse {
  messaging_product: string;
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string; message_status?: string }>;
}

/** WhatsApp Business Profile info response */
export interface WhatsAppBusinessProfileResponse {
  id: string;
  name?: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
}

/** WhatsApp template message (for messages outside the 24h window) */
export interface WhatsAppTemplateMessage {
  name: string;
  language: { code: string };
  components?: Array<{
    type: 'header' | 'body' | 'footer' | 'button';
    parameters?: Array<{ type: 'text' | 'image' | 'video'; text?: string }>;
  }>;
}

// ── Internal service types ────────────────────────────────────────────────────

export interface PostCalendarDay {
  date: string; // YYYY-MM-DD
  posts: Array<{
    id: string;
    content: string;
    scheduledAt: Date | null;
    status: string;
    platforms: SocialPlatform[];
  }>;
}

export interface BulkCreateResult {
  batchId: string;
  created: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
}
