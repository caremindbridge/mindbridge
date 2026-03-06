export type PlanId =
  | 'trial'
  | 'lite'
  | 'standard'
  | 'premium'
  | 'therapist_trial'
  | 'therapist_solo'
  | 'therapist_practice'
  | 'therapist_clinic';

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
export type MessagePackId = 'pack_50' | 'pack_150' | 'pack_400';

export interface UsageStatus {
  hasSubscription: boolean;
  plan?: string;
  status?: SubscriptionStatus;
  trialDaysLeft?: number | null;
  monthly?: {
    used: number;
    limit: number;
    remaining: number;
    bonusRemaining: number;
    totalRemaining: number;
  };
  session?: {
    used: number;
    limit: number;
  };
  periodEnd?: string;
  paymentWarning?: boolean;
  grace?: boolean;
  graceRemaining?: number;
  patientLimit?: number | null;
}

export interface PlanInfo {
  id: PlanId;
  name: string;
  price: number;
  monthlyMessageLimit?: number;
  sessionMessageLimit?: number;
  patientLimit?: number;
  reportLimit?: number;
  features: string[];
}
