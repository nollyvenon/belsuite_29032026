import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import { VideoProject, ExportVideoRequest } from '../../types/video-editor.types';

const execAsync = promisify(exec);

/**
 * FFmpeg-based video rendering pipeline
 * Handles compositing, effects, encoding, and optimization
 */
export class VideoRenderingPipeline {
  private readonly logger = new Logger(VideoRenderingPipeline.name);
  private renderQueue: Map<string, RenderJob> = new Map();
  private maxConcurrentRenders: number = 2;
  private activeRenders: number = 0;

  constructor(private config: ConfigService) {
    this.startRenderWorker();
  }

  /**
   * Queue a video for rendering
   */
  async queueRender(projectId: string, renderId: string, project: VideoProject, exportSettings: ExportVideoRequest): Promise<void> {
    const job: RenderJob = {
      projectId,
      renderId,
      project,
      exportSettings,
      status: 'QUEUED',
      progress: 0,
      startedAt: null,
      completedAt: null,
    };

    this.renderQueue.set(renderId, job);
    this.logger.log(`Queued render job: ${renderId} (queue size: ${this.renderQueue.size})`);
  }

  /**
   * Worker process that continuously processes render queue
   */
  private startRenderWorker(): void {
    const handle = setInterval(async () => {
      if (this.activeRenders < this.maxConcurrentRenders) {
        const nextJob = Array.from(this.renderQueue.values()).find(j => j.status === 'QUEUED');

        if (nextJob) {
          this.activeRenders++;
          await this.processRender(nextJob).finally(() => this.activeRenders--);
        }
      }
    }, 1000);
    handle.unref();
  }

  /**
   * Process a single render job
   */
  private async processRender(job: RenderJob): Promise<void> {
    try {
      job.status = 'PROCESSING';
      job.startedAt = new Date();
      job.progress = 0;

      this.logger.log(`Starting render: ${job.renderId}`);

      // Generate FFmpeg command
      const ffmpegCmd = await this.generateFFmpegCommand(job);

      // Execute rendering
      const outputPath = await this.executeRender(job, ffmpegCmd);

      // Upload to storage (S3, etc.)
      const outputUrl = await this.uploadToStorage(outputPath, job);

      // Update job status
      job.status = 'COMPLETED';
      job.completedAt = new Date();
      job.progress = 100;

      this.logger.log(`Completed render: ${job.renderId} -> ${outputUrl}`);

      // Cleanup temp files
      await this.cleanupTempFiles(outputPath);
    } catch (error) {
      job.status = 'FAILED';
      job.completedAt = new Date();
      this.logger.error(`Render failed: ${job.renderId} - ${error.message}`);
    }
  }

  /**
   * Generate FFmpeg command for video rendering
   */
  private async generateFFmpegCommand(job: RenderJob): Promise<string> {
    const { project, exportSettings } = job;
    const editingState = project.editingState;

    // Build filter graph from editing state
    const filterGraph = this.buildFilterGraph(editingState);

    // Resolution settings
    const resolutionMap: Record<string, string> = {
      '480p': '854x480',
      '720p': '1280x720',
      '1080p': '1920x1080',
      '4K': '3840x2160',
    };

    const resolution = resolutionMap[exportSettings.quality] || '1920x1080';
    const [width, height] = resolution.split('x');

    // Bitrate
    const bitrateMap: Record<string, string> = {
      low: '3M',
      medium: '6M',
      high: '12M',
      ultra: '25M',
    };

    const bitrate = bitrateMap[exportSettings.quality] || '10M';

    // Build concat demuxer file for clips
    const concatFile = await this.generateConcatDemuxerFile(editingState);

    // Build FFmpeg command
    const cmd = `
ffmpeg -f concat -safe 0 -i "${concatFile}" \
  -vf "${filterGraph}" \
  -c:v libx264 \
  -preset medium \
  -b:v ${bitrate} \
  -c:a aac \
  -b:a 128k \
  -s ${resolution} \
  -r ${project.fps} \
  -movflags +faststart \
  -y \
  "${job.renderId}.${exportSettings.format}"
    `.trim();

    this.logger.debug(`FFmpeg command: ${cmd}`);
    return cmd;
  }

