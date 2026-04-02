import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../database/prisma.service';
import { AIAutopilotService } from './ai-autopilot.service';
import {
  PRESET_CRON_MAP,
  AutopilotSchedulePreset,
  UpsertAutopilotScheduleDto,
} from './dto/autopilot-schedule.dto';

export interface ActiveScheduleSummary {
  organizationId: string;
  policyId?: string;
  preset: AutopilotSchedulePreset;
  cron: string;
  enabled: boolean;
  jobName: string;
  nextRun?: Date | null;
}

@Injectable()
export class AIAutopilotSchedulerService {
  private readonly logger = new Logger(AIAutopilotSchedulerService.name);
  private readonly JOB_PREFIX = 'autopilot:org:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly autopilotService: AIAutopilotService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    await this.restoreSchedules();
  }

  async upsertSchedule(dto: UpsertAutopilotScheduleDto): Promise<ActiveScheduleSummary> {
    const cron = dto.preset === AutopilotSchedulePreset.CUSTOM
      ? (dto.customCron ?? '0 */6 * * *')
      : PRESET_CRON_MAP[dto.preset];

    if (!cron) {
      throw new Error('Invalid cron expression — provide customCron when using preset CUSTOM.');
    }

    const jobName = `${this.JOB_PREFIX}${dto.organizationId}`;
    this.removeSafe(jobName);

    await this.prisma.analyticsEvent.create({
      data: {
        organizationId: dto.organizationId,
        userId: 'system',
        eventType: 'autopilot.schedule.upserted',
        properties: JSON.stringify({
          organizationId: dto.organizationId,
          policyId: dto.policyId,
          preset: dto.preset,
          cron,
          enabled: dto.enabled,
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    if (dto.enabled) {
      this.registerJob(jobName, cron, dto.organizationId, dto.policyId ?? undefined);
    }

    const job = this.getJobSafe(jobName);

    return {
      organizationId: dto.organizationId,
      policyId: dto.policyId,
      preset: dto.preset,
      cron,
      enabled: dto.enabled,
      jobName,
      nextRun: job?.nextDate()?.toJSDate() ?? null,
    };
  }

  async deleteSchedule(organizationId: string): Promise<void> {
    this.removeSafe(`${this.JOB_PREFIX}${organizationId}`);

    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId: 'system',
        eventType: 'autopilot.schedule.deleted',
        properties: JSON.stringify({ organizationId, deletedAt: new Date().toISOString() }),
      },
    });
  }

  getActiveSchedules(): ActiveScheduleSummary[] {
    const summaries: ActiveScheduleSummary[] = [];

    const jobs = this.schedulerRegistry.getCronJobs();
    for (const [name, job] of jobs.entries()) {
      if (!name.startsWith(this.JOB_PREFIX)) continue;
      const orgId = name.replace(this.JOB_PREFIX, '');
      summaries.push({
        organizationId: orgId,
        preset: AutopilotSchedulePreset.CUSTOM,
        cron: job.cronTime?.source as string ?? '',
        enabled: job.running ?? false,
        jobName: name,
        nextRun: job.nextDate()?.toJSDate() ?? null,
      });
    }

    return summaries;
  }

  getScheduleForOrg(organizationId: string): ActiveScheduleSummary | null {
    const job = this.getJobSafe(`${this.JOB_PREFIX}${organizationId}`);
    if (!job) return null;

    return {
      organizationId,
      preset: AutopilotSchedulePreset.CUSTOM,
      cron: job.cronTime?.source as string ?? '',
      enabled: job.running ?? false,
      jobName: `${this.JOB_PREFIX}${organizationId}`,
      nextRun: job.nextDate()?.toJSDate() ?? null,
    };
  }

  async listConfiguredSchedules(organizationId?: string) {
    const where = organizationId
      ? { organizationId, eventType: 'autopilot.schedule.upserted' }
      : { eventType: 'autopilot.schedule.upserted' };

    const events = await this.prisma.analyticsEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 500,
    });

    // deduplicate — keep only latest per org
    const seen = new Set<string>();
    const result: Array<Record<string, unknown>> = [];

    for (const event of events) {
      if (seen.has(event.organizationId)) continue;
      seen.add(event.organizationId);

      const data = this.parse(event.properties);
      const job = this.getJobSafe(`${this.JOB_PREFIX}${event.organizationId}`);

      result.push({
        ...data,
        id: event.id,
        updatedAt: event.timestamp,
        liveStatus: job ? (job.running ? 'running' : 'stopped') : 'not_loaded',
        nextRun: job?.nextDate()?.toJSDate() ?? null,
      });
    }

    return result;
  }

  // ─── internals ───────────────────────────────────────────────────────────────

  private registerJob(jobName: string, cron: string, organizationId: string, policyId?: string) {
    const job = new CronJob(cron, async () => {
      this.logger.log(`Scheduled autopilot run for org ${organizationId} (job: ${jobName})`);
      try {
        const run = await this.autopilotService.triggerRun(organizationId, 'system', {
          policyId,
          reason: 'scheduled',
        });
        this.logger.log(`Autopilot run queued: ${run.runId}`);
      } catch (err) {
        this.logger.error(`Scheduled autopilot failed for org ${organizationId}`, err);
      }
    });

    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();
    this.logger.log(`Registered autopilot cron [${jobName}] with pattern [${cron}]`);
  }

  private removeSafe(jobName: string) {
    try {
      this.schedulerRegistry.deleteCronJob(jobName);
    } catch {
      // not present — safe to ignore
    }
  }

  private getJobSafe(jobName: string): CronJob | null {
    try {
      return this.schedulerRegistry.getCronJob(jobName);
    } catch {
      return null;
    }
  }

  private async restoreSchedules() {
    const events = await this.prisma.analyticsEvent.findMany({
      where: { eventType: 'autopilot.schedule.upserted' },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    const seen = new Set<string>();
    let restored = 0;

    for (const event of events) {
      if (seen.has(event.organizationId)) continue;
      seen.add(event.organizationId);

      const data = this.parse(event.properties);
      if (!data.enabled || !data.cron) continue;

      const jobName = `${this.JOB_PREFIX}${event.organizationId}`;
      this.registerJob(jobName, data.cron as string, event.organizationId, data.policyId as string | undefined);
      restored++;
    }

    if (restored > 0) {
      this.logger.log(`Restored ${restored} autopilot schedule(s) from event log.`);
    }
  }

  private parse(raw?: string | null): Record<string, any> {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
}
