/**
 * Optimal Time Service
 * Recommends the best times to post on each social platform based on
 * organisation-specific analytics data, falling back to research-backed defaults.
 */

import { Injectable, Logger } from '@nestjs/common';
import { SocialPlatform } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

/** EST offset from UTC is 5 hours (UTC+5), so 9am EST = 14:00 UTC */

interface DefaultSlot {
  dayOfWeek: number; // 0=Sun … 6=Sat
  hour: number;      // UTC hour
  score: number;
}

// Research-backed default posting times (all times converted to UTC from EST)
const PLATFORM_DEFAULTS: Record<SocialPlatform, DefaultSlot[]> = {
  [SocialPlatform.INSTAGRAM]: [
    // Tue (2), Wed (3), Fri (5) at 9am, 11am, 1pm EST → +5h UTC
    { dayOfWeek: 2, hour: 14, score: 0.92 },
    { dayOfWeek: 2, hour: 16, score: 0.88 },
    { dayOfWeek: 2, hour: 18, score: 0.85 },
    { dayOfWeek: 3, hour: 14, score: 0.91 },
    { dayOfWeek: 3, hour: 16, score: 0.87 },
    { dayOfWeek: 3, hour: 18, score: 0.84 },
    { dayOfWeek: 5, hour: 14, score: 0.90 },
    { dayOfWeek: 5, hour: 16, score: 0.86 },
    { dayOfWeek: 5, hour: 18, score: 0.83 },
  ],
  [SocialPlatform.FACEBOOK]: [
    // Wed 11am, 1pm; Tue/Thu 9am EST → UTC
    { dayOfWeek: 3, hour: 16, score: 0.93 },
    { dayOfWeek: 3, hour: 18, score: 0.91 },
    { dayOfWeek: 2, hour: 14, score: 0.88 },
    { dayOfWeek: 4, hour: 14, score: 0.87 },
  ],
  [SocialPlatform.TWITTER]: [
    // Mon-Fri 8am, 12pm, 5pm EST → UTC
    { dayOfWeek: 1, hour: 13, score: 0.87 },
    { dayOfWeek: 1, hour: 17, score: 0.86 },
    { dayOfWeek: 1, hour: 22, score: 0.84 },
    { dayOfWeek: 2, hour: 13, score: 0.89 },
    { dayOfWeek: 2, hour: 17, score: 0.88 },
    { dayOfWeek: 2, hour: 22, score: 0.85 },
    { dayOfWeek: 3, hour: 13, score: 0.90 },
    { dayOfWeek: 3, hour: 17, score: 0.89 },
    { dayOfWeek: 3, hour: 22, score: 0.86 },
    { dayOfWeek: 4, hour: 13, score: 0.88 },
    { dayOfWeek: 4, hour: 17, score: 0.87 },
    { dayOfWeek: 4, hour: 22, score: 0.85 },
    { dayOfWeek: 5, hour: 13, score: 0.86 },
    { dayOfWeek: 5, hour: 17, score: 0.85 },
    { dayOfWeek: 5, hour: 22, score: 0.82 },
  ],
  [SocialPlatform.TIKTOK]: [
    // Tue/Thu 7am, 9am; Fri 5pm EST → UTC
    { dayOfWeek: 2, hour: 12, score: 0.91 },
    { dayOfWeek: 2, hour: 14, score: 0.89 },
    { dayOfWeek: 4, hour: 12, score: 0.90 },
    { dayOfWeek: 4, hour: 14, score: 0.88 },
    { dayOfWeek: 5, hour: 22, score: 0.87 },
  ],
  [SocialPlatform.LINKEDIN]: [
    // Tue/Wed/Thu 8am, 12pm EST → UTC
    { dayOfWeek: 2, hour: 13, score: 0.92 },
    { dayOfWeek: 2, hour: 17, score: 0.90 },
    { dayOfWeek: 3, hour: 13, score: 0.93 },
    { dayOfWeek: 3, hour: 17, score: 0.91 },
    { dayOfWeek: 4, hour: 13, score: 0.91 },
    { dayOfWeek: 4, hour: 17, score: 0.89 },
  ],
  [SocialPlatform.PINTEREST]: [
    // Best times: Sat/Sun evenings; Fri noon; weekday evenings 8-11pm EST → UTC
    // Pinterest users are most active in evenings and weekends (DIY, recipes, fashion)
    { dayOfWeek: 6, hour: 0,  score: 0.94 }, // Sat 8pm EST
    { dayOfWeek: 6, hour: 1,  score: 0.93 }, // Sat 9pm EST
    { dayOfWeek: 0, hour: 0,  score: 0.92 }, // Sun 8pm EST
    { dayOfWeek: 0, hour: 1,  score: 0.91 }, // Sun 9pm EST
    { dayOfWeek: 5, hour: 17, score: 0.90 }, // Fri 1pm EST
    { dayOfWeek: 2, hour: 1,  score: 0.88 }, // Tue 9pm EST
    { dayOfWeek: 3, hour: 1,  score: 0.87 }, // Wed 9pm EST
    { dayOfWeek: 4, hour: 1,  score: 0.86 }, // Thu 9pm EST
  ],
  [SocialPlatform.WHATSAPP]: [
    // WhatsApp message open rates are highest mid-morning and evening
    // Users in various timezones — UTC times represent a global average
    { dayOfWeek: 1, hour: 9,  score: 0.88 }, // Mon 9am UTC
    { dayOfWeek: 1, hour: 18, score: 0.87 }, // Mon 6pm UTC
    { dayOfWeek: 2, hour: 9,  score: 0.89 }, // Tue 9am UTC
    { dayOfWeek: 2, hour: 18, score: 0.88 }, // Tue 6pm UTC
    { dayOfWeek: 3, hour: 9,  score: 0.90 }, // Wed 9am UTC
    { dayOfWeek: 3, hour: 18, score: 0.89 }, // Wed 6pm UTC
    { dayOfWeek: 4, hour: 9,  score: 0.88 }, // Thu 9am UTC
    { dayOfWeek: 4, hour: 18, score: 0.87 }, // Thu 6pm UTC
    { dayOfWeek: 5, hour: 10, score: 0.85 }, // Fri 10am UTC
    { dayOfWeek: 6, hour: 10, score: 0.83 }, // Sat 10am UTC
  ],
};

