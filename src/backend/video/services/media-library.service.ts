/**
 * Media Library Service
 * Handles upload, metadata extraction, and retrieval of MediaAsset records.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from './storage.service';
import { FfmpegService } from './ffmpeg.service';
import { VideoMediaType } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

export interface UploadResult {
  assetId: string;
  storageKey: string;
  publicUrl: string;
  durationMs?: number;
  width?: number;
  height?: number;
}

@Injectable()
export class MediaLibraryService {
  private readonly logger = new Logger(MediaLibraryService.name);

  constructor(
    private readonly prisma:   PrismaService,
    private readonly storage:  StorageService,
    private readonly ffmpeg:   FfmpegService,
  ) {}

  // ── Upload ────────────────────────────────────────────────────────────────

  async uploadFile(opts: {
    filePath: string;
    originalName: string;
    mimeType: string;
    organizationId: string;
    uploadedById: string;
    videoProjectId?: string;
    aiGenerated?: boolean;
    aiPrompt?: string;
  }): Promise<UploadResult> {
    const { filePath, originalName, mimeType, organizationId, uploadedById } = opts;

    const mediaType  = this.detectMediaType(mimeType);
    const filename   = `${crypto.randomUUID()}${path.extname(originalName)}`;
    const storageKey = this.storage.buildKey(organizationId, 'media', filename);
    const fileSize   = BigInt(fs.statSync(filePath).size);

    // Extract video/audio metadata before uploading (upload removes temp file)
    let durationMs: number | undefined;
    let width: number | undefined;
    let height: number | undefined;

    if (mediaType === VideoMediaType.VIDEO_CLIP || mediaType === VideoMediaType.AUDIO_CLIP) {
      try {
        const info   = await this.ffmpeg.getMediaInfo(filePath);
        const vStream = info.streams.find((s: { codec_type?: string }) => s.codec_type === 'video');
        const dur    = info.format.duration;
        if (dur)      durationMs = Math.round(parseFloat(String(dur)) * 1000);
        if (vStream) {
          width  = vStream.width;
          height = vStream.height;
        }
      } catch (err: unknown) {
        this.logger.warn(`Could not probe media info: ${(err as Error).message}`);
      }
    }

    await this.storage.upload(filePath, storageKey, mimeType);
    // Delete temp file after upload
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }

    const asset = await this.prisma.mediaAsset.create({
      data: {
        organizationId,
        uploadedById,
        videoProjectId: opts.videoProjectId,
        name:           originalName,
        mediaType,
        mimeType,
        storageKey,
        publicUrl:      this.storage.publicUrl(storageKey),
        fileSizeBytes:  fileSize,
        durationMs,
        width,
        height,
        aiGenerated:    opts.aiGenerated ?? false,
        aiPrompt:       opts.aiPrompt,
      },
    });

    this.logger.log(`Asset uploaded: ${asset.id} (${mediaType})`);

    return {
      assetId:   asset.id,
      storageKey,
      publicUrl: asset.publicUrl ?? this.storage.publicUrl(storageKey),
      durationMs,
      width,
      height,
    };
  }

  // ── Signed upload URL (for direct browser → S3 upload) ───────────────────

  createUploadUrl(opts: {
    organizationId: string;
    filename: string;
    mimeType: string;
  }): { uploadUrl: string; storageKey: string } {
    const filename   = `${crypto.randomUUID()}${path.extname(opts.filename)}`;
    const storageKey = this.storage.buildKey(opts.organizationId, 'media', filename);
    const uploadUrl  = this.storage.signedUploadUrl(storageKey, opts.mimeType);
    return { uploadUrl, storageKey };
  }

  // ── Retrieve ──────────────────────────────────────────────────────────────

  async listAssets(organizationId: string, projectId?: string) {
    return this.prisma.mediaAsset.findMany({
      where: {
        organizationId,
        ...(projectId ? { videoProjectId: projectId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAsset(assetId: string, organizationId: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: assetId, organizationId },
    });
    if (!asset) throw new NotFoundException(`Asset ${assetId} not found`);
    return asset;
  }

  async deleteAsset(assetId: string, organizationId: string): Promise<void> {
    const asset = await this.getAsset(assetId, organizationId);
    await this.storage.delete(asset.storageKey);
    await this.prisma.mediaAsset.delete({ where: { id: assetId } });
    this.logger.log(`Asset deleted: ${assetId}`);
  }

  async getDownloadUrl(assetId: string, organizationId: string): Promise<string> {
    const asset = await this.getAsset(assetId, organizationId);
    return this.storage.signedDownloadUrl(asset.storageKey);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private detectMediaType(mimeType: string): VideoMediaType {
    if (mimeType.startsWith('video/'))  return VideoMediaType.VIDEO_CLIP;
    if (mimeType.startsWith('audio/'))  return VideoMediaType.AUDIO_CLIP;
    if (mimeType.startsWith('image/'))  return VideoMediaType.IMAGE;
    if (mimeType.includes('subtitle') || mimeType.includes('srt') || mimeType.includes('vtt'))
      return VideoMediaType.SUBTITLE_TRACK;
    return VideoMediaType.VIDEO_CLIP;
  }
}
