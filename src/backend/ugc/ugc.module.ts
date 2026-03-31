import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { UGCController } from './ugc.controller';
import { AvatarService } from './services/avatar.service';
import { RenderOrchestratorService } from './services/render-orchestrator.service';
import { RenderProviderService } from './services/render-provider.service';
import { ScriptGeneratorService } from './services/script-generator.service';
import { UGCProjectService } from './services/ugc-project.service';
import { VoiceProviderService } from './services/voice-provider.service';
import { VoiceCloneService } from './services/voice-clone.service';

@Module({
  imports: [ConfigModule],
  controllers: [UGCController],
  providers: [
    PrismaService,
    UGCProjectService,
    AvatarService,
    VoiceProviderService,
    VoiceCloneService,
    ScriptGeneratorService,
    RenderProviderService,
    RenderOrchestratorService,
  ],
  exports: [UGCProjectService],
})
export class UGCModule {}