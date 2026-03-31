export type UGCProjectStatus = 'DRAFT' | 'SCRIPTING' | 'RENDERING' | 'READY' | 'PUBLISHED' | 'FAILED';

export type AvatarStyle = 'INFLUENCER' | 'PROFESSIONAL' | 'CASUAL' | 'PRESENTER' | 'NARRATOR';

export type AvatarProvider = 'HEYGEN' | 'DID' | 'TAVUS' | 'SYNTHESIA' | 'MOCK';

export type VoiceGender = 'MALE' | 'FEMALE' | 'NEUTRAL';

export type RenderStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETE' | 'FAILED';

export interface UGCBrandContext {
  companyName?: string;
  website?: string;
  description?: string;
  industry?: string;
  logo?: string;
  defaultLanguage?: string;
  defaultTimezone?: string;
  featurePreferences?: string;
  voiceNotes?: string[];
}

export interface GenerateUGCScriptRequest {
  objective: 'awareness' | 'engagement' | 'conversions' | 'retention';
  platform: 'tiktok' | 'instagram' | 'youtube' | 'facebook';
  durationSeconds: number;
  productOrOffer: string;
  targetAudience: string;
  callToAction?: string;
  talkingPoints?: string[];
}

export interface GeneratedUGCScene {
  order: number;
  durationSeconds: number;
  line: string;
  visualDirection: string;
  facialCue?: string;
}

export interface GeneratedUGCScript {
  hook: string;
  body: string[];
  callToAction: string;
  fullScript: string;
  scenes: GeneratedUGCScene[];
}

export interface CreateUGCRenderRequest {
  faceAnimation?: boolean;
  lipSyncIntensity?: number;
  resolution?: '720p' | '1080p' | '4k';
  enableCaptions?: boolean;
  backgroundMusic?: boolean;
  aspectRatio?: '9:16' | '1:1' | '16:9';
}

export interface UGCDashboardOverview {
  totalProjects: number;
  readyProjects: number;
  publishedProjects: number;
  avatarsAvailable: number;
  voiceClonesAvailable: number;
  rendersInFlight: number;
  recentProjects: Array<{
    id: string;
    title: string;
    status: UGCProjectStatus;
    updatedAt: Date;
    avatarName: string | null;
    outputUrl: string | null;
  }>;
}