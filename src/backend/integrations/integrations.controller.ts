import {
  Controller, Post, Get, Delete, Body, Param, Query,
  UseGuards, Request, RawBodyRequest, Req, Headers,
  HttpCode, Res, BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard }        from '../common/guards/jwt.guard';
import { RequirePermission }   from '../common/decorators/permission.decorator';
import { OAuthService }        from './oauth/oauth.service';
import { WebhookListenerService } from './webhooks/webhook-listener.service';

// Google
import { GmailService }           from './providers/google/gmail.service';
import { GoogleCalendarService }  from './providers/google/google-calendar.service';
import { GoogleDriveService }     from './providers/google/google-drive.service';
import { GoogleSheetsService }    from './providers/google/google-sheets.service';
import { GoogleAuthService }      from './providers/google/google-auth.service';

// Social
import { FacebookService }  from './providers/social/facebook.service';
import { TwitterService }   from './providers/social/twitter.service';
import { LinkedInService }  from './providers/social/linkedin.service';
import { TikTokService }    from './providers/social/tiktok.service';

// Communication
import { WhatsAppService }  from './providers/communication/whatsapp.service';
import { TelegramService }  from './providers/communication/telegram.service';
import { SmsService }       from './providers/communication/sms.service';

// ────────────────────────────────────────────────────────────────────────────
// OAuth Auth-URL endpoints (public — no JWT)
// ────────────────────────────────────────────────────────────────────────────
@Controller('integrations')
export class IntegrationsOAuthController {
  constructor(
    private readonly gauth:    GoogleAuthService,
    private readonly facebook: FacebookService,
    private readonly twitter:  TwitterService,
    private readonly linkedin: LinkedInService,
    private readonly tiktok:   TikTokService,
  ) {}

  @Get('google/auth')
  async googleAuth(@Query('organizationId') orgId: string, @Query('userId') userId: string) {
    return this.gauth.getAuthUrl(orgId, userId);
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    await this.gauth.handleCallback(code, state);
    return res.redirect('/settings/integrations?google=connected');
  }

  @Get('facebook/auth')
  async facebookAuth(@Query('organizationId') orgId: string, @Query('userId') userId: string) {
    return this.facebook.getAuthUrl(orgId, userId);
  }

