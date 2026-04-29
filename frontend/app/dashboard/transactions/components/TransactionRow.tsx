'use client';

import React from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Repeat,
  Sparkles,
} from 'lucide-react';

export type TransactionType = 'deposit' | 'withdraw' | 'swap' | 'yield';
export type TransactionStatus = 'completed' | 'pending';

export interface TransactionRowProps {
  date: string;
  time: string;
  transactionId: string;
  type: TransactionType;
  assetDetails: string;
  amountDisplay: string;
  isPositive: boolean | null;
  status: TransactionStatus;
  onClick?(id: string): void;
}

const typeMeta: Record<TransactionType, { icon: React.ReactNode; label: string }> = {
  deposit: {
    icon: <ArrowDownCircle size={18} className="text-[#34d399]" />,
    label: 'Deposit',
  },
  withdraw: {
    icon: <ArrowUpCircle size={18} className="text-[#fb7185]" />,
    label: 'Withdraw',
  },
  swap: {
    icon: <Repeat size={18} className="text-[#38bdf8]" />,
    label: 'Swap',
  },
  yield: {
    icon: <Sparkles size={18} className="text-[#fcd34d]" />,
    label: 'Yield',
  },
};

const statusMeta: Record<TransactionStatus, { label: string; style: string; defaultColor: string }> = {
  completed: {
    label: 'Completed',
    style: 'border-[#10b981] text-[#34d399]',
    defaultColor: '#10b981',
  },
  pending: {
    label: 'Pending',
    style: 'border-[#f59e0b] text-[#fbbf24]',
    defaultColor: '#f59e0b',
  },
};

export default function TransactionRow({
  date,
  time,
  transactionId,
  type,
  assetDetails,
  amountDisplay,
  isPositive,
  status,
  onClick,
}: TransactionRowProps) {
  const typeInfo = typeMeta[type];
  const statusInfo = statusMeta[status];
  
  let amountStyle = 'text-white';
  if (isPositive === true) amountStyle = 'text-[#34d399]';
  if (isPositive === false) amountStyle = 'text-[#fb7185]';

  return (
    <button
      type="button"
      className="grid w-full grid-cols-1 gap-2 border-b border-white/5 px-4 py-4 text-left text-sm transition-colors hover:bg-white/5 focus:bg-white/5 md:grid-cols-12 md:items-center md:gap-3 md:px-5 md:text-[15px]"
      onClick={() => onClick?.(transactionId)}
      aria-label={`Open transaction ${transactionId} (${typeInfo.label})`}
    >
      <div className="md:col-span-2">
        <p className="text-[#e2f8f8] font-semibold">{date}</p>
        <p className="text-[#5e8c96] text-xs mt-0.5 font-medium">{time}</p>
      </div>

      <div className="text-[#e2f8f8] md:col-span-2">
        {transactionId}
      </div>

      <div className="md:col-span-2">
        <div className="inline-flex items-center gap-2 text-[#e2f8f8] font-medium">
          {typeInfo.icon}
          <span>{typeInfo.label}</span>
        </div>
      </div>

      <div className="font-medium text-[#e2f8f8] md:col-span-2">{assetDetails}</div>

      <div className={`font-bold md:col-span-2 md:text-right ${amountStyle}`}>
        {amountDisplay}
      </div>

      <div className="md:col-span-2 md:flex md:justify-end">
        <span
          className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border border-current ${statusInfo.style}`}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusInfo.defaultColor }}></span>
          {statusInfo.label}
        </span>
      </div>
    </button>
  );
}
