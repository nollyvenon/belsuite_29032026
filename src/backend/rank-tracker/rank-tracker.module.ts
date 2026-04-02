import { Module } from '@nestjs/common';
import { AIModule } from '../ai/ai.module';
import { DatabaseModule } from '../database/database.module';
import { RankTrackerController } from './rank-tracker.controller';
import { RankTrackerService } from './rank-tracker.service';

@Module({
  imports: [DatabaseModule, AIModule],
  controllers: [RankTrackerController],
  providers: [RankTrackerService],
  exports: [RankTrackerService],
})
export class RankTrackerModule {}
