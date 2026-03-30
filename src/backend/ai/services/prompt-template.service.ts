/**
 * Prompt Template Service
 * Manages prompt templates for different content types
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PromptTemplate, AIModel, AICapability } from './types/ai.types';

@Injectable()
export class PromptTemplateService {
  private readonly logger = new Logger(PromptTemplateService.name);

  // Built-in templates
  private builtInTemplates: Map<string, PromptTemplate> = new Map([
    [
      'blog_post',
      {
        id: 'tpl_blog_post',
        name: 'Blog Post Generator',
        category: 'content',
        template: `Write a comprehensive blog post about "{{topic}}" with the following details:
- Tone: {{tone}}
- Target Audience: {{audience}}
- Word Count: {{wordCount}} words
- Keywords: {{keywords}}

Structure:
1. Engaging introduction
2. Main body with 3-5 sections
3. Conclusion
4. Call-to-action

Ensure the content is SEO-optimized and original.`,
        variables: ['topic', 'tone', 'audience', 'wordCount', 'keywords'],
        description: 'Generate SEO-friendly blog posts',
        suggestedModel: AIModel.GPT_4_TURBO,
        defaultTemperature: 0.7,
        exampleOutput: 'Blog post about machine learning best practices...',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'social_post',
      {
        id: 'tpl_social_post',
        name: 'Social Media Post Generator',
        category: 'content',
        template: `Generate a {{platform}} post about "{{topic}}" with these requirements:
- Tone: {{tone}}
- Hashtags: {{hashtags}}
- Include emojis: {{includeEmojis}}
- Length: {{length}} characters max

Make it engaging, shareable, and platform-appropriate.`,
        variables: ['platform', 'topic', 'tone', 'hashtags', 'includeEmojis', 'length'],
        description: 'Create social media content for various platforms',
        suggestedModel: AIModel.GPT_3_5_TURBO,
        defaultTemperature: 0.8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'ad_copy',
      {
        id: 'tpl_ad_copy',
        name: 'Ad Copy Generator',
        category: 'marketing',
        template: `Create compelling ad copy for {{medium}} advertising:
Product/Service: {{product}}
Target audience: {{audience}}
Key benefits: {{benefits}}
Call-to-action: {{cta}}
Tone: {{tone}}

Rules:
- Grab attention immediately
- Highlight unique selling points
- Create urgency or interest
- Include clear CTA
- Keep it concise`,
        variables: ['medium', 'product', 'audience', 'benefits', 'cta', 'tone'],
        description: 'Generate high-converting ad copy',
        suggestedModel: AIModel.GPT_4_TURBO,
        defaultTemperature: 0.7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'video_script',
      {
        id: 'tpl_video_script',
        name: 'Video Script Generator',
        category: 'content',
        template: `Write a video script for a {{videoDuration}} second {{videoType}} video:

Topic: {{topic}}
Target audience: {{audience}}
Key messages: {{keyMessages}}
Call-to-action: {{cta}}

Format:
[SCENE DESCRIPTION] | [VOICEOVER/DIALOGUE] | [VISUAL NOTES]

Guidelines:
- Engage viewer in first 3 seconds
- Follow storytelling structure
- Natural, conversational language
- Include visual cues
- End with clear CTA`,
        variables: ['videoDuration', 'videoType', 'topic', 'audience', 'keyMessages', 'cta'],
        description: 'Generate scripts for videos and YouTube content',
        suggestedModel: AIModel.GPT_4_TURBO,
        defaultTemperature: 0.7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'product_description',
      {
        id: 'tpl_product_desc',
        name: 'Product Description',
        category: 'ecommerce',
        template: `Create a product description for e-commerce:

Product name: {{productName}}
Key features: {{features}}
Target customer: {{customer}}
Unique value: {{uniqueValue}}
Price point: {{price}}

Include:
- Compelling headline
- Problem it solves
- Features and benefits
- Emotional appeal
- Social proof opportunity
- CTA`,
        variables: ['productName', 'features', 'customer', 'uniqueValue', 'price'],
        description: 'Write product descriptions for online stores',
        suggestedModel: AIModel.GPT_3_5_TURBO,
        defaultTemperature: 0.6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'email_campaign',
      {
        id: 'tpl_email',
        name: 'Email Campaign Generator',
        category: 'marketing',
        template: `Write an email for {{emailType}} campaign:

Subject: Create a compelling subject line
Recipient: {{recipientType}}
Goal: {{goal}}
Tone: {{tone}}

Email structure:
1. Subject line (40-50 characters)
2. Pre-header text
3. Greeting
4. Body (hook, value, benefits)
5. CTA button
6. PS line
7. Signature

Make it personalized, scannable, and mobile-friendly.`,
        variables: ['emailType', 'recipientType', 'goal', 'tone'],
        description: 'Generate email marketing campaigns',
        suggestedModel: AIModel.GPT_3_5_TURBO,
        defaultTemperature: 0.6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'title_generator',
      {
        id: 'tpl_title',
        name: 'Headline Generator',
        category: 'content',
        template: `Generate {{count}} compelling headlines for the following content:

Type: {{contentType}}
Topic: {{topic}}
Tone: {{tone}}
Target audience: {{audience}}
Unique angle: {{angle}}

Requirements:
- Numbers work well (use them)
- Create curiosity or urgency
- Be specific
- Make benefits clear
- A/B test potential`,
        variables: ['count', 'contentType', 'topic', 'tone', 'audience', 'angle'],
        description: 'Create multiple headline options',
        suggestedModel: AIModel.GPT_3_5_TURBO,
        defaultTemperature: 0.9,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  ]);

  constructor(private prisma: PrismaService) {}

  /**
   * Get built-in template
   */
  async getBuiltInTemplate(templateId: string): Promise<PromptTemplate | null> {
    return this.builtInTemplates.get(templateId) || null;
  }

  /**
   * Get all built-in templates
   */
  async getAllBuiltInTemplates(): Promise<PromptTemplate[]> {
    return Array.from(this.builtInTemplates.values());
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string): Promise<PromptTemplate[]> {
    const templates = Array.from(this.builtInTemplates.values()).filter(
      t => t.category === category,
    );
    return templates;
  }

  /**
   * Create custom template
   */
  async createTemplate(
    userId: string,
    template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PromptTemplate> {
    try {
      const newTemplate = await this.prisma.promptTemplate.create({
        data: {
          userId,
          name: template.name,
          category: template.category,
          template: template.template,
          variables: template.variables,
          description: template.description,
          suggestedModel: template.suggestedModel,
          defaultTemperature: template.defaultTemperature,
          exampleOutput: template.exampleOutput,
        },
      });

      return {
        id: newTemplate.id,
        name: newTemplate.name,
        category: newTemplate.category,
        template: newTemplate.template,
        variables: newTemplate.variables,
        description: newTemplate.description,
        suggestedModel: newTemplate.suggestedModel as AIModel,
        defaultTemperature: newTemplate.defaultTemperature,
        exampleOutput: newTemplate.exampleOutput || undefined,
        createdAt: newTemplate.createdAt,
        updatedAt: newTemplate.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to create template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    userId: string,
    updates: Partial<PromptTemplate>,
  ): Promise<PromptTemplate> {
    try {
      const template = await this.prisma.promptTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template || template.userId !== userId) {
        throw new NotFoundException('Template not found');
      }

      const updated = await this.prisma.promptTemplate.update({
        where: { id: templateId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      return {
        id: updated.id,
        name: updated.name,
        category: updated.category,
        template: updated.template,
        variables: updated.variables,
        description: updated.description,
        suggestedModel: updated.suggestedModel as AIModel,
        defaultTemperature: updated.defaultTemperature,
        exampleOutput: updated.exampleOutput || undefined,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to update template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    try {
      const template = await this.prisma.promptTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template || template.userId !== userId) {
        throw new NotFoundException('Template not found');
      }

      await this.prisma.promptTemplate.delete({
        where: { id: templateId },
      });

      this.logger.log(`Template deleted: ${templateId}`);
    } catch (error) {
      this.logger.error(`Failed to delete template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's templates
   */
  async getUserTemplates(userId: string): Promise<PromptTemplate[]> {
    try {
      const templates = await this.prisma.promptTemplate.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return templates.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        template: t.template,
        variables: t.variables,
        description: t.description,
        suggestedModel: t.suggestedModel as AIModel,
        defaultTemperature: t.defaultTemperature,
        exampleOutput: t.exampleOutput || undefined,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
    } catch (error) {
      this.logger.error(`Failed to get user templates: ${error.message}`);
      return [];
    }
  }

  /**
   * Render template with variables
   */
  renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return rendered;
  }

  /**
   * Validate template variables
   */
  validateTemplateVariables(
    template: PromptTemplate,
    variables: Record<string, string>,
  ): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const variable of template.variables) {
      if (!variables[variable]) {
        missing.push(variable);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(templateId: string): Promise<any> {
    try {
      const uses = await this.prisma.aiUsage.findMany({
        where: { promptTemplateId: templateId },
      });

      return {
        totalUses: uses.length,
        totalCost: uses.reduce((sum, u) => sum + u.cost, 0),
        averageCost: uses.length > 0 ? uses.reduce((sum, u) => sum + u.cost, 0) / uses.length : 0,
        lastUsed: uses[uses.length - 1]?.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to get template stats: ${error.message}`);
      return null;
    }
  }
}
