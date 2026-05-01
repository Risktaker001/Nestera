import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FeaturesHero from './components/FeaturesHero';
import FeatureGrid from './components/FeatureGrid';
import SecuritySection from './components/SecuritySection';
import YieldSection from './components/YieldSection';
import MultiAssetSection from './components/MultiAssetSection';
import GoalToolsSection from './components/GoalToolsSection';
import FeaturesCta from './components/FeaturesCta';

export const metadata: Metadata = {
  title: "Platform Features",
  description: "Discover the powerful features of Nestera, including automated saving pools, transparent yield generation, and secure smart contracts.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "Platform Features - Nestera",
    description: "Discover the powerful features of Nestera, including automated saving pools, transparent yield generation, and secure smart contracts.",
    images: ["/api/og?page=features"],
  },
};

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#061a1a]">
      <Navbar />
      <FeaturesHero />
      <FeatureGrid />
      <SecuritySection />
      <YieldSection />
      <MultiAssetSection />
      <GoalToolsSection />
      <FeaturesCta />
      <Footer />
    </main>
  );
}
