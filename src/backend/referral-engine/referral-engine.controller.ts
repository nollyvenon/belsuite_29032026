import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RequirePermission } from '../common/decorators/permission.decorator';
import { CreateReferralLinkDto, TrackReferralDto } from './dto/referral.dto';
import { ReferralEngineService } from './referral-engine.service';

@Controller('referrals')
export class ReferralEngineController {
  constructor(private readonly svc: ReferralEngineService) {}

  @Post('links')
  @UseGuards(JwtAuthGuard)
  @RequirePermission('manage:referrals', 'manage:organization')
  create(@Request() req: any, @Body() dto: CreateReferralLinkDto) {
    const { organizationId, id: userId } = req.user;
    return this.svc.createLink(organizationId, userId, dto);
  }

  @Get('links')
  @UseGuards(JwtAuthGuard)
  @RequirePermission('read:referrals', 'manage:organization')
  list(@Request() req: any) {
    return this.svc.listLinks(req.user.organizationId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @RequirePermission('read:referrals', 'manage:organization')
  stats(@Request() req: any) {
    return this.svc.getStats(req.user.organizationId);
  }

  @Post('click/:code')
  trackClick(@Param('code') code: string) {
    return this.svc.trackClick(code);
  }

  @Post('signup')
  trackSignup(@Body() dto: TrackReferralDto) {
    return this.svc.trackSignup(dto);
  }

  @Post(':id/convert')
  @UseGuards(JwtAuthGuard)
  @RequirePermission('manage:referrals', 'manage:organization')
  convert(@Request() req: any, @Param('id') id: string) {
    return this.svc.markConverted(req.user.organizationId, id);
  }
}
