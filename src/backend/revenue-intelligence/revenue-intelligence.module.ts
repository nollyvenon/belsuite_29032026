import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RevenueIntelligenceController } from './revenue-intelligence.controller';
import { RevenueIntelligenceService } from './revenue-intelligence.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RevenueIntelligenceController],
  providers: [RevenueIntelligenceService],
  exports: [RevenueIntelligenceService],
})
export class RevenueIntelligenceModule {}
