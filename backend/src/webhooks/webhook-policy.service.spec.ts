import { Test, TestingModule } from '@nestjs/testing';
import { WebhookPolicyService } from './webhook-policy.service';
import { ForbiddenException } from '@nestjs/common';
import { Webhook } from './webhook.entity';
import { AuthUser } from '../auth/types/auth-user.interface';

describe('WebhookPolicyService', () => {
  let service: WebhookPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookPolicyService],
    }).compile();

    service = module.get<WebhookPolicyService>(WebhookPolicyService);
  });

  describe('assertOwnership', () => {
    it('should pass if the user owns the webhook', () => {
      const user: AuthUser = { id: 'user-1', walletAddress: 'abc', raw: {} };
      const webhook = { userId: 'user-1' } as Webhook;

      expect(() => service.assertOwnership(user, webhook)).not.toThrow();
    });

    it('should throw ForbiddenException if the user does not own the webhook', () => {
      const user: AuthUser = { id: 'user-1', walletAddress: 'abc', raw: {} };
      const webhook = { userId: 'user-2' } as Webhook;

      expect(() => service.assertOwnership(user, webhook)).toThrow(ForbiddenException);
    });
  });
});
