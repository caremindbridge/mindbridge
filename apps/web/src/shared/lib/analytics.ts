import posthog from 'posthog-js';

export const analytics = {
  // === Auth ===
  signUp(method: 'email' | 'google', role: 'patient' | 'therapist') {
    posthog.capture('user_signed_up', { method, role });
  },

  signIn(method: 'email' | 'google') {
    posthog.capture('user_signed_in', { method });
  },

  identify(user: { id: string; email: string; role: string; plan?: string; locale?: string; createdAt?: string }) {
    posthog.identify(user.id, {
      email: user.email,
      role: user.role,
      plan: user.plan ?? 'trial',
      locale: user.locale ?? 'en',
      created_at: user.createdAt,
    });
  },

  reset() {
    posthog.reset();
  },

  // === Sessions ===
  sessionStarted(sessionId: string) {
    posthog.capture('session_started', { session_id: sessionId });
  },

  messageSent(sessionId: string, messageNumber: number) {
    posthog.capture('message_sent', { session_id: sessionId, message_number: messageNumber });
  },

  sessionCompleted(sessionId: string, messageCount: number, durationMinutes: number) {
    posthog.capture('session_completed', {
      session_id: sessionId,
      message_count: messageCount,
      duration_minutes: durationMinutes,
    });
  },

  analysisViewed(sessionId: string) {
    posthog.capture('analysis_viewed', { session_id: sessionId });
  },

  // === Mood ===
  moodCheckedIn(score: number, source: 'dashboard' | 'post_session') {
    posthog.capture('mood_checked_in', { score, source });
  },

  // === Subscription ===
  limitReached(type: 'session' | 'monthly' | 'trial_expired') {
    posthog.capture('limit_reached', { type });
  },

  upgradeViewed(source: 'limit_modal' | 'pricing_page' | 'settings' | 'banner') {
    posthog.capture('upgrade_viewed', { source });
  },

  checkoutStarted(planId: string, billing: 'monthly' | 'yearly') {
    posthog.capture('checkout_started', { plan_id: planId, billing });
  },

  subscriptionActivated(planId: string, billing: 'monthly' | 'yearly') {
    posthog.capture('subscription_activated', { plan_id: planId, billing });
  },

  packPurchased(packId: string, messages: number) {
    posthog.capture('pack_purchased', { pack_id: packId, messages });
  },

  // === Therapist ===
  patientInvited() {
    posthog.capture('patient_invited');
  },

  inviteAccepted() {
    posthog.capture('invite_accepted');
  },

  reportGenerated(patientId: string) {
    posthog.capture('report_generated', { patient_id: patientId });
  },

  dossierViewed(patientId: string) {
    posthog.capture('dossier_viewed', { patient_id: patientId });
  },

  // === Engagement ===
  aboutMeFilled(fieldsCount: number) {
    posthog.capture('about_me_filled', { fields_count: fieldsCount });
  },

  languageChanged(from: string, to: string) {
    posthog.capture('language_changed', { from, to });
  },
};
