import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { MessagePackId, PatientPlanId, TherapistPlanId } from './subscription.plans';
import { StripeService } from './stripe.service';
import { UsageService } from './usage.service';

class CheckoutDto {
  planId!: PatientPlanId | TherapistPlanId;
}

class PackCheckoutDto {
  packId!: MessagePackId;
}

@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly usageService: UsageService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  async getUsage(
    @CurrentUser() user: { id: string },
    @Query('sessionId') sessionId?: string,
  ) {
    return this.usageService.getStatus(user.id, sessionId);
  }

  @Get('plans')
  getPlans() {
    return {
      patient: [
        {
          id: 'lite',
          name: 'Lite',
          price: 999,
          monthlyMessageLimit: 200,
          sessionMessageLimit: 30,
          features: [
            '200 messages/month',
            '30 per session',
            'Full dashboard',
            'AI analysis',
            'Therapist connection',
          ],
        },
        {
          id: 'standard',
          name: 'Standard',
          price: 1999,
          monthlyMessageLimit: 500,
          sessionMessageLimit: 50,
          popular: true,
          features: [
            '500 messages/month',
            '50 per session',
            'Full dashboard',
            'AI analysis',
            'Therapist connection',
          ],
        },
        {
          id: 'premium',
          name: 'Premium',
          price: 3999,
          monthlyMessageLimit: 1500,
          sessionMessageLimit: 80,
          features: [
            '1,500 messages/month',
            '80 per session',
            'Full dashboard',
            'AI analysis',
            'Therapist connection',
            'Priority responses',
          ],
        },
      ],
      therapist: [
        {
          id: 'therapist_solo',
          name: 'Solo',
          price: 2900,
          patientLimit: 10,
          reportLimit: 10,
          features: ['10 patients', '10 AI reports/month', 'Patient dossiers', 'Mira instructions'],
        },
        {
          id: 'therapist_practice',
          name: 'Practice',
          price: 5900,
          patientLimit: 30,
          reportLimit: -1,
          popular: true,
          features: [
            '30 patients',
            'Unlimited reports',
            'Patient dossiers',
            'Mira instructions',
          ],
        },
        {
          id: 'therapist_clinic',
          name: 'Clinic',
          pricePerSeat: 3900,
          patientLimit: -1,
          reportLimit: -1,
          features: [
            'Unlimited patients',
            'Unlimited reports',
            'Leadership dashboard',
            'Custom branding',
          ],
        },
      ],
      messagePacks: [
        { id: 'pack_50', messages: 50, price: 299 },
        { id: 'pack_150', messages: 150, price: 699, popular: true },
        { id: 'pack_400', messages: 400, price: 1499, bestValue: true },
      ],
    };
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: CheckoutDto,
  ) {
    const frontendUrl = this.configService.get<string>('frontendUrl');
    return this.stripeService.createCheckoutSession(
      user.id,
      user.email,
      dto.planId,
      `${frontendUrl}/dashboard?upgraded=true`,
      `${frontendUrl}/dashboard?canceled=1`,
    );
  }

  @Post('checkout/pack')
  @UseGuards(JwtAuthGuard)
  async createPackCheckout(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: PackCheckoutDto,
  ) {
    const frontendUrl = this.configService.get<string>('frontendUrl');
    return this.stripeService.createPackCheckout(
      user.id,
      user.email,
      dto.packId,
      `${frontendUrl}/dashboard?pack_purchased=true`,
      `${frontendUrl}/dashboard?canceled=1`,
    );
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async createPortal(@CurrentUser() user: { id: string }) {
    const frontendUrl = this.configService.get<string>('frontendUrl');
    const sub = await this.usageService.getSubscription(user.id);
    if (!sub?.stripeCustomerId) {
      return { url: null, message: 'No billing account found' };
    }
    return this.stripeService.createPortalSession(
      user.id,
      sub.stripeCustomerId,
      `${frontendUrl}/dashboard/subscription`,
    );
  }
}
