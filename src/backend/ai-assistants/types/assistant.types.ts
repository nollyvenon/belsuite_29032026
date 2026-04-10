export type AssistantType = 'SIERRA' | 'DONNA' | 'YOUTUBE' | 'SOCIAL' | 'CALENDAR';

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool_result';

export type TaskStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED' | 'CANCELLED';

// ── Conversation ──────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ChatRequest {
  organizationId: string;
  userId?: string;
  message: string;
  conversationId?: string;   // pass to continue a thread
  stream?: boolean;
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  reply: string;
  model: string;
  tokensUsed: number;
  costUsd: number;
  tasks?: SubmittedTask[];   // async tasks spawned by this reply
}

// ── Persistent context (long-lived facts per org + assistant) ─────────────────

export interface AssistantContextData {
  // Populated progressively as the assistant learns about the org
  orgName?: string;
  orgGoals?: string[];
  activeProjects?: string[];
  preferredTone?: string;
  preferredPlatforms?: string[];
  recentDecisions?: Array<{ summary: string; date: string }>;
  keyContacts?: Array<{ name: string; role: string }>;
  [key: string]: unknown;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export type TaskType =
  | 'GENERATE_CONTENT'
  | 'SCHEDULE_POST'
  | 'SEND_DM'
  | 'REPLY_TO_COMMENT'
  | 'CREATE_CALENDAR_EVENT'
  | 'SEND_REMINDER'
  | 'YOUTUBE_GENERATE_SCRIPT'
  | 'YOUTUBE_OPTIMIZE_SEO'
  | 'YOUTUBE_SCHEDULE_UPLOAD'
  | 'RUN_WORKFLOW'
  | 'ANALYZE_DATA'
  | 'PLAN_CAMPAIGN';

export interface SubmittedTask {
  taskId: string;
  taskType: TaskType;
  status: TaskStatus;
  scheduledAt?: Date;
}

// ── Sierra (Executive) ────────────────────────────────────────────────────────

export interface StrategySuggestion {
  title: string;
  summary: string;
  rationale: string;
  impactLevel: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  nextSteps: string[];
  estimatedTimeframe?: string;
}

export interface ContentPlan {
  period: string;           // e.g. "April 2026"
  theme: string;
  platforms: string[];
  posts: Array<{
    week: number;
    platform: string;
    format: string;          // blog | reel | carousel | email | etc.
    topic: string;
    cta: string;
    targetAudience: string;
  }>;
  kpis: string[];
}

export interface BusinessInsight {
  category: 'revenue' | 'growth' | 'retention' | 'brand' | 'ops';
  insight: string;
  dataPoints?: string[];
  recommendation: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// ── Donna (Operations) ────────────────────────────────────────────────────────

export interface WorkflowSpec {
  name: string;
  trigger: string;           // event that fires this workflow
  steps: Array<{
    action: string;
    params?: Record<string, unknown>;
    delayMinutes?: number;
  }>;
}

export interface CampaignSpec {
  name: string;
  goal: string;
  audience: string;
  channels: string[];
  startDate: Date;
  endDate?: Date;
  budget?: number;
  contentPieces: number;
}

// ── YouTube ───────────────────────────────────────────────────────────────────

export interface YouTubeScriptSpec {
  topic: string;
  targetAudience: string;
  durationSecs: number;     // target video length
  tone: 'educational' | 'entertaining' | 'inspirational' | 'sales';
  callToAction: string;
  keyPoints?: string[];
}

export interface YouTubeScript {
  title: string;
  hook: string;             // first 30 seconds
  sections: Array<{ heading: string; content: string; durationSecs: number }>;
  outro: string;
  bRollSuggestions: string[];
  estimatedDuration: number;
}

export interface SEOPackage {
  title: string;            // optimized title (< 60 chars)
  description: string;      // 150-300 chars
  tags: string[];           // up to 15
  chapters?: Array<{ timestamp: string; title: string }>;
  category: string;
}

export interface ThumbnailConcept {
  concept: string;
  mainText: string;
  backgroundStyle: string;
  colorScheme: string;
  faceSuggestion: string;
  moodBoard: string;
}

// ── Social media ──────────────────────────────────────────────────────────────

export type SocialPlatform = 'TWITTER' | 'INSTAGRAM' | 'LINKEDIN' | 'FACEBOOK' | 'TIKTOK' | 'YOUTUBE';

export interface PostSpec {
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledAt?: Date;
}

export interface EngagementReplyRequest {
  platform: SocialPlatform;
  postContent: string;
  comment: string;
  commenterHandle: string;
  tone?: 'friendly' | 'professional' | 'playful' | 'empathetic';
}

export interface DMRequest {
  platform: SocialPlatform;
  senderHandle: string;
  messageContent: string;
  previousMessages?: Array<{ role: 'sender' | 'us'; content: string }>;
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export interface EventSpec {
  title: string;
  description?: string;
  eventType: 'CAMPAIGN' | 'CONTENT' | 'MEETING' | 'REMINDER' | 'DEADLINE' | 'REVIEW';
  startAt: Date;
  endAt?: Date;
  allDay?: boolean;
  timezone?: string;
  reminders?: Array<{ minutesBefore: number; method: 'email' | 'push' | 'sms' }>;
  recurrence?: { frequency: string; interval?: number; until?: Date };
  campaignId?: string;
}

export interface CampaignTimeline {
  campaignId: string;
  events: EventSpec[];
  milestones: Array<{ name: string; date: Date; description: string }>;
}
