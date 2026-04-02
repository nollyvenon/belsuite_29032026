import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RequirePermission } from '../common/decorators/permission.decorator';
import { RevenueQueryDto } from './dto/revenue.dto';
import { RevenueIntelligenceService } from './revenue-intelligence.service';

@Controller('revenue')
@UseGuards(JwtAuthGuard)
export class RevenueIntelligenceController {
  constructor(private readonly svc: RevenueIntelligenceService) {}

  @Get('metrics')
  @RequirePermission('read:revenue', 'manage:organization')
  metrics(@Request() req: any, @Query() query: RevenueQueryDto) {
    return this.svc.getMetrics(req.user.organizationId, query.days ?? 30);
  }
}
