# Internationalization (i18n) - Frontend

This project uses `next-intl` with Next.js app directory routing to provide locale-aware pages under `/[locale]/...`.

Quick start

- Install dependencies (from `frontend`):

```bash
cd frontend
npm install
# or pnpm install
```

How it works

- Locale-aware routing is implemented under `app/[locale]/layout.tsx` and `next.config.ts` contains the supported locales.
- Translation files live in `frontend/locales/{locale}.json` (e.g. `en.json`, `es.json`).
- Components can use `useTranslations()` from `next-intl` to get translated strings.
- `app/lib/intl.ts` contains helpers `formatDate()` and `formatNumber()` which use `Intl` to format per-locale.

Add a new language

1. Add the new locale code to `next.config.ts` `i18n.locales` and `defaultLocale` if needed.
2. Create `frontend/locales/<locale>.json` with translated keys matching the existing files.
3. Update `generateStaticParams` in `app/[locale]/layout.tsx` to include the new locale.
4. Run the dev server and verify pages under `/<locale>/...`.

Language switcher

- The `LanguageSwitcher` component is in `app/components/LanguageSwitcher.tsx` and navigates to the same page with a different locale prefix.

Formatting

- Use `formatDate(date, locale)` and `formatNumber(value, locale)` from `app/lib/intl.ts` to render locale-appropriate dates/numbers.

RTL support

- To test RTL languages add the locale and translations, then ensure your layout sets `dir="rtl"` when appropriate (you can modify `app/[locale]/layout.tsx` to set `dir` for rtl locales like `ar`, `he`).

SEO metadata

- Metadata for each locale is generated in `app/[locale]/layout.tsx` using the messages from the locale file.

Questions or need help integrating more keys? Open an issue or ask for help in the repo.