  /**
   * Build FFmpeg filter graph from editing state
   */
  private buildFilterGraph(editingState: any): string {
    const filters: string[] = [];

    // Build clip composition
    // Example: [0:v][1:v]concat=n=2:v=1:a=0[v]
    const clipCount = editingState.clips.length;
    let clipFilter = '';

    for (let i = 0; i < clipCount; i++) {
      clipFilter += `[${i}:v]`;
    }
    clipFilter += `concat=n=${clipCount}:v=1:a=0[v]`;

    filters.push(clipFilter);

    // Apply effects from clip properties
    editingState.clips.forEach((clip: any, idx: number) => {
      const props = clip.properties;
      const effectFilters: string[] = [];

      // Brightness/contrast
      if (props.brightness !== 100 || props.contrast !== 100) {
        const brightness = (props.brightness - 100) / 100;
        const contrast = props.contrast / 100;
        effectFilters.push(`eq=brightness=${brightness}:contrast=${contrast}`);
      }

      // Saturation
      if (props.saturation !== 100) {
        effectFilters.push(`hue=s=${props.saturation / 100}`);
      }

      // Speed (for video)
      if (props.speed !== 1) {
        effectFilters.push(`setpts=${1 / props.speed}*PTS`);
      }

      // Opacity
      if (props.opacity !== 100) {
        effectFilters.push(`format=yuva420p,eval=init+frame,alpha=${props.opacity / 100}`);
      }

      // Apply rotation if needed
      if (props.rotation !== 0) {
        const rotationMap: Record<number, string> = {
          90: 'transpose=1',
          180: 'transpose=2,transpose=2',
          270: 'transpose=2',
        };
        if (rotationMap[props.rotation]) {
          effectFilters.push(rotationMap[props.rotation]);
        }
      }

      if (effectFilters.length > 0) {
        filters.push(`[${idx}:v]${effectFilters.join(',')}[v${idx}]`);
      }
    });

    // Transitions between clips (simplified - fade transitions)
    editingState.clips.forEach((clip: any, idx: number) => {
      if (clip.properties.transitionOut === 'fade' && idx < clipCount - 1) {
        const duration = clip.properties.transitionDuration || 0.5;
        filters.push(`[v${idx}][v${idx + 1}]xfade=transition=fade:duration=${duration}:offset=0[out${idx}]`);
      }
    });

    // Add captions/text if present
    editingState.clips
      .filter((c: any) => c.captionId)
      .forEach((clip: any) => {
        filters.push(`drawtext=textfile='captions/${clip.captionId}.txt':fontsize=24:fontcolor=white`);
      });

    return filters.join(';');
  }

  /**
   * Generate FFmpeg concat demuxer file
   */
  private async generateConcatDemuxerFile(editingState: any): Promise<string> {
    const concatLines: string[] = [];

    for (const clip of editingState.clips) {
      const duration = clip.endTime - clip.startTime;
      concatLines.push(`file '${clip.clipId}.mp4'`);
      concatLines.push(`duration ${duration}`);
    }

    const concatFilePath = `/tmp/concat_${Date.now()}.txt`;
    await fs.writeFile(concatFilePath, concatLines.join('\n'));

    return concatFilePath;
  }

  /**
   * Execute FFmpeg rendering with progress tracking
   */
  private async executeRender(job: RenderJob, ffmpegCmd: string): Promise<string> {
    const outputPath = path.join(process.env.TEMP || '/tmp', `${job.renderId}.${job.exportSettings.format}`);

    // Execute FFmpeg with progress monitoring
    return new Promise((resolve, reject) => {
      const child = require('child_process').spawn('ffmpeg', ['-i', 'input.mp4', '-vf', 'scale=1920:1080', outputPath]);

      child.stderr.on('data', (data: Buffer) => {
        const output = data.toString();

        // Parse progress: frame=1234 fps=45 q=-1 Lsize=12345kB time=00:00:30
        const timeMatch = output.match(/time=(\d+):(\d+):(\d+)/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const seconds = parseInt(timeMatch[3]);
          const totalSeconds = hours * 3600 + minutes * 60 + seconds;
          const projectDuration = job.project.duration || 60;

          job.progress = Math.min(100, (totalSeconds / projectDuration) * 100);
        }
      });

      child.on('close', (code: number) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      child.on('error', (err: Error) => {
        reject(err);
      });
    });
  }

  /**
   * Upload rendered video to cloud storage
   */
  private async uploadToStorage(localPath: string, job: RenderJob): Promise<string> {
    // TODO: Implement S3/Cloud Storage upload
    // Example using AWS S3:
    /*
    const s3 = new AWS.S3();
    const fileContent = await fs.readFile(localPath);

    const params = {
      Bucket: this.config.get('AWS_S3_BUCKET'),
      Key: `renders/${job.projectId}/${job.renderId}.${job.exportSettings.format}`,
      Body: fileContent,
      ContentType: `video/${job.exportSettings.format}`,
    };

    const result = await s3.upload(params).promise();
    return result.Location;
    */

    // Placeholder
    const bucket = this.config.get('AWS_S3_BUCKET') || 'belsuite-videos';
    return `https://${bucket}.s3.amazonaws.com/renders/${job.projectId}/${job.renderId}.${job.exportSettings.format}`;
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(outputPath: string): Promise<void> {
    try {
      await fs.unlink(outputPath);
    } catch (err) {
      this.logger.warn(`Failed to cleanup temp file: ${outputPath}`);
    }
  }

  /**
   * Get render job status
   */
  getJobStatus(renderId: string): RenderJob | undefined {
    return this.renderQueue.get(renderId);
  }

  /**
   * Cancel rendering job
   */
  cancelJob(renderId: string): void {
    this.renderQueue.delete(renderId);
    this.logger.log(`Cancelled render job: ${renderId}`);
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface RenderJob {
  projectId: string;
  renderId: string;
  project: VideoProject;
  exportSettings: ExportVideoRequest;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  startedAt: Date | null;
  completedAt: Date | null;
}
