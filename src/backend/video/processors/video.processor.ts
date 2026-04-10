/**
 * Video Job Processor (BullMQ Worker)
 * Handles all async video processing jobs from the queue.
 */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { FfmpegService } from '../services/ffmpeg.service';
import { TtsService } from '../services/tts.service';
import { SubtitleService } from '../services/subtitle.service';
import { StorageService } from '../services/storage.service';
import { VideoJobPayload } from '../types/video.types';
import { VideoJobStatus } from '@prisma/client';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as crypto from 'crypto';

export const VIDEO_QUEUE = 'video-processing';

@Processor(VIDEO_QUEUE)
export class VideoProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoProcessor.name);

  constructor(
    private readonly prisma:    PrismaService,
    private readonly ffmpeg:    FfmpegService,
    private readonly tts:       TtsService,
    private readonly subtitles: SubtitleService,
    private readonly storage:   StorageService,
  ) {
    super();
  }

  async process(job: Job<VideoJobPayload>): Promise<void> {
    this.logger.log(`Processing job ${job.id} type=${job.data.type}`);

    const dbJob = await this.prisma.videoJob.findFirst({
      where: { bullJobId: String(job.id) },
    });

    if (dbJob) {
      await this.prisma.videoJob.update({
        where: { id: dbJob.id },
        data:  { status: VideoJobStatus.PROCESSING, startedAt: new Date() },
      });
    }

    try {
      switch (job.data.type) {
        case 'render':    await this.handleRender(job);    break;
        case 'tts':       await this.handleTts(job);       break;
        case 'subtitles': await this.handleSubtitles(job); break;
        case 'transcode': await this.handleTranscode(job); break;
        default:
          throw new Error(`Unknown job type: ${(job.data as any).type}`);
      }

      if (dbJob) {
        await this.prisma.videoJob.update({
          where: { id: dbJob.id },
          data:  { status: VideoJobStatus.DONE, completedAt: new Date(), progress: 100 },
        });
      }
    } catch (err: unknown) {
      const msg = (err as Error).message;
      this.logger.error(`Job ${job.id} failed: ${msg}`);
      if (dbJob) {
        await this.prisma.videoJob.update({
          where: { id: dbJob.id },
          data:  { status: VideoJobStatus.FAILED, errorMessage: msg },
        });
      }
      throw err;
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  private async handleRender(job: Job<VideoJobPayload>): Promise<void> {
    if (job.data.type !== 'render') return;
    const { projectId, organizationId, outputFormat, quality } = job.data;

    const project = await this.prisma.videoProject.findUnique({
      where:   { id: projectId },
      include: { scenes: { orderBy: { order: 'asc' } }, mediaAssets: true },
    });
    if (!project) throw new Error(`Project ${projectId} not found`);

    const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'bel-render-'));
    const outFile = path.join(tmpDir, `output.${outputFormat}`);

    try {
      const options = {
        width:         project.width,
        height:        project.height,
        fps:           project.fps,
        format:        outputFormat,
        quality,
      };

      // Download and concatenate scene assets
      const segments = await this.buildSegments(project, tmpDir);

      if (segments.length > 0) {
        await this.ffmpeg.concatenateClips(segments, outFile, options, (pct) => {
          job.updateProgress(pct).catch(() => {});
        });
      } else {
        // No video assets — create a black video
        await this.createBlackVideo(outFile, project.width, project.height, project.fps,
          (project.durationMs ?? 5000) / 1000, options);
      }

      // Generate thumbnail
      const thumbFile = path.join(tmpDir, 'thumb.jpg');
      await this.ffmpeg.generateThumbnail(outFile, thumbFile, 0, 1280, 720);

      // Upload final render + thumbnail
      const renderKey = `${organizationId}/renders/${projectId}-${Date.now()}.${outputFormat}`;
      const thumbKey  = `${organizationId}/renders/${projectId}-thumb.jpg`;

      await Promise.all([
        this.storage.upload(outFile,   renderKey, `video/${outputFormat}`),
        this.storage.upload(thumbFile, thumbKey, 'image/jpeg'),
      ]);

      await this.prisma.videoProject.update({
        where: { id: projectId },
        data:  {
          outputUrl:    this.storage.publicUrl(renderKey),
          thumbnailUrl: this.storage.publicUrl(thumbKey),
          status:       'READY',
        },
      });
    } finally {
      try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
    }
  }

  // ── TTS ───────────────────────────────────────────────────────────────────

  private async handleTts(job: Job<VideoJobPayload>): Promise<void> {
    if (job.data.type !== 'tts') return;
    const { sceneId, text, voiceId, organizationId } = job.data;

    const { audioPath, durationMs } = await this.tts.synthesize(text, { voice: voiceId as any });
    const key = await this.storage.uploadTemp(audioPath, organizationId, `vo-${sceneId}.mp3`);

    await this.prisma.videoScene.update({
      where: { id: sceneId },
      data:  { voiceoverUrl: this.storage.publicUrl(key), durationMs },
    });
  }

  // ── Subtitles ─────────────────────────────────────────────────────────────

  private async handleSubtitles(job: Job<VideoJobPayload>): Promise<void> {
    if (job.data.type !== 'subtitles') return;
    const { projectId, audioUrl, language } = job.data;

    // Download audio to temp file for Whisper
    const tmpAudio = path.join(os.tmpdir(), `bel-audio-${crypto.randomUUID()}.mp3`);
    await this.storage.downloadToFile(audioUrl, tmpAudio);

    try {
      const result = await this.subtitles.transcribeAudio(tmpAudio, language);

      await this.prisma.subtitleTrack.create({
        data: {
          videoProjectId: projectId,
          language,
          srtContent:    result.srt,
          vttContent:    result.vtt,
          autoGenerated: true,
        },
      });
    } finally {
      try { fs.unlinkSync(tmpAudio); } catch { /* ignore */ }
    }
  }

  // ── Transcode ─────────────────────────────────────────────────────────────

  private async handleTranscode(job: Job<VideoJobPayload>): Promise<void> {
    if (job.data.type !== 'transcode') return;
    const { assetId, sourceKey, targetFormat, organizationId } = job.data;

    const tmpIn  = path.join(os.tmpdir(), `bel-src-${crypto.randomUUID()}`);
    const tmpOut = path.join(os.tmpdir(), `bel-out-${crypto.randomUUID()}.${targetFormat}`);

    await this.storage.downloadToFile(sourceKey, tmpIn);

    try {
      await this.ffmpeg.transcode(tmpIn, tmpOut, { format: targetFormat as any });

      const key = `${organizationId}/transcoded/${assetId}.${targetFormat}`;
      await this.storage.upload(tmpOut, key, `video/${targetFormat}`);

      await this.prisma.mediaAsset.update({
        where: { id: assetId },
        data:  {
          storageKey: key,
          publicUrl:  this.storage.publicUrl(key),
        },
      });
    } finally {
      try { fs.unlinkSync(tmpIn); }  catch { /* ignore */ }
      try { fs.unlinkSync(tmpOut); } catch { /* ignore */ }
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async buildSegments(
    project: any,
    tmpDir: string,
  ): Promise<any[]> {
    const segments: any[] = [];

    for (const asset of project.mediaAssets.filter(
      (a: any) => a.mediaType === 'VIDEO_CLIP',
    )) {
      const localPath = path.join(tmpDir, `asset-${asset.id}${path.extname(asset.storageKey)}`);
      try {
        await this.storage.downloadToFile(asset.storageKey, localPath);
        segments.push({
          inputPath:  localPath,
          startMs:    0,
          durationMs: asset.durationMs ?? 5000,
          volume:     1,
          speed:      1,
          filters:    [],
        });
      } catch (err: unknown) {
        this.logger.warn(`Could not download asset ${asset.id}: ${(err as Error).message}`);
      }
    }

    return segments;
  }

  private async createBlackVideo(
    outputPath: string,
    width: number,
    height: number,
    fps: number,
    durationSec: number,
    _options: unknown,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpegLib = require('fluent-ffmpeg');
      ffmpegLib()
        .input(`color=c=black:s=${width}x${height}:r=${fps}`)
        .inputOptions(['-f lavfi'])
        .input('anullsrc')
        .inputOptions(['-f lavfi'])
        .duration(durationSec)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(['-shortest', '-movflags +faststart'])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }
}
