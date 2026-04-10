# AI-Powered Video Creation & Editing Engine

A scalable, production-grade video editing system with FFmpeg backend, AI-powered features, and modern frontend editor interface.

## Architecture Overview

```
Frontend (React/Canvas)
    ↓
    ├─→ Editing State (JSON)
    └─→ API Endpoints
         ↓
    Backend (NestJS)
         ↓
    ├─→ VideoEditorService (Business Logic)
    ├─→ VideoRenderingPipeline (FFmpeg)
    └─→ Database (Prisma)
         ↓
    Storage (S3 / Cloud)
```

## Core Components

### 1. **Data Models** (`prisma/schema.prisma`)

#### VideoProject
- Main container for a video editing session
- Stores editing state (timeline, clips, effects, etc.)
- Tracks rendering progress and project status

#### VideoClip
- Individual video segment
- Contains transformations (speed, scale, rotation, effects)
- Supports audio tracks, captions, transitions

#### VideoRender
- Represents a rendering job
- Tracks progress and output URL
- Supports multiple export formats/qualities

#### AutoEditingJob
- AI analysis and suggestions
- Highlight detection, scene detection, auto-cut recommendations

### 2. **Frontend Types** (`src/types/video-editor.types.ts`)

Comprehensive TypeScript types for:
- Editing state structure
- API request/response contracts
- Component props and events
- Helper types for timeline management

### 3. **API Endpoints** (`video-editor.controller.ts`)

#### Project Management
```
POST   /api/video-editor/projects              Create project
GET    /api/video-editor/projects              List projects
GET    /api/video-editor/projects/:projectId   Get project
PUT    /api/video-editor/projects/:projectId   Update project
DELETE /api/video-editor/projects/:projectId   Delete project
```

#### Editing State
```
POST /api/video-editor/projects/:projectId/save-state    Save timeline
GET  /api/video-editor/projects/:projectId/state         Get timeline
```

#### Clip Management
```
POST   /api/video-editor/projects/:projectId/clips       Add clip
PUT    /api/video-editor/clips/:clipId                   Update clip
DELETE /api/video-editor/clips/:clipId                   Delete clip
```

#### AI Features
```
POST /api/video-editor/clips/:clipId/generate-captions      Auto-captions (STT)
POST /api/video-editor/clips/:clipId/remove-background      Remove background
POST /api/video-editor/clips/:clipId/detect-scenes          Scene detection
POST /api/video-editor/clips/:clipId/detect-highlights      Highlight detection
POST /api/video-editor/clips/:clipId/remove-silence         Silence removal
POST /api/video-editor/projects/:projectId/auto-edit        AI editing suggestions
```

#### Rendering & Export
```
POST /api/video-editor/projects/:projectId/render           Start render
GET  /api/video-editor/renders/:renderId                    Get render status
GET  /api/video-editor/renders/:renderId/download           Download video
POST /api/video-editor/renders/:renderId/cancel             Cancel render
GET  /api/video-editor/render-queue                         Queue status
```

#### Versioning
```
POST   /api/video-editor/projects/:projectId/versions              Create version
GET    /api/video-editor/projects/:projectId/versions              List versions
POST   /api/video-editor/projects/:projectId/versions/:versionId/restore
```

#### Storage & Utility
```
GET /api/video-editor/storage/usage                Get org storage usage
```

### 4. **Service Layer** (`video-editor.service.ts`)

**VideoEditorService** provides:
- Project lifecycle management
- Clip operations with metadata extraction
- Editing state persistence and versioning
- AI feature coordination (async job queuing)
- Render job management

**Key Methods:**
```typescript
// Projects
createProject(orgId, userId, createDto)
listProjects(orgId, filters)
getProject(projectId)
updateProject(projectId, updateDto)
deleteProject(projectId)

// Editing state
saveEditingState(projectId, editingState)
getEditingState(projectId)

// Clips
addClip(projectId, addClipDto)
updateClip(clipId, updateDto)
getClip(clipId)
deleteClip(clipId)

// AI Features
generateAutoCaption(clipId, requestDto)
removeBackground(clipId)
autoEdit(projectId, options)
detectScenes(clipId)
detectHighlights(clipId)
removeSilence(clipId, options)

// Rendering
renderVideo(projectId, userId, exportSettings)
getRender(renderId)
cancelRender(renderId)
```

### 5. **Rendering Pipeline** (`rendering-pipeline.ts`)

**VideoRenderingPipeline** implements:
- Queue-based render job processing
- FFmpeg command generation
- Filter graph building from editing state
- Progress tracking
- Cloud storage upload (S3)
- Concurrent render limiting (max 2 simultaneous)

