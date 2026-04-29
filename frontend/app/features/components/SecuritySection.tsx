'use client';

import React from 'react';
import { ShieldCheck, FileSearch, Lock, CheckCircle2 } from 'lucide-react';

const audits = [
  { firm: 'CyberGuard Labs', date: 'Jan 2025', status: 'Passed', issues: '0 Critical' },
  { firm: 'StellarSecurity', date: 'Mar 2025', status: 'Passed', issues: '0 Critical' },
];

const pillars = [
  {
    icon: ShieldCheck,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    title: 'Audited Contracts',
    body: 'Every Soroban contract powering Nestera has been independently audited. Findings are published publicly with full remediation reports.',
  },
  {
    icon: FileSearch,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    title: 'Open-Source Code',
    body: 'All contract source code lives on GitHub. Any developer can verify logic, fork it, or contribute improvements via pull request.',
  },
  {
    icon: Lock,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    title: 'Non-Custodial Design',
    body: 'Nestera never controls your private keys. Withdrawals are always available — no permissions required, no waiting periods imposed by us.',
  },
];

const SecuritySection: React.FC = () => {
  return (
    <section className="w-full py-24 bg-[#040f0f] relative overflow-hidden">
      {/* Subtle diagonal line pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #00d4c0 0, #00d4c0 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-12 max-md:px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Left: text */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
              <ShieldCheck size={13} /> Smart Contract Security
            </div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-6">
              Security isn&apos;t a feature —<br />it&apos;s the foundation.
            </h2>
            <p className="text-[1rem] leading-relaxed text-[rgba(180,210,210,0.65)] mb-10">
              Nestera is built on a principle of radical transparency. Every line of contract code is open-source, every audit is public, and every user retains full custody of their assets at all times.
            </p>

            <div className="flex flex-col gap-4">
              {pillars.map((p) => (
                <div key={p.title} className="flex gap-4 p-5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                  <div className={`shrink-0 w-10 h-10 rounded-lg ${p.bg} flex items-center justify-center`}>
                    <p.icon className={p.color} size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">{p.title}</h4>
                    <p className="text-sm text-[rgba(180,210,210,0.6)] leading-relaxed">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: audit table */}
          <div className="flex-1 w-full max-w-md">
            <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/[0.08]">
              <h3 className="text-lg font-bold text-white mb-6">Audit Record</h3>
              <div className="flex flex-col gap-4">
                {audits.map((a) => (
                  <div key={a.firm} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                    <div>
                      <div className="text-white font-semibold text-sm">{a.firm}</div>
                      <div className="text-xs text-[rgba(180,210,210,0.5)] mt-0.5">{a.date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[rgba(180,210,210,0.5)]">{a.issues}</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 size={11} /> {a.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/[0.07]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                  <span className="text-sm text-[rgba(180,210,210,0.7)]">All contracts currently operational</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
                  <span className="text-sm text-[rgba(180,210,210,0.7)]">Emergency pause mechanism active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
