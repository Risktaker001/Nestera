import {
  maskWalletAddress,
  sanitizeData,
  sanitizeSentryEvent,
} from "../lib/monitoring";
import type { Event } from "@sentry/nextjs";

describe("monitoring privacy sanitizers", () => {
  it("masks wallet addresses", () => {
    expect(maskWalletAddress("GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ234567AB")).toBe("GABCD…67AB");
  });

  it("redacts sensitive nested keys and values", () => {
    const sanitized = sanitizeData({
      email: "user@example.com",
      nested: {
        token: "secret-token",
        note: "Contact user@example.com with Bearer abc123",
        url: "/api/search?email=user@example.com&token=abc123",
      },
      walletAddressMasked: "GABCD…WXYZ",
    });

    expect(sanitized).toEqual({
      email: "[Redacted]",
      nested: {
        token: "[Redacted]",
        note: "Contact [RedactedEmail] with Bearer [Redacted]",
        url: "/api/search?email=%5BRedacted%5D&token=%5BRedacted%5D",
      },
      walletAddressMasked: "GABCD…WXYZ",
    });
  });

  it("strips unsafe Sentry event fields", () => {
    const event: Event = {
      message: "Failed for user@example.com",
      user: {
        id: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ234567AB",
        email: "user@example.com",
        ip_address: "127.0.0.1",
      },
      request: {
        url: "https://example.com/path?email=user@example.com",
        cookies: { session: "secret" },
        data: { email: "user@example.com" },
        headers: { authorization: "Bearer abc123", accept: "application/json" },
      },
    };

    const sanitized = sanitizeSentryEvent(event);

    expect(sanitized?.message).toBe("Failed for [RedactedEmail]");
    expect(sanitized?.user).toEqual({
      id: "GABCD…67AB",
      segment: undefined,
    });
    expect(sanitized?.request?.url).toBe("https://example.com/path?email=%5BRedacted%5D");
    expect(sanitized?.request?.cookies).toBeUndefined();
    expect(sanitized?.request?.data).toBeUndefined();
    expect(sanitized?.request?.headers).toEqual({
      authorization: "[Redacted]",
      accept: "application/json",
    });
  });
});
