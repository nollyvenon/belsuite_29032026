/**
 * Admin Module
 * Wires admin services and controllers for system administration
 */

import { Module } from '@nestjs/common';
import { AdminEmailSettingsService } from './services/admin-email-settings.service';
import { AdminEmailSettingsController } from './controllers/admin-email-settings.controller';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DatabaseModule, EmailModule],
  providers: [AdminEmailSettingsService],
  controllers: [AdminEmailSettingsController],
  exports: [AdminEmailSettingsService],
})
export class AdminModule {}
