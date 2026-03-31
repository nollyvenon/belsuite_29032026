import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateVoiceCloneDto } from '../dto/ugc.dto';

interface ProvisionedVoiceClone {
  provider: string;
  externalVoiceId?: string | null;
}

@Injectable()
export class VoiceProviderService {
  private readonly logger = new Logger(VoiceProviderService.name);

  constructor(private readonly config: ConfigService) {}

  async provisionVoiceClone(dto: CreateVoiceCloneDto): Promise<ProvisionedVoiceClone> {
    const provider = dto.provider ?? 'elevenlabs';

    if (dto.externalVoiceId) {
      return { provider, externalVoiceId: dto.externalVoiceId };
    }

    if (provider !== 'elevenlabs' || !dto.sampleAudioUrl) {
      return { provider, externalVoiceId: null };
    }

    const apiKey = this.config.get<string>('ELEVENLABS_API_KEY');
    if (!apiKey) {
      return { provider, externalVoiceId: null };
    }

    try {
      const source = await fetch(dto.sampleAudioUrl);
      if (!source.ok) {
        throw new Error(`Unable to fetch sample audio (${source.status})`);
      }

      const audioBuffer = await source.arrayBuffer();
      const mimeType = source.headers.get('content-type') ?? 'audio/mpeg';
      const extension = mimeType.includes('wav') ? 'wav' : mimeType.includes('mp4') ? 'm4a' : 'mp3';

      const form = new FormData();
      form.append('name', dto.name);
      if (dto.description) {
        form.append('description', dto.description);
      }
      form.append('files', new Blob([audioBuffer], { type: mimeType }), `voice-sample.${extension}`);

      const url = this.config.get<string>('ELEVENLABS_VOICE_CLONE_URL') ?? 'https://api.elevenlabs.io/v1/voices/add';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: form,
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs clone failed with ${response.status}`);
      }

      const data = (await response.json()) as Record<string, any>;
      return {
        provider,
        externalVoiceId: data.voice_id ?? null,
      };
    } catch (error) {
      this.logger.warn(`Voice clone provisioning fell back to local record: ${(error as Error).message}`);
      return { provider, externalVoiceId: null };
    }
  }
}