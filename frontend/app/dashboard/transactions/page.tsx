"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Download, History, Loader2, Search, ChevronDown, Inbox } from "lucide-react";
import TransactionRow, { TransactionType, TransactionStatus } from "./components/TransactionRow";
import { useToast } from "../../context/ToastContext";
import ExportModal from "../../components/dashboard/ExportModal";

import { TransactionsSkeleton } from "../../components/ui/PageSkeletons";

type TransactionRowData = {
  date: string;
  time: string;
  transactionId: string;
  type: TransactionType;
  assetDetails: string;
  amountDisplay: string;
  isPositive: boolean | null;
  status: TransactionStatus;
  hash: string;
};


export default function TransactionHistoryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const loadTimer = window.setTimeout(() => setIsLoading(false), 750);
    const timeoutTimer = window.setTimeout(() => setShowTimeoutMessage(true), 5000);
    return () => {
      window.clearTimeout(loadTimer);
      window.clearTimeout(timeoutTimer);
    };
  }, []);

  const transactions: TransactionRowData[] = [
    {
      date: "Oct 25, 2023",
      time: "10:23 AM",
      transactionId: "0xabc...123",
      type: "deposit",
      assetDetails: "USDC",
      amountDisplay: "+$500.00",
      isPositive: true,
      status: "completed",
      hash: "0xabc",
    },
    {
      date: "Oct 24, 2023",
      time: "04:15 PM",
      transactionId: "0xdef...456",
      type: "withdraw",
      assetDetails: "ETH",
      amountDisplay: "-0.50 ETH",
      isPositive: false,
      status: "completed",
      hash: "0xdef",
    },
    {
      date: "Oct 24, 2023",
      time: "09:30 AM",
      transactionId: "0xghi...789",
      type: "swap",
      assetDetails: "XLM → USDC",
      amountDisplay: "200 USDC",
      isPositive: null,
      status: "completed",
      hash: "0xghi",
    },
    {
      date: "Oct 23, 2023",
      time: "08:00 AM",
      transactionId: "0xjkl...012",
      type: "yield",
      assetDetails: "Staking Reward",
      amountDisplay: "+$12.45",
      isPositive: true,
      status: "pending",
      hash: "0xjkl",
    },
  ];

  // exportRows: normalised objects for ExportService
  const exportRows = transactions.map((t) => ({
    date: t.date,
    time: t.time,
    transactionId: t.transactionId,
    type: t.type,
    assetDetails: t.assetDetails,
    amount: t.amountDisplay,
    status: t.status,
    hash: t.hash,
  }));

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return transactions;

    return transactions.filter((transaction) =>
      [
        transaction.date,
        transaction.time,
        transaction.transactionId,
        transaction.type,
        transaction.assetDetails,
        transaction.amountDisplay,
        transaction.status,
        transaction.hash,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [searchQuery, transactions]);

  const hasTransactions = filteredTransactions.length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto pb-20">
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        dataType="transactions"
        title="Transaction History"
        rows={exportRows}
        dateKey="date"
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-b from-[#063d3d] to-[#0a6f6f] flex items-center justify-center text-cyan-400 shadow-[0_8px_20px_rgba(6,61,61,0.3)]">
            <History size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white m-0 tracking-tight">
              Transaction History
            </h1>
            <p className="text-[#5e8c96] text-sm md:text-base m-0 mt-1">
              Export your transactions as CSV, JSON, or PDF for reporting &amp; tax.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExportOpen(true)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 font-bold text-[#061a1a] shadow-lg transition-all hover:bg-cyan-400 active:scale-95"
        >
          <Download size={18} />
          Export Data
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative min-w-0 flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5e8c96]"
            size={18}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by transaction, token, or hash..."
            className="w-full bg-[#0e2330] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-[#4e7a86] focus:outline-hidden focus:border-cyan-500/50 transition-colors"
          />
        </div>

        {["Type: All", "Asset: All", "Status: All"].map((filter) => (
          <button
            type="button"
            key={filter}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-white/5 bg-[#0e2330] px-4 py-3 text-[#5e8c96] transition-all hover:border-white/10 hover:text-white"
          >
            <span className="text-sm font-medium">{filter}</span>
            <ChevronDown size={14} opacity={0.7} />
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#0e2330]">
        {isLoading ? (
          <div className="p-4" aria-live="polite" aria-busy="true">
            <TransactionsSkeleton />
            {showTimeoutMessage && (
              <p className="mt-4 text-center text-sm text-[var(--color-text-muted)] animate-pulse">
                Still loading history... This is taking longer than expected.
              </p>
            )}
          </div>
        ) : hasTransactions ? (
          <div className="overflow-x-auto">
            <div className="min-w-[820px] overflow-hidden">
              <div className="grid grid-cols-12 px-5 py-3 border-b border-white/5 text-[#5e8c96] text-xs font-bold uppercase tracking-widest">
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Transaction ID</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Asset / Details</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2 text-right">Status</div>
              </div>

              {filteredTransactions.map((t) => (
                <TransactionRow
                  key={t.hash}
                  date={t.date}
                  time={t.time}
                  transactionId={t.transactionId}
                  type={t.type}
                  assetDetails={t.assetDetails}
                  amountDisplay={t.amountDisplay}
                  isPositive={t.isPositive}
                  status={t.status}
                  onClick={(id) => console.log("Open transaction", id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
              <Inbox size={30} />
            </div>
            <h3 className="text-xl font-semibold text-[#dff]">
              {searchQuery.trim() ? "No matching transactions" : "No transactions yet"}
            </h3>
            <p className="mt-2 max-w-lg text-sm text-[#90b4b4]">
              {searchQuery.trim()
                ? "Try a different token, transaction type, or hash to narrow your search."
                : "Once deposits, withdrawals, swaps, or rewards are recorded, they will appear here."}
            </p>
            {searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-6 rounded-xl bg-cyan-500 px-6 py-2.5 font-semibold text-[#061a1a] hover:bg-cyan-400"
              >
                Clear search
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setExportOpen(true)}
                className="mt-6 rounded-xl border border-cyan-500/30 px-6 py-2.5 font-semibold text-cyan-300 hover:bg-cyan-500/10"
              >
                Export Data
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-4 px-5 py-4 text-sm font-semibold">
          <button className="min-h-11 text-[#5e8c96] transition-colors hover:text-[#e2f8f8]">
            &lt; Prev
          </button>
          <span className="rounded-lg bg-[rgba(6,110,110,0.2)] px-4 py-1.5 text-[#e2f8f8]">
            Page 1 of 12
          </span>
          <button className="flex min-h-11 items-center gap-1 text-[#e2f8f8] transition-colors hover:text-[#8ef4ef]">
            Next &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
