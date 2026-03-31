/**
 * FFmpeg Service
 * Wraps fluent-ffmpeg for all video manipulation operations:
 * render, transcode, thumbnail generation, and concatenation.
 */

import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpeg: typeof import('fluent-ffmpeg') = require('fluent-ffmpeg');
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export interface RenderOptions {
  width: number;
  height: number;
  fps: number;
  format: 'mp4' | 'webm';
  quality: 'low' | 'medium' | 'high';
  audioBitrate?: string;
  videoBitrate?: string;
}

export interface ClipSegment {
  inputPath: string;
  startMs: number;       // trim start in source file
  durationMs: number;    // duration to take
  volume: number;        // 0-1
  speed: number;         // playback rate
  filters: Array<{ name: string; value: number }>;
}

const QUALITY_MAP: Record<string, { crf: number; preset: string }> = {
  low:    { crf: 32, preset: 'veryfast' },
  medium: { crf: 23, preset: 'medium' },
  high:   { crf: 18, preset: 'slow' },
};

@Injectable()
export class FfmpegService {
  private readonly logger = new Logger(FfmpegService.name);

  // ── Thumbnail ─────────────────────────────────────────────────────────────

  async generateThumbnail(
    inputPath: string,
    outputPath: string,
    atSecond = 0,
    width = 1280,
    height = 720,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(atSecond)
        .outputOptions([
          '-frames:v 1',
          `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
        ])
        .output(outputPath)
        .on('end', () => {
          this.logger.debug(`Thumbnail written → ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err: Error) => {
          this.logger.error(`Thumbnail error: ${err.message}`);
          reject(err);
        })
        .run();
    });
  }

  // ── Transcode ─────────────────────────────────────────────────────────────

  async transcode(
    inputPath: string,
    outputPath: string,
    options: Partial<RenderOptions> = {},
  ): Promise<string> {
    const { crf, preset } = QUALITY_MAP[options.quality ?? 'medium'];

    return new Promise((resolve, reject) => {
      let cmd = ffmpeg(inputPath);

      if (options.width && options.height) {
        cmd = cmd.outputOptions([`-vf scale=${options.width}:${options.height}`]);
      }

      cmd
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          `-crf ${crf}`,
          `-preset ${preset}`,
          '-movflags +faststart',
          `-r ${options.fps ?? 30}`,
        ])
        .audioBitrate(options.audioBitrate ?? '128k')
        .output(outputPath)
        .on('progress', (p: { percent?: number }) => {
          this.logger.debug(`Transcode ${Math.round(p.percent ?? 0)}%`);
        })
        .on('end', () => resolve(outputPath))
        .on('error', (err: Error) => reject(err))
        .run();
    });
  }

  // ── Concatenate clips via concat demuxer ──────────────────────────────────

  async concatenateClips(
    segments: ClipSegment[],
    outputPath: string,
    options: RenderOptions,
    onProgress?: (pct: number) => void,
  ): Promise<string> {
    const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'bel-video-'));
    const parts: string[] = [];

    try {
      // 1. Prepare each segment as a normalised temp clip
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const partPath = path.join(tmpDir, `part_${i}.mp4`);
        await this.prepareSegment(seg, partPath, options);
        parts.push(partPath);
      }

      // 2. Write concat list file
      const listFile = path.join(tmpDir, 'concat.txt');
      const listContent = parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
      fs.writeFileSync(listFile, listContent);

      // 3. Concatenate
      const { crf, preset } = QUALITY_MAP[options.quality];
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(listFile)
          .inputOptions(['-f concat', '-safe 0'])
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            `-crf ${crf}`,
            `-preset ${preset}`,
            '-movflags +faststart',
            `-r ${options.fps}`,
            `-s ${options.width}x${options.height}`,
          ])
          .audioBitrate('128k')
          .output(outputPath)
          .on('progress', (p: { percent?: number }) => {
            onProgress?.(Math.round(p.percent ?? 0));
          })
          .on('end', () => resolve())
          .on('error', (err: Error) => reject(err))
          .run();
      });

      return outputPath;
    } finally {
      // Clean up temp files
      try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
    }
  }

  // ── Overlay subtitles (burn-in) ───────────────────────────────────────────

  async burnSubtitles(
    inputPath: string,
    srtPath: string,
    outputPath: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([`-vf subtitles='${srtPath.replace(/\\/g, '/')}':force_style='Fontsize=24,PrimaryColour=&H00FFFFFF'`])
        .videoCodec('libx264')
        .audioCodec('copy')
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err: Error) => reject(err))
        .run();
    });
  }

  // ── Merge audio onto video ────────────────────────────────────────────────

  async mergeAudio(
    videoPath: string,
    audioPath: string,
    outputPath: string,
    audioVolume = 1.0,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .complexFilter([
          `[1:a]volume=${audioVolume}[a]`,
          '[0:a][a]amix=inputs=2:duration=first[aout]',
        ])
        .outputOptions(['-map 0:v', '-map [aout]'])
        .videoCodec('copy')
        .audioCodec('aac')
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err: Error) => reject(err))
        .run();
    });
  }

  // ── Get media info ────────────────────────────────────────────────────────

  async getMediaInfo(inputPath: string): Promise<import('fluent-ffmpeg').FfprobeData> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async prepareSegment(
    seg: ClipSegment,
    outputPath: string,
    options: RenderOptions,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const startSec    = seg.startMs / 1000;
      const durationSec = seg.durationMs / 1000;

      const vFilters: string[] = [
        `scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease`,
        `pad=${options.width}:${options.height}:(ow-iw)/2:(oh-ih)/2`,
      ];

      if (seg.speed !== 1) {
        vFilters.push(`setpts=${(1 / seg.speed).toFixed(4)}*PTS`);
      }

      for (const f of seg.filters ?? []) {
        if (f.name === 'brightness')  vFilters.push(`eq=brightness=${f.value}`);
        if (f.name === 'contrast')    vFilters.push(`eq=contrast=${f.value}`);
        if (f.name === 'saturation')  vFilters.push(`eq=saturation=${f.value}`);
        if (f.name === 'blur')        vFilters.push(`boxblur=${f.value}`);
      }

      const aFilters: string[] = [`volume=${seg.volume}`];
      if (seg.speed !== 1) {
        aFilters.push(`atempo=${Math.min(Math.max(seg.speed, 0.5), 2.0)}`);
      }

      ffmpeg(seg.inputPath)
        .seekInput(startSec)
        .duration(durationSec)
        .videoFilters(vFilters)
        .audioFilters(aFilters)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          `-r ${options.fps}`,
          '-crf 20',
          '-preset veryfast',
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });
  }
}
