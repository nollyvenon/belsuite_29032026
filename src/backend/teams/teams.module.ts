import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { PrismaService } from '../database/prisma.service';
import { TeamPermissionGuard } from '../common/guards/team-permission.guard';
import { TeamRoleGuard } from '../common/guards/team-role.guard';

@Module({
  controllers: [TeamsController],
  providers: [TeamsService, PrismaService, TeamPermissionGuard, TeamRoleGuard],
  exports: [TeamsService, TeamPermissionGuard, TeamRoleGuard],
})
export class TeamsModule {}
