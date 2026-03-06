import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { YEARLY_DISCOUNT_PERCENT } from './subscription.plans';
import type { MessagePackId, PatientPlanId, TherapistPlanId } from './subscription.plans';
import { StripeService } from './stripe.service';
import { UsageService } from './usage.service';

class CheckoutDto {
  planId!: PatientPlanId | TherapistPlanId;
  billing?: 'monthly' | 'yearly';
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
    @CurrentUser() user: { id: string; role: string; activeMode?: string },
    @Query('sessionId') sessionId?: string,
    @Query('planType') planType?: 'patient' | 'therapist',
  ) {
    const effectivePlanType: 'patient' | 'therapist' =
      planType ?? (user.role === 'therapist' && user.activeMode !== 'patient' ? 'therapist' : 'patient');
    return this.usageService.getStatus(user.id, sessionId, effectivePlanType);
  }

  @Get('plans')
  getPlans(@Req() req: { headers: { authorization?: string } }) {
    let userRole: string | null = null;
    const auth = req.headers?.authorization;
    if (auth?.startsWith('Bearer ')) {
      try {
        const payloadB64 = auth.slice(7).split('.')[1];
        const decoded = JSON.parse(
          Buffer.from(payloadB64, 'base64url').toString('utf-8'),
        ) as { role?: string };
        userRole = decoded.role ?? null;
      } catch {
        /* unauthenticated */
      }
    }

    return {
      patient: [
        {
          id: 'lite',
          name: 'Lite',
          monthlyPrice: 999,
          yearlyPrice: 7990,
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
          monthlyPrice: 1999,
          yearlyPrice: 15990,
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
          monthlyPrice: 3999,
          yearlyPrice: 31990,
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
          monthlyPrice: 2900,
          yearlyPrice: 23200,
          patientLimit: 10,
          reportLimit: 10,
          features: ['10 patients', '10 AI reports/month', 'Patient dossiers', 'Mira instructions'],
        },
        {
          id: 'therapist_practice',
          name: 'Practice',
          monthlyPrice: 5900,
          yearlyPrice: 47200,
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
          monthlyPricePerSeat: 3900,
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
      yearlyDiscountPercent: YEARLY_DISCOUNT_PERCENT,
      userRole,
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
      dto.billing ?? 'monthly',
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
