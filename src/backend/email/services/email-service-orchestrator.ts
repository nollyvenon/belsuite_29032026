/**
 * Email Service Orchestrator
 * Manages email composition, aggregation, rendering, and dispatch
 * Coordinates with multiple providers and tracking systems
 */

import {
  EmailRequest,
  EmailTemplate,
  EmailCompositionResult,
  EmailAggregationConfig,
  EmailCategory,
  DispatchResult,
} from '../types/email.types';
import { EmailTemplateService } from './email-template.service';
import { EmailProvider } from './email-provider.service';
import { EmailQueueService } from './email-queue.service';
import { EmailAnalyticsService } from './email-analytics.service';
import { DEFAULT_EMAIL_TEMPLATES } from './default-templates';
import { SubscriptionService } from '../../subscription/subscription.service';

export interface EmailServiceConfig {
  // Provider settings
  primaryProvider: string;
  fallbackProviders?: string[];
  maxRetries?: number;
  retryDelay?: number;

  // Aggregation settings
  enableAggregation?: boolean;
  aggregationWindow?: number; // milliseconds

  // Rate limiting
  rateLimit?: number; // emails per second
  dailyCap?: number;

  // Analytics
  trackingEnabled?: boolean;
  trackingPixelUrl?: string;
}

export class EmailServiceOrchestrator {
  private templateService: EmailTemplateService;
  private providers: Map<string, EmailProvider> = new Map();
  private queueService: EmailQueueService;
  private analyticsService: EmailAnalyticsService;
  private subscriptionService: SubscriptionService;
  private config: EmailServiceConfig;

  constructor(
    templateService: EmailTemplateService,
    queueService: EmailQueueService,
    analyticsService: EmailAnalyticsService,
    subscriptionService: SubscriptionService,
    config: EmailServiceConfig,
  ) {
    this.templateService = templateService;
    this.queueService = queueService;
    this.analyticsService = analyticsService;
    this.subscriptionService = subscriptionService;
    this.config = {
      maxRetries: 3,
      retryDelay: 5000,
      enableAggregation: false,
      aggregationWindow: 5000,
      rateLimit: 100,
      trackingEnabled: false,
      ...config,
    };
  }

