/**
 * Admin Module - Index
 * Exports all admin services, controllers, and DTOs
 */

export { AdminModule } from './admin.module';
export { AdminEmailSettingsService } from './services/admin-email-settings.service';
export { AdminEmailSettingsController } from './controllers/admin-email-settings.controller';
export type {
  AdminEmailSettingsDto,
  UpdateEmailSettingsDto,
  TestEmailDto,
  EmailProviderConfigDto,
  ConfigField,
} from './dtos/email-settings.dto';
