import React from 'react';
import HeroSection from './sections/HeroSection';
import BuilderShowcaseSection from './sections/BuilderShowcaseSection';
import AudienceSection from './sections/AudienceSection';
import ProblemSection from './sections/ProblemSection';
import HowItWorksSection from './sections/HowItWorksSection';
import OutcomesSection from './sections/OutcomesSection';
import BusinessExamplesSection from './sections/BusinessExamplesSection';
import CapabilitiesSection from './sections/CapabilitiesSection';
import FaqSection from './sections/FaqSection';
import FinalCtaSection from './sections/FinalCtaSection';

const HomePage = () => {
  return (
    <main className="bg-[#0A0A0A] text-white">
      <HeroSection />
      <BuilderShowcaseSection />
      <AudienceSection />
      <ProblemSection />
      <HowItWorksSection />
      <OutcomesSection />
      <BusinessExamplesSection />
      <CapabilitiesSection />
      <FaqSection />
      <FinalCtaSection />
    </main>
  );
};

export default HomePage;