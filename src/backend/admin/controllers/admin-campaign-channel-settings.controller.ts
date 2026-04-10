import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Put, Req } from '@nestjs/common';
import { AdminCampaignChannelSettingsService } from '../services/admin-campaign-channel-settings.service';
import { UpsertCampaignChannelRouteDto } from '../dtos/campaign-channel-settings.dto';

@Controller('api/admin/campaign-channels')
export class AdminCampaignChannelSettingsController {
  constructor(private readonly service: AdminCampaignChannelSettingsService) {}

  private orgId(req: any) {
    const organizationId = req.user?.organizationId;
    if (!organizationId) throw new HttpException('Organization ID not found', HttpStatus.UNAUTHORIZED);
    return organizationId;
  }

  @Get('routes')
  getRoutes(@Req() req: any) {
    return this.service.getRoutes(this.orgId(req));
  }

  @Put('routes')
  upsertRoute(@Req() req: any, @Body() dto: UpsertCampaignChannelRouteDto) {
    return this.service.upsertRoute(this.orgId(req), dto);
  }

  @Delete('routes/:objective')
  deleteRoute(@Req() req: any, @Param('objective') objective: string) {
    return this.service.deleteRoute(this.orgId(req), objective);
  }
}
