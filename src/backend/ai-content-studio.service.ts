// AI Service Layer for Content Studio (core logic, outline)

import { generateAIContent, scoreSEO, selectAIModel } from './ai-providers';

export class AIContentService {
  // Generate content using a template and user input
  static async generateContent({ template, userInput, aiModel, tone, style }) {
    const prompt = this.buildPrompt(template.prompt, userInput, tone, style);
    const model = selectAIModel(aiModel, template.type);
    const aiResult = await generateAIContent({ prompt, model });
    const seoScore = scoreSEO(aiResult.text, userInput.keywords, userInput.metaTags);
    return { ...aiResult, seoScore };
  }

  // Build prompt from template and user input
  static buildPrompt(templatePrompt, userInput, tone, style) {
    let prompt = templatePrompt;
    Object.entries(userInput).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    if (tone) prompt += `\nTone: ${tone}`;
    if (style) prompt += `\nStyle: ${style}`;
    return prompt;
  }

  // Regenerate content (with new params)
  static async regenerateContent({ content, params }) {
    return this.generateContent({ ...params, template: content.template });
  }
}

// ai-providers.ts would wrap OpenAI, Claude, etc. with cost tracking and model selection logic.
