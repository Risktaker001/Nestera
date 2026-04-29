This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

> **Important**: This project exclusively uses `pnpm`. Please do not use `npm` or `yarn` to avoid lockfile conflicts.

First, run the development server:

```bash
pnpm dev
```

### Environment Setup

Copy the example environment file and update it with your local values:

```bash
cp .env.example .env.local
```

The following variables are required:
- `NEXT_PUBLIC_BASE_URL`: The base URL of the application.
- `NEXT_PUBLIC_HORIZON_PUBLIC_URL`: Stellar Horizon API for Mainnet.
- `NEXT_PUBLIC_HORIZON_TESTNET_URL`: Stellar Horizon API for Testnet.
- `NEXT_PUBLIC_COINGECKO_API_URL`: CoinGecko API URL for price data.
- `NEXT_PUBLIC_DISCORD_URL`: Discord invite link.
- `NEXT_PUBLIC_TELEGRAM_URL`: Telegram group link.
- `NEXT_PUBLIC_GITHUB_URL`: GitHub repository link.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
