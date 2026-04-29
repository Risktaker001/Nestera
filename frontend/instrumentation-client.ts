import * as Sentry from "@sentry/nextjs";
import { getMonitoringConfig, sanitizeBreadcrumb, sanitizeSentryEvent } from "./app/lib/monitoring";

const config = getMonitoringConfig();

if (config.enabled) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: config.environment,
    release: config.release,
    tracesSampleRate: config.tracesSampleRate,
    replaysSessionSampleRate: config.replaysSessionSampleRate,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
    beforeSend: sanitizeSentryEvent,
    beforeBreadcrumb: sanitizeBreadcrumb,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
        maskAllInputs: true,
      }),
    ],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
