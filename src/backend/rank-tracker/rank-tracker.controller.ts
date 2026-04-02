import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { BulkTrackKeywordsDto, KeywordResearchDto, RankQueryDto, TrackKeywordDto } from './dto/rank-tracker.dto';
import { RankTrackerService } from './rank-tracker.service';

@Controller('rank-tracker')
@UseGuards(JwtAuthGuard)
export class RankTrackerController {
  constructor(private readonly svc: RankTrackerService) {}

  @Post('track')
  track(@Request() req: any, @Body() dto: TrackKeywordDto) {
    return this.svc.trackKeyword(req.user.organizationId, dto);
  }

  @Post('bulk-track')
  bulkTrack(@Request() req: any, @Body() dto: BulkTrackKeywordsDto) {
    return this.svc.bulkTrack(req.user.organizationId, dto);
  }

  @Get()
  list(@Request() req: any, @Query() query: RankQueryDto) {
    return this.svc.listRanks(req.user.organizationId, query);
  }

  @Get('stats')
  stats(@Request() req: any) {
    return this.svc.getStats(req.user.organizationId);
  }

  @Get('history')
  history(
    @Request() req: any,
    @Query('keyword') keyword: string,
    @Query('domain') domain: string,
    @Query('days') days?: string,
  ) {
    return this.svc.getKeywordHistory(req.user.organizationId, keyword, domain, days ? Number(days) : 30);
  }

  @Post('research')
  research(@Request() req: any, @Body() dto: KeywordResearchDto) {
    const { organizationId, id: userId } = req.user;
    return this.svc.aiResearch(organizationId, userId, dto);
  }
}
