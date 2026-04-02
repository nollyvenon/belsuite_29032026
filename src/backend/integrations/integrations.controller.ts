import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RequirePermission } from '../common/decorators/permission.decorator';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(
    private readonly slackService: any,
    private readonly webhookService: any,
  ) {}

  @Get()
  @RequirePermission('read:integrations')
  async list(@Request() req: any) {
    // Returns list of connected integrations
    return {
      data: [
        { id: 'slack', name: 'Slack', status: 'connected', icon: 'slack' },
        { id: 'webhook', name: 'Webhooks', status: 'configured', icon: 'webhook' },
        { id: 'zapier', name: 'Zapier', status: 'available', icon: 'zapier' },
      ],
    };
  }

  @Post(':type/connect')
  @RequirePermission('manage:integrations')
  async connect(
    @Request() req: any,
    @Param('type') type: string,
    @Body() credentials: any,
  ) {
    const organizationId = req.user.organizationId;

    switch (type) {
      case 'slack':
        return this.slackService.connect(organizationId, credentials);
      case 'webhook':
        return this.webhookService.create(organizationId, credentials);
      default:
        throw new Error(`Integration ${type} not supported`);
    }
  }

  @Delete(':type')
  @RequirePermission('manage:integrations')
  async disconnect(
    @Request() req: any,
    @Param('type') type: string,
  ) {
    const organizationId = req.user.organizationId;

    switch (type) {
      case 'slack':
        return this.slackService.disconnect(organizationId);
      case 'webhook':
        return this.webhookService.delete(organizationId);
      default:
        throw new Error(`Integration ${type} not supported`);
    }
  }

  @Get(':type/test')
  @RequirePermission('manage:integrations')
  async testConnection(
    @Request() req: any,
    @Param('type') type: string,
  ) {
    const organizationId = req.user.organizationId;

    switch (type) {
      case 'slack':
        return this.slackService.test(organizationId);
      case 'webhook':
        return this.webhookService.test(organizationId);
      default:
        throw new Error(`Integration ${type} not supported`);
    }
  }

  @Post('slack/send')
  @RequirePermission('use:integrations')
  async sendSlackMessage(
    @Request() req: any,
    @Body() payload: { channel: string; message: string },
  ) {
    const organizationId = req.user.organizationId;
    return this.slackService.send(organizationId, payload.channel, payload.message);
  }

  @Post('webhook/trigger')
  @RequirePermission('use:integrations')
  async triggerWebhook(
    @Request() req: any,
    @Body() payload: any,
  ) {
    const organizationId = req.user.organizationId;
    return this.webhookService.trigger(organizationId, payload);
  }
}
