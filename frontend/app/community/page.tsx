import { Metadata } from "next";
import CommunityPage from "./CommunityClient";

export const metadata: Metadata = {
  title: "Community & Governance",
  description: "Join the Nestera community. Participate in governance, propose new features, and help shape the future of decentralized savings.",
  alternates: {
    canonical: "/community",
  },
  openGraph: {
    title: "Community & Governance - Nestera",
    description: "Join the Nestera community. Participate in governance, propose new features, and help shape the future of decentralized savings.",
    images: ["/api/og?page=community"],
  },
};

export default function Page() {
  return <CommunityPage />;
}
