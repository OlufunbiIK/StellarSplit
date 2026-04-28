import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WebhookRateLimitStore } from './webhook-rate-limit.store';

// Mock ioredis
jest.mock('ioredis');

describe('WebhookRateLimitStore', () => {
  let store: WebhookRateLimitStore;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('redis://localhost:6379'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookRateLimitStore,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    store = module.get<WebhookRateLimitStore>(WebhookRateLimitStore);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('checkRateLimit (fallback)', () => {
    it('should correctly enforce rate limit when using fallback map', async () => {
      // Force fallback mode by not calling onModuleInit
      (store as any).available = false;

      const webhookId = 'test-webhook';
      const maxRequests = 2;
      const windowMs = 1000;

      // First request: success
      const result1 = await store.checkRateLimit(webhookId, maxRequests, windowMs);
      expect(result1).toBe(true);

      // Second request: success
      const result2 = await store.checkRateLimit(webhookId, maxRequests, windowMs);
      expect(result2).toBe(true);

      // Third request: fails (rate limited)
      const result3 = await store.checkRateLimit(webhookId, maxRequests, windowMs);
      expect(result3).toBe(false);
    });

    it('should reset fallback limit after window', async () => {
      // Force fallback mode
      (store as any).available = false;
      const webhookId = 'test-webhook-2';

      await store.checkRateLimit(webhookId, 1, 10);
      let result = await store.checkRateLimit(webhookId, 1, 10);
      expect(result).toBe(false);

      // Wait for reset
      await new Promise(resolve => setTimeout(resolve, 20));

      // Should be successful again
      result = await store.checkRateLimit(webhookId, 1, 10);
      expect(result).toBe(true);
    });
  });

  describe('checkRateLimit (redis)', () => {
    let mockMulti: any;
    let mockRedisInstance: any;

    beforeEach(() => {
      mockMulti = {
        incr: jest.fn().mockReturnThis(),
        pttl: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      };

      mockRedisInstance = {
        multi: jest.fn().mockReturnValue(mockMulti),
        pexpire: jest.fn().mockResolvedValue(1),
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(undefined),
        quit: jest.fn().mockResolvedValue(undefined),
      };

      (store as any).redis = mockRedisInstance;
      (store as any).available = true;
    });

    it('should allow request if under limit', async () => {
      mockMulti.exec.mockResolvedValue([
        [null, 1], // incr result
        [null, -1] // pttl result
      ]);

      const result = await store.checkRateLimit('wh-1', 5, 60000);
      
      expect(result).toBe(true);
      expect(mockRedisInstance.pexpire).toHaveBeenCalledWith('webhook_rate_limit:wh-1', 60000);
    });

    it('should deny request if over limit', async () => {
      mockMulti.exec.mockResolvedValue([
        [null, 6], // incr result
        [null, 50000] // pttl result
      ]);

      const result = await store.checkRateLimit('wh-1', 5, 60000);
      
      expect(result).toBe(false);
      expect(mockRedisInstance.pexpire).not.toHaveBeenCalled(); // No pexpire call for >1 count
    });

    it('should fallback if redis multi exec fails', async () => {
      mockMulti.exec.mockRejectedValue(new Error('Redis is down'));

      const result = await store.checkRateLimit('wh-1', 5, 60000);
      
      // Should fallback and succeed
      expect(result).toBe(true);
      // Map should have it
      expect((store as any).fallbackMap.has('wh-1')).toBe(true);
    });
  });
});
