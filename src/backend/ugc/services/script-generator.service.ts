import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../database/prisma.service';
import { GenerateUGCScriptDto } from '../dto/ugc.dto';
import { UGCProjectService } from './ugc-project.service';
import type { GeneratedUGCScript, GeneratedUGCScene } from '../ugc.types';

@Injectable()
export class ScriptGeneratorService {
  private readonly logger = new Logger(ScriptGeneratorService.name);
  private readonly client: OpenAI | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly projects: UGCProjectService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async generateScript(organizationId: string, projectId: string, dto: GenerateUGCScriptDto) {
    const project = await this.projects.getProject(organizationId, projectId);
    const brandContext = project.brandContext ?? (await this.projects.getBrandContextString(organizationId));

    await this.prisma.uGCProject.update({
      where: { id: projectId },
      data: { status: 'SCRIPTING' as any },
    });

    const generated = this.client
      ? await this.generateWithAI(project.title, brandContext, project.avatar?.style ?? 'INFLUENCER', dto)
      : this.generateMock(project.title, brandContext, project.avatar?.style ?? 'INFLUENCER', dto);

    const existing = await this.prisma.uGCScript.findUnique({ where: { projectId } });
    const fullScript = generated.fullScript.trim();
    const scenesJson = JSON.stringify(generated.scenes);

    const script = existing
      ? await this.prisma.uGCScript.update({
          where: { projectId },
          data: {
            content: fullScript,
            aiGenerated: true,
            prompt: this.buildPrompt(project.title, brandContext, project.avatar?.style ?? 'INFLUENCER', dto),
            model: this.client ? 'gpt-4o-mini' : 'mock-ugc-generator',
            scenesJson,
            wordCount: this.countWords(fullScript),
            estimatedSecs: dto.durationSeconds,
            version: { increment: 1 },
          },
        })
      : await this.prisma.uGCScript.create({
          data: {
            projectId,
            content: fullScript,
            aiGenerated: true,
            prompt: this.buildPrompt(project.title, brandContext, project.avatar?.style ?? 'INFLUENCER', dto),
            model: this.client ? 'gpt-4o-mini' : 'mock-ugc-generator',
            scenesJson,
            wordCount: this.countWords(fullScript),
            estimatedSecs: dto.durationSeconds,
          },
        });

    await this.prisma.uGCProject.update({
      where: { id: projectId },
      data: {
        status: 'DRAFT' as any,
        durationSeconds: dto.durationSeconds,
        platform: dto.platform,
      },
    });

    return {
      ...script,
      parsedScenes: generated.scenes,
    };
  }

  private async generateWithAI(
    title: string,
    brandContext: string,
    avatarStyle: string,
    dto: GenerateUGCScriptDto,
  ): Promise<GeneratedUGCScript> {
    const prompt = this.buildPrompt(title, brandContext, avatarStyle, dto);
    try {
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.8,
        messages: [
          {
            role: 'system',
            content:
              'You write high-performing UGC scripts for short-form video. Return valid JSON only. Scripts should feel native, conversational, specific, and realistic rather than overproduced.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw) as Partial<GeneratedUGCScript>;
      if (!parsed.fullScript || !Array.isArray(parsed.scenes)) {
        return this.generateMock(title, brandContext, avatarStyle, dto);
      }

      return {
        hook: parsed.hook ?? parsed.scenes[0]?.line ?? 'I was skeptical, but this genuinely surprised me.',
        body: parsed.body ?? [],
        callToAction: parsed.callToAction ?? dto.callToAction ?? 'Try it for yourself.',
        fullScript: parsed.fullScript,
        scenes: parsed.scenes as GeneratedUGCScene[],
      };
    } catch (error) {
      this.logger.warn(`Falling back to mock UGC script generation: ${(error as Error).message}`);
      return this.generateMock(title, brandContext, avatarStyle, dto);
    }
  }

  private generateMock(
    title: string,
    brandContext: string,
    avatarStyle: string,
    dto: GenerateUGCScriptDto,
  ): GeneratedUGCScript {
    const brand = this.extractBrandName(brandContext) ?? title;
    const beats = [
      `I didn't expect ${brand} to fit into my day this easily, but it did.`,
      `The thing that stood out first was how quickly it solved ${dto.productOrOffer} without feeling complicated.`,
      `If you're ${dto.targetAudience}, this feels like it was built with your actual routine in mind.`,
      dto.callToAction ?? `If you want a more realistic ${dto.platform} workflow, try ${brand}.`,
    ];
    const sceneDuration = Math.max(4, Math.round(dto.durationSeconds / beats.length));
    const scenes = beats.map((line, index) => ({
      order: index + 1,
      durationSeconds: sceneDuration,
      line,
      visualDirection:
        index === 0
          ? `${avatarStyle.toLowerCase()} selfie framing with natural room tone and direct eye contact`
          : index === beats.length - 1
            ? 'Product close-up, avatar pointing to CTA overlay, subtle smile'
            : 'Handheld lifestyle b-roll, natural gestures, eye-line shifts, micro-expressions',
      facialCue: index === 0 ? 'Curious eyebrow raise' : index === beats.length - 1 ? 'Confident smile' : 'Natural emphasis',
    }));

    return {
      hook: beats[0],
      body: beats.slice(1, -1),
      callToAction: beats[beats.length - 1],
      fullScript: beats.join(' '),
      scenes,
    };
  }

  private buildPrompt(
    title: string,
    brandContext: string,
    avatarStyle: string,
    dto: GenerateUGCScriptDto,
  ) {
    return `Create a realistic UGC script as strict JSON.

PROJECT TITLE: ${title}
BRAND CONTEXT: ${brandContext}
AVATAR STYLE: ${avatarStyle}
OBJECTIVE: ${dto.objective}
PLATFORM: ${dto.platform}
DURATION SECONDS: ${dto.durationSeconds}
PRODUCT / OFFER: ${dto.productOrOffer}
TARGET AUDIENCE: ${dto.targetAudience}
CALL TO ACTION: ${dto.callToAction ?? 'Encourage trial'}
TALKING POINTS: ${(dto.talkingPoints ?? []).join(', ') || 'none provided'}

Return JSON with:
{
  "hook": string,
  "body": string[],
  "callToAction": string,
  "fullScript": string,
  "scenes": [
    {
      "order": number,
      "durationSeconds": number,
      "line": string,
      "visualDirection": string,
      "facialCue": string
    }
  ]
}

Requirements:
- conversational, human, non-corporate
- native to creator-led video
- specific sensory detail and believable pacing
- build around social proof, demo, or transformation
- no hashtags or markdown
- total time should roughly match requested duration`;
  }

  private extractBrandName(brandContext: string) {
    try {
      const parsed = JSON.parse(brandContext) as { companyName?: string };
      return parsed.companyName ?? null;
    } catch {
      return null;
    }
  }

  private countWords(content: string) {
    return content.trim().split(/\s+/).filter(Boolean).length;
  }
}