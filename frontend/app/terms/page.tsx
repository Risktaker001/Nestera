import type { Metadata } from "next";
import { cookies } from "next/headers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { formatDate } from "../lib/intl";
import { env } from "../config/env";

const pageCopy = {
  en: {
    title: "Terms of Service",
    metadataTitle: "Terms of Service — Nestera",
    metadataDescription:
      "Terms of Service for Nestera - Decentralized Savings on Stellar",
    lastUpdated: "Last updated:",
  },
  es: {
    title: "Términos del servicio",
    metadataTitle: "Términos del servicio — Nestera",
    metadataDescription:
      "Términos del servicio de Nestera - Ahorros descentralizados en Stellar",
    lastUpdated: "Última actualización:",
  },
} as const;

export function generateMetadata(): Metadata {
  const locale = cookies().get("nestera-locale")?.value === "es" ? "es" : "en";
  const content = pageCopy[locale];

  return {
    title: content.metadataTitle,
    description: content.metadataDescription,
  };
}

export default function TermsPage() {
  const locale = cookies().get("nestera-locale")?.value === "es" ? "es" : "en";
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
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-300 mb-4">
              By accessing and using Nestera (&quot;the Service&quot;), you
              accept and agree to be bound by the terms and provision of this
              agreement. If you do not agree to abide by the above, please do
              not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              2. Description of Service
            </h2>
            <p className="text-gray-300 mb-4">
              Nestera is a decentralized savings platform built on the Stellar
              blockchain. Our service allows users to create and manage savings
              goals, earn yield through smart contracts, and participate in
              decentralized finance activities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              3. User Agreements
            </h2>
            <p className="text-gray-300 mb-4">
              By using Nestera, you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>
                Provide accurate and complete information when creating an
                account
              </li>
              <li>Maintain the security of your wallet and private keys</li>
              <li>
                Use the service in compliance with applicable laws and
                regulations
              </li>
              <li>Not engage in any fraudulent or illegal activities</li>
              <li>
                Accept responsibility for all transactions initiated through
                your account
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              4. Service Limitations
            </h2>
            <p className="text-gray-300 mb-4">
              Nestera provides the service &quot;as is&quot; and &quot;as
              available&quot;. We do not guarantee:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Uninterrupted or error-free operation of the service</li>
              <li>Specific yields or returns on savings</li>
              <li>Compatibility with all wallets or browsers</li>
              <li>
                Protection against all security threats or vulnerabilities
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              5. Blockchain and Smart Contract Risks
            </h2>
            <p className="text-gray-300 mb-4">
              As a decentralized platform, Nestera operates on blockchain
              technology. Users acknowledge and accept:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Risks associated with cryptocurrency volatility</li>
              <li>Potential smart contract vulnerabilities</li>
              <li>Network congestion or delays on the Stellar blockchain</li>
              <li>Irreversible nature of blockchain transactions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              6. Liability Disclaimers
            </h2>
            <p className="text-gray-300 mb-4">
              To the maximum extent permitted by law, Nestera and its affiliates
              shall not be liable for:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>
                Any direct, indirect, incidental, or consequential damages
              </li>
              <li>Loss of profits, data, or cryptocurrency</li>
              <li>Service interruptions or technical failures</li>
              <li>Third-party actions or external market conditions</li>
            </ul>
            <p className="text-gray-300 mb-4">
              Users are solely responsible for their financial decisions and the
              security of their funds.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              7. Termination
            </h2>
            <p className="text-gray-300 mb-4">
              We reserve the right to terminate or suspend your account and
              access to the service at our discretion, without prior notice, for
              conduct that violates these terms or is harmful to other users or
              the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              8. Governing Law
            </h2>
            <p className="text-gray-300 mb-4">
              These terms shall be governed by and construed in accordance with
              the laws of [Jurisdiction], without regard to its conflict of law
              provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              9. Changes to Terms
            </h2>
            <p className="text-gray-300 mb-4">
              We reserve the right to modify these terms at any time. Users will
              be notified of significant changes, and continued use of the
              service constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              10. Contact Information
            </h2>
            <p className="text-gray-300 mb-4">
              If you have any questions about these Terms of Service, please
              contact us at {env.legalEmail}.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
