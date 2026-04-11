// AI Service Layer for Content Studio (core logic)

import { Injectable } from '@nestjs/common';
import { generateAIContent, scoreSEO, selectAIModel } from './ai-providers';
import type { PromptTemplate } from './ai/types/ai.types';

@Injectable()
export class AIContentStudioService {
  async generateContent(params: {
    template: PromptTemplate;
    userInput: Record<string, unknown>;
    aiModel: string;
    tone: string;
    style: string;
  }) {
    const prompt = this.buildPrompt(
      params.template.template,
      params.userInput,
      params.tone,
      params.style,
    );
    const model = selectAIModel(params.aiModel, params.template.category);
    const aiResult = await generateAIContent({ prompt, model });
    const keywords = (params.userInput.keywords as string[]) || [];
    const metaTags = (params.userInput.metaTags as string[]) || [];
    const seoScore = scoreSEO(aiResult.text, keywords, metaTags);
    return { ...aiResult, seoScore };
  }

  buildPrompt(
    templatePrompt: string,
    userInput: Record<string, unknown>,
    tone: string,
    style: string,
  ): string {
    let prompt = templatePrompt;
    Object.entries(userInput).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });
    if (tone) prompt += `\nTone: ${tone}`;
    if (style) prompt += `\nStyle: ${style}`;
    return prompt;
  }

  async regenerateContent(params: {
    content: { template: PromptTemplate; id?: string };
    params: Record<string, unknown>;
  }) {
    const userInput = (params.params.userInput as Record<string, unknown>) || {};
    return this.generateContent({
      template: params.content.template,
      userInput,
      aiModel: String(params.params.aiModel ?? ''),
      tone: String(params.params.tone ?? ''),
      style: String(params.params.style ?? ''),
    });
  }
}
