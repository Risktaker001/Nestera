"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const locales = ["en", "es"];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  const current = pathname?.split("/")[1] ?? "en";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locale = e.target.value;
    // strip existing locale prefix if present
    const pathWithoutLocale =
      pathname?.replace(new RegExp(`^/(${locales.join("|")})`), "") || "/";
    router.push(`/${locale}${pathWithoutLocale}`);
  };

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">{t?.("language.label") ?? "Language"}</span>
      <select
        aria-label={t?.("language.label") ?? "Language"}
        value={current}
        onChange={handleChange}
        className="rounded-md border px-2 py-1 text-sm"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {t ? t(`language.${loc}`) : loc}
          </option>
        ))}
      </select>
    </label>
  );
}
