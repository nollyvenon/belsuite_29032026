import {
  Controller, Post, Get, Delete, Body, Param, Query,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { SierrAIService }            from '../services/sierra-ai.service';
import { DonnaAIService }            from '../services/donna-ai.service';
import { YouTubeAutomationService }  from '../services/youtube-automation.service';
import { SocialMediaService }        from '../services/social-media.service';
import { CalendarService }           from '../services/calendar.service';
import { TaskExecutionEngine }       from '../engine/task-execution.engine';

// ── Sierra ─────────────────────────────────────────────────────────────────────

@Controller('assistants/sierra')
export class SierraController {
  constructor(private sierra: SierrAIService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  chat(@Body() body: any) { return this.sierra.chat(body); }

  @Post('strategy')
  @HttpCode(HttpStatus.OK)
  strategy(@Body() body: any) {
    return this.sierra.suggestStrategy(body.organizationId, body.context ?? {});
  }

  @Post('content-plan')
  @HttpCode(HttpStatus.OK)
  contentPlan(@Body() body: any) {
    return this.sierra.planContent(
      body.organizationId, body.goals, body.timeframe, body.platforms,
    );
  }

  @Post('insights')
  @HttpCode(HttpStatus.OK)
  insights(@Body() body: any) {
    return this.sierra.generateInsights(body.organizationId, body.metrics ?? {});
  }
}

// ── Donna ──────────────────────────────────────────────────────────────────────

@Controller('assistants/donna')
export class DonnaController {
  constructor(private donna: DonnaAIService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  chat(@Body() body: any) { return this.donna.chat(body); }

  @Post('workflow/design')
  @HttpCode(HttpStatus.OK)
  designWorkflow(@Body() body: any) {
    return this.donna.designWorkflow(body.organizationId, body.description, body.trigger);
  }

  @Post('workflow/execute')
  @HttpCode(HttpStatus.OK)
  executeWorkflow(@Body() body: any) {
    return this.donna.executeWorkflow(body.organizationId, body.userId, body.workflow);
  }

  @Post('campaign')
  @HttpCode(HttpStatus.OK)
  createCampaign(@Body() body: any) {
    return this.donna.createCampaign(body.organizationId, body.userId, body.spec);
  }

  @Get('campaign/:id/status')
  campaignStatus(
    @Param('id') id: string,
    @Query('organizationId') orgId: string,
  ) {
    return this.donna.getCampaignStatus(orgId, id);
  }

  @Post('tasks/prioritize')
  @HttpCode(HttpStatus.OK)
  prioritize(@Body() body: any) {
    return this.donna.prioritizeTasks(body.organizationId, body.tasks);
  }
}

// ── YouTube ────────────────────────────────────────────────────────────────────

@Controller('assistants/youtube')
export class YouTubeController {
  constructor(private yt: YouTubeAutomationService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  chat(@Body() body: any) { return this.yt.chat(body); }

  @Post('script')
  @HttpCode(HttpStatus.OK)
  generateScript(@Body() body: any) {
    return this.yt.generateScript(body.organizationId, body.spec);
  }

  @Post('seo')
  @HttpCode(HttpStatus.OK)
  optimizeSEO(@Body() body: any) {
    return this.yt.optimizeSEO(
      body.organizationId, body.jobId, body.title, body.description, body.niche,
    );
  }

  @Post('thumbnails')
  @HttpCode(HttpStatus.OK)
  thumbnails(@Body() body: any) {
    return this.yt.suggestThumbnails(
      body.organizationId, body.videoTitle, body.niche, body.style,
    );
  }

  @Post('pipeline')
  @HttpCode(HttpStatus.OK)
  pipeline(@Body() body: any) {
    return this.yt.runFullPipeline(body.organizationId, body.userId, body.spec);
  }

  @Get('jobs')
  listJobs(@Query('organizationId') orgId: string, @Query('status') status?: string) {
    return this.yt.listJobs(orgId, status);
  }

  @Get('jobs/:id')
  getJob(@Param('id') id: string, @Query('organizationId') orgId: string) {
    return this.yt.getJob(orgId, id);
  }
}

// ── Social ─────────────────────────────────────────────────────────────────────

@Controller('assistants/social')
export class SocialController {
  constructor(private social: SocialMediaService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  chat(@Body() body: any) { return this.social.chat(body); }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  generate(@Body() body: any) {
    return this.social.generatePost(
      body.organizationId, body.platform, body.topic, body.options,
    );
  }

  @Post('generate/multi-platform')
  @HttpCode(HttpStatus.OK)
  generateMulti(@Body() body: any) {
    return this.social.generateMultiPlatform(
      body.organizationId, body.topic, body.platforms, body.options,
    );
  }

  @Post('schedule')
  @HttpCode(HttpStatus.OK)
  schedule(@Body() body: any) {
    return this.social.schedulePost(body.organizationId, body.userId, body.spec);
  }

  @Post('schedule/bulk')
  @HttpCode(HttpStatus.OK)
  bulkSchedule(@Body() body: any) {
    return this.social.bulkSchedule(body.organizationId, body.userId, body.posts);
  }

  @Post('reply')
  @HttpCode(HttpStatus.OK)
  reply(@Body() body: any) {
    return this.social.generateEngagementReply(body.organizationId, body);
  }

  @Post('dm')
  @HttpCode(HttpStatus.OK)
  handleDM(@Body() body: any) {
    return this.social.handleDM(body.organizationId, body.userId, body);
  }

  @Get('queue')
  getQueue(
    @Query('organizationId') orgId: string,
    @Query('platform') platform?: string,
    @Query('status') status?: string,
  ) {
    return this.social.getQueue(orgId, { platform: platform as any, status });
  }

  @Delete('queue/:id')
  cancelPost(@Param('id') id: string, @Query('organizationId') orgId: string) {
    return this.social.cancelPost(orgId, id);
  }
}

// ── Calendar ───────────────────────────────────────────────────────────────────

@Controller('assistants/calendar')
export class CalendarController {
  constructor(private calendar: CalendarService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  chat(@Body() body: any) { return this.calendar.chat(body); }

  @Post('events')
  @HttpCode(HttpStatus.OK)
  createEvent(@Body() body: any) {
    return this.calendar.createEvent(body.organizationId, body.spec);
  }

  @Delete('events/:id')
  deleteEvent(@Param('id') id: string, @Query('organizationId') orgId: string) {
    return this.calendar.deleteEvent(orgId, id);
  }

  @Post('events/:id/reminders')
  @HttpCode(HttpStatus.OK)
  setReminders(@Param('id') id: string, @Body() body: any) {
    return this.calendar.scheduleReminder(
      body.organizationId, body.userId, id, body.reminders,
    );
  }

  @Post('campaign-timeline')
  @HttpCode(HttpStatus.OK)
  campaignTimeline(@Body() body: any) {
    return this.calendar.planCampaignTimeline(
      body.organizationId, body.userId, body.campaignId, body.campaign,
    );
  }

  @Get('upcoming')
  upcoming(
    @Query('organizationId') orgId: string,
    @Query('days') days?: string,
  ) {
    return this.calendar.getUpcoming(orgId, days ? Number(days) : 7);
  }

  @Get('range')
  range(
    @Query('organizationId') orgId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.calendar.getByDateRange(orgId, new Date(from), new Date(to));
  }

  @Get('campaign/:id')
  campaignEvents(@Param('id') id: string, @Query('organizationId') orgId: string) {
    return this.calendar.getCampaignEvents(orgId, id);
  }

  @Post('conflicts')
  @HttpCode(HttpStatus.OK)
  resolveConflicts(@Body() body: any) {
    return this.calendar.detectAndResolveConflicts(
      body.organizationId, new Date(body.from), new Date(body.to),
    );
  }
}

// ── Tasks ──────────────────────────────────────────────────────────────────────

@Controller('assistants/tasks')
export class AssistantTasksController {
  constructor(private engine: TaskExecutionEngine) {}

  @Get()
  list(
    @Query('organizationId') orgId: string,
    @Query('assistantType') type?: string,
    @Query('status') status?: string,
  ) {
    return this.engine.getOrgTasks(orgId, { assistantType: type as any, status: status as any });
  }

  @Get(':id')
  getStatus(@Param('id') id: string) { return this.engine.getStatus(id); }

  @Delete(':id')
  cancel(@Param('id') id: string) { return this.engine.cancel(id); }
}
