import type { Metadata } from "next";
import { cookies } from "next/headers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { formatDate } from "../lib/intl";
import { env } from "../config/env";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Nestera collects, uses, and protects your data on our decentralized savings platform.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy - Nestera",
    description: "Learn how Nestera collects, uses, and protects your data on our decentralized savings platform.",
    images: ["/api/og?page=home"],
  },
};
const pageCopy = {
  en: {
    title: "Privacy Policy",
    metadataTitle: "Privacy Policy — Nestera",
    metadataDescription:
      "Privacy Policy for Nestera - Decentralized Savings on Stellar",
    lastUpdated: "Last updated:",
  },
  es: {
    title: "Política de privacidad",
    metadataTitle: "Política de privacidad — Nestera",
    metadataDescription:
      "Política de privacidad de Nestera - Ahorros descentralizados en Stellar",
    lastUpdated: "Última actualización:",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await cookies()).get("nestera-locale")?.value === "es" ? "es" : "en";
  const content = pageCopy[locale];

  return {
    title: content.metadataTitle,
    description: content.metadataDescription,
  };
}

export default async function PrivacyPage() {
  const locale = (await cookies()).get("nestera-locale")?.value === "es" ? "es" : "en";
  const content = pageCopy[locale];

  return (
    <main className="min-h-screen bg-[#061a1a]">
      <Navbar />
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">{content.title}</h1>

        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 mb-8">
            {content.lastUpdated} {formatDate(new Date(), locale)}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-300 mb-4">
              Nestera (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
              respects your privacy and is committed to protecting your personal
              data. This privacy policy explains how we collect, use, disclose,
              and safeguard your information when you use our decentralized
              savings platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              2. Information We Collect
            </h2>
            <p className="text-gray-300 mb-4">
              As a decentralized platform, we minimize data collection. We may
              collect:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>
                <strong>Wallet Addresses:</strong> Public blockchain addresses
                associated with your account
              </li>
              <li>
                <strong>Transaction Data:</strong> Public transaction history on
                the Stellar blockchain
              </li>
              <li>
                <strong>Usage Analytics:</strong> Anonymous usage patterns and
                feature interactions
              </li>
              <li>
                <strong>Device Information:</strong> Browser type, operating
                system, and screen resolution
              </li>
              <li>
                <strong>Communication Data:</strong> Messages sent through our
                support channels
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-300 mb-4">
              We use collected information to:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Provide and maintain our decentralized savings services</li>
              <li>Process transactions and manage your savings goals</li>
              <li>Improve platform functionality and user experience</li>
              <li>Ensure security and prevent fraudulent activities</li>
              <li>Comply with legal obligations and regulatory requirements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              4. Data Protection and Security
            </h2>
            <p className="text-gray-300 mb-4">
              We implement robust security measures to protect your data:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>End-to-end encryption for data transmission</li>
              <li>Secure server infrastructure with regular security audits</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Regular security updates and vulnerability assessments</li>
              <li>Incident response procedures for data breaches</li>
            </ul>
            <p className="text-gray-300 mb-4">
              However, as a decentralized platform, the security of your funds
              ultimately depends on your wallet security practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              5. Cookie Policy
            </h2>
            <p className="text-gray-300 mb-4">
              We use cookies and similar technologies to enhance your
              experience:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>
                <strong>Essential Cookies:</strong> Required for basic platform
                functionality
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand how users
                interact with our platform
              </li>
              <li>
                <strong>Preference Cookies:</strong> Remember your settings and
                preferences
              </li>
            </ul>
            <p className="text-gray-300 mb-4">
              You can control cookie settings through your browser preferences.
              Disabling certain cookies may affect platform functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              6. Data Sharing and Disclosure
            </h2>
            <p className="text-gray-300 mb-4">
              We do not sell, trade, or rent your personal information. We may
              share information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations or court orders</li>
              <li>To prevent fraud, security threats, or illegal activities</li>
              <li>
                With service providers who assist our operations (under strict
                confidentiality agreements)
              </li>
              <li>In connection with a business transfer or acquisition</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              7. Your Rights
            </h2>
            <p className="text-gray-300 mb-4">
              Depending on your location, you may have the following rights
              regarding your personal data:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of the personal data we
                hold about you
              </li>
              <li>
                <strong>Rectification:</strong> Correct inaccurate or incomplete
                data
              </li>
              <li>
                <strong>Erasure:</strong> Request deletion of your personal data
                (subject to legal requirements)
              </li>
              <li>
                <strong>Portability:</strong> Receive your data in a structured,
                machine-readable format
              </li>
              <li>
                <strong>Restriction:</strong> Limit how we process your data
              </li>
              <li>
                <strong>Objection:</strong> Object to certain types of data
                processing
              </li>
            </ul>
            <p className="text-gray-300 mb-4">
              To exercise these rights, please contact us at
              {env.legalEmail}.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              8. International Data Transfers
            </h2>
            <p className="text-gray-300 mb-4">
              As a global decentralized platform, your data may be transferred
              to and processed in countries other than your own. We ensure
              appropriate safeguards are in place to protect your data during
              such transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              9. Children&apos;s Privacy
            </h2>
            <p className="text-gray-300 mb-4">
              Our service is not intended for children under 18 years of age. We
              do not knowingly collect personal information from children under
              18. If we become aware that we have collected personal data from a
              child under 18, we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              10. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-300 mb-4">
              We may update this privacy policy from time to time. We will
              notify users of material changes through our platform or via
              email. Your continued use of Nestera after such modifications
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              11. Contact Us
            </h2>
            <p className="text-gray-300 mb-4">
              If you have any questions about this Privacy Policy or our data
              practices, please contact us at:
            </p>
            <p className="text-gray-300 mb-4">
              Email: {env.legalEmail}
              <br />
              Address: [Company Address]
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
