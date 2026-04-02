import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CallCenterService } from './call-center.service';
import { CallQueryDto, LogInboundCallDto, UpdateCallDto } from './dto/call-center.dto';

@Controller('call-center')
@UseGuards(JwtAuthGuard)
export class CallCenterController {
  constructor(private readonly svc: CallCenterService) {}

  @Post('calls')
  log(@Request() req: any, @Body() dto: LogInboundCallDto) {
    return this.svc.logCall(req.user.organizationId, dto);
  }

  @Patch('calls/:id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateCallDto) {
    return this.svc.updateCall(req.user.organizationId, id, dto);
  }

  @Get('calls')
  list(@Request() req: any, @Query() query: CallQueryDto) {
    return this.svc.listCalls(req.user.organizationId, query);
  }

  @Get('queue')
  queue(@Request() req: any) {
    return this.svc.getLiveQueue(req.user.organizationId);
  }

  @Get('stats')
  stats(@Request() req: any) {
    return this.svc.getStats(req.user.organizationId);
  }

  @Post('calls/:id/summarize')
  summarize(@Request() req: any, @Param('id') id: string) {
    const { organizationId, id: userId } = req.user;
    return this.svc.transcribeAndSummarize(organizationId, userId, id);
  }
}
