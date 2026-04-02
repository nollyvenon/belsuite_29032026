import { Module } from '@nestjs/common';
import { AIModule } from '../ai/ai.module';
import { DatabaseModule } from '../database/database.module';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';

@Module({
  imports: [DatabaseModule, AIModule],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
