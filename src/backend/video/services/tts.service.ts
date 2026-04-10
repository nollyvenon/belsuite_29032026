/**
 * Text-to-Speech Service
 * Uses OpenAI TTS (tts-1 / tts-1-hd) to generate voiceovers.
 * Requires OpenAI API credentials to generate TTS output.
 */

import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import OpenAI from 'openai';

export interface TtsResult {
  audioPath: string;   // temp file path — caller must move/upload and delete
  durationMs: number;
}

export type TtsVoice =
  | 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';  // OpenAI voices

export interface TtsOptions {
  voice?: TtsVoice;
  model?: 'tts-1' | 'tts-1-hd';
  speed?: number;    // 0.25 – 4.0
}

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly client: OpenAI | null;

  constructor() {
    const key = process.env['OPENAI_API_KEY'];
    this.client = key ? new OpenAI({ apiKey: key }) : null;
    if (!this.client) {
      this.logger.warn('OPENAI_API_KEY not set for TTS');
    }
  }

  /**
   * Generate speech audio for the given text.
   * Returns the path to an mp3 file. Caller must clean up.
   */
  async synthesize(text: string, options: TtsOptions = {}): Promise<TtsResult> {
    const tmpFile = path.join(
      os.tmpdir(),
      `bel-tts-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`,
    );

    if (!this.client) throw new ServiceUnavailableException('TTS provider is not configured');

    const voice  = options.voice ?? 'nova';
    const model  = options.model ?? 'tts-1';
    const speed  = options.speed ?? 1.0;

    this.logger.log(`TTS: ${text.length} chars, voice=${voice}`);

    const response = await this.client.audio.speech.create({
      model,
      voice,
      input: text,
      speed,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(tmpFile, buffer);

    // Estimate duration: ~150 words per minute, average 5 chars/word
    const wordCount   = text.split(/\s+/).length;
    const durationMs  = Math.round((wordCount / (150 * speed)) * 60_000);

    this.logger.debug(`TTS written → ${tmpFile} (~${durationMs}ms)`);
    return { audioPath: tmpFile, durationMs };
  }

  /**
   * Split a script into per-scene segments based on paragraph breaks.
   */
  splitScriptIntoSegments(script: string): string[] {
    return script
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

}
