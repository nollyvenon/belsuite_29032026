import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { AIModule } from '../ai/ai.module';
import { PrismaService } from '../database/prisma.service';
import { LeadEngineController } from './lead-engine.controller';
import { LeadEngineService } from './lead-engine.service';

@Module({
  imports: [AIModule, CommonModule],
  controllers: [LeadEngineController],
  providers: [PrismaService, LeadEngineService],
  exports: [LeadEngineService],
})
export class LeadEngineModule {}
