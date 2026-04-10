import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoEditorController } from './video-editor.controller';
import { VideoEditorService } from './video-editor.service';
import { VideoRenderingPipeline } from './rendering-pipeline';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule],
  controllers: [VideoEditorController],
  providers: [VideoEditorService, VideoRenderingPipeline],
  exports: [VideoEditorService, VideoRenderingPipeline],
})
export class VideoEngineModule {}