  @Get('facebook/callback')
  async facebookCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    await this.facebook.handleCallback(code, state);
    return res.redirect('/settings/integrations?facebook=connected');
  }

  @Get('twitter/auth')
  async twitterAuth(@Query('organizationId') orgId: string, @Query('userId') userId: string) {
    return this.twitter.getAuthUrl(orgId, userId);
  }

  @Get('twitter/callback')
  async twitterCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    await this.twitter.handleCallback(code, state);
    return res.redirect('/settings/integrations?twitter=connected');
  }

  @Get('linkedin/auth')
  async linkedinAuth(@Query('organizationId') orgId: string, @Query('userId') userId: string) {
    return this.linkedin.getAuthUrl(orgId, userId);
  }

  @Get('linkedin/callback')
  async linkedinCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    await this.linkedin.handleCallback(code, state);
    return res.redirect('/settings/integrations?linkedin=connected');
  }

  @Get('tiktok/auth')
  async tiktokAuth(@Query('organizationId') orgId: string, @Query('userId') userId: string) {
    return this.tiktok.getAuthUrl(orgId, userId);
  }

  @Get('tiktok/callback')
  async tiktokCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    await this.tiktok.handleCallback(code, state);
    return res.redirect('/settings/integrations?tiktok=connected');
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Webhook receivers (public — verified by provider signature)
// ────────────────────────────────────────────────────────────────────────────
@Controller('integrations/webhooks')
export class IntegrationsWebhookController {
  constructor(
    private readonly listener: WebhookListenerService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  // Facebook / Instagram webhook
  @Get('facebook')
  facebookVerify(
    @Query('hub.mode')      mode:      string,
    @Query('hub.verify_token') token:  string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.listener.verifyFacebookChallenge(mode, token, challenge);
    if (result !== null) return res.status(200).send(result);
    return res.status(403).send('Forbidden');
  }

  @Post('facebook')
  @HttpCode(200)
  async facebookEvents(@Req() req: RawBodyRequest<any>, @Headers() headers: any) {
    await this.listener.process('FACEBOOK', (req.rawBody ?? Buffer.alloc(0)).toString(), headers);
    return { ok: true };
  }

  // WhatsApp
  @Get('whatsapp')
  whatsappVerify(
    @Query('hub.mode')      mode:      string,
    @Query('hub.verify_token') token:  string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.whatsapp.verifyWebhook(mode, token, challenge);
    if (result !== null) return res.status(200).send(result);
    return res.status(403).send('Forbidden');
  }

  @Post('whatsapp')
  @HttpCode(200)
  async whatsappEvents(@Req() req: RawBodyRequest<any>, @Headers() headers: any) {
    await this.listener.process('WHATSAPP', (req.rawBody ?? Buffer.alloc(0)).toString(), headers);
    return { ok: true };
  }

  // Telegram
  @Post('telegram')
  @HttpCode(200)
  async telegramUpdate(@Req() req: RawBodyRequest<any>, @Headers() headers: any) {
    await this.listener.process('TELEGRAM', (req.rawBody ?? Buffer.alloc(0)).toString(), headers);
    return { ok: true };
  }

  // Twitter CRC
  @Get('twitter')
  async twitterCrc(@Query('crc_token') crcToken: string) {
    await this.listener.process('TWITTER', JSON.stringify({ crc_token: crcToken }), {});
    return { ok: true };
  }

  @Post('twitter')
  @HttpCode(200)
  async twitterEvents(@Req() req: RawBodyRequest<any>, @Headers() headers: any) {
    await this.listener.process('TWITTER', (req.rawBody ?? Buffer.alloc(0)).toString(), headers);
    return { ok: true };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Authenticated integration API
// ────────────────────────────────────────────────────────────────────────────
@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(
    private readonly oauth:    OAuthService,
    // Google
    private readonly gmail:    GmailService,
    private readonly gcal:     GoogleCalendarService,
    private readonly gdrive:   GoogleDriveService,
    private readonly gsheets:  GoogleSheetsService,
    // Social
    private readonly facebook: FacebookService,
    private readonly twitter:  TwitterService,
    private readonly linkedin: LinkedInService,
    private readonly tiktok:   TikTokService,
    // Comms
    private readonly whatsapp: WhatsAppService,
    private readonly telegram: TelegramService,
    private readonly sms:      SmsService,
  ) {}

  // ── Status ───────────────────────────────────────────────────────────────

  @Get()
  @RequirePermission('read:integrations')
  async listConnections(@Request() req: any) {
    const orgId = req.user.organizationId;
    const providers = ['GOOGLE', 'FACEBOOK', 'TWITTER', 'LINKEDIN', 'TIKTOK'];
    const results = await Promise.all(
      providers.map(async p => {
        const conn = await this.oauth.getConnection(orgId, p as any);
        return { provider: p, connected: !!conn, accountName: conn?.accountName };
      }),
    );
    return { data: results };
  }

  @Delete(':provider')
  @RequirePermission('manage:integrations')
  async disconnect(@Request() req: any, @Param('provider') provider: string) {
    const orgId = req.user.organizationId;
    const conn  = await this.oauth.getConnection(orgId, provider.toUpperCase() as any);
    if (!conn) throw new BadRequestException('Not connected');
    await this.oauth.revokeConnection(orgId, provider.toUpperCase() as any);
    return { ok: true };
  }

  // ── Gmail ────────────────────────────────────────────────────────────────

  @Get('gmail/messages')
  @RequirePermission('read:integrations')
  async gmailList(@Request() req: any, @Query('q') q: string, @Query('max') max: string) {
    return this.gmail.listMessages(req.user.organizationId, { query: q, maxResults: max ? +max : 20 });
  }

  @Get('gmail/messages/:id')
  @RequirePermission('read:integrations')
  async gmailGet(@Request() req: any, @Param('id') id: string) {
    return this.gmail.getMessage(req.user.organizationId, id);
  }

  @Post('gmail/send')
  @RequirePermission('use:integrations')
  async gmailSend(@Request() req: any, @Body() body: any) {
    return { messageId: await this.gmail.sendMessage(req.user.organizationId, body) };
  }

  @Post('gmail/draft')
  @RequirePermission('use:integrations')
  async gmailDraft(@Request() req: any, @Body() body: any) {
    return { draftId: await this.gmail.createDraft(req.user.organizationId, body) };
  }

  // ── Google Calendar ───────────────────────────────────────────────────────

  @Get('google-calendar/events')
  @RequirePermission('read:integrations')
  async calendarList(@Request() req: any, @Query('from') from: string, @Query('to') to: string) {
    return this.gcal.listEvents(req.user.organizationId, {
      timeMin: from ? new Date(from) : undefined,
      timeMax: to   ? new Date(to)   : undefined,
    });
  }

  @Post('google-calendar/events')
  @RequirePermission('use:integrations')
  async calendarCreate(@Request() req: any, @Body() body: any) {
    return this.gcal.createEvent(req.user.organizationId, body);
  }

  @Delete('google-calendar/events/:id')
  @RequirePermission('use:integrations')
  async calendarDelete(@Request() req: any, @Param('id') id: string) {
    await this.gcal.deleteEvent(req.user.organizationId, id);
    return { ok: true };
  }

  // ── Google Drive ──────────────────────────────────────────────────────────

  @Get('google-drive/files')
  @RequirePermission('read:integrations')
  async driveList(@Request() req: any, @Query('q') q: string) {
    return this.gdrive.listFiles(req.user.organizationId, { query: q });
  }

  @Post('google-drive/folders')
  @RequirePermission('use:integrations')
  async driveCreateFolder(@Request() req: any, @Body() body: { name: string; parentId?: string }) {
    return { folderId: await this.gdrive.createFolder(req.user.organizationId, body.name, body.parentId) };
  }

  @Delete('google-drive/files/:id')
  @RequirePermission('manage:integrations')
  async driveDelete(@Request() req: any, @Param('id') id: string) {
    await this.gdrive.deleteFile(req.user.organizationId, id);
    return { ok: true };
  }

  // ── Google Sheets ─────────────────────────────────────────────────────────

  @Post('google-sheets')
  @RequirePermission('use:integrations')
  async sheetsCreate(@Request() req: any, @Body() body: { title: string; sheets?: string[] }) {
    return { spreadsheetId: await this.gsheets.createSpreadsheet(req.user.organizationId, body.title, body.sheets) };
  }

  @Post('google-sheets/export-report')
  @RequirePermission('use:integrations')
  async sheetsExport(@Request() req: any, @Body() body: { title: string; headers: string[]; rows: any[][] }) {
    return this.gsheets.exportReport(req.user.organizationId, body.title, body.headers, body.rows);
  }

  // ── Facebook ──────────────────────────────────────────────────────────────

  @Get('facebook/pages')
  @RequirePermission('read:integrations')
  async fbPages(@Request() req: any) {
    return this.facebook.listPages(req.user.organizationId);
  }

  @Post('facebook/pages/:pageId/posts')
  @RequirePermission('use:integrations')
  async fbPost(@Request() req: any, @Param('pageId') pageId: string, @Body() body: any) {
    return this.facebook.publishPost(req.user.organizationId, pageId, body);
  }

  @Post('facebook/pages/:pageId/photos')
  @RequirePermission('use:integrations')
  async fbPhoto(@Request() req: any, @Param('pageId') pageId: string, @Body() body: any) {
    return this.facebook.publishPhoto(req.user.organizationId, pageId, body.imageUrl, body.caption);
  }

  @Get('facebook/pages/:pageId/insights/:metric')
  @RequirePermission('read:integrations')
  async fbInsights(@Request() req: any, @Param('pageId') pageId: string, @Param('metric') metric: string, @Query('period') period: string) {
    return this.facebook.getPageInsights(req.user.organizationId, pageId, metric, period);
  }

  // ── Twitter ───────────────────────────────────────────────────────────────

  @Post('twitter/tweets')
  @RequirePermission('use:integrations')
  async tweet(@Request() req: any, @Body() body: any) {
    return this.twitter.publishTweet(req.user.organizationId, body);
  }

  @Delete('twitter/tweets/:id')
  @RequirePermission('use:integrations')
  async deleteTweet(@Request() req: any, @Param('id') id: string) {
    await this.twitter.deleteTweet(req.user.organizationId, id);
    return { ok: true };
  }

  @Get('twitter/search')
  @RequirePermission('read:integrations')
  async twitterSearch(@Request() req: any, @Query('q') q: string) {
    return this.twitter.searchTweets(req.user.organizationId, q);
  }

  // ── LinkedIn ──────────────────────────────────────────────────────────────

  @Post('linkedin/posts')
  @RequirePermission('use:integrations')
  async liPost(@Request() req: any, @Body() body: any) {
    return this.linkedin.publishPost(req.user.organizationId, body, body.authorUrn);
  }

  @Get('linkedin/organizations')
  @RequirePermission('read:integrations')
  async liOrgs(@Request() req: any) {
    return this.linkedin.listOrganizations(req.user.organizationId);
  }

  // ── TikTok ────────────────────────────────────────────────────────────────

  @Get('tiktok/videos')
  @RequirePermission('read:integrations')
  async tiktokVideos(@Request() req: any) {
    return this.tiktok.listVideos(req.user.organizationId);
  }

  @Post('tiktok/videos')
  @RequirePermission('use:integrations')
  async tiktokPublish(@Request() req: any, @Body() body: any) {
    return this.tiktok.publishVideo(req.user.organizationId, body);
  }

  // ── WhatsApp ──────────────────────────────────────────────────────────────

  @Post('whatsapp/messages')
  @RequirePermission('use:integrations')
  async waSend(@Body() body: any) {
    return { messageId: await this.whatsapp.sendText(body) };
  }

  @Post('whatsapp/templates')
  @RequirePermission('use:integrations')
  async waTemplate(@Body() body: any) {
    return { messageId: await this.whatsapp.sendTemplate(body) };
  }

  @Post('whatsapp/interactive')
  @RequirePermission('use:integrations')
  async waInteractive(@Body() body: any) {
    return { messageId: await this.whatsapp.sendInteractive(body) };
  }

  // ── Telegram ──────────────────────────────────────────────────────────────

  @Post('telegram/messages')
  @RequirePermission('use:integrations')
  async tgSend(@Body() body: any) {
    return this.telegram.sendMessage(body);
  }

  @Post('telegram/broadcast')
  @RequirePermission('use:integrations')
  async tgBroadcast(@Body() body: { chatIds: (string | number)[]; text: string }) {
    return this.telegram.broadcast(body.chatIds, body.text);
  }

  @Post('telegram/webhook')
  @RequirePermission('manage:integrations')
  async tgSetWebhook(@Body() body: { webhookUrl: string; secretToken?: string }) {
    return { ok: await this.telegram.setWebhook(body.webhookUrl, body.secretToken) };
  }

  // ── SMS ───────────────────────────────────────────────────────────────────

  @Post('sms/send')
  @RequirePermission('use:integrations')
  async smsSend(@Body() body: any) {
    return this.sms.send(body);
  }

  @Post('sms/bulk')
  @RequirePermission('use:integrations')
  async smsBulk(@Body() body: { messages: any[] }) {
    return this.sms.sendBulk(body.messages);
  }
}