**FFmpeg Filter Graph Example:**
```
Input: Multiple video clips from timeline
├─ Concatenate clips: [0:v][1:v]concat=n=2:v=1:a=0[v]
├─ Apply effects: eq=brightness, hue=saturation, setpts (speed)
├─ Transitions: xfade for fade transitions
├─ Compositing: overlay for PiP, chroma_key for greenscreen
├─ Text: drawtext for captions
└─ Output: H.264 encoded MP4

Example command:
ffmpeg -f concat -safe 0 -i clips.txt \
  -vf "filter_graph" \
  -c:v libx264 -preset medium -b:v 12M \
  -c:a aac -b:a 128k \
  -s 1920x1080 -r 30 \
  output.mp4
```

## Editing State Structure

```typescript
interface EditingState {
  projectId: string;
  clips: TimelineClip[];        // Video clips on timeline
  duration: number;              // Total project duration
  audioTracks: TimelineAudioTrack[]; // Music, voiceover, SFX
  selectedClipId?: string;        // Currently selected clip
  zoom: number;                   // 0.5x to 2x timeline zoom
  currentTime: number;            // Scrubber position (seconds)
  scale: number;                  // Pixels per second
  gridSize: number;               // Snap-to-grid size
}

interface TimelineClip {
  id: string;
  clipId: string;              // Reference to VideoClip
  startTime: number;           // When clip starts in timeline
  endTime: number;             // When clip ends in timeline
  trackIndex: number;          // V1, V2, V3 (vertical stacking)
  properties: ClipProperties;  // Effects, transitions, transforms
}

interface ClipProperties {
  speed: number;               // 0.5x to 4x
  volume: number;              // 0-100%
  opacity: number;             // 0-100%
  rotation: number;            // 0, 90, 180, 270
  brightness: number;          // 0-200%
  contrast: number;            // 0-200%
  saturation: number;          // 0-200%
  transitionIn?: TransitionType;
  transitionOut?: TransitionType;
  transitionDuration: number;  // seconds
  effects: EffectNode[];       // Blur, pixelate, sepia, etc.
}
```

## AI Features

### 1. **Auto-Captions (Speech-to-Text)**
- Extracts audio from video clip
- Uses STT API (Google Cloud Speech, AWS Transcribe, or Deepgram)
- Generates SRT/VTT subtitle file
- Auto-styling with font, color, position customization

**Implementation:**
```typescript
await videoEditor.generateAutoCaption(clipId, {
  language: 'en',
  stylePreset: 'modern' // or 'bold', 'classic'
});
```

### 2. **Background Removal**
- AI-powered background separation
- Uses REMBG, MediaPipe, or cloud APIs
- Outputs alpha channel for compositing
- Enables greenscreen replacement

**Implementation:**
```typescript
await videoEditor.removeBackground(clipId);
```

### 3. **Scene Detection**
- Detects scene changes and cuts
- Uses OpenCV or FFmpeg scenedetect filter
- Returns timestamps and confidence scores
- Auto-suggests cut points

**Implementation:**
```typescript
const scenes = await videoEditor.detectScenes(clipId);
// Returns: { startTime, endTime, confidence, label }
```

### 4. **Highlight Detection**
- Face detection (MediaPipe, YOLO)
- Action/motion detection (optical flow)
- Sound/silence analysis
- Returns score 0-1 indicating "highlight-ness"

**Implementation:**
```typescript
await videoEditor.detectHighlights(clipId);
```

### 5. **Silence Removal**
- Audio analysis to detect silence
- Uses librosa or FFmpeg audio filters
- Automatically trims silent segments
- Maintains proper transitions

**Implementation:**
```typescript
await videoEditor.removeSilence(clipId, {
  threshold: -40, // dB
  minDuration: 0.5 // seconds
});
```

### 6. **Auto-Editing (AI Suggestions)**
- Analyzes full video project
- Suggests highlights, cuts, and transitions
- Applies smart pacing based on music/audio
- User can accept/reject suggestions

**Implementation:**
```typescript
const suggestions = await videoEditor.autoEdit(projectId, {
  analysisType: 'highlight_reel', // or 'auto_cut', 'scene_sync'
  scriptInput: 'Make this video punchy and energetic'
});
```

## Performance Considerations

### Timeline Optimization
- Virtual scrolling for large clip counts
- Lazy-load clip thumbnails
- Debounce state saves (auto-save every 5 seconds)
- Keep editing state serializable (avoid circular references)

### Rendering Optimization
- FFmpeg preset: `fast` (draft), `medium` (standard), `slow` (highest quality)
- Multi-threaded encoding: `-threads 4`
- Hardware acceleration: NVIDIA CUDA, Intel QuickSync, AMD VCE
- Concurrent limit: 2-4 simultaneous renders based on server specs

