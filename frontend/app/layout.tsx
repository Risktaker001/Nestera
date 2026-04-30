import "./globals.css";

import { cookies } from "next/headers";
import type { Metadata } from "next";
import AppProviders from "./providers";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "./context/ThemeContext";
import { WalletProvider } from "./context/WalletContext";
import { ToastProvider } from "./context/ToastContext";

import { env } from "./config/env";

const BASE_URL = env.baseUrl;

const supportedLocales = ["en", "es"] as const;

const localeMessages = {
  en: () => import("../locales/en.json").then((module) => module.default),
  es: () => import("../locales/es.json").then((module) => module.default),
} as const;

const themeBootScript = `(function(){try{var key='nestera-theme';var root=document.documentElement;var stored=window.localStorage.getItem(key);var theme=stored==='light'||stored==='dark'||stored==='system'?stored:'system';var resolved=theme==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':theme==='system'?'light':theme;root.dataset.themePreference=theme;root.dataset.theme=resolved;root.classList.remove('light','dark');root.classList.add(resolved);root.style.colorScheme=resolved;}catch(error){document.documentElement.dataset.themePreference='system';}})();`;

export const metadata: Metadata = {
  title: "Nestera - Decentralized Savings on Stellar",
  description: "Secure, transparent savings powered by Stellar & Soroban",
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nestera - Decentralized Savings on Stellar",
    description: "Secure, transparent savings powered by Stellar & Soroban",
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const localeCookie = cookies().get("nestera-locale")?.value;
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
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
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
