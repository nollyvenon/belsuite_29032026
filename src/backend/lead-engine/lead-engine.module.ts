import { Module } from '@nestjs/common';
import { AIModule } from '../ai/ai.module';
import { PrismaService } from '../database/prisma.service';
import { LeadEngineController } from './lead-engine.controller';
import { LeadEngineService } from './lead-engine.service';

@Module({
  imports: [AIModule],
  controllers: [LeadEngineController],
  providers: [PrismaService, LeadEngineService],
  exports: [LeadEngineService],
})
export class LeadEngineModule {}
