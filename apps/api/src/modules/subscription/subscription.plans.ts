export const PLANS = {
  // === Patient Plans ===
  trial: {
    type: 'patient' as const,
    monthlyMessageLimit: 9999,
    sessionMessageLimit: 9999,
    trialDays: 7,
    price: 0,
    stripePriceId: null,
    stripeYearlyPriceId: null,
  },
  lite: {
    type: 'patient' as const,
    monthlyMessageLimit: 200,
    sessionMessageLimit: 30,
    trialDays: 0,
    price: 999,
    yearlyPrice: 7990,
    stripePriceId: null as string | null,
    stripeYearlyPriceId: null as string | null,
  },
  standard: {
    type: 'patient' as const,
    monthlyMessageLimit: 500,
    sessionMessageLimit: 50,
    trialDays: 0,
    price: 1999,
    yearlyPrice: 15990,
    stripePriceId: null as string | null,
    stripeYearlyPriceId: null as string | null,
  },
  premium: {
    type: 'patient' as const,
    monthlyMessageLimit: 1500,
    sessionMessageLimit: 80,
    trialDays: 0,
    price: 3999,
    yearlyPrice: 31990,
    stripePriceId: null as string | null,
    stripeYearlyPriceId: null as string | null,
  },

  // === Therapist Plans ===
  therapist_trial: {
    type: 'therapist' as const,
    patientLimit: -1,
    reportLimit: -1,
    trialDays: 14,
    price: 0,
    stripePriceId: null,
    stripeYearlyPriceId: null,
  },
  therapist_solo: {
    type: 'therapist' as const,
    patientLimit: 10,
    reportLimit: 10,
    trialDays: 0,
    price: 2900,
    yearlyPrice: 23200,
    stripePriceId: null as string | null,
    stripeYearlyPriceId: null as string | null,
  },
  therapist_practice: {
    type: 'therapist' as const,
    patientLimit: 30,
    reportLimit: -1,
    trialDays: 0,
    price: 5900,
    yearlyPrice: 47200,
    stripePriceId: null as string | null,
    stripeYearlyPriceId: null as string | null,
  },
  therapist_clinic: {
    type: 'therapist' as const,
    patientLimit: -1,
    reportLimit: -1,
    trialDays: 0,
    pricePerSeat: 3900,
    stripePriceId: null as string | null,
    stripeYearlyPriceId: null as string | null,
  },
} as const;

export const YEARLY_DISCOUNT_PERCENT = 33;

export type PlanId = keyof typeof PLANS;
export type PatientPlanId = 'trial' | 'lite' | 'standard' | 'premium';
export type TherapistPlanId =
  | 'therapist_trial'
  | 'therapist_solo'
  | 'therapist_practice'
  | 'therapist_clinic';

export const MESSAGE_PACKS = {
  pack_50: { messages: 50, price: 299, stripePriceId: null as string | null },
  pack_150: { messages: 150, price: 699, stripePriceId: null as string | null },
  pack_400: { messages: 400, price: 1499, stripePriceId: null as string | null },
} as const;

export type MessagePackId = keyof typeof MESSAGE_PACKS;
