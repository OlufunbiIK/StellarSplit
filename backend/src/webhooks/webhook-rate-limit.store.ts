import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { getRedisUrl } from '../config/redis.config';

@Injectable()
export class WebhookRateLimitStore implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebhookRateLimitStore.name);
  private redis: Redis | null = null;
  private available = false;
  
  // Fallback in-memory map if redis is down
  private fallbackMap = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const url = getRedisUrl(this.configService);
    
    try {
      this.redis = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 2,
      });

      this.redis.on('error', (err: Error) => {
        if (this.available) {
          this.logger.warn(`Redis connection error: ${err.message}`);
        }
        this.available = false;
      });

      this.redis.on('connect', () => {
        this.available = true;
        this.logger.log('Webhook Rate Limit Redis connected');
      });

      this.redis.on('close', () => {
        this.available = false;
      });

      await this.redis.connect();
    } catch (err: any) {
      this.logger.warn(`Webhook Rate Limit Redis unavailable — using fallback. ${err.message}`);
      this.available = false;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit().catch(() => this.redis?.disconnect());
      this.redis = null;
      this.available = false;
      this.logger.log('Webhook Rate Limit Redis connection closed');
    }
  }

  async checkRateLimit(webhookId: string, maxRequests: number, windowMs: number): Promise<boolean> {
    if (!this.redis || !this.available) {
      return this.checkFallback(webhookId, maxRequests, windowMs);
    }

    try {
      const key = `webhook_rate_limit:${webhookId}`;
      
      // Atomic increment and expiry
      const multi = this.redis.multi();
      multi.incr(key);
      multi.pttl(key);
      const results = await multi.exec();

      if (!results) return false;

      const [incrError, countVal] = results[0];
      const [pttlError, pttlVal] = results[1];

      if (incrError) throw incrError;
      
      const count = Number(countVal);
      const pttl = Number(pttlVal);

      if (count === 1 || pttl === -1) {
        // Set expiry if it's a new key or lacks expiry
        await this.redis.pexpire(key, windowMs);
      }

      return count <= maxRequests;
    } catch (err: any) {
      this.logger.warn(`Redis rate limit failed for ${webhookId}, using fallback: ${err.message}`);
      return this.checkFallback(webhookId, maxRequests, windowMs);
    }
  }

  private checkFallback(webhookId: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const limit = this.fallbackMap.get(webhookId);

    if (!limit || now > limit.resetAt) {
      this.fallbackMap.set(webhookId, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    if (limit.count >= maxRequests) {
      return false;
    }

    limit.count += 1;
    return true;
  }
}
