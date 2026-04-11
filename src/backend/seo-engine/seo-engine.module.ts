import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { AIModule } from '../ai/ai.module';
import { PrismaService } from '../database/prisma.service';
import { SeoEngineController } from './seo-engine.controller';
import { SeoEngineService } from './seo-engine.service';

@Module({
  imports: [CommonModule, AIModule],
  controllers: [SeoEngineController],
  providers: [PrismaService, SeoEngineService],
  exports: [SeoEngineService],
})
export class SeoEngineModule {}
