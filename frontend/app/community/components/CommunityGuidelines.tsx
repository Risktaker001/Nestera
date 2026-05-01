'use client';

import React from 'react';
import { ShieldCheck, Heart, Zap, Globe } from 'lucide-react';
import { env } from '../../config/env';

const guidelines = [
  {
    title: 'Transparency First',
    description: 'We believe in radical transparency. All code is open-source, and all governance decisions are recorded on-chain.',
    icon: ShieldCheck,
    color: 'text-cyan-400',
  },
  {
    title: 'Inclusive Growth',
    description: 'Nestera is built for everyone, from small savers to large institutions. We prioritize accessible financial tools.',
    icon: Globe,
    color: 'text-emerald-400',
  },
  {
    title: 'Respectful Discourse',
    description: 'Our community thrives on healthy debate. We maintain a respectful and welcoming environment for all members.',
    icon: Heart,
    color: 'text-pink-400',
  },
  {
    title: 'Innovation Driven',
    description: 'We constantly push the boundaries of what is possible on Stellar and Soroban to deliver the best user experience.',
    icon: Zap,
    color: 'text-yellow-400',
  },
];

const CommunityGuidelines: React.FC = () => {
  return (
    <section className="w-full py-24 bg-[#061a1a] relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-12 max-md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-4xl font-extrabold text-white mb-4">Community Guidelines</h2>
          <p className="text-[1.1rem] text-[rgba(180,210,210,0.7)] max-w-2xl mx-auto">
            The Nestera Collective is governed by a set of core values that ensure our ecosystem remains secure, fair, and innovative.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {guidelines.map((guide, i) => (
            <div
              key={guide.title}
              className="flex gap-6 p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all duration-300"
            >
              <div className={`shrink-0 w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${guide.color}`}>
                <guide.icon size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-3">{guide.title}</h3>
                <p className="text-[0.95rem] leading-relaxed text-[rgba(180,210,210,0.65)]">
                  {guide.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 p-10 rounded-[32px] bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-white/10 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to contribute?</h3>
          <p className="text-[1.1rem] text-[rgba(180,210,210,0.8)] mb-8 max-w-xl mx-auto">
            We are always looking for developers, designers, and community managers to help us grow.
          </p>
          <a
            href={env.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#061a1a] font-bold rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
          >
            Start Contributing on GitHub
          </a>
        </div>
      </div>
    </section>
  );
};

export default CommunityGuidelines;
