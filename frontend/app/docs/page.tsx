import { Metadata } from "next";
import DocsPage from "./DocsClient";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Learn how to use Nestera, understand the technology behind our decentralized savings platform, and find answers to your questions.",
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: "Documentation - Nestera",
    description: "Learn how to use Nestera, understand the technology behind our decentralized savings platform, and find answers to your questions.",
    images: ["/api/og?page=docs"],
  },
};

export default function Page() {
  return <DocsPage />;
}
