import { Module } from '@nestjs/common';
import { AIModule } from '../ai/ai.module';
import { PrismaService } from '../database/prisma.service';
import { FunnelEngineController } from './funnel-engine.controller';
import { FunnelEngineService } from './funnel-engine.service';

@Module({
  imports: [AIModule],
  controllers: [FunnelEngineController],
  providers: [PrismaService, FunnelEngineService],
  exports: [FunnelEngineService],
})
export class FunnelEngineModule {}
