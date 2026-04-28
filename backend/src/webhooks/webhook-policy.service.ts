import { Injectable, ForbiddenException } from '@nestjs/common';
import { Webhook } from './webhook.entity';
import { AuthUser } from '../auth/types/auth-user.interface';

@Injectable()
export class WebhookPolicyService {
  /**
   * Enforces that the current user owns the webhook
   */
  assertOwnership(user: AuthUser, webhook: Webhook): void {
    if (webhook.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to access or modify this webhook');
    }
  }
}
