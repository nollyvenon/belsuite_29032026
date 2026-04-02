import { Module } from '@nestjs/common';
import { AIModule } from '../ai/ai.module';
import { DatabaseModule } from '../database/database.module';
import { CallCenterController } from './call-center.controller';
import { CallCenterService } from './call-center.service';

@Module({
  imports: [DatabaseModule, AIModule],
  controllers: [CallCenterController],
  providers: [CallCenterService],
  exports: [CallCenterService],
})
export class CallCenterModule {}
