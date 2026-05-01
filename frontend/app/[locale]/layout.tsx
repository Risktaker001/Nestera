import React from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";

export const generateStaticParams = async () => {
  return [{ locale: "en" }, { locale: "es" }];
};

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const messages = (await import(`../../locales/${params.locale}.json`))
    .default;

  return {
    title: messages.title,
    description: messages.description,
  };
}

export default async function LocaleLayout(props: any) {
  const { children, params } = props;
  const messages = (await import(`../../locales/${params.locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={params.locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