@Injectable()
export class OptimalTimeService {
  private readonly logger = new Logger(OptimalTimeService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Returns the best posting time for the given platform on or after targetDate.
   * Falls back to platform defaults if no org-specific data exists.
   */
  async getOptimalTime(
    orgId: string,
    platform: SocialPlatform,
    targetDate?: Date,
  ): Promise<Date> {
    const slots = await this.getRecommendedSlots(orgId, platform, 1, targetDate);
    return slots[0] ?? this.getNextDefaultSlot(platform, targetDate ?? new Date());
  }

  /**
   * Returns the top N upcoming optimal posting slots for the platform.
   */
  async getRecommendedSlots(
    orgId: string,
    platform: SocialPlatform,
    count = 5,
    after?: Date,
  ): Promise<Date[]> {
    const fromDate = after ?? new Date();

    const dbSlots = await this.prisma.optimalPostingTime.findMany({
      where: { organizationId: orgId, platform },
      orderBy: { score: 'desc' },
      take: count * 2, // fetch extra to filter past
    });

    const slots = dbSlots.length
      ? dbSlots
      : PLATFORM_DEFAULTS[platform].sort((a, b) => b.score - a.score);

    const result: Date[] = [];
    const checked = new Set<string>();
    let daysAhead = 0;

    while (result.length < count && daysAhead < 14) {
      const checkDate = new Date(fromDate);
      checkDate.setDate(checkDate.getDate() + daysAhead);
      const dayOfWeek = checkDate.getUTCDay();

      for (const slot of slots) {
        if (slot.dayOfWeek !== dayOfWeek) continue;

        const candidate = new Date(
          Date.UTC(
            checkDate.getUTCFullYear(),
            checkDate.getUTCMonth(),
            checkDate.getUTCDate(),
            slot.hour,
            0,
            0,
            0,
          ),
        );

        const key = candidate.toISOString();
        if (candidate > fromDate && !checked.has(key)) {
          checked.add(key);
          result.push(candidate);
          if (result.length >= count) break;
        }
      }

      daysAhead++;
    }

    return result;
  }

  /**
   * Upsert optimal posting time scores from analytics data.
   */
  async updateOptimalTimes(
    orgId: string,
    platform: SocialPlatform,
    analyticsData: Array<{ dayOfWeek: number; hour: number; score: number }>,
  ): Promise<void> {
    await Promise.all(
      analyticsData.map((d) =>
        this.prisma.optimalPostingTime.upsert({
          where: {
            organizationId_platform_dayOfWeek_hour: {
              organizationId: orgId,
              platform,
              dayOfWeek: d.dayOfWeek,
              hour: d.hour,
            },
          },
          create: {
            organizationId: orgId,
            platform,
            dayOfWeek: d.dayOfWeek,
            hour: d.hour,
            score: d.score,
          },
          update: { score: d.score },
        }),
      ),
    );

    this.logger.log(
      `Updated ${analyticsData.length} optimal time slots for ${platform} in org ${orgId}`,
    );
  }

  /**
   * Seeds research-backed default posting times for a platform if none exist.
   */
  async seedDefaults(orgId: string, platform: SocialPlatform): Promise<void> {
    const existing = await this.prisma.optimalPostingTime.count({
      where: { organizationId: orgId, platform },
    });

    if (existing > 0) return; // Already seeded

    const defaults = PLATFORM_DEFAULTS[platform];
    await this.updateOptimalTimes(orgId, platform, defaults);
    this.logger.log(`Seeded default optimal times for ${platform} in org ${orgId}`);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private getNextDefaultSlot(platform: SocialPlatform, after: Date): Date {
    const defaults = PLATFORM_DEFAULTS[platform].sort(
      (a, b) => b.score - a.score,
    );

    for (let daysAhead = 0; daysAhead < 14; daysAhead++) {
      const checkDate = new Date(after);
      checkDate.setDate(checkDate.getDate() + daysAhead);
      const dayOfWeek = checkDate.getUTCDay();

      for (const slot of defaults) {
        if (slot.dayOfWeek !== dayOfWeek) continue;

        const candidate = new Date(
          Date.UTC(
            checkDate.getUTCFullYear(),
            checkDate.getUTCMonth(),
            checkDate.getUTCDate(),
            slot.hour,
            0,
          ),
        );

        if (candidate > after) return candidate;
      }
    }

    // Last resort: 24h from now
    return new Date(Date.now() + 86_400_000);
  }
}
