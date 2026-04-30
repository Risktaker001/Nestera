export const EVENT_DLQ_QUEUE = 'event-dlq';

export const EVENT_DLQ_RETRY_JOB = 'retry-failed-event';

/**
 * Default retry policy used by ResilientEventBus when a caller does
 * not provide explicit options.
 */
export const DEFAULT_MAX_ATTEMPTS = 3;
export const DEFAULT_BASE_BACKOFF_MS = 1000;
export const MAX_BACKOFF_MS = 30 * 1000;
