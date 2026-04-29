'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

const FeaturesHero: React.FC = () => {
  return (
    <section className="relative w-full pt-28 pb-20 bg-[#061a1a] overflow-hidden">
      {/* Background glows */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,192,0.08) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-12 max-md:px-6 flex flex-col items-center text-center gap-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest">
          <Sparkles size={14} />
          Everything you need. Nothing you don&apos;t.
        </div>

        <h1 className="text-[clamp(2.8rem,6vw,5rem)] font-extrabold leading-[1.05] tracking-tight text-white max-w-4xl">
          Savings built for the{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400">
            decentralized future.
          </span>
        </h1>

        <p className="text-[1.1rem] leading-relaxed text-[rgba(180,210,210,0.7)] max-w-2xl">
          From smart-contract security to goal-based automation, every feature of Nestera is designed to make your money work harder — transparently, non-custodially, on Stellar.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center mt-4">
          <Link
            href="/savings"
            className="flex items-center gap-2 px-8 py-4 bg-[#00d4c0] hover:bg-[#00bfad] text-[#061a1a] font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,212,192,0.35)]"
          >
            Start Saving <ArrowRight size={18} />
          </Link>
          <Link
            href="/docs"
            className="px-8 py-4 bg-white/5 border border-white/15 text-white font-semibold rounded-xl transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:-translate-y-0.5"
          >
            Read the Docs
          </Link>
        </div>

        {/* Decorative stat strip */}
        <div className="mt-16 w-full max-w-3xl grid grid-cols-3 divide-x divide-white/10 border border-white/10 rounded-2xl overflow-hidden bg-white/[0.03]">
          {[
            { value: '12% APY', label: 'Average Yield' },
            { value: '$10M+', label: 'Total Value Locked' },
            { value: '< 1s', label: 'Settlement Time' },
          ].map((s) => (
            <div key={s.label} className="py-6 flex flex-col items-center gap-1">
              <span className="text-2xl font-extrabold text-white">{s.value}</span>
              <span className="text-xs font-medium text-[rgba(180,210,210,0.5)] uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesHero;
