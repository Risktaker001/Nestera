"use client";

import React, { useState } from "react";
import { Users, Copy, Check, Trophy, Gift, TrendingUp } from "lucide-react";

const REFERRED_USERS = [
  { name: "Alice K.", joined: "Apr 20, 2026", status: "Active", reward: "$12.00" },
  { name: "Bob M.", joined: "Apr 15, 2026", status: "Active", reward: "$12.00" },
  { name: "Carol T.", joined: "Apr 10, 2026", status: "Pending", reward: "$0.00" },
  { name: "David R.", joined: "Mar 28, 2026", status: "Active", reward: "$12.00" },
];

const LEADERBOARD = [
  { rank: 1, name: "0xAb...3f", referrals: 24, earned: "$288" },
  { rank: 2, name: "0xCd...7a", referrals: 18, earned: "$216" },
  { rank: 3, name: "0xEf...2b", referrals: 15, earned: "$180" },
  { rank: 4, name: "You", referrals: 4, earned: "$36", isYou: true },
  { rank: 5, name: "0x12...9c", referrals: 3, earned: "$24" },
];

import { env } from "../../config/env";

const REFERRAL_LINK = `${env.baseUrl}/ref/0x4a8f`;

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(REFERRAL_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#063d3d] to-[#0a6f6f] flex items-center justify-center text-[#5de0e0]">
          <Users size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Referral Program</h1>
          <p className="text-[#5e8c96] text-sm m-0">Invite friends and earn rewards</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Referred", value: "4", icon: Users, color: "text-cyan-400 bg-cyan-400/10" },
          { label: "Rewards Earned", value: "$36.00", icon: Gift, color: "text-emerald-400 bg-emerald-400/10" },
          { label: "Active Referrals", value: "3", icon: TrendingUp, color: "text-violet-400 bg-violet-400/10" },
          { label: "Leaderboard Rank", value: "#4", icon: Trophy, color: "text-amber-400 bg-amber-400/10" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-[rgba(8,120,120,0.12)] bg-gradient-to-b from-[rgba(6,18,20,0.55)] to-[rgba(4,12,14,0.45)] p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                <Icon size={16} />
              </div>
              <p className="text-2xl font-bold text-white m-0">{s.value}</p>
              <p className="text-xs text-[#5e8c96] mt-0.5 m-0">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Referral link */}
      <div className="rounded-2xl border border-[rgba(8,120,120,0.12)] bg-gradient-to-b from-[rgba(6,18,20,0.55)] to-[rgba(4,12,14,0.45)] p-5 mb-6">
        <h2 className="text-base font-semibold text-white mb-3">Your Referral Link</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-[#8cc0c7] font-mono truncate">
            {REFERRAL_LINK}
          </div>
          <button
            onClick={copy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 text-sm font-medium hover:bg-cyan-500/25 transition-colors cursor-pointer shrink-0"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-[#4a7080] mt-3 m-0">
          Earn $12 USDC for every friend who deposits at least $100.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Referred users */}
        <div className="rounded-2xl border border-[rgba(8,120,120,0.12)] bg-gradient-to-b from-[rgba(6,18,20,0.55)] to-[rgba(4,12,14,0.45)] p-5">
          <h2 className="text-base font-semibold text-white mb-4">Referred Users</h2>
          <div className="flex flex-col gap-3">
            {REFERRED_USERS.map((u) => (
              <div key={u.name} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white m-0">{u.name}</p>
                  <p className="text-xs text-[#4a7080] m-0">Joined {u.joined}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      u.status === "Active"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-amber-400/10 text-amber-300",
                    ].join(" ")}
                  >
                    {u.status}
                  </span>
                  <span className="text-sm font-semibold text-cyan-300">{u.reward}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-2xl border border-[rgba(8,120,120,0.12)] bg-gradient-to-b from-[rgba(6,18,20,0.55)] to-[rgba(4,12,14,0.45)] p-5">
          <h2 className="text-base font-semibold text-white mb-4">Leaderboard</h2>
          <div className="flex flex-col gap-3">
            {LEADERBOARD.map((entry) => (
              <div
                key={entry.rank}
                className={[
                  "flex items-center gap-3 p-2.5 rounded-xl",
                  entry.isYou ? "bg-cyan-500/10 border border-cyan-500/20" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    entry.rank === 1
                      ? "bg-amber-400/20 text-amber-300"
                      : entry.rank === 2
                      ? "bg-slate-400/20 text-slate-300"
                      : entry.rank === 3
                      ? "bg-orange-400/20 text-orange-300"
                      : "bg-white/5 text-[#6e9aaa]",
                  ].join(" ")}
                >
                  {entry.rank}
                </span>
                <span className={`flex-1 text-sm font-medium ${entry.isYou ? "text-cyan-300" : "text-white"}`}>
                  {entry.name}
                </span>
                <span className="text-xs text-[#5e8c96]">{entry.referrals} refs</span>
                <span className="text-sm font-semibold text-emerald-300">{entry.earned}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
