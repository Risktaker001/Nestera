import React from "react";
import Link from "next/link";
import { Activity, AlertTriangle, CheckCircle2, ExternalLink, ShieldCheck, XCircle } from "lucide-react";

const isConfigured = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
const sentryOrg = process.env.NEXT_PUBLIC_SENTRY_ORG;
const sentryProject = process.env.NEXT_PUBLIC_SENTRY_PROJECT;
const sentryDashboardUrl = process.env.NEXT_PUBLIC_SENTRY_DASHBOARD_URL;

const trackedCategories = [
  "Runtime JavaScript and React error boundary failures",
  "Server, edge, route handler, and API failures",
  "Wallet connection, Freighter, network watcher, and balance refresh errors",
  "Slow route renders and performance breadcrumbs",
  "Dashboard navigation and key user-action breadcrumbs",
  "Session replay for error sessions with masked text and blocked media",
];

const privacyRules = [
  "Raw wallet addresses are never attached; wallet context uses masked values only.",
  "Emails, tokens, cookies, authorization headers, signatures, seed phrases, and request bodies are redacted.",
  "URL query values are stripped before events and breadcrumbs are sent.",
  "Session replay masks text and inputs and blocks media by default.",
];

export default function ErrorMonitoringPage() {
  return (
    <div className="w-full pb-10">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-[var(--color-border)] bg-linear-to-b from-[var(--color-card-start)] to-[var(--color-card-end)] p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <Activity size={22} />
          </div>
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-text-soft)]">
              Production monitoring
            </p>
            <h1 className="m-0 mt-1 text-2xl font-bold text-[var(--color-text)]">Error Monitoring</h1>
            <p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              Nestera uses Sentry for production error tracking, privacy-safe diagnostics, source maps, performance signals, and team alerting.
            </p>
          </div>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
            isConfigured
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
          }`}
        >
          {isConfigured ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {isConfigured ? "Sentry DSN configured" : "Sentry DSN not configured"}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="m-0 flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
            <AlertTriangle size={18} className="text-[var(--color-accent)]" />
            What is tracked
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {trackedCategories.map((category) => (
              <div key={category} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-sm leading-6 text-[var(--color-text-muted)]">
                {category}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="m-0 flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
            <ShieldCheck size={18} className="text-[var(--color-accent)]" />
            Privacy posture
          </h2>
          <ul className="mt-5 space-y-3 p-0 text-sm leading-6 text-[var(--color-text-muted)]">
            {privacyRules.map((rule) => (
              <li key={rule} className="flex gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-300" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="m-0 text-lg font-semibold text-[var(--color-text)]">Public status</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <StatusRow label="DSN" value={isConfigured ? "Configured" : "Missing"} />
            <StatusRow label="Organization" value={sentryOrg || "Not exposed"} />
            <StatusRow label="Project" value={sentryProject || "Not exposed"} />
          </dl>
          {sentryDashboardUrl ? (
            <Link
              href={sentryDashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[#061a1a] no-underline hover:brightness-105"
            >
              Open Sentry dashboard
              <ExternalLink size={14} />
            </Link>
          ) : null}
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 lg:col-span-2">
          <h2 className="m-0 text-lg font-semibold text-[var(--color-text)]">Deployment setup</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            Production source map upload is enabled when these server-side build variables are present: <EnvName>SENTRY_ORG</EnvName>, <EnvName>SENTRY_PROJECT</EnvName>, and <EnvName>SENTRY_AUTH_TOKEN</EnvName>. Releases can be pinned with <EnvName>SENTRY_RELEASE</EnvName> or <EnvName>NEXT_PUBLIC_SENTRY_RELEASE</EnvName>.
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            Configure Sentry project alerts for new issues, regressions, high-frequency events, elevated API error volume, and slow route warnings. Keep <EnvName>SENTRY_AUTH_TOKEN</EnvName> server-only and never expose it as a public environment variable.
          </p>
        </section>
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-3">
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd className="m-0 max-w-[55%] truncate font-semibold text-[var(--color-text)]">{value}</dd>
    </div>
  );
}

function EnvName({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-[var(--color-surface-subtle)] px-1.5 py-0.5 text-[var(--color-accent)]">{children}</code>;
}