  /**
   * Register an email provider
   */
  registerProvider(name: string, provider: EmailProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * Compose and send an email
   * High-level API for sending emails
   */
  async send(request: EmailRequest): Promise<DispatchResult> {
    try {
      // Validate subscription can send emails
      const organization = request.organizationId
        ? await this.subscriptionService.getOrganization(request.organizationId)
        : null;

      if (organization && !this.canSendEmail(organization)) {
        throw new Error('Email sending quota exceeded for this organization');
      }

      // Compose the email
      const composed = await this.compose(request);

      // Add to appropriate queue
      if (this.config.enableAggregation && this.shouldAggregate(request)) {
        await this.queueService.addToAggregationQueue(composed);
        return {
          success: true,
          messageId: composed.messageId,
          provider: 'queued_for_aggregation',
        };
      }

      // Send immediately
      const result = await this.dispatch(composed);

      // Track analytics
      if (this.config.trackingEnabled) {
        await this.analyticsService.trackSent(composed. messageId, {
          provider: result.provider,
          timestamp: new Date(),
          organizationId: request.organizationId,
        });
      }

      return result;
    } catch (error) {
      console.error('Email send failed:', error);
      throw error;
    }
  }

  /**
   * Compose an email from a request
   * Validates, renders template, adds tracking
   */
  async compose(request: EmailRequest): Promise<EmailCompositionResult> {
    // Get template
    let template: EmailTemplate;

    if (request.templateId) {
      template = await this.templateService.getTemplate(request.templateId);
    } else if (request.templateName) {
      template = await this.templateService.getByName(request.templateName);
    } else if (request.inlineTemplate) {
      template = request.inlineTemplate;
    } else {
      throw new Error('No template provided');
    }

    if (!template) {
      throw new Error(`Template not found: ${request.templateId || request.templateName}`);
    }

    // Validate variables
    this.validateVariables(template, request.variables || {});

    // Render template
    const htmlContent = this.renderTemplate(template.htmlTemplate, request.variables || {});
    const textContent = template.textTemplate
      ? this.renderTemplate(template.textTemplate, request.variables || {})
      : this.stripHtml(htmlContent);

    const subject = this.renderTemplate(template.subject, request.variables || {});

    // Add tracking if needed
    const finalHtml = this.config.trackingEnabled
      ? this.addTrackingPixel(htmlContent, `compose:${Date.now()}`)
      : htmlContent;

    return {
      messageId: this.generateMessageId(),
      to: request.to,
      cc: request.cc,
      bcc: request.bcc,
      subject,
      htmlContent: finalHtml,
      textContent,
      template: template.name,
      category: template.category,
      variables: request.variables,
      organizationId: request.organizationId,
      userId: request.userId,
      metadata: request.metadata,
      priority: request.priority || 'normal',
      tags: request.tags || [],
      createdAt: new Date(),
    };
  }

  /**
   * Dispatch composed email
   * Handles provider selection and retries
   */
  async dispatch(composed: EmailCompositionResult, retryCount = 0): Promise<DispatchResult> {
    try {
      const provider = this.getProvider(this.config.primaryProvider);

      if (!provider) {
        throw new Error(`Provider not configured: ${this.config.primaryProvider}`);
      }

      const result = await provider.send({
        to: composed.to,
        cc: composed.cc,
        bcc: composed.bcc,
        subject: composed.subject,
        html: composed.htmlContent,
        text: composed.textContent,
        metadata: {
          messageId: composed.messageId,
          template: composed.template,
          organizationId: composed.organizationId,
          tags: composed.tags,
        },
      });

      // Track in database
      await this.analyticsService.logDispatch({
        messageId: composed.messageId,
        provider: result.provider,
        to: composed.to,
        template: composed.template,
        category: composed.category,
        timestamp: new Date(),
        organizationId: composed.organizationId,
        status: 'sent',
      });

      return result;
    } catch (error) {
      // Try fallback providers
      if (retryCount < (this.config.maxRetries || 3)) {
        const fallbackProvider = this.getProvider(this.config.fallbackProviders?.[retryCount]);

        if (fallbackProvider) {
          console.warn(`Primary provider failed, trying fallback ${retryCount + 1}`);
          await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay || 5000));
          return this.dispatch(composed, retryCount + 1);
        }
      }

      // All providers failed
      await this.queueService.addToRetryQueue(composed);

      throw error;
    }
  }

  /**
   * Batch send emails
   * Handles multiple emails efficiently
   */
  async sendBatch(requests: EmailRequest[]): Promise<DispatchResult[]> {
    const results: DispatchResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.send(request);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          messageId: '',
          provider: this.config.primaryProvider || 'unknown',
        });
      }
    }

    return results;
  }

  /**
   * Get aggregation recommendations for a recipient
   * Returns suggested email categories to batch together
   */
  async getAggregationRecommendations(recipientEmail: string): Promise<EmailCategory[]> {
    const recentEmails = await this.analyticsService.getRecentEmails(recipientEmail, {
      hours: 24,
      limit: 10,
    });

    const categories = recentEmails.map((e) => e.category);
    const categoryCount: Record<string, number> = {};

    categories.forEach((cat) => {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    // Return categories that appear more than once
    return Object.entries(categoryCount)
      .filter(([, count]) => count > 1)
      .map(([cat]) => cat as EmailCategory)
      .slice(0, 3); // Limit to 3 categories
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: Record<string, string | number>): string {
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    });

    return result;
  }

  /**
   * Validate that all required variables are provided
   */
  private validateVariables(template: EmailTemplate, variables: Record<string, any>): void {
    const required = template.variables || [];

    for (const variable of required) {
      if (!variables[variable]) {
        throw new Error(`Missing required template variable: ${variable}`);
      }
    }
  }

  /**
   * Strip HTML tags from content
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * Add tracking pixel to HTML
   */
  private addTrackingPixel(html: string, trackingId: string): string {
    const pixel = `<img src="${this.config.trackingPixelUrl}?id=${trackingId}" width="1" height="1" style="display:none;" />`;
    return html.replace('</body>', `${pixel}</body>`);
  }

  /**
   * Determine if email should be aggregated
   */
  private shouldAggregate(request: EmailRequest): boolean {
    if (!this.config.enableAggregation) return false;
    if (request.priority === 'high') return false;
    if (request.category === EmailCategory.PAYMENT) return false; // Payment emails not aggregated
    return true;
  }

  /**
   * Check if organization can send emails
   */
  private canSendEmail(organization: any): boolean {
    // Check subscription tiers and limits
    const dailyLimit = organization.subscription?.emailsPerDay || 1000;
    const sentToday = organization.emailsSentToday || 0;
    return sentToday < dailyLimit;
  }

  /**
   * Get provider instance
   */
  private getProvider(name?: string): EmailProvider | null {
    const providerName = name || this.config.primaryProvider;
    return this.providers.get(providerName) || null;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
