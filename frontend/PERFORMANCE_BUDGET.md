# Nestera Performance Budget

This document outlines the performance targets and budgets for the Nestera frontend application.

## Core Web Vitals Targets

| Metric | Target (Good) | Target (Needs Improvement) |
| :--- | :--- | :--- |
| **LCP** (Largest Contentful Paint) | < 2.5s | < 4.0s |
| **FID** (First Input Delay) | < 100ms | < 300ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.25 |
| **FCP** (First Contentful Paint) | < 1.8s | < 3.0s |
| **TTFB** (Time to First Byte) | < 0.8s | < 1.8s |

## Bundle Size Budget

We aim to keep our bundle size within the following limits to ensure fast loading on slower networks:

| Category | Maximum Size (Gzip) | Warning Threshold |
| :--- | :--- | :--- |
| **Main Bundle** (JS) | 200 KB | 150 KB |
| **Total Page Size** | 500 KB | 400 KB |
| **Critical CSS** | 50 KB | 30 KB |

## Monitoring Process

1.  **Continuous Integration**: Every Pull Request triggers a `Bundle Analysis` workflow.
2.  **Runtime Monitoring**: Real User Monitoring (RUM) is implemented via `WebVitals.tsx` and Google Analytics.
3.  **Error Tracking**: Sentry is used to monitor performance bottlenecks and frontend errors.

## Optimization Strategies

- **Code Splitting**: Use Next.js dynamic imports for heavy components (e.g., charts, wallet modals).
- **Image Optimization**: Always use `next/image` with proper `priority` and `sizes`.
- **Font Loading**: Use `next/font` to minimize FOIT/FONT.
- **Tree Shaking**: Ensure third-party libraries (like `stellar-sdk`) are imported in a way that allows tree shaking.
