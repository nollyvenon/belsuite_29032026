/**
 * Email Service - Core implementation
 * Orchestrates email operations across different providers
 */

import { Injectable, Logger } from '@nestjs/common';
import { IEmailService, EmailSendOptions, EmailResponse, EmailStatus, CreateEmailTemplateDto, UpdateEmailTemplateDto, EmailTemplate } from '../interfaces/email.service.interface';
import { PrismaService } from '../../database/prisma.service';
import { SendGridProvider } from '../providers/sendgrid.provider';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sendGridProvider: SendGridProvider,
  ) {}

  /**
   * Send a single email
   */
  async send(options: EmailSendOptions, organizationId: string): Promise<EmailResponse> {
    try {
      // Get organization to check quotas
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { tier: true },
      });

      if (!organization) {
        throw new Error('Organization not found');
      }

      // For now, use SendGrid as primary provider
      const response = await this.sendGridProvider.send(options);

      if (response.success && response.messageId) {
        // Store in database
        await this.prisma.email.create({
          data: {
            toEmail: Array.isArray(options.to) ? options.to[0] : options.to,
            toName: undefined,
            organizationId,
            subject: options.subject,
            htmlContent: options.html,
            textContent: options.text,
            status: 'SENT',
            provider: 'SENDGRID',
            externalEmailId: response.messageId,
            attemptNumber: 1,
            createdAt: new Date(),
          },
        });

        this.logger.log(`Email sent: ${response.messageId}`);
      }

      return response;
    } catch (error) {
      this.logger.error(`Send failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
        provider: 'sendgrid',
        timestamp: new Date(),
        retryable: true,
      };
    }
  }

  /**
   * Send batch emails
   */
  async sendBatch(emails: EmailSendOptions[], organizationId: string): Promise<EmailResponse[]> {
    const results: EmailResponse[] = [];

    for (const email of emails) {
      const result = await this.send(email, organizationId);
      results.push(result);
    }

    return results;
  }

  /**
   * Send email from template
   */
  async sendFromTemplate(
    templateId: string,
    to: string,
    variables: Record<string, any>,
    organizationId: string,
  ): Promise<EmailResponse> {
    try {
      // Get template
      const template = await this.prisma.emailTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // Render template
      const subject = this.renderTemplate(template.subject, variables);
      const html = this.renderTemplate(template.htmlTemplate, variables);
      const text = template.textTemplate ? this.renderTemplate(template.textTemplate, variables) : undefined;

      return this.send(
        {
          to,
          subject,
          html,
          text,
          metadata: {
            templateId,
            templateName: template.name,
          },
        },
        organizationId,
      );
    } catch (error) {
      this.logger.error(`Template send failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        provider: 'sendgrid',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get email status
   */
  async getStatus(messageId: string): Promise<EmailStatus | null> {
    return this.sendGridProvider.getStatus(messageId);
  }

  /**
   * Service health check
   */
  async health(): Promise<{ healthy: boolean; provider: string; timestamp: Date }> {
    return this.sendGridProvider.health();
  }

  /**
   * Create email template
   */
  async createTemplate(
    data: CreateEmailTemplateDto,
    organizationId: string,
  ): Promise<EmailTemplate> {
    const template = await this.prisma.emailTemplate.create({
      data: {
        ...data,
        organizationId,
        variables: data.variables || [],
      },
    });

    this.logger.log(`Template created: ${template.id}`);
    return template;
  }

  /**
   * Get email template
   */
  async getTemplate(templateId: string, organizationId: string): Promise<EmailTemplate | null> {
    return this.prisma.emailTemplate.findFirst({
      where: {
        id: templateId,
        organizationId,
      },
    });
  }

  /**
   * List organization templates
   */
  async listTemplates(organizationId: string): Promise<EmailTemplate[]> {
    return this.prisma.emailTemplate.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update email template
   */
  async updateTemplate(
    templateId: string,
    data: UpdateEmailTemplateDto,
    organizationId: string,
  ): Promise<EmailTemplate> {
    const template = await this.prisma.emailTemplate.updateMany({
      where: {
        id: templateId,
        organizationId,
      },
      data,
    });

    if (template.count === 0) {
      throw new Error('Template not found');
    }

    this.logger.log(`Template updated: ${templateId}`);

    return this.getTemplate(templateId, organizationId);
  }

  /**
   * Delete email template
   */
  async deleteTemplate(templateId: string, organizationId: string): Promise<void> {
    const result = await this.prisma.emailTemplate.deleteMany({
      where: {
        id: templateId,
        organizationId,
        isSystem: false, // Prevent deleting system templates
      },
    });

    if (result.count === 0) {
      throw new Error('Template not found or is a system template');
    }

    this.logger.log(`Template deleted: ${templateId}`);
  }

  /**
   * Get email statistics
   */
  async getStats(organizationId: string, days = 30): Promise<Record<string, any>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const emails = await this.prisma.email.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        status: true,
        sentAt: true,
        openedAt: true,
        clickedAt: true,
      },
    });

    const stats = {
      total: emails.length,
      sent: emails.filter((e) => e.sentAt).length,
      opened: emails.filter((e) => e.openedAt).length,
      clicked: emails.filter((e) => e.clickedAt).length,
      failed: emails.filter((e) => e.status === 'FAILED').length,
      openRate: 0,
      clickRate: 0,
    };

    if (stats.sent > 0) {
      stats.openRate = (stats.opened / stats.sent) * 100;
      stats.clickRate = (stats.clicked / stats.sent) * 100;
    }

    return stats;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    });

    return result;
  }
}
