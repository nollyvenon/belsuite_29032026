import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SmsService } from '../../integrations/providers/communication/sms.service';
import {
  AdminSmsSettingsDto,
  SmsProviderConfigDto,
  TestSmsDto,
  UpdateSmsSettingsDto,
} from '../dtos/sms-settings.dto';

type SmsStore = {
  provider: 'TWILIO' | 'VONAGE' | 'AWS_SNS';
  fromNumber?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  vonageApiKey?: string;
  vonageApiSecret?: string;
  vonageFromNumber?: string;
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  enabled: boolean;
  updatedAt: string;
  lastTestedAt?: string;
  testStatus?: string;
};

@Injectable()
export class AdminSmsSettingsService {
  private readonly keyPrefix = 'sms_settings:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
  ) {}

  async getSettings(organizationId: string): Promise<AdminSmsSettingsDto> {
    const row = await this.prisma.billingConfig.findUnique({
      where: { key: `${this.keyPrefix}${organizationId}` },
    });
    if (!row) {
      return {
        provider: 'TWILIO',
        enabled: false,
        updatedAt: new Date().toISOString(),
      };
    }
    return JSON.parse(row.value) as AdminSmsSettingsDto;
  }

  async updateSettings(organizationId: string, dto: UpdateSmsSettingsDto): Promise<AdminSmsSettingsDto> {
    const current = await this.getSettings(organizationId);
    const merged: SmsStore = {
      ...current,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    await this.prisma.billingConfig.upsert({
      where: { key: `${this.keyPrefix}${organizationId}` },
      create: {
        key: `${this.keyPrefix}${organizationId}`,
        value: JSON.stringify(merged),
        description: 'SMS provider settings for organization',
      },
      update: {
        value: JSON.stringify(merged),
      },
    });
    return merged;
  }

  getProviders(): SmsProviderConfigDto[] {
    return [
      { id: 'TWILIO', name: 'Twilio', requiredFields: ['twilioAccountSid', 'twilioAuthToken', 'twilioFromNumber'] },
      { id: 'VONAGE', name: 'Vonage', requiredFields: ['vonageApiKey', 'vonageApiSecret', 'vonageFromNumber'] },
      { id: 'AWS_SNS', name: 'AWS SNS', requiredFields: ['awsRegion', 'awsAccessKeyId', 'awsSecretAccessKey'] },
    ];
  }

  async testSettings(organizationId: string, dto: TestSmsDto) {
    const cfg = await this.getSettings(organizationId);
    if (!cfg.enabled) throw new Error('SMS is disabled');
    const body = dto.body ?? 'BelSuite SMS provider test';
    const result = await this.sms.send({ to: dto.to, body, provider: cfg.provider });
    const updated = await this.updateSettings(organizationId, {
      lastTestedAt: new Date().toISOString(),
      testStatus: `SUCCESS:${result.provider}`,
    } as any);
    return { success: true, result, settings: updated };
  }

  async health(organizationId: string) {
    const cfg = await this.getSettings(organizationId);
    return {
      enabled: cfg.enabled,
      provider: cfg.provider,
      configured: this.isConfigured(cfg),
      lastTestedAt: cfg.lastTestedAt ?? null,
      testStatus: cfg.testStatus ?? null,
    };
  }

  private isConfigured(cfg: AdminSmsSettingsDto) {
    if (cfg.provider === 'TWILIO') return Boolean(cfg.twilioAccountSid && cfg.twilioAuthToken && cfg.twilioFromNumber);
    if (cfg.provider === 'VONAGE') return Boolean(cfg.vonageApiKey && cfg.vonageApiSecret);
    return Boolean(cfg.awsAccessKeyId && cfg.awsSecretAccessKey);
  }
}
