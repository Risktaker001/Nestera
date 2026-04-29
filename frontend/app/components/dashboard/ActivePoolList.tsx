"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import ActivePoolCard, { PoolItem } from "./ActivePoolCard";

const MOCK_POOLS: PoolItem[] = [
  {
    id: 1,
    title: "USDC Flexible Savings",
    subtitle: "Stellar Network",
    apy: 12.0,
    staked: "$10,000.00",
    earnings: "$450.21",
  },
  {
    id: 2,
    title: "ETH Locked Staking",
    subtitle: "Ethereum Network",
    apy: 5.2,
    staked: "4.50 ETH",
    earnings: "0.12 ETH",
  },
];

const ActivePoolList: React.FC = () => {
  const hasPools = MOCK_POOLS.length > 0;

  return (
    <section className="bg-linear-to-b from-[rgba(6,18,20,0.45)] to-[rgba(4,12,14,0.35)] border border-[rgba(8,120,120,0.06)] rounded-2xl p-[18px] text-[#dff]">
      <div className="flex justify-between items-center mb-3">
        <h4 className="m-0 text-base font-semibold">
          Active Savings &amp; Staking
        </h4>
        <a
          href="/dashboard/savings-pools"
          className="text-[#60f0ec] no-underline font-semibold hover:text-[#9ef0f0] transition-colors"
        >
          View all
        </a>
      </div>

      {hasPools ? (
        <div className="flex flex-col gap-3">
          {MOCK_POOLS.map((p) => (
            <ActivePoolCard key={p.id} pool={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
            <Sparkles size={24} />
          </div>
          <h5 className="m-0 text-lg font-semibold text-[#e6ffff]">No active pools yet</h5>
          <p className="mt-2 max-w-sm text-sm text-[#90b4b4]">
            Start a savings pool to see yields, staking balances, and earning history here.
          </p>
          <Link
            href="/dashboard/savings-pools"
            className="mt-5 rounded-xl bg-cyan-500 px-5 py-2.5 font-semibold text-[#061a1a] no-underline hover:bg-cyan-400"
          >
            Browse pools
          </Link>
        </div>
      )}
    </section>
  );
};

export default ActivePoolList;
