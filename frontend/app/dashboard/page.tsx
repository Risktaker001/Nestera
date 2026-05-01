"use client";

import React, { useState, useEffect } from "react";
import NetWorthCard from "../components/dashboard/NetWorthCard";
import QuickActionsGrid from "../components/dashboard/QuickActionsGrid";
import WalletBalanceCard from "../components/dashboard/WalletBalanceCard";
import ActivePoolList from "../components/dashboard/ActivePoolList";
import RecentTransactionsWidget from "../components/dashboard/RecentTransactionsWidget";
import { DashboardSkeleton } from "../components/ui/PageSkeletons";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  useEffect(() => {
    const loadTimer = setTimeout(() => setIsLoading(false), 1200);
    const timeoutTimer = setTimeout(() => setShowTimeoutMessage(true), 5000);
    return () => {
      clearTimeout(loadTimer);
      clearTimeout(timeoutTimer);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full max-w-full overflow-x-hidden pb-10 px-4 md:px-0">
        <DashboardSkeleton />
        {showTimeoutMessage && (
          <p className="mt-4 text-center text-sm text-[var(--color-text-muted)] animate-pulse">
            This is taking longer than usual. Please check your connection.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden pb-10">
      {/* Top row: NetWorth (stretches) + QuickActions (fixed width) */}
      <div className="flex gap-4 md:gap-[18px] items-start flex-col md:flex-row">
        <div className="flex-1 w-full min-w-0">
          <NetWorthCard />
          <div className="mt-4 md:mt-[18px]">
            <ActivePoolList />
          </div>
        </div>
        <div className="w-full md:w-[360px] md:max-w-[40%] min-w-0 flex flex-col gap-4 md:gap-[18px]">
          <QuickActionsGrid />
          <WalletBalanceCard />
        </div>
      </div>

      {/* Second row: RecentTransactions */}
      <div className="mt-4 md:mt-5">
        <RecentTransactionsWidget />
      </div>
    </div>
  );
}

