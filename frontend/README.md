This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

> **Important**: This project exclusively uses `pnpm`. Please do not use `npm` or `yarn` to avoid lockfile conflicts.

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Storybook

We use Storybook to document and showcase our reusable UI components in isolation.

To start Storybook locally:

```bash
pnpm storybook
```

To build Storybook for deployment:

```bash
pnpm build-storybook
```

The documentation includes:
- **UI Components**: Button, Input, Card, Toast, etc.
- **Dashboard Components**: NetWorthCard, WalletBalanceCard.
- **Context Mocks**: Integration with Wallet and Theme contexts.
- **Accessibility**: A11y addon for testing WCAG compliance.
