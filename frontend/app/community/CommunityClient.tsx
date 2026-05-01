'use client';

import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CommunityHero from './components/CommunityHero';
import CommunityStats from './components/CommunityStats';
import ProposalsList from './components/ProposalsList';
import SocialFeeds from './components/SocialFeeds';
import CommunityGuidelines from './components/CommunityGuidelines';

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-[#061a1a]">
      <Navbar />
      
      <CommunityHero />
      
      <div className="relative">
        {/* Horizontal divider with gradient */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <CommunityStats />
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <ProposalsList />
      
      <SocialFeeds />
      
      <CommunityGuidelines />

      <Footer />
    </main>
  );
}
