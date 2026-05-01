/**
 * Environment variables configuration and validation.
 * Ensures all required environment variables are present and correctly formatted.
 * 
 * NEXT_PUBLIC_* variables are available on both client and server.
 * Note: Next.js statically replaces process.env.NEXT_PUBLIC_* with the actual value at build time for client-side use.
 * 
 * Fail Fast: This module throws an error during initialization if required variables are missing.
 */

export const env = {
  // Public variables (baked into client bundle)
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL!,
  horizonPublicUrl: process.env.NEXT_PUBLIC_HORIZON_PUBLIC_URL!,
  horizonTestnetUrl: process.env.NEXT_PUBLIC_HORIZON_TESTNET_URL!,
  coinGeckoApiUrl: process.env.NEXT_PUBLIC_COINGECKO_API_URL!,
  discordUrl: process.env.NEXT_PUBLIC_DISCORD_URL!,
  telegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_URL!,
  githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL!,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL!,
  legalEmail: process.env.NEXT_PUBLIC_LEGAL_EMAIL!,
  
  // Server-only variables (will be undefined on client)
  backendApiUrl: process.env.BACKEND_API_URL,
} as const;

/**
 * Validates that all required environment variables are set.
 * Throws an error if any are missing.
 */
export const validateEnv = () => {
  const missing: string[] = [];

  // Required on both client and server
  if (!process.env.NEXT_PUBLIC_BASE_URL) missing.push("NEXT_PUBLIC_BASE_URL");
  if (!process.env.NEXT_PUBLIC_HORIZON_PUBLIC_URL) missing.push("NEXT_PUBLIC_HORIZON_PUBLIC_URL");
  if (!process.env.NEXT_PUBLIC_HORIZON_TESTNET_URL) missing.push("NEXT_PUBLIC_HORIZON_TESTNET_URL");
  if (!process.env.NEXT_PUBLIC_COINGECKO_API_URL) missing.push("NEXT_PUBLIC_COINGECKO_API_URL");
  if (!process.env.NEXT_PUBLIC_DISCORD_URL) missing.push("NEXT_PUBLIC_DISCORD_URL");
  if (!process.env.NEXT_PUBLIC_TELEGRAM_URL) missing.push("NEXT_PUBLIC_TELEGRAM_URL");
  if (!process.env.NEXT_PUBLIC_GITHUB_URL) missing.push("NEXT_PUBLIC_GITHUB_URL");
  if (!process.env.NEXT_PUBLIC_SUPPORT_EMAIL) missing.push("NEXT_PUBLIC_SUPPORT_EMAIL");
  if (!process.env.NEXT_PUBLIC_LEGAL_EMAIL) missing.push("NEXT_PUBLIC_LEGAL_EMAIL");

  // Required only on server
  if (typeof window === "undefined") {
    if (!process.env.BACKEND_API_URL) missing.push("BACKEND_API_URL");
  }

  if (missing.length > 0) {
    throw new Error(`[Env Validation Error] The following environment variables are missing: ${missing.join(", ")}. Please check your .env.local file.`);
  }
};

// Validate on module load (Server always, Client in dev to catch issues early)
if (typeof window === "undefined" || process.env.NODE_ENV === "development") {
  validateEnv();
}
