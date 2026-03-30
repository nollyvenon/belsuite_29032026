/**
 * AI Controller
 * API endpoints for AI generation features
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import { AIService } from '../ai.service';
import { ContentGenerationService } from '../services/content-generation.service';
import { PromptTemplateService } from '../services/prompt-template.service';
import { AIUsageLimitService } from '../services/ai-usage-limit.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { AIModel, RoutingStrategy } from '../types/ai.types';

@Controller('api/ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private aiService: AIService,
    private contentService: ContentGenerationService,
    private promptService: PromptTemplateService,
    private usageLimitService: AIUsageLimitService,
  ) {}

  // ========== Text Generation ==========

  /**
   * POST /api/ai/text
   * Generate text with custom prompt
   */
  @Post('text')
  @HttpCode(HttpStatus.OK)
  async generateText(
    @Tenant() organizationId: string,
    @CurrentUser() user: any,
    @Body()
    body: {
      prompt: string;
      model?: AIModel;
      maxTokens?: number;
      temperature?: number;
      useCache?: boolean;
    },
  ) {
    try {
      const result = await this.aiService.generateText(
        {
          prompt: body.prompt,
          model: body.model,
          maxTokens: body.maxTokens,
          temperature: body.temperature,
        },
        organizationId,
        user.sub,
        { type: 'cheapest' },
        body.useCache !== false,
      );

      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Text generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/ai/blog-post
   * Generate blog post
   */
  @Post('blog-post')
  @HttpCode(HttpStatus.OK)
  async generateBlogPost(
    @CurrentUser() user: any,
    @Body()
    body: {
      topic: string;
      tone?: string;
      audience?: string;
      wordCount?: number;
      keywords?: string;
      model?: AIModel;
    },
  ) {
    try {
      const result = await this.contentService.generateBlogPost(user.sub, body);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Blog post generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/ai/social-post
   * Generate social media post
   */
  @Post('social-post')
  @HttpCode(HttpStatus.OK)
  async generateSocialPost(
    @CurrentUser() user: any,
    @Body()
    body: {
      platform: 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'tiktok';
      topic: string;
      tone?: string;
      hashtags?: boolean;
      includeEmojis?: boolean;
      model?: AIModel;
    },
  ) {
    try {
      const result = await this.contentService.generateSocialPost(user.sub, body);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Social post generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/ai/ad-copy
   * Generate advertisement copy
   */
  @Post('ad-copy')
  @HttpCode(HttpStatus.OK)
  async generateAdCopy(
    @CurrentUser() user: any,
    @Body()
    body: {
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
      const result = await this.contentService.generateAdCopy(user.sub, body);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Ad copy generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/ai/video-script
   * Generate video script
   */
  @Post('video-script')
  @HttpCode(HttpStatus.OK)
  async generateVideoScript(
    @CurrentUser() user: any,
    @Body()
    body: {
      topic: string;
      videoDuration: number;
      videoType: 'tutorial' | 'promotional' | 'educational' | 'comedy' | 'story';
      audience?: string;
      keyMessages?: string;
      cta?: string;
      model?: AIModel;
    },
  ) {
    try {
      const result = await this.contentService.generateVideoScript(user.sub, body);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Video script generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/ai/product-description
   * Generate product description
   */
  @Post('product-description')
  @HttpCode(HttpStatus.OK)
  async generateProductDescription(
    @CurrentUser() user: any,
    @Body()
    body: {
      productName: string;
      features: string;
      customer?: string;
      uniqueValue?: string;
      price?: string;
      model?: AIModel;
    },
  ) {
    try {
      const result = await this.contentService.generateProductDescription(user.sub, body);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Product description generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/ai/email-campaign
   * Generate email campaign
   */
  @Post('email-campaign')
  @HttpCode(HttpStatus.OK)
  async generateEmailCampaign(
    @CurrentUser() user: any,
    @Body()
    body: {
      emailType: 'promotional' | 'newsletter' | 'followup' | 'welcome';
      recipientType: string;
      goal: string;
      tone?: string;
      model?: AIModel;
    },
  ) {
    try {
      const result = await this.contentService.generateEmailCampaign(user.sub, body);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Email campaign generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/ai/headlines
   * Generate multiple headlines
   */
  @Post('headlines')
  @HttpCode(HttpStatus.OK)
  async generateHeadlines(
    @CurrentUser() user: any,
    @Body()
    body: {
      contentType: string;
      topic: string;
      audience?: string;
      count?: number;
      model?: AIModel;
    },
  ) {
    try {
      const result = await this.contentService.generateHeadlines(user.sub, body);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Headline generation failed: ${error.message}`);
      throw error;
    }
  }

  // ========== Image Generation ==========

  /**
   * POST /api/ai/image
   * Generate image
   */
  @Post('image')
  @HttpCode(HttpStatus.OK)
  async generateImage(
    @Tenant() organizationId: string,
    @CurrentUser() user: any,
    @Body()
    body: {
      prompt: string;
      size?: string;
      quantity?: number;
      style?: string;
      quality?: 'standard' | 'hd';
    },
  ) {
    try {
      const result = await this.contentService.generateImage(organizationId, user.sub, body);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Image generation failed: ${error.message}`);
      throw error;
    }
  }

  // ========== Templates ==========

  /**
   * GET /api/ai/templates
   * Get all templates
   */
  @Get('templates')
  async getTemplates() {
    try {
      const templates = await this.promptService.getAllBuiltInTemplates();
      return { success: true, data: templates };
    } catch (error) {
      this.logger.error(`Failed to get templates: ${error.message}`);
      throw error;
    }
  }

  /**
   * GET /api/ai/templates?category=content
   * Get templates by category
   */
  @Get('templates/category')
  async getTemplatesByCategory(@Query('category') category: string) {
    try {
      const templates = await this.promptService.getTemplatesByCategory(category);
      return { success: true, data: templates };
    } catch (error) {
      this.logger.error(`Failed to get templates: ${error.message}`);
      throw error;
    }
  }

  // ========== Usage & Analytics ==========

  /**
   * GET /api/ai/usage/stats
   * Get AI usage statistics and limits
   */
  @Get('usage/stats')
  async getUsageStats(
    @Tenant() organizationId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const [stats, limits] = await Promise.all([
        this.aiService.getUserStats(user.sub),
        this.usageLimitService.getRemaining(organizationId, user.sub),
      ]);
      return { success: true, data: { stats, limits } };
    } catch (error) {
      this.logger.error(`Failed to get usage stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * GET /api/ai/usage/check
   * Check current usage status and limits
   */
  @Get('usage/check')
  async checkUsageStatus(
    @Tenant() organizationId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.usageLimitService.checkUsageLimit(organizationId, user.sub);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Failed to check usage: ${error.message}`);
      throw error;
    }
  }

  /**
   * GET /api/ai/cache/stats
   * Get cache statistics
   */
  @Get('cache/stats')
  async getCacheStats() {
    try {
      const stats = this.aiService.getCacheStats();
      return { success: true, data: stats };
    } catch (error) {
      this.logger.error(`Failed to get cache stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/ai/cache/clear
   * Clear expired cache entries
   */
  @Post('cache/clear')
  @HttpCode(HttpStatus.OK)
  async clearCache() {
    try {
      const cleared = this.aiService.clearExpiredCache();
      return {
        success: true,
        message: `Cleared ${cleared} cache entries`,
      };
    } catch (error) {
      this.logger.error(`Failed to clear cache: ${error.message}`);
      throw error;
    }
  }

  /**
   * GET /api/ai/providers
   * Get available providers
   */
  @Get('providers')
  async getProviders() {
    try {
      const status = await this.aiService.validateProviders();
      return { success: true, data: status };
    } catch (error) {
      this.logger.error(`Failed to get providers: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/ai/models/test
   * Test model availability
   */
  @Post('models/test')
  @HttpCode(HttpStatus.OK)
  async testModel(
    @Body() body: { prompt: string; model: AIModel },
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.aiService.generateText(
        {
          prompt: body.prompt || 'Test prompt',
          model: body.model,
          maxTokens: 100,
        },
        user.sub,
        { type: 'custom' },
        false,
      );

      return {
        success: true,
        message: 'Model test successful',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Model test failed: ${error.message}`);
      throw error;
    }
  }
}
