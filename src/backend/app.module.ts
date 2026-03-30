import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { RbacModule } from './rbac/rbac.module';
import { PaymentModule } from './payments/payment.module';
import { AIModule } from './ai/ai.module';
import { DatabaseConfig } from './config/database.config';
import { AppConfig } from './config/app.config';
import { PrismaService } from './database/prisma.service';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantGuard } from './common/guards/tenant.guard';
import { PermissionGuard } from './common/guards/permission.guard';

// Placeholder modules (to be implemented in next phases)
@Module({})
class ContentModule {}

@Module({})
class AutomationModule {}

@Module({})
class AnalyticsModule {}

@Module({})
class StorageModule {}

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Core modules
    AuthModule,
    UsersModule,
    OrganizationsModule,
    RbacModule,

    // Business modules (Phase 2+)
    PaymentModule,  // Phase 2: Multi-payment gateway support
    ContentModule,
    AutomationModule,
    AnalyticsModule,
    AIModule,
    StorageModule,
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
  ],
})
export class AppModule {
  constructor(private prisma: PrismaService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }

  async onModuleInit() {
    // Shutdown hooks for graceful termination
    process.on('SIGINT', async () => {
      await this.prisma.$disconnect();
      process.exit(0);
    });
  }
}
