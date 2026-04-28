import { Injectable, Logger } from '@nestjs/common';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { Webhook } from './webhook.entity';
import { WebhookEventType } from './webhook.entity';

@Injectable()
export class TestWebhookDispatcher {
  private readonly logger = new Logger(TestWebhookDispatcher.name);

  constructor(private readonly deliveryService: WebhookDeliveryService) {}

  /**
   * Dispatches a test payload to a single specific webhook, bypassing the bulk event fan-out.
   */
  async dispatchTest(
    webhook: Webhook,
    eventType: WebhookEventType,
    payload: Record<string, any>,
  ): Promise<void> {
    this.logger.log(`Dispatching test event ${eventType} to webhook ${webhook.id}`);
    
    // Call a direct delivery method on deliveryService instead of triggerEvent
    await this.deliveryService.triggerSingleWebhook(webhook, eventType, payload);
  }
}
