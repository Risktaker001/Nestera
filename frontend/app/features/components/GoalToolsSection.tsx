'use client';

import React from 'react';
import { Target, Bell, Users, CalendarCheck } from 'lucide-react';

const tools = [
  {
    icon: Target,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    title: 'Named Goals',
    body: 'Create goals with a name, emoji, and target amount. "🏡 House Fund" hits differently than a generic savings account.',
  },
  {
    icon: CalendarCheck,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    title: 'Deadline Tracking',
    body: 'Set a target date and Nestera tells you exactly how much you need to deposit per week to reach it on time.',
  },
  {
    icon: Bell,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    title: 'Milestone Alerts',
    body: 'Get notified when you hit 25%, 50%, 75%, and 100% of your goal — celebratory moments built right in.',
  },
  {
    icon: Users,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    title: 'Group Savings',
    body: 'Pool funds with family or friends toward a shared goal. Multi-sig authorization keeps everyone accountable.',
  },
];

const GoalToolsSection: React.FC = () => {
  return (
    <section className="w-full py-24 bg-[#061a1a] relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-16 left-1/4 w-[700px] h-[400px]"
        style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-12 max-md:px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          {/* Left: text */}
          <div className="flex-1 max-w-md lg:pt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Target size={13} /> Goal-Based Savings
            </div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-6">
              Save with intention. Reach goals faster.
            </h2>
            <p className="text-[1rem] leading-relaxed text-[rgba(180,210,210,0.65)] mb-8">
              Vague savings stall. Concrete goals with deadlines succeed. Nestera&apos;s goal toolkit gives every deposit a purpose — and a finish line.
            </p>
            <p className="text-[0.95rem] leading-relaxed text-[rgba(180,210,210,0.5)]">
              All goal logic runs entirely on-chain. No third party can freeze, redirect, or delay your progress. 
            </p>
          </div>

          {/* Right: tool cards */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
            {tools.map((t) => (
              <div
                key={t.title}
                className="group p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl ${t.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <t.icon className={t.color} size={22} />
                </div>
                <h4 className="text-white font-bold mb-2">{t.title}</h4>
                <p className="text-sm leading-relaxed text-[rgba(180,210,210,0.6)]">{t.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Inline progress UI mockup */}
        <div className="mt-20 p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08]">
          <div className="text-xs font-bold uppercase tracking-widest text-[rgba(180,210,210,0.4)] mb-6">Example Goal Progress</div>
          <div className="flex flex-col sm:flex-row gap-6">
            {[
              { label: '🏡 House Fund', pct: 68, current: '$6,800', target: '$10,000', color: 'bg-purple-400' },
              { label: '✈️ Japan Trip', pct: 42, current: '$2,100', target: '$5,000', color: 'bg-cyan-400' },
              { label: '📚 Education', pct: 91, current: '$9,100', target: '$10,000', color: 'bg-emerald-400' },
            ].map((g) => (
              <div key={g.label} className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-semibold text-sm">{g.label}</span>
                  <span className="text-[rgba(180,210,210,0.5)] text-xs">{g.pct}%</span>
                </div>
                <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full ${g.color} transition-all duration-700`}
                    style={{ width: `${g.pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[rgba(180,210,210,0.4)]">
                  <span>{g.current}</span>
                  <span>{g.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GoalToolsSection;
