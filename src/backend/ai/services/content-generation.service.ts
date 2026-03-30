/**
 * Content Generation Services
 * Specialized services for different content types
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AIService } from '../ai.service';
import { PromptTemplateService } from './prompt-template.service';
import { AIRequest, AIModel, ImageGenerationRequest, RoutingStrategy } from '../types/ai.types';

@Injectable()
export class ContentGenerationService {
  private readonly logger = new Logger(ContentGenerationService.name);

  constructor(
    private aiService: AIService,
    private promptService: PromptTemplateService,
  ) {}

  /**
   * Generate blog post
   */
  async generateBlogPost(
    userId: string,
    options: {
      topic: string;
      tone?: string;
      audience?: string;
      wordCount?: number;
      keywords?: string;
      model?: AIModel;
      useCache?: boolean;
    },
  ) {
    try {
      const template = await this.promptService.getBuiltInTemplate('blog_post');
      if (!template) throw new BadRequestException('Template not found');

      const variables = {
        topic: options.topic,
        tone: options.tone || 'professional',
        audience: options.audience || 'general',
        wordCount: (options.wordCount || 2000).toString(),
        keywords: options.keywords || '',
      };

      const validation = this.promptService.validateTemplateVariables(
        template,
        variables,
      );
      if (!validation.valid) {
        throw new BadRequestException(
          `Missing variables: ${validation.missing.join(', ')}`,
        );
      }

      const prompt = this.promptService.renderTemplate(template.template, variables);

      const response = await this.aiService.generateText(
        {
          prompt,
          model: options.model || template.suggestedModel,
          temperature: template.defaultTemperature,
          maxTokens: 4000,
        },
        userId,
        { type: 'cheapest' },
        options.useCache !== false,
      );

      return {
        content: response.text,
        metadata: {
          model: response.model,
          provider: response.provider,
          tokens: response.tokens,
          cost: response.cost,
          generatedAt: response.generatedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Blog post generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate social media post
   */
  async generateSocialPost(
    userId: string,
    options: {
      platform: 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'tiktok';
      topic: string;
      tone?: string;
      hashtags?: boolean;
      includeEmojis?: boolean;
      model?: AIModel;
    },
  ) {
    try {
      const template = await this.promptService.getBuiltInTemplate('social_post');
      if (!template) throw new BadRequestException('Template not found');

      const platformLimits: Record<string, number> = {
        twitter: 280,
        instagram: 2200,
        linkedin: 3000,
        facebook: 63206,
        tiktok: 2200,
      };

      const variables = {
        platform: options.platform,
        topic: options.topic,
        tone: options.tone || 'engaging',
        hashtags: options.hashtags ? 'yes' : 'no',
        includeEmojis: options.includeEmojis ? 'yes' : 'no',
        length: platformLimits[options.platform].toString(),
      };

      const prompt = this.promptService.renderTemplate(template.template, variables);

      const response = await this.aiService.generateText(
        {
          prompt,
          model: options.model || template.suggestedModel,
          temperature: 0.8,
          maxTokens: 500,
        },
        userId,
        { type: 'cheapest' },
        true,
      );

      return {
        content: response.text,
        platform: options.platform,
        metadata: {
          cost: response.cost,
          tokens: response.tokens,
          generatedAt: response.generatedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Social post generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate video script
   */
  async generateVideoScript(
    userId: string,
    options: {
      topic: string;
      videoDuration: number; // in seconds
      videoType: 'tutorial' | 'promotional' | 'educational' | 'comedy' | 'story';
      audience?: string;
      keyMessages?: string;
      cta?: string;
      model?: AIModel;
    },
  ) {
    try {
      const template = await this.promptService.getBuiltInTemplate('video_script');
      if (!template) throw new BadRequestException('Template not found');

      const variables = {
        videoDuration: options.videoDuration.toString(),
        videoType: options.videoType,
        topic: options.topic,
        audience: options.audience || 'general viewers',
        keyMessages: options.keyMessages || 'main points about the topic',
        cta: options.cta || 'Subscribe for more content',
      };

      const prompt = this.promptService.renderTemplate(template.template, variables);

      // Longer timeout for video scripts
      const response = await this.aiService.generateText(
        {
          prompt,
          model: options.model || template.suggestedModel,
          temperature: template.defaultTemperature,
          maxTokens: 3000,
        },
        userId,
        { type: 'best_quality' },
        true,
      );

      return {
        script: response.text,
        duration: options.videoDuration,
        type: options.videoType,
        metadata: {
          model: response.model,
          cost: response.cost,
          tokens: response.tokens,
          generatedAt: response.generatedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Video script generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate ad copy
   */
  async generateAdCopy(
    userId: string,
    options: {
      product: string;
      audience?: string;
      benefits?: string;
      cta?: string;
      tone?: string;
      medium: 'google' | 'facebook' | 'linkedin' | 'instagram' | 'email';
      quantity?: number;
      model?: AIModel;
    },
  ) {
    try {
      const template = await this.promptService.getBuiltInTemplate('ad_copy');
      if (!template) throw new BadRequestException('Template not found');

      const variables = {
        medium: options.medium,
        product: options.product,
        audience: options.audience || 'target customers',
        benefits: options.benefits || 'key benefits',
        cta: options.cta || 'Buy Now',
        tone: options.tone || 'persuasive',
      };

      const prompt = this.promptService.renderTemplate(template.template, variables);
      const quantity = options.quantity || 1;
      const fullPrompt =
        quantity > 1
          ? `${prompt}\n\nGenerate ${quantity} different variations of ad copy.`
          : prompt;

      const response = await this.aiService.generateText(
        {
          prompt: fullPrompt,
          model: options.model || template.suggestedModel,
          temperature: 0.8,
          maxTokens: 2000,
        },
        userId,
        { type: 'best_quality' },
        true,
      );

      return {
        copies: this.parseAdCopies(response.text, quantity),
        product: options.product,
        medium: options.medium,
        metadata: {
          count: quantity,
          cost: response.cost,
          tokens: response.tokens,
          generatedAt: response.generatedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Ad copy generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate product description
   */
  async generateProductDescription(
    userId: string,
    options: {
      productName: string;
      features: string;
      customer?: string;
      uniqueValue?: string;
      price?: string;
      model?: AIModel;
    },
  ) {
    try {
      const template = await this.promptService.getBuiltInTemplate(
        'product_description',
      );
      if (!template) throw new BadRequestException('Template not found');

      const variables = {
        productName: options.productName,
        features: options.features,
        customer: options.customer || 'online shoppers',
        uniqueValue: options.uniqueValue || 'premium quality',
        price: options.price || 'competitive pricing',
      };

      const prompt = this.promptService.renderTemplate(template.template, variables);

      const response = await this.aiService.generateText(
        {
          prompt,
          model: options.model || template.suggestedModel,
          temperature: 0.7,
          maxTokens: 1500,
        },
        userId,
        { type: 'balanced' },
        true,
      );

      return {
        description: response.text,
        productName: options.productName,
        metadata: {
          cost: response.cost,
          tokens: response.tokens,
          generatedAt: response.generatedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Product description generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate email campaign
   */
  async generateEmailCampaign(
    userId: string,
    options: {
      emailType: 'promotional' | 'newsletter' | 'followup' | 'welcome';
      recipientType: string;
      goal: string;
      tone?: string;
      model?: AIModel;
    },
  ) {
    try {
      const template = await this.promptService.getBuiltInTemplate('email_campaign');
      if (!template) throw new BadRequestException('Template not found');

      const variables = {
        emailType: options.emailType,
        recipientType: options.recipientType,
        goal: options.goal,
        tone: options.tone || 'professional',
      };

      const prompt = this.promptService.renderTemplate(template.template, variables);

      const response = await this.aiService.generateText(
        {
          prompt,
          model: options.model || template.suggestedModel,
          temperature: 0.6,
          maxTokens: 2000,
        },
        userId,
        { type: 'balanced' },
        true,
      );

      return {
        email: response.text,
        type: options.emailType,
        metadata: {
          cost: response.cost,
          tokens: response.tokens,
          generatedAt: response.generatedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Email campaign generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate image
   */
  async generateImage(
    userId: string,
    options: {
      prompt: string;
      size?: string;
      quantity?: number;
      style?: string;
      quality?: 'standard' | 'hd';
    },
  ) {
    try {
      const response = await this.aiService.generateImage(
        {
          prompt: options.prompt,
          size: options.size || '1024x1024',
          quantity: options.quantity || 1,
          style: options.style,
          quality: options.quality || 'standard',
        },
        userId,
        { type: 'best_quality' },
      );

      return {
        images: response.urls,
        prompt: options.prompt,
        metadata: {
          model: response.model,
          provider: response.provider,
          cost: response.cost,
          generatedAt: response.generatedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Image generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate multiple headlines
   */
  async generateHeadlines(
    userId: string,
    options: {
      contentType: string;
      topic: string;
      audience?: string;
      count?: number;
      model?: AIModel;
    },
  ) {
    try {
      const template = await this.promptService.getBuiltInTemplate('title_generator');
      if (!template) throw new BadRequestException('Template not found');

      const variables = {
        count: (options.count || 5).toString(),
        contentType: options.contentType,
        topic: options.topic,
        tone: 'compelling',
        audience: options.audience || 'general readers',
        angle: 'unique perspective',
      };

      const prompt = this.promptService.renderTemplate(template.template, variables);

      const response = await this.aiService.generateText(
        {
          prompt,
          model: options.model || template.suggestedModel,
          temperature: 0.9,
          maxTokens: 1000,
        },
        userId,
        { type: 'cheapest' },
        true,
      );

      return {
        headlines: this.parseHeadlines(response.text),
        topic: options.topic,
        metadata: {
          cost: response.cost,
          tokens: response.tokens,
          generatedAt: response.generatedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Headline generation failed: ${error.message}`);
      throw error;
    }
  }

  // Helper functions
  private parseAdCopies(text: string, count: number): string[] {
    const lines = text
      .split('\n')
      .filter(line => line.trim().length > 0);
    return lines.slice(0, count);
  }

  private parseHeadlines(text: string): string[] {
    return text
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
  }
}
