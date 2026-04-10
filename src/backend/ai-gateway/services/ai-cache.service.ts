/**
 * AI Cache Service
 * Redis-backed response cache with in-memory fallback.
 * Saves cost by returning identical responses for repeated prompts.
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import type Redis from 'ioredis';
import * as crypto from 'crypto';
import { CacheStats, GatewayResponse } from '../types/gateway.types';

interface MemoryCacheEntry {
  value: GatewayResponse;
  expiresAt: number;
  savedUsd: number;
}

@Injectable()
export class AICacheService {
  private readonly logger = new Logger(AICacheService.name);
  private readonly REDIS_PREFIX = 'belsuite:ai:cache:';
  private readonly DEFAULT_TTL_SECONDS = 24 * 60 * 60;   // 24 h

  // In-memory fallback
  private memoryCache = new Map<string, MemoryCacheEntry>();
  private hitCount  = 0;
  private missCount = 0;
  private totalSavedUsd = 0;

  private useRedis: boolean;

  constructor(
    @Optional() private redis?: Redis,
  ) {
    this.useRedis = !!redis;
    if (this.useRedis) {
      this.logger.log('AI cache → Redis backend');
    } else {
      this.logger.warn('AI cache → in-memory fallback (Redis not configured)');
    }
    // Prune expired memory entries every 10 min
    setInterval(() => this.pruneMemoryCache(), 10 * 60 * 1000);
  }

  // ── Public API ─────────────────────────────────────────────────────────

  buildKey(prompt: string, modelId: string, params: Record<string, unknown> = {}): string {
    const content = JSON.stringify({ prompt, modelId, ...params });
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async get(key: string): Promise<GatewayResponse | null> {
    try {
      if (this.useRedis && this.redis) {
        const raw = await this.redis.get(this.REDIS_PREFIX + key);
        if (raw) {
          this.hitCount++;
          const entry = JSON.parse(raw) as { value: GatewayResponse; savedUsd: number };
          this.totalSavedUsd += entry.savedUsd;
          return { ...entry.value, cacheHit: true };
        }
      } else {
        const entry = this.memoryCache.get(key);
        if (entry && entry.expiresAt > Date.now()) {
          this.hitCount++;
          this.totalSavedUsd += entry.savedUsd;
          return { ...entry.value, cacheHit: true };
        } else if (entry) {
          this.memoryCache.delete(key);
        }
      }
    } catch (err) {
      this.logger.error(`Cache get error: ${String(err)}`);
    }
    this.missCount++;
    return null;
  }

  async set(
    key: string,
    value: GatewayResponse,
    ttlSeconds = this.DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    const savedUsd = value.costUsd;
    try {
      if (this.useRedis && this.redis) {
        await this.redis.setex(
          this.REDIS_PREFIX + key,
          ttlSeconds,
          JSON.stringify({ value, savedUsd }),
        );
      } else {
        this.memoryCache.set(key, {
          value,
          savedUsd,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
      }
    } catch (err) {
      this.logger.error(`Cache set error: ${String(err)}`);
    }
  }

  async invalidate(key: string): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.del(this.REDIS_PREFIX + key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (err) {
      this.logger.error(`Cache invalidate error: ${String(err)}`);
    }
  }

  async flushAll(): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        const keys = await this.redis.keys(this.REDIS_PREFIX + '*');
        if (keys.length > 0) await this.redis.del(...keys);
        this.logger.log(`Flushed ${keys.length} Redis cache entries`);
      } else {
        const count = this.memoryCache.size;
        this.memoryCache.clear();
        this.logger.log(`Flushed ${count} in-memory cache entries`);
      }
    } catch (err) {
      this.logger.error(`Cache flush error: ${String(err)}`);
    }
  }

  async getStats(): Promise<CacheStats> {
    let entries = 0;
    let totalSizeBytes = 0;

    try {
      if (this.useRedis && this.redis) {
        const keys = await this.redis.keys(this.REDIS_PREFIX + '*');
        entries = keys.length;
        // Sample size from first 20 entries
        for (const key of keys.slice(0, 20)) {
          const val = await this.redis.get(key);
          totalSizeBytes += val ? Buffer.byteLength(val, 'utf8') : 0;
        }
        if (keys.length > 20) {
          totalSizeBytes = Math.round((totalSizeBytes / 20) * keys.length);
        }
      } else {
        entries = this.memoryCache.size;
        for (const entry of this.memoryCache.values()) {
          totalSizeBytes += JSON.stringify(entry.value).length;
        }
      }
    } catch { /* ignore */ }

    const total = this.hitCount + this.missCount;
    return {
      backend: this.useRedis ? 'redis' : 'memory',
      entries,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total > 0 ? Math.round((this.hitCount / total) * 100) : 0,
      estimatedSavedUsd: Math.round(this.totalSavedUsd * 10000) / 10000,
      totalSizeBytes,
    };
  }

  // ── Private ────────────────────────────────────────────────────────────

  private pruneMemoryCache(): void {
    const now = Date.now();
    let pruned = 0;
    for (const [k, v] of this.memoryCache) {
      if (v.expiresAt <= now) {
        this.memoryCache.delete(k);
        pruned++;
      }
    }
    if (pruned > 0) this.logger.debug(`Pruned ${pruned} expired memory cache entries`);
  }
}
