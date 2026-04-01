import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SocialPlatform } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  BlackoutWindowDto,
  SchedulePreviewDto,
  UpdateSchedulingPolicyDto,
} from '../dto/social.dto';
import { OptimalTimeService } from './optimal-time.service';

interface SchedulingPolicy {
  timezone: string;
  minimumLeadMinutes: number;
  blackoutWindows: BlackoutWindowDto[];
}

@Injectable()
export class SchedulingPolicyService {
  private readonly logger = new Logger(SchedulingPolicyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly optimalTime: OptimalTimeService,
  ) {}

  async getPolicy(orgId: string): Promise<SchedulingPolicy> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        metadata: true,
        tenantOnboarding: {
          select: { defaultTimezone: true },
        },
      },
    });

    const metadata = this.parseMetadata(organization?.metadata);
    const rawPolicy = metadata['socialScheduler'];
    const fallbackTimezone = organization?.tenantOnboarding?.defaultTimezone ?? 'UTC';

    return {
      timezone: this.resolveTimezone(
        typeof rawPolicy?.timezone === 'string' ? rawPolicy.timezone : fallbackTimezone,
      ),
      minimumLeadMinutes:
        typeof rawPolicy?.minimumLeadMinutes === 'number'
          ? Math.max(0, rawPolicy.minimumLeadMinutes)
          : 15,
      blackoutWindows: this.normalizeBlackoutWindows(rawPolicy?.blackoutWindows),
    };
  }

  async updatePolicy(orgId: string, dto: UpdateSchedulingPolicyDto): Promise<SchedulingPolicy> {
    const current = await this.getPolicy(orgId);
    const next: SchedulingPolicy = {
      timezone: dto.timezone ? this.resolveTimezone(dto.timezone) : current.timezone,
      minimumLeadMinutes:
        dto.minimumLeadMinutes !== undefined
          ? Math.max(0, dto.minimumLeadMinutes)
          : current.minimumLeadMinutes,
      blackoutWindows:
        dto.blackoutWindows !== undefined
          ? this.normalizeBlackoutWindows(dto.blackoutWindows)
          : current.blackoutWindows,
    };

    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { metadata: true },
    });

    const metadata = this.parseMetadata(organization?.metadata);
    metadata['socialScheduler'] = next;

    await this.prisma.organization.update({
      where: { id: orgId },
      data: { metadata: JSON.stringify(metadata) },
    });

    this.logger.log(`Updated social scheduling policy for org ${orgId}`);
    return next;
  }

  async validateScheduledAt(orgId: string, scheduledAt: Date): Promise<void> {
    const policy = await this.getPolicy(orgId);
    const now = Date.now();
    const minimumAllowed = now + policy.minimumLeadMinutes * 60_000;

    if (scheduledAt.getTime() < minimumAllowed) {
      throw new BadRequestException(
        `Scheduled time must be at least ${policy.minimumLeadMinutes} minutes in the future.`,
      );
    }

    const blackout = this.findMatchingBlackoutWindow(scheduledAt, policy);
    if (blackout) {
      throw new BadRequestException(
        `Scheduled time falls inside blackout window "${blackout.name}" in timezone ${policy.timezone}.`,
      );
    }
  }

  async previewSchedule(orgId: string, dto: SchedulePreviewDto) {
    const policy = await this.getPolicy(orgId);
    const count = dto.count ?? 5;
    const after = dto.after ? new Date(dto.after) : new Date();
    const platforms = await this.resolvePlatforms(orgId, dto);

    const previews = await Promise.all(
      platforms.map(async (platform) => {
        const candidates = await this.optimalTime.getRecommendedSlots(
          orgId,
          platform,
          count * 4,
          after,
        );

        const slots = candidates
          .filter((candidate) => this.isAllowed(candidate, policy))
          .slice(0, count)
          .map((candidate) => ({
            utcIso: candidate.toISOString(),
            localDisplay: this.formatInTimezone(candidate, policy.timezone),
            timezone: policy.timezone,
          }));

        return { platform, slots };
      }),
    );

    return {
      timezone: policy.timezone,
      minimumLeadMinutes: policy.minimumLeadMinutes,
      blackoutWindows: policy.blackoutWindows,
      generatedAt: new Date().toISOString(),
      previews,
    };
  }

  private async resolvePlatforms(orgId: string, dto: SchedulePreviewDto): Promise<SocialPlatform[]> {
    if (dto.platforms?.length) {
      return Array.from(new Set(dto.platforms));
    }

    if (dto.accountIds?.length) {
      const accounts = await this.prisma.socialAccount.findMany({
        where: {
          id: { in: dto.accountIds },
          organizationId: orgId,
        },
        select: { platform: true },
      });

      return Array.from(new Set(accounts.map((account) => account.platform)));
    }

    const accounts = await this.prisma.socialAccount.findMany({
      where: { organizationId: orgId, isActive: true },
      select: { platform: true },
      distinct: ['platform'],
    });

    return accounts.map((account) => account.platform);
  }

  private isAllowed(date: Date, policy: SchedulingPolicy): boolean {
    const minimumAllowed = Date.now() + policy.minimumLeadMinutes * 60_000;
    if (date.getTime() < minimumAllowed) {
      return false;
    }

    return !this.findMatchingBlackoutWindow(date, policy);
  }

  private findMatchingBlackoutWindow(
    date: Date,
    policy: SchedulingPolicy,
  ): BlackoutWindowDto | null {
    const local = this.getLocalParts(date, policy.timezone);
    const previousDay = (local.dayOfWeek + 6) % 7;

    for (const window of policy.blackoutWindows) {
      const start = this.toMinutes(window.startTime);
      const end = this.toMinutes(window.endTime);

      if (start <= end) {
        if (window.daysOfWeek.includes(local.dayOfWeek) && local.minutes >= start && local.minutes < end) {
          return window;
        }
        continue;
      }

      if (window.daysOfWeek.includes(local.dayOfWeek) && local.minutes >= start) {
        return window;
      }

      if (window.daysOfWeek.includes(previousDay) && local.minutes < end) {
        return window;
      }
    }

    return null;
  }

  private getLocalParts(date: Date, timeZone: string): { dayOfWeek: number; minutes: number } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Sun';
    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    return {
      dayOfWeek: dayMap[weekday] ?? 0,
      minutes: hour * 60 + minute,
    };
  }

  private normalizeBlackoutWindows(input: unknown): BlackoutWindowDto[] {
    if (!Array.isArray(input)) return [];

    return input
      .filter((item): item is BlackoutWindowDto => !!item && typeof item === 'object')
      .map((item) => ({
        name: typeof item.name === 'string' ? item.name : 'Blackout Window',
        daysOfWeek: Array.isArray(item.daysOfWeek)
          ? item.daysOfWeek.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6)
          : [],
        startTime: typeof item.startTime === 'string' ? item.startTime : '00:00',
        endTime: typeof item.endTime === 'string' ? item.endTime : '00:00',
      }))
      .filter((item) => item.daysOfWeek.length > 0 && this.isTime(item.startTime) && this.isTime(item.endTime));
  }

  private parseMetadata(metadata: string | null | undefined): Record<string, any> {
    if (!metadata) return {};

    try {
      const parsed = JSON.parse(metadata);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private resolveTimezone(timezone: string): string {
    try {
      Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
      return timezone;
    } catch {
      throw new BadRequestException(`Invalid IANA timezone: ${timezone}`);
    }
  }

  private formatInTimezone(date: Date, timeZone: string): string {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  private isTime(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }
}