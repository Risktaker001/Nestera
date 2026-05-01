import { Metadata } from "next";
import LandingPage from './LandingPage/LandingPage';
import JsonLd from "./components/JsonLd";

export const metadata: Metadata = {
  title: "Nestera - Decentralized Savings on Stellar",
  description: "Experience the future of decentralized savings on Stellar. Nestera provides secure, transparent, and automated goal-based savings powered by Soroban smart contracts.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Nestera - Decentralized Savings on Stellar",
    description: "Experience the future of decentralized savings on Stellar. Nestera provides secure, transparent, and automated goal-based savings powered by Soroban smart contracts.",
    images: ["/api/og?page=home"],
  },
};

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    "name": "Nestera Savings",
    "description": "Decentralized savings on Stellar",
    "provider": {
      "@type": "Organization",
      "name": "Nestera",
      "url": "https://nestera.app"
    },
    "offers": {
      "@type": "Offer",
      "description": "Up to 12% APY on-chain savings"
    }
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <LandingPage />
    </>
  );
}