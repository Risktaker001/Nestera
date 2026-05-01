'use client';

import React from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { env } from '../../config/env';

const CommunityHero: React.FC = () => {
  return (
    <section className="relative w-full py-24 bg-[#061a1a] flex items-center font-['Inter'] overflow-hidden">
      {/* Background Glow */}
      <div
        className="pointer-events-none absolute -top-[10%] -right-[5%] w-1/2 h-[70%]"
        style={{ background: 'radial-gradient(ellipse, rgba(0, 180, 160, 0.12) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-[10%] -left-[5%] w-1/2 h-[70%]"
        style={{ background: 'radial-gradient(ellipse, rgba(0, 180, 160, 0.08) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-12 flex flex-col items-center text-center gap-8 max-md:px-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          The Nestera Collective
        </div>
        
        <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.1] tracking-tight text-white max-w-4xl">
          Built by the People, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
            For the Future.
          </span>
        </h1>

        <p className="text-[1.1rem] leading-[1.7] text-[rgba(180,210,210,0.7)] max-w-2xl mx-auto">
          Join thousands of savers and contributors building the most transparent, decentralized savings ecosystem on Stellar. Your voice matters.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center mt-4">
          <a
            href={env.discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(88,101,242,0.3)]"
          >
            <MessageSquare size={20} />
            Join Discord
          </a>
          <a
            href={env.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-4 bg-[#229ED9] hover:bg-[#1C82B3] text-white font-bold rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(34,158,217,0.3)]"
          >
            <Send size={20} />
            Join Telegram
          </a>
        </div>
      </div>
    </section>
  );
};

export default CommunityHero;
