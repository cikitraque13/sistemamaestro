import React from 'react';
import HomeNav from './components/HomeNav';
import CookieBanner from './components/CookieBanner';
import HomeFooter from './components/HomeFooter';
import HeroBuilderSection from './sections/HeroBuilderSection';
import AudienceSection from './sections/AudienceSection';
import ProblemSection from './sections/ProblemSection';
import HowItWorksSection from './sections/HowItWorksSection';
import OutcomesSection from './sections/OutcomesSection';
import BusinessExamplesSection from './sections/BusinessExamplesSection';
import CapabilitiesSection from './sections/CapabilitiesSection';
import LeadCaptureSection from './sections/LeadCaptureSection';
import TrustSection from './sections/TrustSection';
import PricingSection from './sections/PricingSection';
import FaqSection from './sections/FaqSection';
import FinalCtaSection from './sections/FinalCtaSection';

const HomePage = () => {
  return (
    <>
      <HomeNav />

      <main className="bg-[#0A0A0A] text-white">
        <HeroBuilderSection />
        <AudienceSection />
        <ProblemSection />
        <HowItWorksSection />
        <OutcomesSection />
        <BusinessExamplesSection />
        <CapabilitiesSection />
        <LeadCaptureSection />
        <TrustSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
      </main>

      <HomeFooter />
      <CookieBanner />
    </>
  );
};

export default HomePage;