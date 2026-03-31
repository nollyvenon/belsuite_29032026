/**
 * Subtitle Service
 * Generates SRT / VTT subtitle tracks.
 * - Auto-generate from OpenAI Whisper (transcription) when an audio file exists.
 * - Generate from script segments with estimated timing when no audio available.
 */

import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import OpenAI from 'openai';

export interface SubtitleEntry {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
}

export interface SubtitleResult {
  entries: SubtitleEntry[];
  srt: string;
  vtt: string;
}

@Injectable()
export class SubtitleService {
  private readonly logger = new Logger(SubtitleService.name);
  private readonly client: OpenAI | null;

  constructor() {
    const key = process.env['OPENAI_API_KEY'];
    this.client = key ? new OpenAI({ apiKey: key }) : null;
  }

  // ── Whisper transcription → subtitles ────────────────────────────────────

  async transcribeAudio(
    audioPath: string,
    language = 'en',
  ): Promise<SubtitleResult> {
    if (!this.client) {
      this.logger.warn('OPENAI_API_KEY not set — returning empty subtitles');
      return this.buildResult([]);
    }

    this.logger.log(`Transcribing ${path.basename(audioPath)} via Whisper`);

    const response = await this.client.audio.transcriptions.create({
      file: fs.createReadStream(audioPath) as any,
      model: 'whisper-1',
      language,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    const raw = response as any;
    const segments: SubtitleEntry[] = (raw.segments ?? []).map(
      (seg: { id: number; start: number; end: number; text: string }) => ({
        index:   seg.id + 1,
        startMs: Math.round(seg.start * 1000),
        endMs:   Math.round(seg.end * 1000),
        text:    seg.text.trim(),
      }),
    );

    return this.buildResult(segments);
  }

  // ── Script-based subtitle generation (no audio needed) ───────────────────

  generateFromScript(
    scriptSegments: string[],
    segmentDurationsMs: number[],
  ): SubtitleResult {
    let cursor = 0;
    const entries: SubtitleEntry[] = scriptSegments.map((text, i) => {
      const startMs = cursor;
      const endMs   = cursor + (segmentDurationsMs[i] ?? 4000);
      cursor = endMs;
      return { index: i + 1, startMs, endMs, text: text.trim() };
    });
    return this.buildResult(entries);
  }

  // ── Format builders ───────────────────────────────────────────────────────

  private buildResult(entries: SubtitleEntry[]): SubtitleResult {
    return {
      entries,
      srt: this.toSrt(entries),
      vtt: this.toVtt(entries),
    };
  }

  toSrt(entries: SubtitleEntry[]): string {
    return entries
      .map(
        (e) =>
          `${e.index}\n${this.formatSrtTime(e.startMs)} --> ${this.formatSrtTime(e.endMs)}\n${e.text}`,
      )
      .join('\n\n');
  }

  toVtt(entries: SubtitleEntry[]): string {
    const header = 'WEBVTT\n\n';
    const body   = entries
      .map(
        (e) =>
          `${this.formatVttTime(e.startMs)} --> ${this.formatVttTime(e.endMs)}\n${e.text}`,
      )
      .join('\n\n');
    return header + body;
  }

  writeSrt(entries: SubtitleEntry[]): string {
    const tmp = path.join(os.tmpdir(), `bel-subs-${Date.now()}.srt`);
    fs.writeFileSync(tmp, this.toSrt(entries));
    return tmp;
  }

  // ── Time formatters ───────────────────────────────────────────────────────

  private formatSrtTime(ms: number): string {
    const h   = Math.floor(ms / 3_600_000);
    const m   = Math.floor((ms % 3_600_000) / 60_000);
    const s   = Math.floor((ms % 60_000) / 1_000);
    const mil = ms % 1_000;
    return `${pad(h)}:${pad(m)}:${pad(s)},${padMs(mil)}`;
  }

  private formatVttTime(ms: number): string {
    return this.formatSrtTime(ms).replace(',', '.');
  }
}

function pad(n: number): string  { return String(n).padStart(2, '0'); }
function padMs(n: number): string { return String(n).padStart(3, '0'); }
