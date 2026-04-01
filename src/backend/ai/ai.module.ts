/**
 * AI Module
 * Orchestrates all AI-related services and controllers
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { LocalModelProvider } from './providers/local.provider';
import { PromptTemplateService } from './services/prompt-template.service';
import { ContentGenerationService } from './services/content-generation.service';
import { AIUsageLimitService } from './services/ai-usage-limit.service';
import { AIMonitoringService } from './services/ai-monitoring.service';
import { DatabaseModule } from '../database/database.module';
import { PaymentModule } from '../payments/payment.module';

@Module({
  imports: [
    DatabaseModule,
    PaymentModule,
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [
    AIService,
    OpenAIProvider,
    ClaudeProvider,
    LocalModelProvider,
    PromptTemplateService,
    ContentGenerationService,
    AIUsageLimitService,
    AIMonitoringService,
  ],
  controllers: [AIController],
  exports: [
    AIService,
    ContentGenerationService,
    PromptTemplateService,
    AIUsageLimitService,
    AIMonitoringService,
  ],
})
export class AIModule {}
