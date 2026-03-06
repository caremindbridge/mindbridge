import { LandingHeader } from '@/widgets/landing/landing-header';
import { LandingFooter } from '@/widgets/landing/landing-footer';
import { HeroSection } from '@/widgets/landing/sections/hero-section';
import { StatsSection } from '@/widgets/landing/sections/stats-section';
import { FounderSection } from '@/widgets/landing/sections/founder-section';
import { HowItWorksSection } from '@/widgets/landing/sections/how-it-works-section';
import { FeaturesSection } from '@/widgets/landing/sections/features-section';
import { TherapistSection } from '@/widgets/landing/sections/therapist-section';
import { PricingSection } from '@/widgets/landing/sections/pricing-section';
import { CtaSection } from '@/widgets/landing/sections/cta-section';

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <LandingHeader />
      <main>
        <HeroSection />
        <StatsSection />
        <FounderSection />
        <HowItWorksSection />
        <FeaturesSection />
        <TherapistSection />
        <PricingSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
