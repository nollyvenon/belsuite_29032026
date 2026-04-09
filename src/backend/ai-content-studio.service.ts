// AI Service Layer for Content Studio (core logic, outline)

import { generateAIContent, scoreSEO, selectAIModel } from './ai-providers';

export class AIContentService {
  // Generate content using a template and user input
    static async generateContent({ template, userInput, aiModel, tone, style }: {
      template: import('./ai/types/ai.types').PromptTemplate;
      userInput: Record<string, any>;
      aiModel: string;
      tone: string;
      style: string;
    }) {
      const prompt = this.buildPrompt(template.template, userInput, tone, style);
      const model = selectAIModel(aiModel, template.category);
      const aiResult = await generateAIContent({ prompt, model });
      const seoScore = scoreSEO(
        aiResult.text,
        userInput.keywords || [],
        userInput.metaTags || []
      );
      return { ...aiResult, seoScore };
    }

  // Build prompt from template and user input
  static buildPrompt(
    templatePrompt: string,
    userInput: Record<string, any>,
    tone: string,
    style: string
  ) {
    let prompt = templatePrompt;
    Object.entries(userInput).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    if (tone) prompt += `\nTone: ${tone}`;
    if (style) prompt += `\nStyle: ${style}`;
    return prompt;
  }

  // Regenerate content (with new params)
  static async regenerateContent({ content, params }: { content: { template: import('./ai/types/ai.types').PromptTemplate }; params: Record<string, any> }) {
    return this.generateContent({
      template: content.template,
      userInput: params.userInput,
      aiModel: params.aiModel,
      tone: params.tone,
      style: params.style
    });
  }
}

// ai-providers.ts would wrap OpenAI, Claude, etc. with cost tracking and model selection logic.
