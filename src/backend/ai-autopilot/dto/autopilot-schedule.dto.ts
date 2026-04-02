import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export enum AutopilotSchedulePreset {
  EVERY_15_MIN = 'every_15_min',
  EVERY_30_MIN = 'every_30_min',
  HOURLY = 'hourly',
  EVERY_2H = 'every_2h',
  EVERY_6H = 'every_6h',
  EVERY_12H = 'every_12h',
  DAILY_MIDNIGHT = 'daily_midnight',
  DAILY_8AM = 'daily_8am',
  DAILY_NOON = 'daily_noon',
  WEEKLY_MONDAY = 'weekly_monday',
  CUSTOM = 'custom',
}

export const PRESET_CRON_MAP: Record<AutopilotSchedulePreset, string> = {
  [AutopilotSchedulePreset.EVERY_15_MIN]: '*/15 * * * *',
  [AutopilotSchedulePreset.EVERY_30_MIN]: '*/30 * * * *',
  [AutopilotSchedulePreset.HOURLY]: '0 * * * *',
  [AutopilotSchedulePreset.EVERY_2H]: '0 */2 * * *',
  [AutopilotSchedulePreset.EVERY_6H]: '0 */6 * * *',
  [AutopilotSchedulePreset.EVERY_12H]: '0 */12 * * *',
  [AutopilotSchedulePreset.DAILY_MIDNIGHT]: '0 0 * * *',
  [AutopilotSchedulePreset.DAILY_8AM]: '0 8 * * *',
  [AutopilotSchedulePreset.DAILY_NOON]: '0 12 * * *',
  [AutopilotSchedulePreset.WEEKLY_MONDAY]: '0 8 * * 1',
  [AutopilotSchedulePreset.CUSTOM]: '',
};

export class UpsertAutopilotScheduleDto {
  @IsString()
  organizationId: string;

  @IsOptional()
  @IsString()
  policyId?: string;

  @IsEnum(AutopilotSchedulePreset)
  preset: AutopilotSchedulePreset;

  @IsOptional()
  @IsString()
  customCron?: string;

  @IsBoolean()
  enabled: boolean;
}
