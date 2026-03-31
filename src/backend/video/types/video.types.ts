/**
 * Shared types for the video engine.
 * Timeline JSON is serialised and stored in VideoProject.timelineJson.
 */

// ── Timeline ──────────────────────────────────────────────────────────────────

export interface TimelineState {
  version: 1;
  durationMs: number;
  width: number;
  height: number;
  fps: number;
  tracks: TimelineTrack[];
  globalAudio?: AudioSettings;
}

export type TimelineTrack =
  | VideoTrack
  | AudioTrack
  | TextTrack
  | ImageTrack;

export interface BaseTrack {
  id: string;
  name: string;
  locked: boolean;
  muted: boolean;
  clips: Clip[];
}

export interface VideoTrack extends BaseTrack { kind: 'video' }
export interface AudioTrack extends BaseTrack { kind: 'audio' }
export interface TextTrack  extends BaseTrack { kind: 'text'  }
export interface ImageTrack extends BaseTrack { kind: 'image' }

// ── Clips ─────────────────────────────────────────────────────────────────────

export type Clip =
  | VideoClip
  | AudioClip
  | TextClip
  | ImageClip;

interface BaseClip {
  id: string;
  /** Start on the timeline in ms */
  startMs: number;
  /** Duration on the timeline in ms */
  durationMs: number;
  /** 0-100 opacity */
  opacity: number;
  /** CSS-style transform string, e.g. "translate(0px,0px) scale(1)" */
  transform?: string;
  /** Fade in/out durations */
  fadeInMs?: number;
  fadeOutMs?: number;
}

export interface VideoClip extends BaseClip {
  kind: 'video';
  assetId: string;
  /** Start offset inside the source asset in ms */
  trimStartMs: number;
  trimEndMs: number;
  volume: number;    // 0-1
  speed: number;     // 0.25 - 4
  muted: boolean;
  filters?: VideoFilter[];
}

export interface AudioClip extends BaseClip {
  kind: 'audio';
  assetId: string;
  trimStartMs: number;
  trimEndMs: number;
  volume: number;
  speed: number;
}

export interface TextClip extends BaseClip {
  kind: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  background?: string;
  align: 'left' | 'center' | 'right';
  position: { x: number; y: number };
  /** If true this clip was auto-generated as a subtitle */
  isSubtitle: boolean;
}

export interface ImageClip extends BaseClip {
  kind: 'image';
  assetId: string;
  fit: 'contain' | 'cover' | 'fill';
  position: { x: number; y: number };
  width: number;
  height: number;
}

// ── Filters / effects ─────────────────────────────────────────────────────────

export interface VideoFilter {
  name: string;          // e.g. 'brightness', 'contrast', 'saturation', 'blur'
  value: number;
}

export interface AudioSettings {
  masterVolume: number;  // 0-1
  backgroundMusicUrl?: string;
  backgroundMusicVolume?: number;
}

// ── Scene generation input ────────────────────────────────────────────────────

export interface SceneGenerationRequest {
  projectId: string;
  organizationId: string;
  script: string;
  voiceId?: string;
  style?: 'cinematic' | 'minimal' | 'vibrant' | 'dark';
  aspectRatio?: '16:9' | '9:16' | '1:1';
  language?: string;
}

// ── Job payloads (stored in BullMQ + DB) ─────────────────────────────────────

export interface RenderJobPayload {
  projectId: string;
  organizationId: string;
  outputFormat: 'mp4' | 'webm';
  quality: 'low' | 'medium' | 'high';
}

export interface TtsJobPayload {
  projectId: string;
  sceneId: string;
  text: string;
  voiceId: string;
  organizationId: string;
}

export interface SubtitleJobPayload {
  projectId: string;
  audioUrl: string;
  language: string;
  organizationId: string;
}

export interface TranscodeJobPayload {
  assetId: string;
  sourceKey: string;
  targetFormat: string;
  organizationId: string;
}

export type VideoJobPayload =
  | ({ type: 'render' }      & RenderJobPayload)
  | ({ type: 'tts' }         & TtsJobPayload)
  | ({ type: 'subtitles' }   & SubtitleJobPayload)
  | ({ type: 'transcode' }   & TranscodeJobPayload);
