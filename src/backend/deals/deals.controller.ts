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
import { DealsService } from './deals.service';
import { AddActivityDto, CreateDealDto, DealQueryDto, UpdateDealDto } from './dto/deals.dto';

@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealsController {
  constructor(private readonly svc: DealsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateDealDto) {
    const { organizationId, id: userId } = req.user;
    return this.svc.createDeal(organizationId, userId, dto);
  }

  @Get()
  list(@Request() req: any, @Query() query: DealQueryDto) {
    return this.svc.listDeals(req.user.organizationId, query);
  }

  @Get('board')
  board(@Request() req: any) {
    return this.svc.getBoardView(req.user.organizationId);
  }

  @Get('stats')
  stats(@Request() req: any) {
    return this.svc.getDealStats(req.user.organizationId);
  }

  @Get('contact/:email/timeline')
  timeline(@Request() req: any, @Param('email') email: string) {
    return this.svc.getContactTimeline(req.user.organizationId, decodeURIComponent(email));
  }

  @Get(':id')
  getOne(@Request() req: any, @Param('id') id: string) {
    return this.svc.getDeal(req.user.organizationId, id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateDealDto) {
    return this.svc.updateDeal(req.user.organizationId, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.svc.deleteDeal(req.user.organizationId, id);
  }

  @Post(':id/ai-score')
  aiScore(@Request() req: any, @Param('id') id: string) {
    const { organizationId, id: userId } = req.user;
    return this.svc.aiScoreDeal(organizationId, userId, id);
  }

  @Post('activity')
  addActivity(@Request() req: any, @Body() dto: AddActivityDto) {
    return this.svc.addActivity(req.user.organizationId, dto);
  }
}
