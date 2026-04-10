export type IntegrationProvider =
  | 'GOOGLE'
  | 'FACEBOOK'
  | 'TWITTER'
  | 'LINKEDIN'
  | 'TIKTOK'
  | 'WHATSAPP'
  | 'TELEGRAM'
  | 'SMS_TWILIO'
  | 'SMS_AFRICAS_TALKING';

export type IntegrationStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'ERROR';

export interface OAuthConfig {
  provider:     IntegrationProvider;
  clientId:     string;
  clientSecret: string;
  authUrl:      string;
  tokenUrl:     string;
  scopes:       string[];
  redirectPath: string;  // e.g. /integrations/google/callback
  usePKCE?:     boolean;
}

export interface TokenSet {
  accessToken:    string;
  refreshToken?:  string;
  expiresAt?:     Date;
  scopes?:        string[];
  tokenType?:     string;
}

export interface IntegrationConnection {
  id:             string;
  organizationId: string;
  provider:       IntegrationProvider;
  accountName?:   string;
  accountEmail?:  string;
  accountId?:     string;
  accountHandle?: string;
  scopes:         string[];
  status:         IntegrationStatus;
  tokenExpiresAt?: Date;
  lastUsedAt?:    Date;
  metadata?:      Record<string, unknown>;
}

// Provider-specific interfaces ────────────────────────────────────────────────

export interface GmailMessage {
  id:        string;
  threadId:  string;
  from:      string;
  to:        string[];
  subject:   string;
  body:      string;
  snippet:   string;
  date:      Date;
  labels:    string[];
  isRead:    boolean;
}

export interface GmailSendOptions {
  to:          string | string[];
  subject:     string;
  body:        string;
  html?:       boolean;
  cc?:         string[];
  bcc?:        string[];
  replyToId?:  string;  // threadId to reply to
}

export interface GoogleCalendarEvent {
  id?:          string;
  summary:      string;
  description?: string;
  startTime:    Date;
  endTime:      Date;
  allDay?:      boolean;
  location?:    string;
  attendees?:   string[];
  recurrence?:  string[];  // RRULE strings
  meetLink?:    string;
  reminders?:   Array<{ method: string; minutesBefore: number }>;
}

export interface GoogleDriveFile {
  id:         string;
  name:       string;
  mimeType:   string;
  size?:      number;
  webViewLink?: string;
  modifiedTime?: Date;
}

export interface SocialPost {
  content:    string;
  mediaUrls?: string[];
  scheduledAt?: Date;
  // Platform-specific extra fields
  extra?:     Record<string, unknown>;
}

export interface SocialPostResult {
  postId:     string;
  url?:       string;
  platform:   IntegrationProvider;
  publishedAt?: Date;
}

export interface WhatsAppMessage {
  to:       string;  // phone number with country code
  type:     'text' | 'template' | 'image' | 'document';
  text?:    string;
  template?: { name: string; language: string; components?: any[] };
  mediaUrl?: string;
  caption?:  string;
}

export interface TelegramMessage {
  chatId:     string | number;
  text:       string;
  parseMode?: 'HTML' | 'MarkdownV2';
  replyToId?: number;
  keyboard?:  any;
}

export interface SMSMessage {
  to:      string;
  body:    string;
  from?:   string;  // sender ID / number
}

// Webhook event ────────────────────────────────────────────────────────────────

export interface WebhookEvent {
  provider:      IntegrationProvider;
  eventType:     string;
  connectionId?: string;
  organizationId?: string;
  payload:       Record<string, unknown>;
  receivedAt:    Date;
}
