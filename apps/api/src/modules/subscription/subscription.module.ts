import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Message } from '../chat/entities/message.entity';
import { MessageUsage } from './entities/message-usage.entity';
import { Subscription } from './entities/subscription.entity';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeService } from './stripe.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { UsageService } from './usage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, MessageUsage, Message])],
  controllers: [SubscriptionController, StripeWebhookController],
  providers: [SubscriptionService, UsageService, StripeService],
  exports: [SubscriptionService, UsageService],
})
export class SubscriptionModule {}
