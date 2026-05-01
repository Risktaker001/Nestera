import "./globals.css";

import { cookies } from "next/headers";
import type { Metadata } from "next";
import AppProviders from "./providers";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "./context/ThemeContext";
import { WalletProvider } from "./context/WalletContext";
import { ToastProvider } from "./context/ToastContext";
import { GoogleAnalytics } from "@next/third-parties/google";
import { WebVitals } from "./components/monitoring/WebVitals";
import { QueryProvider } from "./providers/QueryProvider";

import { env } from "./config/env";

const BASE_URL = env.baseUrl;

const supportedLocales = ["en", "es"] as const;

const localeMessages = {
  en: () => import("../locales/en.json").then((module) => module.default),
  es: () => import("../locales/es.json").then((module) => module.default),
} as const;

const themeBootScript = `(function(){try{var key='nestera-theme';var root=document.documentElement;var stored=window.localStorage.getItem(key);var theme=stored==='light'||stored==='dark'||stored==='system'?stored:'system';var resolved=theme==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':theme==='system'?'light':theme;root.dataset.themePreference=theme;root.dataset.theme=resolved;root.classList.remove('light','dark');root.classList.add(resolved);root.style.colorScheme=resolved;}catch(error){document.documentElement.dataset.themePreference='system';}})();`;

export const metadata: Metadata = {
  title: {
    default: "Nestera - Decentralized Savings on Stellar",
    template: "%s | Nestera",
  },
  description: "Secure, transparent, and automated goal-based savings powered by Stellar & Soroban smart contracts.",
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Nestera",
    title: "Nestera - Decentralized Savings on Stellar",
    description: "Secure, transparent, and automated goal-based savings powered by Stellar & Soroban smart contracts.",
    images: [
      {
        url: "/api/og?page=home",
        width: 1200,
        height: 630,
        alt: "Nestera - Decentralized Savings on Stellar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nestera - Decentralized Savings on Stellar",
    description: "Secure, transparent, and automated goal-based savings powered by Stellar & Soroban smart contracts.",
    images: ["/api/og?page=home"],
    creator: "@nestera_app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const localeCookie = (await cookies()).get("nestera-locale")?.value;
  const locale = supportedLocales.includes(
    localeCookie as (typeof supportedLocales)[number],
  )
    ? (localeCookie as (typeof supportedLocales)[number])
    : "en";
  const messages = await localeMessages[locale]();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="bg-[var(--color-background)] text-[var(--color-text)] antialiased">
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-XXXXXXXXXX"} />
        <WebVitals />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider>
          <QueryProvider>
            <WalletProvider>
              <ToastProvider>
                <main id="main-content">{children}</main>
              </ToastProvider>
            </WalletProvider>
          </QueryProvider>
        </ThemeProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>
            <ThemeProvider>
              <WalletProvider>
                <ToastProvider>
                  <main id="main-content">{children}</main>
                </ToastProvider>
              </WalletProvider>
            </ThemeProvider>
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
