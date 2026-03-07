import { LandingFooter } from '@/widgets/landing/landing-footer';
import { LandingHeader } from '@/widgets/landing/landing-header';
import { BridgeSection } from '@/widgets/landing/sections/bridge-section';
import { CtaSection } from '@/widgets/landing/sections/cta-section';
import { DemoDialoguesSection } from '@/widgets/landing/sections/demo-dialogues-section';
import { FounderSection } from '@/widgets/landing/sections/founder-section';
import { HeroSection } from '@/widgets/landing/sections/hero-section';
import { HowItWorksSection } from '@/widgets/landing/sections/how-it-works-section';
import { PricingSection } from '@/widgets/landing/sections/pricing-section';
import { StatsSection } from '@/widgets/landing/sections/stats-section';
import { TwoPathsSection } from '@/widgets/landing/sections/two-paths-section';

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <LandingHeader />
      <main>
        <HeroSection />
        <DemoDialoguesSection />
        <StatsSection />
        <BridgeSection />
        <TwoPathsSection />
        <HowItWorksSection />
        <FounderSection />
        <PricingSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
