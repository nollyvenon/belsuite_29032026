/**
 * SaaS Growth Engine Types
 * Lead generation, SEO, CRM, Marketing automation
 */

// ============================================================================
// LEAD GENERATION TYPES
// ============================================================================

export interface LeadSource {
  id: string;
  organizationId: string;
  name: string;
  sourceType: LeadSourceType;
  config: Record<string, any>;
  isActive: boolean;
  leadsGenerated: number;
  lastRunAt?: string;
  successRate: number;
  dailyLimit: number;
  monthlyLimit: number;
  monthlyUsage: number;
}

export interface Lead {
  id: string;
  organizationId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  jobTitle?: string;
  industry?: string;
  companySize?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  sourceId?: string;
  enrichmentStatus: EnrichmentStatus;
  enrichmentData?: Record<string, any>;
  verificationStatus: VerificationStatus;
  leadScore: number;
  leadGrade: LeadGrade;
  inboundScore: number;
  visitorId?: string;
  lastSeen?: string;
  pageViews: number;
  engagementValue: number;
  contactId?: string;
  status: LeadStatus;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastEngagedAt?: string;
}

export interface VisitorTrack {
  id: string;
  organizationId: string;
  anonymousId: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  geoData?: GeoData;
  pages: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  sessionCount: number;
  totalTimeSeconds: number;
  converted: boolean;
  conversionValue: number;
  leadId?: string;
}

