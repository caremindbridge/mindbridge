import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import type { MessagePackId, PatientPlanId, TherapistPlanId } from './subscription.plans';
import { SubscriptionService } from './subscription.service';
import { UsageService } from './usage.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe | null;
  private readonly webhookSecret: string | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly subscriptionService: SubscriptionService,
    private readonly usageService: UsageService,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    this.webhookSecret = this.configService.get<string>('stripe.webhookSecret') ?? null;

    if (secretKey) {
      this.stripe = new Stripe(secretKey, { apiVersion: '2026-02-25.clover' });
    } else {
      this.stripe = null;
      this.logger.warn('STRIPE_SECRET_KEY not set — payments disabled');
    }
  }

  isEnabled(): boolean {
    return this.stripe !== null;
  }

  async createCheckoutSession(
    userId: string,
    email: string,
    planId: PatientPlanId | TherapistPlanId,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ url: string | null; message?: string }> {
    if (!this.stripe) return { url: null, message: 'Payments coming soon' };

    const priceId = this.configService.get<string>(`stripe.prices.${planId}`);
    if (!priceId) return { url: null, message: `Price for plan '${planId}' not configured` };

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, planId },
    });

    return { url: session.url };
  }

  async createPackCheckout(
    userId: string,
    email: string,
    packId: MessagePackId,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ url: string | null; message?: string }> {
    if (!this.stripe) return { url: null, message: 'Payments coming soon' };

    const priceId = this.configService.get<string>(`stripe.prices.${packId}`);
    if (!priceId) return { url: null, message: `Price for pack '${packId}' not configured` };

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, packId },
    });

    return { url: session.url };
  }

  async createPortalSession(
    userId: string,
    stripeCustomerId: string,
    returnUrl: string,
  ): Promise<{ url: string | null; message?: string }> {
    if (!this.stripe) return { url: null, message: 'Payments coming soon' };

    const session = await this.stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    if (!this.stripe || !this.webhookSecret) {
      this.logger.warn('Webhook received but Stripe not configured');
      return;
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err) {
      this.logger.error('Webhook signature verification failed:', err);
      throw err;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionChange(sub);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const paidSubId = this.getInvoiceSubscriptionId(invoice);
        if (paidSubId) {
          await this.subscriptionService.reactivate(paidSubId);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const failedSubId = this.getInvoiceSubscriptionId(invoice);
        if (failedSubId) {
          await this.subscriptionService.setPastDue(failedSubId);
        }
        break;
      }
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }

  private getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
    const subDetails = invoice.parent?.subscription_details;
    if (!subDetails) return null;
    const sub = subDetails.subscription;
    return typeof sub === 'string' ? sub : (sub?.id ?? null);
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId as PatientPlanId | TherapistPlanId | undefined;
    const packId = session.metadata?.packId as MessagePackId | undefined;

    if (!userId) {
      this.logger.error('checkout.session.completed: missing userId in metadata');
      return;
    }

    if (planId && session.mode === 'subscription') {
      await this.subscriptionService.upgradePlan(userId, planId, session.customer as string, session.subscription as string);
    } else if (packId && session.mode === 'payment') {
      const packMessages: Record<string, number> = { pack_50: 50, pack_150: 150, pack_400: 400 };
      const count = packMessages[packId] ?? 0;
      if (count > 0) {
        await this.usageService.addBonusMessages(userId, count);
      }
    }
  }

  private async handleSubscriptionChange(stripeSub: Stripe.Subscription): Promise<void> {
    const stripeSubId = stripeSub.id;

    switch (stripeSub.status) {
      case 'canceled':
      case 'unpaid':
        await this.subscriptionService.cancelByStripeId(stripeSubId);
        break;
      case 'past_due':
        await this.subscriptionService.setPastDue(stripeSubId);
        break;
      case 'active': {
        const firstItem = stripeSub.items.data[0];
        if (firstItem) {
          const periodStart = new Date(firstItem.current_period_start * 1000);
          const periodEnd = new Date(firstItem.current_period_end * 1000);
          await this.subscriptionService.renewPeriod(stripeSubId, periodStart, periodEnd);
        }
        break;
      }
      default:
        this.logger.debug(`Unhandled subscription status: ${stripeSub.status}`);
    }
  }
}
