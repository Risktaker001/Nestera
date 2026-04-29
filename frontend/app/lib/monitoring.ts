import * as Sentry from "@sentry/nextjs";
import type { Breadcrumb, Event, EventHint, SeverityLevel } from "@sentry/nextjs";

export type MonitoringData = Record<string, unknown>;

export type MonitoringContext = {
  boundaryName?: string;
  tags?: Record<string, string | number | boolean | null | undefined>;
  level?: SeverityLevel;
  data?: MonitoringData;
  extra?: MonitoringData;
  fingerprint?: string[];
};

export type ApiErrorContext = {
  endpoint: string;
  method: string;
  status?: number;
  error?: unknown;
  durationMs?: number;
  data?: MonitoringData;
};

export type WalletErrorContext = {
  action: string;
  error: unknown;
  network?: string | null;
  address?: string | null;
  data?: MonitoringData;
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const SENSITIVE_KEY_PATTERN =
  /(email|password|passcode|token|secret|authorization|cookie|signature|private|seed|mnemonic|address|body|form|dsn|auth|credential)/i;
const SAFE_ADDRESS_KEY_PATTERN = /(masked|short).*address|address.*(masked|short)/i;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BEARER_PATTERN = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi;
const STELLAR_ADDRESS_PATTERN = /\bG[A-Z2-7]{20,80}\b/g;
const MAX_DEPTH = 5;
const MAX_ARRAY_LENGTH = 20;

function hasDsn() {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
}

function normalizeSampleRate(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0, parsed));
}

export function getMonitoringConfig() {
  return {
    enabled: hasDsn(),
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.SENTRY_RELEASE,
    tracesSampleRate: normalizeSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || process.env.SENTRY_TRACES_SAMPLE_RATE,
      0.05,
    ),
    replaysSessionSampleRate: normalizeSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
      0,
    ),
    replaysOnErrorSampleRate: normalizeSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
      1,
    ),
  };
}

export function maskWalletAddress(address?: string | null) {
  if (!address) return undefined;
  const trimmed = address.trim();
  if (trimmed.length <= 12) return "[Redacted]";
  return `${trimmed.slice(0, 5)}…${trimmed.slice(-4)}`;
}

function sanitizeUrl(value: string) {
  try {
    const url = value.startsWith("/")
      ? new URL(value, "https://nestera.local")
      : new URL(value);
    url.searchParams.forEach((_, key) => {
      url.searchParams.set(key, "[Redacted]");
    });
    if (value.startsWith("/")) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
    return url.toString();
  } catch {
    return value;
  }
}

function sanitizeString(value: string) {
  const sanitized = value
    .replace(EMAIL_PATTERN, "[RedactedEmail]")
    .replace(BEARER_PATTERN, "$1 [Redacted]")
    .replace(STELLAR_ADDRESS_PATTERN, (match) => maskWalletAddress(match) ?? "[Redacted]");

  if (/^https?:\/\//i.test(sanitized) || sanitized.startsWith("/")) {
    return sanitizeUrl(sanitized);
  }

  return sanitized;
}

export function sanitizeData(input: unknown, depth = 0, key = ""): JsonValue {
  if (SAFE_ADDRESS_KEY_PATTERN.test(key)) {
    return typeof input === "string" ? sanitizeString(input) : "[Redacted]";
  }

  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return "[Redacted]";
  }

  if (input === null || input === undefined) return null;

  if (typeof input === "string") return sanitizeString(input);
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input === "boolean") return input;
  if (typeof input === "bigint") return input.toString();
  if (typeof input === "symbol" || typeof input === "function") return `[${typeof input}]`;

  if (input instanceof Error) {
    return {
      name: sanitizeString(input.name),
      message: sanitizeString(input.message),
    };
  }

  if (input instanceof Date) return input.toISOString();

  if (depth >= MAX_DEPTH) return "[Truncated]";

  if (Array.isArray(input)) {
    return input.slice(0, MAX_ARRAY_LENGTH).map((item) => sanitizeData(item, depth + 1));
  }

  if (typeof input === "object") {
    const output: Record<string, JsonValue> = {};
    for (const [childKey, value] of Object.entries(input as Record<string, unknown>)) {
      output[childKey] = sanitizeData(value, depth + 1, childKey);
    }
    return output;
  }

  return null;
}

function applyScopeContext(scope: Sentry.Scope, context?: MonitoringContext) {
  if (!context) return;

  if (context.level) scope.setLevel(context.level);
  if (context.fingerprint) scope.setFingerprint(context.fingerprint);
  if (context.boundaryName) scope.setTag("boundary", context.boundaryName);

  for (const [key, value] of Object.entries(context.tags ?? {})) {
    if (value !== null && value !== undefined) {
      scope.setTag(key, String(sanitizeData(value)));
    }
  }

  if (context.data) {
    scope.setContext("monitoring", sanitizeData(context.data) as Record<string, unknown>);
  }

  for (const [key, value] of Object.entries(context.extra ?? {})) {
    scope.setExtra(key, sanitizeData(value));
  }
}