export interface GeoData {
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

// ============================================================================
// SEO & CONTENT TYPES
// ============================================================================

export interface BlogPost {
  id: string;
  organizationId: string;
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  keywords: string[];
  focusKeyword?: string;
  generationPrompt?: string;
  aiModel?: string;
  wordCount: number;
  readingTime: number;
  seoScore: number;
  status: ContentStatus;
  publishedAt?: string;
  scheduledFor?: string;
  views: number;
  clicks: number;
  conversions: number;
  ranking?: string;
  internalLinks: string[];
  backlinkCount: number;
}

export interface Backlink {
  id: string;
  postId: string;
  organizationId: string;
  sourceUrl: string;
  sourceTitle?: string;
  sourceDomain: string;
  anchorText?: string;
  domainAuthority?: number;
  pageAuthority?: number;
  trustFlow?: number;
  citationFlow?: number;
  spamScore?: number;
  status: BacklinkStatus;
  acquiredAt?: string;
}

export interface KeywordCluster {
  id: string;
  organizationId: string;
  name: string;
  primaryKeyword: string;
  keywords: string[];
  searchVolume: number;
  keywordDifficulty: number;
  suggestedBid: number;
  postId?: string;
  status: ClusterStatus;
}

// ============================================================================
// CRM TYPES
// ============================================================================

export interface Contact {
  id: string;
  organizationId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  jobTitle?: string;
  score: number;
  source?: string;
  status: ContactStatus;
  tags: string[];
  lastInteraction?: string;
  customFields?: Record<string, any>;
}

export interface Deal {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  expectedRevenue?: number;
  stage: DealStage;
  probability: number;
  ownerId?: string;
  expectedCloseDate?: string;
  wonAt?: string;
  lostAt?: string;
  notes?: string;
  lastActivityAt?: string;
  isAutomated: boolean;
  contactIds: string[];
}

export interface Activity {
  id: string;
  organizationId: string;
  type: ActivityType;
  leadId?: string;
  contactId?: string;
  dealId?: string;
  title: string;
  description?: string;
  duration?: number;
  channel?: string;
  status: ActivityStatus;
  result?: string;
  assignedTo?: string;
  scheduledFor?: string;
  completedAt?: string;
  aiGenerated: boolean;
  automationJobId?: string;
}

// ============================================================================
// MARKETING AUTOMATION TYPES
// ============================================================================

export interface MarketingCampaign {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  campaignType: CampaignType;
  config: Record<string, any>;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  scheduledAt?: string;
  totalRecipients: number;
  sentCount: number;
  openCount: number;
  clickCount: number;
  responseCount: number;
  conversionCount: number;
  budget?: number;
  spent: number;
  revenue: number;
  roi: number;
}

export interface CampaignTemplate {
  id: string;
  organizationId: string;
  name: string;
  templateType: CampaignType;
  subject?: string;
  body: string;
  variables: string[];
  aiGenerated: boolean;
  generationPrompt?: string;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  campaignCount: number;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  leadId?: string;
  contactId?: string;
  email?: string;
  phoneNumber?: string;
  status: CampaignRecipientStatus;
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  respondedAt?: string;
  openCount: number;
  clickCount: number;
  bounceType?: BounceType;
}

export interface AutomationWorkflow {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  triggerConfig: Record<string, any>;
  steps: WorkflowStep[];
  isActive: boolean;
  executionCount: number;
  successCount: number;
  failureCount: number;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  order: number;
  type: WorkflowStepType;
  config: Record<string, any>;
  conditions?: ConditionNode[];
}

export interface ConditionNode {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt' | 'in';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface AICalling {
  id: string;
  organizationId: string;
  name: string;
  voiceId: string;
  prompt: string;
  personality?: string;
  webhookUrl?: string;
  totalCalls: number;
  successfulCalls: number;
  avgDuration: number;
  successRate: number;
  isActive: boolean;
}

export interface AICall {
  id: string;
  agentId: string;
  leadId?: string;
  contactId?: string;
  phoneNumber: string;
  status: CallStatus;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  recordingUrl?: string;
  transcription?: string;
  outcome?: CallOutcome;
  notes?: string;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface EnrichLeadRequest {
  leadId: string;
  enrichmentServices?: Array<'clearbit' | 'hunter' | 'rocketreach' | 'apollo'>;
}

export interface GenerateBlogPostRequest {
  keywordClusterId?: string;
  title: string;
  tone?: 'professional' | 'conversational' | 'technical';
  lengthPreference?: 'short' | 'medium' | 'long'; // 800, 1500, 2500 words
  includeImages?: boolean;
  aiModel?: string;
}

export interface CreateCampaignRequest {
  name: string;
  campaignType: CampaignType;
  templateId?: string;
  recipientIds: string[];
  recipientFilters?: {
    leadGrade?: LeadGrade[];
    tags?: string[];
    status?: LeadStatus[];
  };
  scheduledAt?: string;
  budget?: number;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  triggerConfig: Record<string, any>;
  steps: WorkflowStepInput[];
}

export interface WorkflowStepInput {
  type: WorkflowStepType;
  config: Record<string, any>;
  conditions?: ConditionNode[];
}

export interface InitiateAICallRequest {
  agentId: string;
  leadIds?: string[];
  contactIds?: string[];
  phoneNumbers: string[];
  scheduledFor?: string;
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

export interface LeadAnalytics {
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  averageLeadScore: number;
  sourceBreakdown: Record<string, number>;
  statusBreakdown: Record<LeadStatus, number>;
  enrichmentRate: number;
  verificationRate: number;
  topSources: Array<{ source: string; count: number }>;
  trendData: Array<{ date: string; newLeads: number }>;
}

export interface CampaignAnalytics {
  totalCampaigns: number;
  activeCampaigns: number;
  averageOpenRate: number;
  averageClickRate: number;
  averageConversionRate: number;
  totalSent: number;
  totalResponses: number;
  totalRevenue: number;
  roi: number;
  topPerformingCampaign?: {
    id: string;
    name: string;
    openRate: number;
  };
}

export interface CRMAnalytics {
  totalContacts: number;
  totalDeals: number;
  dealValue: number;
  winRate: number;
  averageDealSize: number;
  pipelineByStage: Record<DealStage, number>;
  conversionFunnel: Array<{ stage: DealStage; count: number }>;
  topOwners: Array<{ ownerId: string; dealCount: number; totalValue: number }>;
}

export interface GrowthEngineStats {
  leads: LeadAnalytics;
  campaigns: CampaignAnalytics;
  crm: CRMAnalytics;
  seo: {
    totalPosts: number;
    totalBacklinks: number;
    avgSeoScore: number;
    rankedKeywords: number;
  };
}

// ============================================================================
// ENUMS
// ============================================================================

export enum LeadSourceType {
  WEB_SCRAPE = 'WEB_SCRAPE',
  IMPORT = 'IMPORT',
  MANUAL = 'MANUAL',
  API = 'API',
  LINKEDIN = 'LINKEDIN',
  FORM = 'FORM',
  REFERRAL = 'REFERRAL',
  PAID_AD = 'PAID_AD',
  ORGANIC = 'ORGANIC',
}

export enum EnrichmentStatus {
  PENDING = 'PENDING',
  ENRICHING = 'ENRICHING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  INVALID = 'INVALID',
  BOUNCED = 'BOUNCED',
}

export enum LeadGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  F = 'F',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  NURTURING = 'NURTURING',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum BacklinkStatus {
  PENDING = 'PENDING',
  ACQUIRED = 'ACQUIRED',
  LOST = 'LOST',
  REJECTED = 'REJECTED',
}

export enum ClusterStatus {
  RESEARCH = 'RESEARCH',
  CONTENT_CREATED = 'CONTENT_CREATED',
  PUBLISHED = 'PUBLISHED',
  RANKING = 'RANKING',
}

export enum ContactStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum DealStage {
  LEAD = 'LEAD',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
}

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  WEB_ACTIVITY = 'WEB_ACTIVITY',
  FORM_SUBMISSION = 'FORM_SUBMISSION',
}

export enum ActivityStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum CampaignType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  VOICE = 'VOICE',
  WORKFLOW = 'WORKFLOW',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum CampaignRecipientStatus {
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  BOUNCED = 'BOUNCED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  RESPONDED = 'RESPONDED',
  CONVERTED = 'CONVERTED',
}

export enum BounceType {
  HARD = 'HARD',
  SOFT = 'SOFT',
}

export enum WorkflowTrigger {
  LEAD_CREATED = 'LEAD_CREATED',
  CONTACT_CREATED = 'CONTACT_CREATED',
  LINK_CLICKED = 'LINK_CLICKED',
  FORM_SUBMITTED = 'FORM_SUBMITTED',
  EMAIL_OPENED = 'EMAIL_OPENED',
  DEAL_STAGE_CHANGED = 'DEAL_STAGE_CHANGED',
  TAG_ADDED = 'TAG_ADDED',
  MANUAL = 'MANUAL',
  TIME_BASED = 'TIME_BASED',
}

export enum WorkflowStepType {
  SEND_EMAIL = 'SEND_EMAIL',
  SEND_SMS = 'SEND_SMS',
  MAKE_CALL = 'MAKE_CALL',
  ADD_TAG = 'ADD_TAG',
  UPDATE_SCORE = 'UPDATE_SCORE',
  DELAY = 'DELAY',
  CONDITIONAL = 'CONDITIONAL',
  WEBHOOK = 'WEBHOOK',
  ASSIGN_USER = 'ASSIGN_USER',
  UPDATE_STAGE = 'UPDATE_STAGE',
}

export enum CallStatus {
  PENDING = 'PENDING',
  RINGING = 'RINGING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  NO_ANSWER = 'NO_ANSWER',
  BUSY = 'BUSY',
}

export enum CallOutcome {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE',
  VOICEMAIL = 'VOICEMAIL',
  NOT_ANSWERED = 'NOT_ANSWERED',
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const LEAD_SCORING_WEIGHTS = {
  EMAIL_VERIFIED: 10,
  COMPANY_VERIFIED: 15,
  JOB_TITLE_VERIFIED: 10,
  PAGE_VIEW: 2,
  EMAIL_OPENED: 5,
  LINK_CLICKED: 8,
  FORM_SUBMISSION: 20,
  MEETING_SCHEDULED: 25,
};

export const ENRICHMENT_PROVIDERS = ['clearbit', 'hunter', 'rocketreach', 'apollo', 'zoominfo'] as const;

export const WORKFLOW_STEP_LIMITS = {
  MAX_STEPS: 50,
  MAX_DELAYS: 100, // Max 100 days delay between steps
};
