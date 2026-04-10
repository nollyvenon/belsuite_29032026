import { Body, Controller, Get, HttpException, HttpStatus, Post, Put, Req } from '@nestjs/common';
import { AdminSmsSettingsService } from '../services/admin-sms-settings.service';
import { TestSmsDto, UpdateSmsSettingsDto } from '../dtos/sms-settings.dto';

@Controller('api/admin/sms')
export class AdminSmsSettingsController {
  constructor(private readonly service: AdminSmsSettingsService) {}

  private orgId(req: any) {
    const organizationId = req.user?.organizationId;
    if (!organizationId) throw new HttpException('Organization ID not found', HttpStatus.UNAUTHORIZED);
    return organizationId;
  }

  @Get('settings')
  getSettings(@Req() req: any) {
    return this.service.getSettings(this.orgId(req));
  }

  @Put('settings')
  updateSettings(@Req() req: any, @Body() dto: UpdateSmsSettingsDto) {
    return this.service.updateSettings(this.orgId(req), dto);
  }

  @Get('providers')
  getProviders() {
    return this.service.getProviders();
  }

  @Post('test')
  test(@Req() req: any, @Body() dto: TestSmsDto) {
    return this.service.testSettings(this.orgId(req), dto);
  }

  @Get('health')
  health(@Req() req: any) {
    return this.service.health(this.orgId(req));
  }
}
