/**
 * Email Controller
 * Handles email-related HTTP requests
 */

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EmailService } from '../services/email.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../../rbac/guards/organization.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentOrganization } from '../../organizations/decorators/current-organization.decorator';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto, IEmailService, EmailSendOptions } from '../interfaces/email.service.interface';
import { Throttle } from '@nestjs/throttler';

@Controller('email')
@UseGuards(JwtAuthGuard, OrganizationGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Send email
   * POST /email/send
   */
  @Post('send')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async sendEmail(
    @Body() payload: EmailSendOptions & { templateId?: string; variables?: Record<string, any> },
    @CurrentOrganization() organizationId: string,
  ) {
    try {
      // If template ID is provided, use template
      if (payload.templateId) {
        return await this.emailService.sendFromTemplate(
          payload.templateId,
          payload.to as string,
          payload.variables || {},
          organizationId,
        );
      }

      // Otherwise send direct
      if (!payload.to || !payload.subject || (!payload.html && !payload.text)) {
        throw new BadRequestException(
          'Must provide: to, subject, and (html or text)',
        );
      }

      return await this.emailService.send(payload, organizationId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Send batch emails
   * POST /email/send-batch
   */
  @Post('send-batch')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async sendBatchEmails(
    @Body() payload: { emails: EmailSendOptions[] },
    @CurrentOrganization() organizationId: string,
  ) {
    if (!payload.emails || !Array.isArray(payload.emails) || payload.emails.length === 0) {
      throw new BadRequestException('Must provide array of emails');
    }

    if (payload.emails.length > 1000) {
      throw new BadRequestException('Maximum 1000 emails per batch');
    }

    return await this.emailService.sendBatch(payload.emails, organizationId);
  }

  /**
   * Get email status
   * GET /email/:messageId/status
   */
  @Get(':messageId/status')
  async getEmailStatus(@Param('messageId') messageId: string) {
    const status = await this.emailService.getStatus(messageId);

    if (!status) {
      throw new NotFoundException('Email not found');
    }

    return status;
  }

  /**
   * Service health check
   * GET /email/health
   */
  @Get('health')
  async healthCheck() {
    return await this.emailService.health();
  }

  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================

  /**
   * Create email template
   * POST /email/templates
   */
  @Post('templates')
  @HttpCode(201)
  async createTemplate(
    @Body() data: CreateEmailTemplateDto,
    @CurrentOrganization() organizationId: string,
  ) {
    if (!data.name || !data.subject || !data.htmlTemplate) {
      throw new BadRequestException(
        'Must provide: name, subject, htmlTemplate',
      );
    }

    return await this.emailService.createTemplate(data, organizationId);
  }

  /**
   * Get email template
   * GET /email/templates/:templateId
   */
  @Get('templates/:templateId')
  async getTemplate(
    @Param('templateId') templateId: string,
    @CurrentOrganization() organizationId: string,
  ) {
    const template = await this.emailService.getTemplate(templateId, organizationId);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  /**
   * List organization templates
   * GET /email/templates
   */
  @Get('templates')
  async listTemplates(
    @Query('category') category?: string,
    @CurrentOrganization() organizationId: string = '',
  ) {
    let templates = await this.emailService.listTemplates(organizationId);

    if (category) {
      templates = templates.filter((t) => t.category === category);
    }

    return templates;
  }

  /**
   * Update email template
   * PUT /email/templates/:templateId
   */
  @Put('templates/:templateId')
  async updateTemplate(
    @Param('templateId') templateId: string,
    @Body() data: UpdateEmailTemplateDto,
    @CurrentOrganization() organizationId: string,
  ) {
    try {
      return await this.emailService.updateTemplate(templateId, data, organizationId);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Delete email template
   * DELETE /email/templates/:templateId
   */
  @Delete('templates/:templateId')
  @HttpCode(204)
  async deleteTemplate(
    @Param('templateId') templateId: string,
    @CurrentOrganization() organizationId: string,
  ) {
    try {
      await this.emailService.deleteTemplate(templateId, organizationId);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get email statistics
   * GET /email/stats
   */
  @Get('stats')
  async getStats(
    @Query('days') days: string = '30',
    @CurrentOrganization() organizationId: string,
  ) {
    const parsedDays = Math.min(parseInt(days) || 30, 365); // Max 1 year

    return await this.emailService.getStats(organizationId, parsedDays);
  }
}
