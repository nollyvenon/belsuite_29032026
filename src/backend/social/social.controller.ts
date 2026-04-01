/**
 * Social Media Scheduler Controller
 * Base path: /api/social
 *
 * Groups:
 *  - /accounts          Social account management & OAuth
 *  - /posts             Scheduled post CRUD
 *  - /bulk              Bulk post batches
 *  - /ai                AI content generation
 *  - /optimal-times     Posting time recommendations
 *  - /calendar          Calendar view
 *  - /oauth/callback    Platform OAuth redirect (no auth guard)
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { SocialPlatform } from '@prisma/client';

// Auth imports — pulled from the common guards/decorators used by the video module
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

// Services
import { SocialAccountService } from './services/social-account.service';
import { PostSchedulerService } from './services/post-scheduler.service';
import { BulkPostService } from './services/bulk-post.service';
import { AutoCreatorService } from './services/auto-creator.service';
import { OptimalTimeService } from './services/optimal-time.service';
import { RetryDashboardService } from './services/retry-dashboard.service';

// DTOs
import {
  ConnectAccountDto,
  CreatePostDto,
  UpdatePostDto,
  BulkCreateDto,
  AutoCreatorDto,
  GenerateCaptionDto,
  RescheduleDto,
  ListPostsQueryDto,
  UpdateSchedulingPolicyDto,
  SchedulePreviewDto,
} from './dto/social.dto';
import { SchedulingPolicyService } from './services/scheduling-policy.service';

interface AuthUser {
  id: string;
  orgId: string;
  sub?: string;
}

@Controller('api/social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(
    private readonly accounts: SocialAccountService,
    private readonly scheduler: PostSchedulerService,
    private readonly bulk: BulkPostService,
    private readonly creator: AutoCreatorService,
    private readonly optimalTimes: OptimalTimeService,
    private readonly retryDashboard: RetryDashboardService,
    private readonly schedulingPolicy: SchedulingPolicyService,
  ) {}

  // ── Accounts ──────────────────────────────────────────────────────────────

  @Get('accounts')
  listAccounts(@CurrentUser() user: AuthUser) {
    return this.accounts.listAccounts(user.orgId);
  }

  @Post('accounts/connect')
  connectAccount(
    @CurrentUser() user: AuthUser,
    @Body() dto: ConnectAccountDto,
  ) {
    return this.accounts.connectAccount(
      user.orgId,
      user.id ?? user.sub ?? '',
      dto.platform,
      dto.code,
      dto.redirectUri,
    );
  }

  @Delete('accounts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  disconnectAccount(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.accounts.disconnectAccount(user.orgId, id);
  }

  /**
   * Returns the OAuth authorization URL for the given platform.
   * The caller should redirect the browser to this URL.
   * State is base64-encoded JSON: { orgId, userId, redirectUri }
   */
  @Get('accounts/:platform/oauth-url')
  getOAuthUrl(
    @CurrentUser() user: AuthUser,
    @Param('platform') platform: SocialPlatform,
    @Query('redirectUri') redirectUri: string,
  ) {
    if (!redirectUri) {
      throw new BadRequestException('redirectUri query parameter is required');
    }

    const state = Buffer.from(
      JSON.stringify({
        orgId: user.orgId,
        userId: user.id ?? user.sub,
        redirectUri,
      }),
    ).toString('base64url');

    const url = this.accounts.getOAuthUrl(platform, redirectUri, state);
    return { url };
  }

  // ── Posts ─────────────────────────────────────────────────────────────────

  @Get('posts')
  listPosts(
    @CurrentUser() user: AuthUser,
    @Query() query: ListPostsQueryDto,
  ) {
    return this.scheduler.listPosts(user.orgId, query);
  }

  @Post('posts')
  createPost(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePostDto,
  ) {
    return this.scheduler.createPost(user.orgId, user.id ?? user.sub ?? '', dto);
  }

  @Get('posts/:id')
  getPost(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.scheduler.getPost(user.orgId, id);
  }

  @Patch('posts/:id')
  updatePost(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.scheduler.updatePost(user.orgId, id, dto);
  }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelPost(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.scheduler.cancelPost(user.orgId, id);
  }

  @Patch('posts/:id/reschedule')
  reschedule(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RescheduleDto,
  ) {
    return this.scheduler.reschedule(user.orgId, id, dto);
  }

  // ── Bulk ──────────────────────────────────────────────────────────────────

  @Post('bulk')
  createBulk(
    @CurrentUser() user: AuthUser,
    @Body() dto: BulkCreateDto,
  ) {
    return this.bulk.createBulk(user.orgId, user.id ?? user.sub ?? '', dto);
  }

  @Get('bulk')
  listBatches(@CurrentUser() user: AuthUser) {
    return this.bulk.listBatches(user.orgId);
  }

  @Get('bulk/:id')
  getBatch(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bulk.getBatch(user.orgId, id);
  }

  // ── AI ────────────────────────────────────────────────────────────────────

  @Post('ai/generate')
  generateAndSchedule(
    @CurrentUser() user: AuthUser,
    @Body() dto: AutoCreatorDto,
  ) {
    return this.creator.generateAndSchedule(
      user.orgId,
      user.id ?? user.sub ?? '',
      dto,
    );
  }

  @Post('ai/caption')
  generateCaption(@Body() dto: GenerateCaptionDto) {
    return this.creator.generateCaption(dto.content, dto.platform, dto.tone);
  }

  // ── Optimal times ─────────────────────────────────────────────────────────

  @Get('optimal-times/:platform')
  getRecommendedSlots(
    @CurrentUser() user: AuthUser,
    @Param('platform') platform: SocialPlatform,
    @Query('count') count?: string,
  ) {
    const n = count ? parseInt(count, 10) : 5;
    return this.optimalTimes.getRecommendedSlots(user.orgId, platform, n);
  }

  // ── Calendar ──────────────────────────────────────────────────────────────

  @Get('calendar')
  getCalendar(
    @CurrentUser() user: AuthUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!from || !to) {
      throw new BadRequestException('"from" and "to" query parameters are required');
    }

    return this.scheduler.getCalendar(
      user.orgId,
      new Date(from),
      new Date(to),
    );
  }

  // ── Scheduler policy ─────────────────────────────────────────────────────

  @Get('settings/scheduling')
  getSchedulingPolicy(@CurrentUser() user: AuthUser) {
    return this.schedulingPolicy.getPolicy(user.orgId);
  }

  @Patch('settings/scheduling')
  updateSchedulingPolicy(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateSchedulingPolicyDto,
  ) {
    return this.schedulingPolicy.updatePolicy(user.orgId, dto);
  }

  @Post('schedule/preview')
  previewSchedule(
    @CurrentUser() user: AuthUser,
    @Body() dto: SchedulePreviewDto,
  ) {
    return this.schedulingPolicy.previewSchedule(user.orgId, dto);
  }

  // ── Retry dashboard ───────────────────────────────────────────────────────

  /** List all failed publish results for the org, with post context. */
  @Get('failed')
  listFailedResults(@CurrentUser() user: AuthUser) {
    return this.retryDashboard.listFailed(user.orgId);
  }

  /** Manually trigger a retry for a specific PostPublishResult. */
  @Post('failed/:resultId/retry')
  @HttpCode(HttpStatus.NO_CONTENT)
  retryResult(
    @CurrentUser() user: AuthUser,
    @Param('resultId') resultId: string,
  ) {
    return this.retryDashboard.manualRetry(user.orgId, resultId);
  }

  /** Dismiss / mark as acknowledged a failed result. */
  @Delete('failed/:resultId')
  @HttpCode(HttpStatus.NO_CONTENT)
  dismissResult(
    @CurrentUser() user: AuthUser,
    @Param('resultId') resultId: string,
  ) {
    return this.retryDashboard.dismiss(user.orgId, resultId);
  }

  /** Publishing stats summary for the org. */
  @Get('stats')
  getStats(@CurrentUser() user: AuthUser) {
    return this.retryDashboard.getStats(user.orgId);
  }

  // ── WhatsApp recipients ───────────────────────────────────────────────────

  /** Get recipients list stored in a WhatsApp account's metadata. */
  @Get('accounts/:id/whatsapp-recipients')
  getWhatsAppRecipients(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.accounts.getWhatsAppRecipients(user.orgId, id);
  }

  /** Update the recipients list for a WhatsApp account. Body: { recipients: string[] } */
  @Patch('accounts/:id/whatsapp-recipients')
  updateWhatsAppRecipients(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('recipients') recipients: string[],
  ) {
    if (!Array.isArray(recipients)) {
      throw new BadRequestException('recipients must be an array of E.164 phone numbers');
    }
    return this.accounts.setWhatsAppRecipients(user.orgId, id, recipients);
  }

  // ── OAuth callback (no auth guard — called by platform redirect) ──────────

  /**
   * Handles the OAuth redirect from social platforms.
   * State param: base64url-encoded JSON with orgId, userId, redirectUri.
   * On success: redirects to {redirectUri}?success=true&platform={platform}
   * On failure: redirects to {redirectUri}?error={message}
   */
  @Get('oauth/callback/:platform')
  @UseGuards() // Override class-level guard — no auth needed here
  async handleOAuthCallback(
    @Param('platform') platform: SocialPlatform,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    let redirectUri = '/';

    try {
      if (!state) throw new Error('Missing state parameter');

      const decoded = JSON.parse(
        Buffer.from(state, 'base64url').toString('utf8'),
      ) as { orgId: string; userId: string; redirectUri: string };

      redirectUri = decoded.redirectUri;

      if (error) {
        throw new Error(error);
      }

      if (!code) throw new Error('Missing authorization code');

      await this.accounts.connectAccount(
        decoded.orgId,
        decoded.userId,
        platform,
        code,
        decoded.redirectUri,
      );

      return res.redirect(
        `${redirectUri}?success=true&platform=${platform}`,
      );
    } catch (err) {
      const msg = encodeURIComponent((err as Error).message ?? 'OAuth failed');
      return res.redirect(`${redirectUri}?error=${msg}`);
    }
  }
}
