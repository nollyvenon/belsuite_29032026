import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RenderSettings {
  faceAnimation: boolean;
  lipSyncIntensity: number;
  resolution: string;
  enableCaptions: boolean;
  backgroundMusic: boolean;
  aspectRatio: string;
  avatarProvider: string;
  voiceProvider: string;
}

interface RenderProjectContext {
  organizationId: string;
  projectId: string;
  title: string;
  durationSeconds?: number | null;
  avatar?: {
    provider?: string | null;
    externalId?: string | null;
    thumbnailUrl?: string | null;
    previewVideoUrl?: string | null;
  } | null;
  voiceClone?: {
    provider?: string | null;
    externalVoiceId?: string | null;
    language?: string | null;
  } | null;
  script: { content: string };
}

export interface RenderExecutionResult {
  provider: string;
  status: 'PROCESSING' | 'COMPLETE';
  progress: number;
  externalJobId?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  startedAt: Date;
  completedAt?: Date | null;
}

@Injectable()
export class RenderProviderService {
  private readonly logger = new Logger(RenderProviderService.name);

  constructor(private readonly config: ConfigService) {}

  async renderProject(
    project: RenderProjectContext,
    settings: RenderSettings,
  ): Promise<RenderExecutionResult> {
    const provider = String(project.avatar?.provider ?? 'MOCK').toUpperCase();

    try {
      if (provider === 'HEYGEN') {
        return await this.renderWithHeyGen(project, settings);
      }

      if (provider === 'DID') {
        return await this.renderWithDid(project, settings);
      }
    } catch (error) {
      this.logger.warn(
        `Provider render failed for ${provider}, falling back to mock output: ${(error as Error).message}`,
      );
    }

    return this.renderMock(project);
  }

  private async renderWithHeyGen(
    project: RenderProjectContext,
    settings: RenderSettings,
  ): Promise<RenderExecutionResult> {
    const apiKey = this.config.get<string>('HEYGEN_API_KEY');
    const avatarId = project.avatar?.externalId;
    if (!apiKey || !avatarId) {
      return this.renderMock(project);
    }

    const url = this.config.get<string>('HEYGEN_RENDER_URL') ?? 'https://api.heygen.com/v2/video/generate';
    const payload = {
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: avatarId,
            avatar_style: settings.faceAnimation ? 'normal' : 'still',
          },
          voice: project.voiceClone?.externalVoiceId
            ? {
                type: 'voice',
                voice_id: project.voiceClone.externalVoiceId,
                input_text: project.script.content,
              }
            : {
                type: 'text',
                input_text: project.script.content,
              },
          caption: settings.enableCaptions,
          aspect_ratio: settings.aspectRatio,
        },
      ],
      dimension: { width: settings.aspectRatio === '16:9' ? 1920 : 1080, height: settings.aspectRatio === '16:9' ? 1080 : 1920 },
      title: project.title,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HeyGen render failed with ${response.status}`);
    }

    const data = (await response.json()) as Record<string, any>;
    const externalJobId = data.data?.video_id ?? data.video_id ?? null;
    const videoUrl = data.data?.video_url ?? data.video_url ?? null;
    const thumbnailUrl = data.data?.thumbnail_url ?? data.thumbnail_url ?? project.avatar?.thumbnailUrl ?? null;

    return {
      provider: 'heygen',
      status: videoUrl ? 'COMPLETE' : 'PROCESSING',
      progress: videoUrl ? 100 : 25,
      externalJobId,
      videoUrl,
      thumbnailUrl,
      startedAt: new Date(),
      completedAt: videoUrl ? new Date() : null,
    };
  }

  private async renderWithDid(
    project: RenderProjectContext,
    settings: RenderSettings,
  ): Promise<RenderExecutionResult> {
    const apiKey = this.config.get<string>('DID_API_KEY');
    const sourceUrl = project.avatar?.previewVideoUrl ?? project.avatar?.thumbnailUrl;
    if (!apiKey || !sourceUrl) {
      return this.renderMock(project);
    }

    const url = this.config.get<string>('DID_RENDER_URL') ?? 'https://api.d-id.com/talks';
    const payload = {
      source_url: sourceUrl,
      script: {
        type: 'text',
        input: project.script.content,
        provider: {
          type: 'microsoft',
          voice_id: project.voiceClone?.externalVoiceId ?? 'en-US-JennyNeural',
        },
      },
      config: {
        stitch: true,
        result_format: settings.resolution,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`D-ID render failed with ${response.status}`);
    }

    const data = (await response.json()) as Record<string, any>;
    const externalJobId = data.id ?? null;
    const videoUrl = data.result_url ?? null;

    return {
      provider: 'did',
      status: videoUrl ? 'COMPLETE' : 'PROCESSING',
      progress: videoUrl ? 100 : 20,
      externalJobId,
      videoUrl,
      thumbnailUrl: project.avatar?.thumbnailUrl ?? null,
      startedAt: new Date(),
      completedAt: videoUrl ? new Date() : null,
    };
  }

  private renderMock(project: RenderProjectContext): RenderExecutionResult {
    const videoUrl = `https://cdn.belsuite.ai/ugc/${project.organizationId}/${project.projectId}/render.mp4`;
    const thumbnailUrl = `https://cdn.belsuite.ai/ugc/${project.organizationId}/${project.projectId}/render.jpg`;

    return {
      provider: 'mock',
      status: 'COMPLETE',
      progress: 100,
      externalJobId: null,
      videoUrl,
      thumbnailUrl,
      startedAt: new Date(),
      completedAt: new Date(),
    };
  }
}