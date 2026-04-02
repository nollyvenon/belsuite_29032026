import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { RbacModule } from './rbac/rbac.module';
import { TeamsModule } from './teams/teams.module';
import { PaymentModule } from './payments/payment.module';
import { AIModule } from './ai/ai.module';
import { VideoModule } from './video/video.module';
import { SocialModule } from './social/social.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MarketingModule } from './marketing/marketing.module';
import { UGCModule } from './ugc/ugc.module';
import { AutomationModule } from './automation/automation.module';
import { MultiTenantModule } from './multi-tenant/multi-tenant.module';
import { AICEOModule } from './ai-ceo/ai-ceo.module';
import { LeadEngineModule } from './lead-engine/lead-engine.module';
import { SeoEngineModule } from './seo-engine/seo-engine.module';
import { CrmEngineModule } from './crm-engine/crm-engine.module';
import { MarketingAutomationModule } from './marketing-automation/marketing-automation.module';
import { AICallingModule } from './ai-calling/ai-calling.module';
import { FunnelEngineModule } from './funnel-engine/funnel-engine.module';
import { DatabaseConfig } from './config/database.config';
import { AppConfig } from './config/app.config';
import { PrismaService } from './database/prisma.service';
import { TenantGuard } from './common/guards/tenant.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { BillingEnforcementGuard } from './common/guards/billing-enforcement.guard';
import { CommonModule } from './common/common.module';

// Placeholder modules (to be implemented in next phases)
@Module({})
class ContentModule {}

@Module({})
class StorageModule {}

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // BullMQ root — shared Redis connection for all queues
    BullModule.forRoot({
      connection: {
        host: process.env['REDIS_HOST'] ?? 'localhost',
        port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
        password: process.env['REDIS_PASSWORD'] ?? undefined,
      },
    }),

    // Common infrastructure (event bus, request context, resilience)
    CommonModule,

    // Multi-tenant infrastructure (global — must be before feature modules)
    MultiTenantModule,

    // Core modules
    AuthModule,
    UsersModule,
    OrganizationsModule,
    RbacModule,
    TeamsModule,

    // Business modules (Phase 2+)
    PaymentModule,
    ContentModule,
    AutomationModule,
    AnalyticsModule,
    AIModule,
    StorageModule,

    // Video engine
    VideoModule,

    // Social media scheduler
    SocialModule,

    // Marketing engine
    MarketingModule,

    // UGC creator engine
    UGCModule,

    // AI CEO Module
    AICEOModule,

    // BelGrowth core engines
    LeadEngineModule,
    SeoEngineModule,
    CrmEngineModule,
    MarketingAutomationModule,
    AICallingModule,
    FunnelEngineModule,
  ],
  providers: [
    DatabaseConfig,
    AppConfig,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: BillingEnforcementGuard,
    },
  ],
})
export class AppModule {
  constructor(private prisma: PrismaService) {}

  // TenantMiddleware is applied inside MultiTenantModule.configure()
  configure(_consumer: MiddlewareConsumer) {
    // Intentionally empty — middleware wired in MultiTenantModule
  }

  async onModuleInit() {
    process.on('SIGINT', async () => {
      await this.prisma.$disconnect();
      process.exit(0);
    });
  }
}
