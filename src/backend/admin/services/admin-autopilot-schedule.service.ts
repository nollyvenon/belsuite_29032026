import { Injectable } from '@nestjs/common';
import { AIAutopilotSchedulerService } from '../../ai-autopilot/autopilot-scheduler.service';
import {
  AutopilotSchedulePreset,
  PRESET_CRON_MAP,
  UpsertAutopilotScheduleDto,
} from '../../ai-autopilot/dto/autopilot-schedule.dto';

@Injectable()
export class AdminAutopilotScheduleService {
  constructor(private readonly scheduler: AIAutopilotSchedulerService) {}

  getPresets() {
    return (Object.keys(AutopilotSchedulePreset) as Array<keyof typeof AutopilotSchedulePreset>).map(
      (key) => {
        const value = AutopilotSchedulePreset[key];
        return {
          preset: value,
          label: this.presetLabel(value),
          cron: PRESET_CRON_MAP[value] || '(custom)',
          isCustom: value === AutopilotSchedulePreset.CUSTOM,
        };
      },
    );
  }

  getLiveSchedules() {
    return this.scheduler.getActiveSchedules();
  }

  listSchedules(organizationId?: string) {
    return this.scheduler.listConfiguredSchedules(organizationId);
  }

  upsertSchedule(dto: UpsertAutopilotScheduleDto) {
    return this.scheduler.upsertSchedule(dto);
  }

  deleteSchedule(organizationId: string) {
    return this.scheduler.deleteSchedule(organizationId);
  }

  private presetLabel(preset: AutopilotSchedulePreset): string {
    const labels: Record<AutopilotSchedulePreset, string> = {
      [AutopilotSchedulePreset.EVERY_15_MIN]: 'Every 15 minutes',
      [AutopilotSchedulePreset.EVERY_30_MIN]: 'Every 30 minutes',
      [AutopilotSchedulePreset.HOURLY]: 'Every hour',
      [AutopilotSchedulePreset.EVERY_2H]: 'Every 2 hours',
      [AutopilotSchedulePreset.EVERY_6H]: 'Every 6 hours',
      [AutopilotSchedulePreset.EVERY_12H]: 'Every 12 hours',
      [AutopilotSchedulePreset.DAILY_MIDNIGHT]: 'Daily at midnight',
      [AutopilotSchedulePreset.DAILY_8AM]: 'Daily at 8 AM',
      [AutopilotSchedulePreset.DAILY_NOON]: 'Daily at noon',
      [AutopilotSchedulePreset.WEEKLY_MONDAY]: 'Weekly — Monday 8 AM',
      [AutopilotSchedulePreset.CUSTOM]: 'Custom cron expression',
    };
    return labels[preset] ?? preset;
  }
}
