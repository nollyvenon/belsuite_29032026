import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GrowthEngineController } from './growth-engine.controller';
import { GrowthEngineService } from './growth-engine.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule],
  controllers: [GrowthEngineController],
  providers: [GrowthEngineService],
  exports: [GrowthEngineService],
})
export class GrowthEngineModule {}
