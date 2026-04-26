import React from 'react';
import HomeNav from './components/HomeNav';
import HomeFooter from './components/HomeFooter';
import HeroSection from './sections/HeroSection';
import HomeEntrySection from './sections/HomeEntrySection';
import PricingSection from './sections/PricingSection';
import ValueAuthoritySection from './sections/ValueAuthoritySection';
import AudienceSection from './sections/AudienceSection';
import LeadCaptureSection from './sections/LeadCaptureSection';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <HomeNav />
      <HeroSection />
      <HomeEntrySection />
      <PricingSection />
      <ValueAuthoritySection />
      <AudienceSection />
      <LeadCaptureSection />
      <HomeFooter />
    </div>
  );
};

export default HomePage;