export function sanitizeBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  return {
    ...breadcrumb,
    message: breadcrumb.message ? sanitizeString(breadcrumb.message) : breadcrumb.message,
    data: breadcrumb.data ? (sanitizeData(breadcrumb.data) as Record<string, unknown>) : breadcrumb.data,
  };
}

export function sanitizeSentryEvent<T extends Event>(event: T, _hint?: EventHint): T | null {
  if (event.message) event.message = sanitizeString(event.message);

  if (event.user) {
    const { id, segment } = event.user;
    event.user = {
      id: typeof id === "string" ? sanitizeString(id) : undefined,
      segment: typeof segment === "string" ? sanitizeString(segment) : undefined,
    };
  }

  if (event.request) {
    if (event.request.url) event.request.url = sanitizeUrl(sanitizeString(event.request.url));
    if (event.request.query_string) event.request.query_string = sanitizeUrl(`/?${event.request.query_string}`).slice(2);
    event.request.cookies = undefined;
    event.request.data = undefined;
    if (event.request.headers) {
      event.request.headers = sanitizeData(event.request.headers) as Record<string, string>;
    }
  }

  if (event.contexts) event.contexts = sanitizeData(event.contexts) as Event["contexts"];
  if (event.extra) event.extra = sanitizeData(event.extra) as Event["extra"];
  if (event.tags) event.tags = sanitizeData(event.tags) as Event["tags"];

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs
      .map((breadcrumb) => sanitizeBreadcrumb(breadcrumb))
      .filter((breadcrumb): breadcrumb is Breadcrumb => Boolean(breadcrumb));
  }

  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = sanitizeString(exception.value);
    if (exception.type) exception.type = sanitizeString(exception.type);
  }

  return event;
}

export function captureException(error: unknown, context?: MonitoringContext) {
  if (!hasDsn()) return;
  Sentry.withScope((scope) => {
    applyScopeContext(scope, context);
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, context?: MonitoringContext) {
  if (!hasDsn()) return;
  Sentry.withScope((scope) => {
    applyScopeContext(scope, context);
    Sentry.captureMessage(sanitizeString(message), context?.level);
  });
}

export function addBreadcrumb({
  category,
  message,
  level = "info",
  data,
}: {
  category: string;
  message: string;
  level?: SeverityLevel;
  data?: MonitoringData;
}) {
  if (!hasDsn()) return;
  Sentry.addBreadcrumb({
    category,
    message: sanitizeString(message),
    level,
    data: data ? (sanitizeData(data) as Record<string, unknown>) : undefined,
  });
}

export function trackUserAction(action: string, data?: MonitoringData) {
  addBreadcrumb({
    category: "user.action",
    message: action,
    level: "info",
    data,
  });
}

export function trackApiError({ endpoint, method, status, error, durationMs, data }: ApiErrorContext) {
  const safeData = {
    endpoint: sanitizeUrl(endpoint),
    method: method.toUpperCase(),
    status,
    durationMs,
    ...data,
  };

  addBreadcrumb({
    category: "api.error",
    message: `${method.toUpperCase()} ${sanitizeUrl(endpoint)} failed`,
    level: "error",
    data: safeData,
  });

  if (error) {
    captureException(error, {
      level: "error",
      tags: { endpoint: sanitizeUrl(endpoint), method: method.toUpperCase(), status },
      data: safeData,
    });
  } else {
    captureMessage("API request failed", {
      level: status && status >= 500 ? "error" : "warning",
      tags: { endpoint: sanitizeUrl(endpoint), method: method.toUpperCase(), status },
      data: safeData,
    });
  }
}

export function trackWalletError({ action, error, network, address, data }: WalletErrorContext) {
  const safeData = {
    action,
    network: network ?? undefined,
    walletAddressMasked: maskWalletAddress(address),
    ...data,
  };

  addBreadcrumb({
    category: "wallet.error",
    message: action,
    level: "error",
    data: safeData,
  });

  captureException(error, {
    level: "error",
    tags: { action, network: network ?? undefined },
    data: safeData,
  });
}

export function setMonitoringUserFromWallet(address: string | null | undefined, network?: string | null) {
  if (!hasDsn()) return;
  const maskedAddress = maskWalletAddress(address);
  Sentry.setUser(maskedAddress ? { id: maskedAddress, segment: network ?? undefined } : null);
  addBreadcrumb({
    category: "wallet",
    message: "wallet.user_context.set",
    level: "info",
    data: { network, walletAddressMasked: maskedAddress },
  });
}

export function clearMonitoringUser() {
  if (!hasDsn()) return;
  Sentry.setUser(null);
  addBreadcrumb({ category: "wallet", message: "wallet.user_context.clear", level: "info" });
}

export function measureMonitoringDuration<T>(
  name: string,
  callback: () => T,
  context?: MonitoringData,
): T {
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();
  try {
    return callback();
  } finally {
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    addBreadcrumb({
      category: "performance",
      message: name,
      level: "info",
      data: { ...context, durationMs: Math.round(end - start) },
    });
  }
}
