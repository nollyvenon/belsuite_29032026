/**
 * Storage Service (video module)
 * Wraps AWS S3 for uploading, downloading, and generating signed URLs.
 * Falls back to local tmp storage when AWS credentials are absent (dev mode).
 */

import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: AWS.S3 | null;
  private readonly bucket: string;
  private readonly cdnBase: string;

  constructor() {
    const key    = process.env['AWS_ACCESS_KEY_ID'];
    const secret = process.env['AWS_SECRET_ACCESS_KEY'];
    this.bucket  = process.env['AWS_S3_BUCKET'] ?? 'belsuite-videos';
    this.cdnBase = process.env['CDN_BASE_URL']  ?? `https://${this.bucket}.s3.amazonaws.com`;

    if (key && secret) {
      this.s3 = new AWS.S3({
        accessKeyId:     key,
        secretAccessKey: secret,
        region:          process.env['AWS_REGION'] ?? 'us-east-1',
      });
    } else {
      this.s3 = null;
      this.logger.warn('AWS credentials not set — storage running in local mode');
    }
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  async upload(
    filePath: string,
    key: string,
    contentType = 'application/octet-stream',
  ): Promise<string> {
    if (!this.s3) {
      this.logger.debug(`[local] upload ${filePath} → ${key}`);
      return key; // In dev, return the key as-is
    }

    const stream = fs.createReadStream(filePath);
    await this.s3
      .upload({
        Bucket:      this.bucket,
        Key:         key,
        Body:        stream,
        ContentType: contentType,
      })
      .promise();

    this.logger.debug(`Uploaded → s3://${this.bucket}/${key}`);
    return key;
  }

  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType = 'application/octet-stream',
  ): Promise<string> {
    if (!this.s3) {
      this.logger.debug(`[local] uploadBuffer → ${key}`);
      return key;
    }

    await this.s3
      .upload({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: contentType })
      .promise();

    return key;
  }

  /**
   * Upload a temp file and optionally delete it afterwards.
   */
  async uploadTemp(
    tmpPath: string,
    organizationId: string,
    filename: string,
    contentType?: string,
  ): Promise<string> {
    const key = `${organizationId}/video/${filename}`;
    await this.upload(tmpPath, key, contentType);
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    return key;
  }

  // ── Download ──────────────────────────────────────────────────────────────

  async downloadToFile(key: string, destPath: string): Promise<void> {
    if (!this.s3) {
      this.logger.debug(`[local] downloadToFile ${key} → ${destPath}`);
      return;
    }

    const obj    = await this.s3.getObject({ Bucket: this.bucket, Key: key }).promise();
    const body   = obj.Body;
    if (!body) throw new Error(`No body for key: ${key}`);
    fs.writeFileSync(destPath, body as Buffer);
  }

  async downloadToBuffer(key: string): Promise<Buffer> {
    if (!this.s3) {
      this.logger.debug(`[local] downloadToBuffer ${key}`);
      return Buffer.alloc(0);
    }

    const obj = await this.s3.getObject({ Bucket: this.bucket, Key: key }).promise();
    return obj.Body as Buffer;
  }

  // ── Signed URLs ───────────────────────────────────────────────────────────

  signedUploadUrl(key: string, contentType: string, expiresIn = 300): string {
    if (!this.s3) return `/dev-upload/${key}`;
    return this.s3.getSignedUrl('putObject', {
      Bucket:      this.bucket,
      Key:         key,
      ContentType: contentType,
      Expires:     expiresIn,
    });
  }

  signedDownloadUrl(key: string, expiresIn = 3600): string {
    if (!this.s3) return `/dev-download/${key}`;
    return this.s3.getSignedUrl('getObject', {
      Bucket:  this.bucket,
      Key:     key,
      Expires: expiresIn,
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async delete(key: string): Promise<void> {
    if (!this.s3) return;
    await this.s3.deleteObject({ Bucket: this.bucket, Key: key }).promise();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  publicUrl(key: string): string {
    return `${this.cdnBase}/${key}`;
  }

  buildKey(organizationId: string, folder: string, filename: string): string {
    return `${organizationId}/${folder}/${filename}`;
  }
}
