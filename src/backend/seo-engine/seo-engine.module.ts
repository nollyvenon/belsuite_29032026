import { Module } from '@nestjs/common';
import { AIModule } from '../ai/ai.module';
import { PrismaService } from '../database/prisma.service';
import { SeoEngineController } from './seo-engine.controller';
import { SeoEngineService } from './seo-engine.service';

@Module({
  imports: [AIModule],
  controllers: [SeoEngineController],
  providers: [PrismaService, SeoEngineService],
  exports: [SeoEngineService],
})
export class SeoEngineModule {}
