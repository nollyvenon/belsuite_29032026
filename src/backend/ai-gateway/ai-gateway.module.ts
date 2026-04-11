import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';

import { AIGatewayService }          from './ai-gateway.service';
import { ModelRegistryService }       from './services/model-registry.service';
import { AICacheService }             from './services/ai-cache.service';
import { FailoverService }            from './services/failover.service';
import { CostOptimizerService }       from './services/cost-optimizer.service';
import { UsageTrackerService }        from './services/usage-tracker.service';
import { TaskRouterService }          from './services/task-router.service';
import { GatewayControlService }      from './services/gateway-control.service';
import { AIGatewayController }        from './controllers/ai-gateway.controller';
import { AdminGatewayController }     from './controllers/admin-gateway.controller';
import { DatabaseModule }             from '../database/database.module';

@Module({
  imports: [
    ConfigModule,   // provides ConfigService
    DatabaseModule, // provides PrismaService
    CommonModule,
  ],
  controllers: [
    AIGatewayController,
    AdminGatewayController,
  ],
  providers: [
    AIGatewayService,
    ModelRegistryService,
    AICacheService,
    FailoverService,
    CostOptimizerService,
    UsageTrackerService,
    TaskRouterService,
    GatewayControlService,
  ],
  exports: [
    AIGatewayService,
    UsageTrackerService,
    ModelRegistryService,
    GatewayControlService,
  ],
})
export class AIGatewayModule {}
