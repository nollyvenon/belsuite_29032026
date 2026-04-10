// @ts-nocheck
// ai-providers.ts
// Connects to OpenAI and Claude providers for AI Content Studio

import { OpenAIProvider } from './ai/providers/openai.provider';
import { ClaudeProvider } from './ai/providers/claude.provider';
import { AIModel, AIProvider } from './ai/types/ai.types';

const openai = new OpenAIProvider();
const claude = new ClaudeProvider();

export function selectAIModel(requestedModel, contentType) {
  // Example: choose model based on content type or admin config
  if (requestedModel) return requestedModel;
  if (contentType === 'blog') return AIModel.GPT_4_TURBO;
  if (contentType === 'ad') return AIModel.CLAUDE_3_HAIKU;
  return AIModel.GPT_3_5_TURBO;
}

export async function generateAIContent({ prompt, model }) {
  // Route to correct provider
  if (model.startsWith('gpt-')) {
    return openai.generateText({ model, prompt });
  }
  if (model.startsWith('claude')) {
    return claude.generateText({ model, prompt });
  }
  throw new Error('Unsupported model');
}

export function scoreSEO(body, keywords, metaTags) {
  // Simple SEO scoring (stub)
  let score = 0;
  if (keywords) {
    keywords.forEach((kw) => {
      if (body.includes(kw)) score += 10;
    });
  }
  if (metaTags) {
    metaTags.forEach((tag) => {
      if (body.includes(tag)) score += 5;
    });
  }
  return Math.min(score, 100);
}
