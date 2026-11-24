import React from 'react';
import HomeNav from './components/HomeNav';
import HomeFooter from './components/HomeFooter';
import HeroSection from './sections/HeroSection';
import AgencySection from './sections/AgencySection';
import AudienceSection from './sections/AudienceSection';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <HomeNav />
      <HeroSection />
      <AgencySection />
      <AudienceSection />
      <HomeFooter />
    </div>
  );
};

export default HomePage;
