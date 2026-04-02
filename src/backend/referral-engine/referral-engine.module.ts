import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ReferralEngineController } from './referral-engine.controller';
import { ReferralEngineService } from './referral-engine.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ReferralEngineController],
  providers: [ReferralEngineService],
  exports: [ReferralEngineService],
})
export class ReferralEngineModule {}
