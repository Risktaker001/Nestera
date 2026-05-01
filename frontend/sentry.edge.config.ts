import * as Sentry from "@sentry/nextjs";
import { getMonitoringConfig, sanitizeBreadcrumb, sanitizeSentryEvent } from "./app/lib/monitoring";

const config = getMonitoringConfig();

if (config.enabled) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: config.environment,
    release: config.release,
    tracesSampleRate: config.tracesSampleRate,
    beforeSend: sanitizeSentryEvent,
    beforeBreadcrumb: sanitizeBreadcrumb,
  });
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
