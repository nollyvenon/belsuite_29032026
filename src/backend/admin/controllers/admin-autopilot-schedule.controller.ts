import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { AdminAutopilotScheduleService } from '../services/admin-autopilot-schedule.service';
import { UpsertAutopilotScheduleDto } from '../../ai-autopilot/dto/autopilot-schedule.dto';

/**
 * Admin Autopilot Schedule Controller
 *
 * Endpoints:
 * GET    /api/admin/autopilot/schedules         - List all org schedules
 * GET    /api/admin/autopilot/schedules/live     - Live job registry snapshot
 * GET    /api/admin/autopilot/schedules/presets  - List available schedule presets
 * POST   /api/admin/autopilot/schedules          - Create / update a schedule
 * DELETE /api/admin/autopilot/schedules/:orgId   - Remove a schedule
 */
@Controller('api/admin/autopilot')
@UseGuards(JwtAuthGuard)
export class AdminAutopilotScheduleController {
  constructor(private readonly scheduleService: AdminAutopilotScheduleService) {}

  @Get('schedules/presets')
  getPresets() {
    return this.scheduleService.getPresets();
  }

  @Get('schedules/live')
  getLiveSchedules() {
    return this.scheduleService.getLiveSchedules();
  }

  @Get('schedules')
  listSchedules(@Query('organizationId') organizationId?: string) {
    return this.scheduleService.listSchedules(organizationId);
  }

  @Post('schedules')
  upsertSchedule(@Body() dto: UpsertAutopilotScheduleDto) {
    return this.scheduleService.upsertSchedule(dto);
  }

  @Delete('schedules/:orgId')
  deleteSchedule(@Param('orgId') organizationId: string) {
    return this.scheduleService.deleteSchedule(organizationId);
  }
}
