import * as Sentry from "@sentry/nextjs";

type EventParams = Record<string, string | number | boolean>;

/**
 * Utility for tracking custom events across the application.
 * Wraps Google Analytics (gtag) and Sentry for consistent tracking.
 */
export const trackEvent = (eventName: string, params?: EventParams) => {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[Analytics] Event: ${eventName}`, params);
  }

  // Track in Google Analytics
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, params);
  }

  // Optionally add to Sentry breadcrumbs
  Sentry.addBreadcrumb({
    category: "analytics",
    message: eventName,
    data: params,
    level: "info",
  });
};

/**
 * Utility for reporting errors to Sentry.
 */
export const reportError = (error: unknown, context?: Record<string, any>) => {
  if (process.env.NODE_ENV === "development") {
    console.error(`[Analytics] Error:`, error, context);
  }

  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Predefined event names for consistency.
 */
export const AnalyticsEvents = {
  WALLET_CONNECT_ATTEMPT: "wallet_connect_attempt",
  WALLET_CONNECT_SUCCESS: "wallet_connect_success",
  WALLET_CONNECT_FAILURE: "wallet_connect_failure",
  WALLET_DISCONNECT: "wallet_disconnect",
  FORM_SUBMIT_SUCCESS: "form_submit_success",
  FORM_SUBMIT_FAILURE: "form_submit_failure",
  GOAL_CREATE_SUCCESS: "goal_create_success",
  NAVIGATION_CLICK: "navigation_click",
} as const;
