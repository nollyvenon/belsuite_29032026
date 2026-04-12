/**
 * Video Editor Types
 * Frontend state management & API contracts for video editing engine
 */

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface VideoProjectVersion {
  id: string;
  label?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface VideoProject {
  id: string;
  organizationId: string;
  createdBy: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  aspectRatio: AspectRatio;
  resolution: string;
  fps: number;
  status: VideoProjectStatus;
  editingState: EditingState | null;
  renderProgress: number;
  versions: VideoProjectVersion[];
  createdAt: string;
  updatedAt: string;
  lastEditedAt: string;
}

export interface VideoClip {
  id: string;
  projectId: string;
  sourceUrl: string;
  fileName: string;
  fileSize: number;
  duration: number;
  width: number;
  height: number;

  // Trim & timing
  startTime: number;
  endTime?: number;
  displayOrder: number;
  x: number; // Position in timeline

  // Playback
  speed: number;
  volume: number;
  opacity: number;

  // Transforms
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  scaleX: number;
  scaleY: number;

  // Effects
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;

  // Transitions
  transitionIn?: TransitionType;
  transitionOut?: TransitionType;
  transitionDuration: number;

  // Audio & effects
  hasAudio: boolean;
  backgroundRemoved: boolean;
  audioTracks: AudioTrack[];
  autoCaption?: VideoCaption;

  // AI features
  highlightScore?: number;

  createdAt: string;
  updatedAt: string;
}

export interface AudioTrack {
  id: string;
  clipId: string;
  sourceUrl: string;
  fileName: string;
  duration: number;
  trackType: AudioTrackType;
  volume: number;
  startTime: number;
  fadeIn: number;
  fadeOut: number;
  musicTitle?: string;
  musicArtist?: string;
}

export interface VideoCaption {
  id: string;
  clipId: string;
  sourceType: CaptionSourceType;
  transcriptUrl?: string;
  transcript?: CaptionSegment[];
  font: string;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  position: CaptionPosition;
  opacity: number;
  language: string;
  textToSpeech: boolean;
}

export interface CaptionSegment {
  startTime: number;
  endTime: number;
  text: string;
}

export interface VideoRender {
  id: string;
  projectId: string;
  format: VideoFormat;
  quality: VideoQuality;
  bitrate: string;
  status: RenderStatus;
  progress: number;
  outputUrl?: string;
  fileSize?: number;
  duration?: number;
  errorMessage?: string;
  processingTime?: number;
  creditsCost?: number;
  createdAt: string;
  completedAt?: string;
}

// ============================================================================
// EDITING STATE (SERIALIZABLE)
// ============================================================================

export interface EditingState {
  projectId: string;
  clips: TimelineClip[];
  duration: number;
  audioTracks: TimelineAudioTrack[];
  selectedClipId?: string;
  zoom: number; // 0.5x to 2x
  currentTime: number; // Scrubber position
  scale: number; // pixels per second
  gridSize: number; // pixels for snap-to-grid
}

export interface TimelineClip {
  id: string;
  clipId: string; // References VideoClip
  startTime: number; // When clip starts in timeline
  endTime: number; // When clip ends in timeline
  trackIndex: number; // V1, V2, V3, etc.
  properties: ClipProperties;
}

export interface ClipProperties {
  speed: number;
  volume: number;
  opacity: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  x: number;
  y: number;
  brightness: number;
  contrast: number;
  saturation: number;
  transitionIn?: TransitionType;
  transitionOut?: TransitionType;
  transitionDuration: number;
  effects: EffectNode[];
}

export interface EffectNode {
  id: string;
  type: EffectType;
  params: Record<string, any>;
}

export interface TimelineAudioTrack {
  id: string;
  trackIndex: number;
  clips: TimelineAudioClip[];
}

export interface TimelineAudioClip {
  id: string;
  audioTrackId: string;
  startTime: number;
  endTime: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

// ============================================================================
// SELECTION & EDITING CONTEXT
// ============================================================================

export interface EditorSelection {
  selectedClipId?: string;
  selectedAudioClipId?: string;
  selectedCaptionId?: string;
  multiSelect: string[]; // IDs of multi-selected clips
}

export interface EditorAction {
  type: EditorActionType;
  payload: any;
  timestamp: number;
}

export interface UndoRedoStack {
  past: EditingState[];
  future: EditingState[];
  limit: number; // Max undo states to keep
}

// ============================================================================
// AI FEATURES
// ============================================================================

export interface AutoEditingRequest {
  projectId: string;
  analysisType: 'highlight_reel' | 'auto_cut' | 'scene_sync';
  scriptInput?: string; // User provides script for AI to follow
}

export interface AutoEditingResult {
  id: string;
  projectId: string;
  status: AutoEditingStatus;
  suggestedClips: SuggestedEdit[];
  suggestedEffects: SuggestedEffect[];
  suggestedMusic: SuggestedMusic[];
  confidence: number;
}

export interface SuggestedEdit {
  startTime: number;
  endTime: number;
  reason: string; // "Action detected", "Face appeared", etc.
  confidence: number;
}

export interface SuggestedEffect {
  startTime: number;
  endTime: number;
  effect: TransitionType | EffectType;
  reason: string;
  confidence: number;
}

export interface SuggestedMusic {
  title: string;
  artist: string;
  tempo: number; // BPM
  mood: string; // "energetic", "calm", etc.
  duration: number;
  reason: string;
}

export interface CropPreset {
  name: string;
  width: number;
  height: number;
  aspectRatio: AspectRatio;
  description: string;
}

// ============================================================================
// ENUMS
// ============================================================================

export enum AspectRatio {
  LANDSCAPE_16_9 = '16_9',
  LANDSCAPE_4_3 = '4_3',
  PORTRAIT_9_16 = '9_16',
  SQUARE_1_1 = '1_1',
  ULTRAWIDE_21_9 = '21_9',
  CUSTOM = 'custom',
}

export enum VideoProjectStatus {
  DRAFT = 'DRAFT',
  EDITING = 'EDITING',
  RENDERING = 'RENDERING',
  COMPLETED = 'COMPLETED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum TransitionType {
  NONE = 'none',
  FADE = 'fade',
  SLIDE = 'slide',
  ZOOM = 'zoom',
  WIPE = 'wipe',
  BLUR = 'blur',
  GLITCH = 'glitch',
  MORPH = 'morph',
}

export enum AudioTrackType {
  ORIGINAL = 'original',
  MUSIC = 'music',
  SFX = 'sfx',
  VOICEOVER = 'voiceover',
}

export enum CaptionSourceType {
  AUTO = 'auto',
  UPLOAD = 'upload',
  MANUAL = 'manual',
}

export enum CaptionPosition {
  TOP = 'top',
  MIDDLE = 'middle',
  BOTTOM = 'bottom',
}

export enum VideoFormat {
  MP4 = 'mp4',
  MOV = 'mov',
  AVI = 'avi',
  WEBM = 'webm',
  MKV = 'mkv',
}

export enum VideoQuality {
  LOW = 'low',        // 480p, 3Mbps
  MEDIUM = 'medium',  // 720p, 6Mbps
  HIGH = 'high',      // 1080p, 12Mbps
  ULTRA = 'ultra',    // 4K, 25Mbps
}

export enum RenderStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum AutoEditingStatus {
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum EffectType {
  // Visual effects
  BLUR = 'blur',
  SHARPEN = 'sharpen',
  PIXELATE = 'pixelate',
  SEPIA = 'sepia',
  GRAYSCALE = 'grayscale',
  INVERT = 'invert',

  // Time-based effects
  SLOW_MOTION = 'slow_motion',
  SPEED_RAMP = 'speed_ramp',
  TIME_WARP = 'time_warp',

  // Audio effects
  ECHO = 'echo',
  REVERB = 'reverb',
  EQUALIZE = 'equalize',

  // Composite effects
  PICTURE_IN_PICTURE = 'pip',
  CHROMA_KEY = 'chroma_key',
  OVERLAY = 'overlay',
}

export enum EditorActionType {
  ADD_CLIP = 'ADD_CLIP',
  REMOVE_CLIP = 'REMOVE_CLIP',
  UPDATE_CLIP_PROPERTIES = 'UPDATE_CLIP_PROPERTIES',
  MOVE_CLIP = 'MOVE_CLIP',
  TRIM_CLIP = 'TRIM_CLIP',
  ADD_TRANSITION = 'ADD_TRANSITION',
  ADD_AUDIO_TRACK = 'ADD_AUDIO_TRACK',
  REMOVE_AUDIO_TRACK = 'REMOVE_AUDIO_TRACK',
  ADD_CAPTION = 'ADD_CAPTION',
  UPDATE_CAPTION = 'UPDATE_CAPTION',
  ADD_EFFECT = 'ADD_EFFECT',
  REMOVE_EFFECT = 'REMOVE_EFFECT',
  SET_CURRENT_TIME = 'SET_CURRENT_TIME',
  SET_ZOOM = 'SET_ZOOM',
  ENABLE_GRID_SNAP = 'ENABLE_GRID_SNAP',
}

// ============================================================================
// API REQUEST/RESPONSE CONTRACTS
// ============================================================================

export interface CreateProjectRequest {
  title: string;
  description?: string;
  aspectRatio: AspectRatio;
  resolution?: string;
  fps?: number;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: VideoProjectStatus;
}

export interface AddClipRequest {
  sourceUrl: string;
  fileName: string;
  startTime?: number;
  endTime?: number;
  displayOrder?: number;
}

export interface UpdateClipRequest {
  speed?: number;
  volume?: number;
  opacity?: number;
  rotation?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  transitionIn?: TransitionType;
  transitionOut?: TransitionType;
}

export interface GenerateAutoCaptionRequest {
  clipId: string;
  language?: string;
  stylePreset?: string;
}

export interface ExportVideoRequest {
  format: VideoFormat;
  quality: VideoQuality;
  aspectRatio?: AspectRatio;
  platforms?: ('instagram' | 'tiktok' | 'youtube' | 'linkedin')[]; // Multi-export
}

export interface RenderQueueItem {
  id: string;
  projectId: string;
  priority: number;
  status: RenderStatus;
  progress: number;
  eta?: number; // seconds remaining
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface VideoEditorState {
  projects: VideoProject[];
  currentProjectId?: string;
  editingState: EditingState | null;
  selection: EditorSelection;
  undoStack: UndoRedoStack;
  isRendering: boolean;
  renderProgress: number;
  autoSaveEnabled: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
}

export interface EditorToolbar {
  clipTools: ToolButton[];
  transitionTools: ToolButton[];
  effectTools: ToolButton[];
  audioTools: ToolButton[];
  textTools: ToolButton[];
}

export interface ToolButton {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  isActive: boolean;
}

export const CROP_PRESETS: CropPreset[] = [
  { name: 'Instagram Post', width: 1080, height: 1080, aspectRatio: AspectRatio.SQUARE_1_1, description: '1:1' },
  { name: 'Instagram Reel', width: 1080, height: 1920, aspectRatio: AspectRatio.PORTRAIT_9_16, description: '9:16' },
  { name: 'TikTok', width: 1080, height: 1920, aspectRatio: AspectRatio.PORTRAIT_9_16, description: '9:16' },
  { name: 'YouTube', width: 1920, height: 1080, aspectRatio: AspectRatio.LANDSCAPE_16_9, description: '16:9' },
  { name: 'LinkedIn Post', width: 1200, height: 628, aspectRatio: AspectRatio.LANDSCAPE_16_9, description: '16:9' },
  { name: 'Square', width: 1080, height: 1080, aspectRatio: AspectRatio.SQUARE_1_1, description: '1:1' },
];
