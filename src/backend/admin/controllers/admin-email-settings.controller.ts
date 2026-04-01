/**
 * Admin Email Settings Controller
 * HTTP endpoints for managing email provider configuration
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Req,
  Body,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AdminEmailSettingsService } from '../services/admin-email-settings.service';
import {
  AdminEmailSettingsDto,
  UpdateEmailSettingsDto,
  TestEmailDto,
  EmailProviderConfigDto,
} from '../dtos/email-settings.dto';

/**
 * Admin Email Configuration Controller
 * 
 * Endpoints:
 * GET  /api/admin/email-settings       - Get current settings
 * PUT  /api/admin/email-settings       - Update settings
 * GET  /api/admin/email-providers      - List available providers
 * POST /api/admin/email/test           - Send test email
 * GET  /api/admin/email/health         - Check email health
 * GET  /api/admin/email/configured     - List configured providers
 */
@Controller('api/admin/email')
export class AdminEmailSettingsController {
  private readonly logger = new Logger(AdminEmailSettingsController.name);

  constructor(private readonly emailSettingsService: AdminEmailSettingsService) {}

  private getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }

  private getErrorStatus(error: unknown, fallback = HttpStatus.INTERNAL_SERVER_ERROR) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof (error as { status?: unknown }).status === 'number'
    ) {
      return (error as { status: number }).status;
    }

    return fallback;
  }

  // ============================================================================
  // GET ENDPOINTS
  // ============================================================================

  /**
   * GET /api/admin/email/settings
   * Get current email settings for organization
   */
  @Get('settings')
  async getEmailSettings(@Req() req: any): Promise<AdminEmailSettingsDto> {
    try {
      const organizationId = req.user.organizationId;

      if (!organizationId) {
        throw new HttpException(
          'Organization ID not found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return await this.emailSettingsService.getEmailSettings(organizationId);
    } catch (error) {
      const message = this.getErrorMessage(error, 'Failed to get email settings');
      this.logger.error(`Failed to get email settings: ${message}`);
      throw new HttpException(
        message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/admin/email/providers
   * Get list of available email providers with configuration requirements
   */
  @Get('providers')
  async getAvailableProviders(): Promise<EmailProviderConfigDto[]> {
    try {
      return await this.emailSettingsService.getAvailableProviders();
    } catch (error) {
      this.logger.error(
        `Failed to get providers: ${this.getErrorMessage(error, 'Failed to get providers')}`,
      );
      throw new HttpException(
        'Failed to fetch providers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/admin/email/health
   * Check email configuration health
   */
  @Get('health')
  async checkEmailHealth(@Req() req: any): Promise<any> {
    try {
      const organizationId = req.user.organizationId;

      if (!organizationId) {
        throw new HttpException(
          'Organization ID not found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return await this.emailSettingsService.checkEmailHealth(organizationId);
    } catch (error) {
      const message = this.getErrorMessage(error, 'Failed to check email health');
      this.logger.error(`Failed to check email health: ${message}`);
      throw new HttpException(
        message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/admin/email/configured
   * Get list of configured providers
   */
  @Get('configured')
  async getConfiguredProviders(@Req() req: any): Promise<string[]> {
    try {
      const organizationId = req.user.organizationId;

      if (!organizationId) {
        throw new HttpException(
          'Organization ID not found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return await this.emailSettingsService.getConfiguredProviders(
        organizationId,
      );
    } catch (error) {
      const message = this.getErrorMessage(error, 'Failed to get configured providers');
      this.logger.error(
        `Failed to get configured providers: ${message}`,
      );
      throw new HttpException(
        'Failed to fetch configured providers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================================================
  // PUT ENDPOINTS
  // ============================================================================

  /**
   * PUT /api/admin/email/settings
   * Update email configuration settings
   */
  @Put('settings')
  async updateEmailSettings(
    @Req() req: any,
    @Body() dto: UpdateEmailSettingsDto,
  ): Promise<AdminEmailSettingsDto> {
    try {
      const organizationId = req.user.organizationId;

      if (!organizationId) {
        throw new HttpException(
          'Organization ID not found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Validate that at least one provider is being configured or already exists
      const currentSettings = await this.emailSettingsService.getEmailSettings(
        organizationId,
      );
      const hasExistingProvider = this.hasConfiguredProvider(currentSettings);

      if (!hasExistingProvider && !this.hasProviderInDto(dto)) {
        throw new HttpException(
          'At least one email provider must be configured',
          HttpStatus.BAD_REQUEST,
        );
      }

      const updated = await this.emailSettingsService.updateEmailSettings(
        organizationId,
        dto,
      );

      this.logger.log(
        `Email settings updated for organization: ${organizationId}`,
      );

      return updated;
    } catch (error) {
      const message = this.getErrorMessage(error, 'Failed to update email settings');
      this.logger.error(`Failed to update email settings: ${message}`);
      throw new HttpException(
        message,
        this.getErrorStatus(error),
      );
    }
  }

  // ============================================================================
  // POST ENDPOINTS
  // ============================================================================

  /**
   * POST /api/admin/email/test
   * Send a test email to verify configuration
   */
  @Post('test')
  async testEmailConfiguration(
    @Req() req: any,
    @Body() dto: TestEmailDto,
  ): Promise<{ success: boolean; provider: string; message: string }> {
    try {
      const organizationId = req.user.organizationId;

      if (!organizationId) {
        throw new HttpException(
          'Organization ID not found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result =
        await this.emailSettingsService.testEmailConfiguration(
          organizationId,
          dto,
        );

      this.logger.log(
        `Test email sent successfully for organization: ${organizationId}`,
      );

      return result;
    } catch (error) {
      const message = this.getErrorMessage(error, 'Test email failed');
      this.logger.error(`Test email failed: ${message}`);
      throw new HttpException(
        message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Check if DTO contains provider configuration
   */
  private hasProviderInDto(dto: UpdateEmailSettingsDto): boolean {
    return !!(
      dto.sendgridApiKey ||
      dto.mailgunApiKey ||
      dto.postmarkApiKey ||
      (dto.awsAccessKeyId && dto.awsSecretAccessKey) ||
      dto.smtpHost ||
      dto.sendmailPath
    );
  }

  private hasConfiguredProvider(settings: AdminEmailSettingsDto): boolean {
    return Boolean(
      settings.sendgridApiKey ||
      settings.mailgunApiKey ||
      settings.postmarkApiKey ||
      (settings.awsAccessKeyId && settings.awsSecretAccessKey) ||
      settings.smtpHost ||
      settings.sendmailPath,
    );
  }
}
