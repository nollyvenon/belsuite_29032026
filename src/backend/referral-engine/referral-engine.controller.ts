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
import { CreateReferralLinkDto, TrackReferralDto } from './dto/referral.dto';
import { ReferralEngineService } from './referral-engine.service';

@Controller('referrals')
export class ReferralEngineController {
  constructor(private readonly svc: ReferralEngineService) {}

  @Post('links')
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() dto: CreateReferralLinkDto) {
    const { organizationId, id: userId } = req.user;
    return this.svc.createLink(organizationId, userId, dto);
  }

  @Get('links')
  @UseGuards(JwtAuthGuard)
  list(@Request() req: any) {
    return this.svc.listLinks(req.user.organizationId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
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
  convert(@Request() req: any, @Param('id') id: string) {
    return this.svc.markConverted(req.user.organizationId, id);
  }
}
