import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as os from 'os';
import { VideoController } from './video.controller';
import { VideoProjectService } from './services/video-project.service';
import { MediaLibraryService } from './services/media-library.service';
import { SceneGeneratorService } from './services/scene-generator.service';
import { FfmpegService } from './services/ffmpeg.service';
import { TtsService } from './services/tts.service';
import { SubtitleService } from './services/subtitle.service';
import { StorageService } from './services/storage.service';
import { VideoProcessor, VIDEO_QUEUE } from './processors/video.processor';
import { PrismaService } from '../database/prisma.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule, // Import Module 1 infrastructure (EventBus, Context, CircuitBreaker)
    
    // BullMQ queue for async video processing
    BullModule.registerQueue({
      name: VIDEO_QUEUE,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail:     50,
        attempts:         3,
        backoff:          { type: 'exponential', delay: 5000 },
      },
    }),

    // Multer: store uploads in OS temp dir, then we move to S3
    MulterModule.register({
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, os.tmpdir()),
        filename:    (_req, file, cb) =>
          cb(null, `bel-upload-${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
      }),
      limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
    }),
  ],
  controllers: [VideoController],
  providers: [
    PrismaService,
    // Core video services
    VideoProjectService,
    MediaLibraryService,
    SceneGeneratorService,
    // Utility services
    FfmpegService,
    TtsService,
    SubtitleService,
    StorageService,
    // Job processor
    VideoProcessor,
  ],
  exports: [VideoProjectService, MediaLibraryService, StorageService],
})
export class VideoModule {}
