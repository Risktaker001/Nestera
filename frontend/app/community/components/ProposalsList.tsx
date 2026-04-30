'use client';

import React from 'react';
import { CheckCircle2, Clock, XCircle, ArrowUpRight } from 'lucide-react';
import { ProposalsSkeleton } from '../../ui/PageSkeletons';

const proposals = [
// ... existing proposals
  {
    id: 'NP-84',
    title: 'Implement Multi-Asset Yield Optimization',
    description: 'A proposal to integrate automated yield switching between USDC and XLM pools for higher returns.',
    status: 'Active',
    votes: '2.4M XLM',
    timeLeft: '2 days left',
  },
  {
    id: 'NP-83',
    title: 'Increase Community Treasury Allocation',
    description: 'Allocate an additional 5% of platform fees to the community-governed treasury fund.',
    status: 'Passed',
    votes: '4.8M XLM',
    date: '3 days ago',
  },
  {
    id: 'NP-82',
    title: 'New Interface Design for Mobile App',
    description: 'Redesigning the mobile experience for better accessibility and transaction monitoring.',
    status: 'Executed',
    votes: '3.1M XLM',
    date: '1 week ago',
  },
];

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'Active':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">
          <Clock size={12} />
          Active
        </span>
      );
    case 'Passed':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
          <CheckCircle2 size={12} />
          Passed
        </span>
      );
    case 'Executed':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 text-xs font-bold border border-slate-500/20">
          <CheckCircle2 size={12} />
          Executed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
          <XCircle size={12} />
          Rejected
        </span>
      );
  }
};

const ProposalsList: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <section className="w-full py-20 bg-[#061a1a]">
        <div className="max-w-[1200px] mx-auto px-12 max-md:px-6">
          <ProposalsSkeleton />
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-20 bg-[#061a1a]">
      <div className="max-w-[1200px] mx-auto px-12 max-md:px-6">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div className="max-w-xl">
            <h2 className="text-4xl font-extrabold text-white mb-4">Recent Proposals</h2>
            <p className="text-[1rem] leading-relaxed text-[rgba(180,210,210,0.7)]">
              Decide the future of Nestera. Every token represents a vote in our decentralized governance system.
            </p>
          </div>
          <a
            href="/proposals"
            className="flex items-center gap-2 text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
          >
            View Governance Hub <ArrowUpRight size={20} />
          </a>
        </div>

        <div className="flex flex-col gap-4">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-6 flex-wrap md:flex-nowrap">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono font-bold text-cyan-500/80 tracking-widest">
                      {proposal.id}
                    </span>
                    <StatusBadge status={proposal.status} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {proposal.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[rgba(180,210,210,0.6)] mb-0">
                    {proposal.description}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0 max-md:items-start max-md:w-full max-md:pt-4 max-md:border-t max-md:border-white/5">
                  <div className="text-right max-md:text-left">
                    <div className="text-xs text-[rgba(180,210,210,0.5)] uppercase font-bold tracking-wider mb-1">
                      Current Votes
                    </div>
                    <div className="text-lg font-bold text-white">{proposal.votes}</div>
                  </div>
                  <div className="text-xs text-[rgba(180,210,210,0.45)]">
                    {proposal.timeLeft || proposal.date}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProposalsList;
