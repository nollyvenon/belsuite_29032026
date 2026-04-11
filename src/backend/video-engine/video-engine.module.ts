import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { VideoEditorController } from './video-editor.controller';
import { VideoEditorService } from './video-editor.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { VIDEO_QUEUE } from '../video/processors/video.processor';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    BullModule.registerQueue({
      name: VIDEO_QUEUE,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    }),
  ],
  controllers: [VideoEditorController],
  providers: [VideoEditorService],
  exports: [VideoEditorService],
})
export class VideoEngineModule {}
