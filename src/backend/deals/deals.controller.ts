import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RequirePermission } from '../common/decorators/permission.decorator';
import { DealsService } from './deals.service';
import { AddActivityDto, CreateDealDto, DealQueryDto, UpdateDealDto } from './dto/deals.dto';

@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealsController {
  constructor(private readonly svc: DealsService) {}

  @Post()
  @RequirePermission('manage:deals', 'manage:organization')
  create(@Request() req: any, @Body() dto: CreateDealDto) {
    const { organizationId, id: userId } = req.user;
    return this.svc.createDeal(organizationId, userId, dto);
  }

  @Get()
  @RequirePermission('read:deals', 'manage:organization')
  list(@Request() req: any, @Query() query: DealQueryDto) {
    return this.svc.listDeals(req.user.organizationId, query);
  }

  @Get('board')
  @RequirePermission('read:deals', 'manage:organization')
  board(@Request() req: any) {
    return this.svc.getBoardView(req.user.organizationId);
  }

  @Get('stats')
  @RequirePermission('read:deals', 'manage:organization')
  stats(@Request() req: any) {
    return this.svc.getDealStats(req.user.organizationId);
  }

  @Get('contact/:email/timeline')
  @RequirePermission('read:deals', 'manage:organization')
  timeline(@Request() req: any, @Param('email') email: string) {
    return this.svc.getContactTimeline(req.user.organizationId, decodeURIComponent(email));
  }

  @Get(':id')
  @RequirePermission('read:deals', 'manage:organization')
  getOne(@Request() req: any, @Param('id') id: string) {
    return this.svc.getDeal(req.user.organizationId, id);
  }

  @Patch(':id')
  @RequirePermission('manage:deals', 'manage:organization')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateDealDto) {
    return this.svc.updateDeal(req.user.organizationId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('manage:deals', 'manage:organization')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.svc.deleteDeal(req.user.organizationId, id);
  }

  @Post(':id/ai-score')
  @RequirePermission('manage:deals', 'manage:organization')
  aiScore(@Request() req: any, @Param('id') id: string) {
    const { organizationId, id: userId } = req.user;
    return this.svc.aiScoreDeal(organizationId, userId, id);
  }

  @Post('activity')
  @RequirePermission('manage:deals', 'manage:organization')
  addActivity(@Request() req: any, @Body() dto: AddActivityDto) {
    return this.svc.addActivity(req.user.organizationId, dto);
  }
}