### Storage Management
- Compress source videos before upload
- Implement storage quota per organization
- Auto-cleanup old render outputs after 30 days
- Chunk uploads for large files

## Integration with Billing

Rendering jobs consume credits based on:
- Video duration (minutes)
- Output resolution (720p = 1x, 1080p = 1.5x, 4K = 3x)
- Output quality preset (low=0.5x, medium=1x, high=1.5x, ultra=2x)

**Example Cost Calculation:**
```
10-minute video @ 1080p high quality:
= 10 minutes * 1.5x (resolution) * 1.5x (quality)
= 22.5 credits
```

## Example Usage Flow

### 1. Create Project
```typescript
const project = await videoEditor.createProject(orgId, userId, {
  title: 'Product Demo Video',
  aspectRatio: 'LANDSCAPE_16_9',
  resolution: '1080p'
});
```

### 2. Add Clips
```typescript
const clip1 = await videoEditor.addClip(projectId, {
  sourceUrl: 's3://belsuite-videos/demo-part1.mp4',
  fileName: 'demo-part1.mp4'
});

const clip2 = await videoEditor.addClip(projectId, {
  sourceUrl: 's3://belsuite-videos/demo-part2.mp4',
  fileName: 'demo-part2.mp4'
});
```

### 3. Edit Timeline
```typescript
const editingState: EditingState = {
  projectId,
  clips: [
    {
      id: 'tc1',
      clipId: clip1.id,
      startTime: 0,
      endTime: 10,
      trackIndex: 0,
      properties: {
        speed: 1.0,
        volume: 100,
        opacity: 100,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        transitionOut: 'FADE',
        transitionDuration: 0.5,
        effects: []
      }
    },
    {
      id: 'tc2',
      clipId: clip2.id,
      startTime: 9.5,  // Overlaps with fade transition
      endTime: 20,
      trackIndex: 0,
      properties: { /* ... */ }
    }
  ],
  duration: 20,
  audioTracks: [],
  zoom: 1,
  currentTime: 0,
  scale: 100,
  gridSize: 16
};

await videoEditor.saveEditingState(projectId, editingState);
```

### 4. Add Captions & Effects
```typescript
// Auto-generate captions
await videoEditor.generateAutoCaption(clip1.id, {
  language: 'en',
  stylePreset: 'modern'
});

// Remove background
await videoEditor.removeBackground(clip1.id);

// Detect scenes
const scenes = await videoEditor.detectScenes(clip1.id);
```

### 5. Render & Export
```typescript
const render = await videoEditor.renderVideo(projectId, userId, {
  format: 'MP4',
  quality: 'HIGH',
  aspectRatio: 'LANDSCAPE_16_9',
  platforms: ['instagram', 'youtube']
});

// Poll for completion
const checkRender = setInterval(async () => {
  const status = await videoEditor.getRender(render.id);
  if (status.status === 'COMPLETED') {
    console.log('Ready to download:', status.outputUrl);
    clearInterval(checkRender);
  }
}, 5000);
```

## Development Setup

### Requirements
- Node.js 18+
- FFmpeg 4.4+ with libx264
- PostgreSQL 13+
- AWS S3 (or compatible storage)

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/belsuite
AWS_S3_BUCKET=belsuite-videos
AWS_REGION=us-east-1
FFMPEG_PATH=/usr/bin/ffmpeg
MAX_CONCURRENT_RENDERS=2
VIDEO_TEMP_STORAGE=/tmp/belsuite-video
```

### Install FFmpeg
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
choco install ffmpeg
```

### Database Migration
```bash
npx prisma migrate dev --name add_video_engine
```

## Future Enhancements

- [ ] Real-time collaboration (WebSocket syncing)
- [ ] GPU-accelerated rendering (CUDA, Metal)
- [ ] More AI features: voice clone, text-to-video, image-to-video
- [ ] Music sync (beat detection and auto-edit)
- [ ] Advanced color grading (LUTs, curves)
- [ ] Multi-track audio mixing and EQ
- [ ] Batch rendering across multiple servers
- [ ] Video preview streaming (HLS)
- [ ] Mobile app editor (React Native)
- [ ] Plugin system for custom effects

## References

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [FFmpeg Filter Graph](https://ffmpeg.org/ffmpeg-filters.html)
- [MediaPipe Vision](https://mediapipe.dev/solutions/vision/)
- [OpenCV Documentation](https://docs.opencv.org/)
- [Prisma Video Schema Design](https://www.prisma.io/docs/)
