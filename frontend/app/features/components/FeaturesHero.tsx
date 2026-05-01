"use client";

import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { formatCurrency, formatNumber } from "@/app/lib/intl";

const copy = {
  en: {
    badge: "Everything you need. Nothing you don't.",
    headlinePrefix: "Savings built for the",
    headlineAccent: "decentralized future.",
    body: "From smart-contract security to goal-based automation, every feature of Nestera is designed to make your money work harder — transparently, non-custodially, on Stellar.",
    primaryCta: "Start Saving",
    secondaryCta: "Read the Docs",
    stats: [
      { value: "12% APY", label: "Average Yield" },
      { value: "$10M+", label: "Total Value Locked" },
      { value: "< 1s", label: "Settlement Time" },
    ],
  },
  es: {
    badge: "Todo lo que necesitas. Nada de lo que no.",
    headlinePrefix: "Ahorros pensados para el",
    headlineAccent: "futuro descentralizado.",
    body: "Desde la seguridad de contratos inteligentes hasta la automatización por objetivos, cada función de Nestera está diseñada para hacer que tu dinero rinda más, de forma transparente y sin custodia, sobre Stellar.",
    primaryCta: "Empezar a ahorrar",
    secondaryCta: "Leer la documentación",
    stats: [
      { value: "12% APY", label: "Rendimiento promedio" },
      { value: "$10M+", label: "Valor total bloqueado" },
      { value: "< 1 s", label: "Tiempo de liquidación" },
    ],
  },
} as const;

const FeaturesHero: React.FC = () => {
  const locale = useLocale() as keyof typeof copy;
  const content = copy[locale] ?? copy.en;

  return (
    <section className="relative w-full pt-28 pb-20 bg-[#061a1a] overflow-hidden">
      {/* Background glows */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,212,192,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-12 max-md:px-6 flex flex-col items-center text-center gap-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest">
          <Sparkles size={14} />
          {content.badge}
        </div>

        <h1 className="text-[clamp(2.8rem,6vw,5rem)] font-extrabold leading-[1.05] tracking-tight text-white max-w-4xl">
          {content.headlinePrefix}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400">
            {content.headlineAccent}
          </span>
        </h1>

        <p className="text-[1.1rem] leading-relaxed text-[rgba(180,210,210,0.7)] max-w-2xl">
          {content.body}
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center mt-4">
          <Link
            href="/savings"
            className="flex items-center gap-2 px-8 py-4 bg-[#00d4c0] hover:bg-[#00bfad] text-[#061a1a] font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,212,192,0.35)]"
          >
            {content.primaryCta} <ArrowRight size={18} />
          </Link>
          <Link
            href="/docs"
            className="px-8 py-4 bg-white/5 border border-white/15 text-white font-semibold rounded-xl transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:-translate-y-0.5"
          >
            {content.secondaryCta}
          </Link>
        </div>

        {/* Decorative stat strip */}
        <div className="mt-16 w-full max-w-3xl grid grid-cols-3 divide-x divide-white/10 border border-white/10 rounded-2xl overflow-hidden bg-white/[0.03]">
          {[
            {
              value: `${formatNumber(12, locale, { maximumFractionDigits: 0 })}% APY`,
              label: content.stats[0].label,
            },
            {
              value: `${formatCurrency(10_000_000, locale).replace(/\.00$/, "")}+`,
              label: content.stats[1].label,
            },
            { value: content.stats[2].value, label: content.stats[2].label },
          ].map((s) => (
            <div
              key={s.label}
              className="py-6 flex flex-col items-center gap-1"
            >
              <span className="text-2xl font-extrabold text-white">
                {s.value}
              </span>
              <span className="text-xs font-medium text-[rgba(180,210,210,0.5)] uppercase tracking-wider">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesHero;
