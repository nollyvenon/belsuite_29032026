import { Module }       from '@nestjs/common';
import { BullModule }   from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';

// Engine & memory
import { ASSISTANT_QUEUE, TaskExecutionEngine }    from './engine/task-execution.engine';
import { ConversationMemoryService }               from './memory/conversation-memory.service';

// Services
import { SierrAIService }           from './services/sierra-ai.service';
import { DonnaAIService }           from './services/donna-ai.service';
import { YouTubeAutomationService } from './services/youtube-automation.service';
import { SocialMediaService }       from './services/social-media.service';
import { CalendarService }          from './services/calendar.service';

// Controllers
import {
  SierraController,
  DonnaController,
  YouTubeController,
  SocialController,
  CalendarController,
  AssistantTasksController,
} from './controllers/ai-assistants.controller';

// Infrastructure
import { AIGatewayModule } from '../ai-gateway/ai-gateway.module';
import { DatabaseModule }  from '../database/database.module';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    DatabaseModule,
    AIGatewayModule,   // provides AIGatewayService
    BullModule.registerQueue({ name: ASSISTANT_QUEUE }),
  ],
  controllers: [
    SierraController,
    DonnaController,
    YouTubeController,
    SocialController,
    CalendarController,
    AssistantTasksController,
  ],
  providers: [
    // Infrastructure
    TaskExecutionEngine,
    ConversationMemoryService,
    // AI services
    SierrAIService,
    DonnaAIService,
    YouTubeAutomationService,
    SocialMediaService,
    CalendarService,
  ],
  exports: [
    SierrAIService,
    DonnaAIService,
    YouTubeAutomationService,
    SocialMediaService,
    CalendarService,
    ConversationMemoryService,
    TaskExecutionEngine,
  ],
})
export class AIAssistantsModule {}
