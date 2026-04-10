/**
 * Admin Module
 * Wires admin services and controllers for system administration
 */

import { Module } from '@nestjs/common';
import { AdminEmailSettingsService } from './services/admin-email-settings.service';
import { AdminEmailSettingsController } from './controllers/admin-email-settings.controller';
import { AdminAutopilotScheduleController } from './controllers/admin-autopilot-schedule.controller';
import { AdminAutopilotScheduleService } from './services/admin-autopilot-schedule.service';
import { AdminSmsSettingsController } from './controllers/admin-sms-settings.controller';
import { AdminSmsSettingsService } from './services/admin-sms-settings.service';
import { AIAutopilotModule } from '../ai-autopilot/ai-autopilot.module';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../email/email.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [DatabaseModule, EmailModule, AIAutopilotModule, IntegrationsModule],
  providers: [AdminEmailSettingsService, AdminAutopilotScheduleService, AdminSmsSettingsService],
  controllers: [AdminEmailSettingsController, AdminAutopilotScheduleController, AdminSmsSettingsController],
  exports: [AdminEmailSettingsService],
})
export class AdminModule {}
