import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { AIModule } from '../ai/ai.module';
import { PrismaService } from '../database/prisma.service';
import { EmailModule } from '../email/email.module';
import { CrmEngineController } from './crm-engine.controller';
import { CrmEngineService } from './crm-engine.service';

@Module({
  imports: [AIModule, EmailModule, CommonModule],
  controllers: [CrmEngineController],
  providers: [PrismaService, CrmEngineService],
  exports: [CrmEngineService],
})
export class CrmEngineModule {}
