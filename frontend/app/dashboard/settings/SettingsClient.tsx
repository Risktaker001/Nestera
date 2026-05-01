"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Monitor, Moon, Settings, Sun } from "lucide-react";
import { type Theme, useTheme } from "../../context/ThemeContext";
import DataExportSection from "../../components/dashboard/DataExportSection";
import { SettingsSkeleton } from "../../components/ui/PageSkeletons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const PrefsSchema = z.object({
  emailNotifications: z.boolean().default(false),
  inAppNotifications: z.boolean().default(false),
  sweepNotifications: z.boolean().default(false),
  claimNotifications: z.boolean().default(false),
  yieldNotifications: z.boolean().default(false),
  milestoneNotifications: z.boolean().default(false),
});

type Prefs = z.infer<typeof PrefsSchema>;

const themeOptions: Array<{
  value: Theme;
  label: string;
  description: string;
  Icon: typeof Sun;
}> = [
  {
    value: "light",
    label: "Light",
    description: "Use brighter surfaces across the app.",
    Icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Keep the existing low-light dashboard feel.",
    Icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Follow your browser or operating system preference.",
    Icon: Monitor,
  },
];

export default function SettingsClient() {
  const [isLoading, setIsLoading] = useState(true);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<Prefs>({
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(PrefsSchema),
    defaultValues: {
      emailNotifications: false,
      inAppNotifications: false,
      sweepNotifications: false,
      claimNotifications: false,
      yieldNotifications: false,
      milestoneNotifications: false,
    },
  });

  const prefs = watch();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/notifications/preferences", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          reset(data);
        }
      } catch {}
    };

    load();
  }, [reset]);

  const onSubmit = async (data: Prefs) => {
    setSaveSuccess(false);
    try {
      const res = await fetch("/notifications/preferences", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {}
  };

  const resolvedThemeLabel = useMemo(
    () => (resolvedTheme === "dark" ? "Dark" : "Light"),
    [resolvedTheme],
  );

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-b from-[var(--color-accent-soft)] to-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <Settings size={20} />
        </div>
        <div>
          <h1 className="m-0 text-2xl font-bold text-[var(--color-text)]">
            Settings
          </h1>
          <p className="m-0 text-sm text-[var(--color-text-soft)]">
            Manage your account preferences
          </p>
        </div>
      </div>

      {isLoading ? (
        <SettingsSkeleton />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
          <section className="rounded-2xl border border-[var(--color-border)] bg-linear-to-b from-[var(--color-card-start)] to-[var(--color-card-end)] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="m-0 text-lg font-semibold text-[var(--color-text)]">
                  Theme preference
                </h2>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  Choose how Nestera should look across public pages, dashboard
                  shells, and analytics.
                </p>
              </div>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Resolved {resolvedThemeLabel}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {themeOptions.map(({ value, label, description, Icon }) => {
                const selected = theme === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    aria-pressed={selected}
                    className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${
                      selected
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]"
                    }`}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-accent)]">
                      <Icon size={18} />
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                        {label}
                        {selected ? (
                          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--color-accent)]">
                            Active
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-sm text-[var(--color-text-muted)]">
                        {description}
                      </span>
                      {value === "system" ? (
                        <span className="mt-2 block text-xs text-[var(--color-text-soft)]">
                          Currently following your device&apos;s{" "}
                          {resolvedThemeLabel.toLowerCase()} appearance.
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-linear-to-b from-[var(--color-card-start)] to-[var(--color-card-end)] p-6 md:p-8">
            <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">
              Notifications
            </h2>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mx-auto flex max-w-xl flex-col gap-4 text-left"
            >
              <PreferenceToggle
                label="Email Notifications"
                description="Receive emails about important account events"
                checked={!!prefs.emailNotifications}
                onChange={() =>
                  setValue("emailNotifications", !prefs.emailNotifications, {
                    shouldDirty: true,
                  })
                }
              />
              <PreferenceToggle
                label="In-app Notifications"
                description="Show notifications inside the app"
                checked={!!prefs.inAppNotifications}
                onChange={() =>
                  setValue("inAppNotifications", !prefs.inAppNotifications, {
                    shouldDirty: true,
                  })
                }
              />
              <PreferenceToggle
                label="Goal Milestone Notifications"
                description="Receive celebratory messages when goals reach 25%, 50%, 75%, and 100%."
                checked={!!prefs.milestoneNotifications}
                onChange={() =>
                  setValue("milestoneNotifications", !prefs.milestoneNotifications, {
                    shouldDirty: true,
                  })
                }
              />

              <div className="flex items-center justify-end gap-3 mt-2">
                {saveSuccess && (
                  <span className="text-emerald-500 text-sm font-medium">
                    Preferences saved!
                  </span>
                )}
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[#061a1a] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 transition-all active:scale-95"
                  disabled={isSubmitting || !isDirty}
                >
                  {isSubmitting ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </form>
          </section>
        </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-linear-to-b from-[var(--color-card-start)] to-[var(--color-card-end)] p-6 md:p-8">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Notifications</h2>
          <div className="mx-auto flex max-w-xl flex-col gap-4 text-left">
            <PreferenceToggle
              label="Email Notifications"
              description="Receive emails about important account events"
              checked={!!prefs?.emailNotifications}
              onChange={() => toggle("emailNotifications")}
            />
            <PreferenceToggle
              label="In-app Notifications"
              description="Show notifications inside the app"
              checked={!!prefs?.inAppNotifications}
              onChange={() => toggle("inAppNotifications")}
            />
            <PreferenceToggle
              label="Goal Milestone Notifications"
              description="Receive celebratory messages when goals reach 25%, 50%, 75%, and 100%."
              checked={!!prefs?.milestoneNotifications}
              onChange={() => toggle("milestoneNotifications")}
            />

            <div className="text-right">
              <button
                className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[#061a1a] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <DataExportSection />
      )}
    </div>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 cursor-pointer hover:border-[var(--color-border-strong)] transition-colors">
      <div>
        <div className="font-medium text-[var(--color-text)]">{label}</div>
        <div className="text-sm text-[var(--color-text-muted)]">
          {description}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.preventDefault();
          onChange();
        }}
        className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
          checked
            ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
            : "border-[var(--color-border)] bg-[var(--color-surface-subtle)]"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}
