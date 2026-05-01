"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Landmark,
  Loader2,
  ChevronDown,
  LayoutGrid,
  List,
} from "lucide-react";
import SavingsPoolCard, {
  type SavingsPool,
} from "@/app/components/dashboard/SavingsPoolCard";
import { useToast } from "@/app/context/ToastContext";
import { useSearchFilter } from "@/app/hooks/useSearchFilter";
import SearchFilterSystem from "@/app/components/ui/SearchFilterSystem";
import { toCsv, downloadTextFile } from "@/app/utils/csvExport";
import { Download } from "lucide-react";
import { SAVINGS_POOLS } from "@/app/data/savingsPools";
import {
  savingsPoolDepositStateQueryKey,
  savingsPoolsQueryKey,
  STATIC_QUERY_GC_TIME,
  STATIC_QUERY_STALE_TIME,
} from "@/app/lib/query";

export default function GoalBasedSavingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const savingsPools: SavingsPool[] = [
    {
      id: "usdc-flexible",
      name: "USDC Flexible",
      strategy: "Stablecoin",
      icon: "$",
      iconBgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
      apy: 5.4,
      tvl: "$24.5M",
      riskLevel: "Low Risk",
    },
    {
      id: "xlm-staking",
      name: "XLM Staking",
      strategy: "Native",
      icon: "✦",
      iconBgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
      apy: 4.5,
      tvl: "$12.8M",
      riskLevel: "Medium Risk",
  const queryClient = useQueryClient();

  const poolsQuery = useQuery({
    queryKey: savingsPoolsQueryKey,
    queryFn: async () => SAVINGS_POOLS,
    staleTime: STATIC_QUERY_STALE_TIME,
    gcTime: STATIC_QUERY_GC_TIME,
    initialData: SAVINGS_POOLS,
  });

  const depositStateQuery = useQuery<string | null>({
    queryKey: savingsPoolDepositStateQueryKey,
    queryFn: async () => null,
    staleTime: STATIC_QUERY_STALE_TIME,
    gcTime: STATIC_QUERY_GC_TIME,
    initialData: null,
    enabled: false,
  });

  const savingsPools = poolsQuery.data ?? SAVINGS_POOLS;
  const activeDepositId = depositStateQuery.data;

  const depositMutation = useMutation({
    mutationFn: async (poolId: string) => {
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      return poolId;
    },
    onMutate: async (poolId: string) => {
      await queryClient.cancelQueries({
        queryKey: savingsPoolDepositStateQueryKey,
      });

      const previousDepositId =
        queryClient.getQueryData<string | null>(
          savingsPoolDepositStateQueryKey,
        ) ?? null;

      queryClient.setQueryData(savingsPoolDepositStateQueryKey, poolId);
      toast.info(
        "Deposit queued",
        `Optimistically reserving ${poolId} while the action completes.`,
      );

      return { previousDepositId };
    },
    onError: (_error, _poolId, context) => {
      queryClient.setQueryData(
        savingsPoolDepositStateQueryKey,
        context?.previousDepositId ?? null,
      );
      toast.error("Deposit failed", "The optimistic update was rolled back.");
    },
    onSuccess: (poolId) => {
      toast.success("Deposit ready", `Selected pool: ${poolId}`);
    },
    onSettled: () => {
      queryClient.setQueryData(savingsPoolDepositStateQueryKey, null);
    },
  });

  const {
    query,
    setQuery,
    ranges,
    setRanges,
    history,
    addToHistory,
    presets,
    savePreset,
    applyPreset,
    clearFilters,
    filteredItems: filteredPools,
  } = useSearchFilter(savingsPools, {
    includeFields: ["name", "strategy", "riskLevel"],
  });

  const handleDeposit = (poolId: string) => {
    depositMutation.mutate(poolId);
  };

  function onExportCsv() {
    const csv = toCsv(filteredPools, ["name", "strategy", "apy", "tvl", "riskLevel"]);
    downloadTextFile(
      `nestera-savings-pools-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
    );
    toast.success("Pools exported", "CSV file downloaded successfully.");
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsLoading(false), 700);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-b from-[#063d3d] to-[#0a6f6f] flex items-center justify-center text-cyan-400 shadow-[0_8px_20px_rgba(6,61,61,0.3)]">
            <Landmark size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white m-0 tracking-tight">
              Savings Pools
            </h1>
            <p className="text-[#5e8c96] text-sm md:text-base m-0 mt-1">
              Discover and manage savings pools across supported assets.
            </p>
          </div>
        </div>

        {/* View Toggles & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#0e2330] p-1 rounded-xl border border-white/5">
            <Button variant="ghost" size="sm" className="bg-cyan-500/10 text-cyan-400" aria-label="Grid view">
              <LayoutGrid size={18} />
            </Button>
            <Button variant="ghost" size="sm" aria-label="List view">
              <List size={18} />
            </Button>
          </div>
          <button
            onClick={onExportCsv}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-white/5 bg-[#0e2330] px-4 py-2 text-[#5e8c96] hover:text-white transition-all"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button className="min-h-11 rounded-xl bg-cyan-500 px-5 py-2.5 font-bold text-[#061a1a] shadow-lg transition-all hover:bg-cyan-400 active:scale-95">
          <Button variant="primary" size="md">
            Create New Goal
          </Button>
        </div>
      </div>

      {/* Search & Filters Row */}
          <SearchFilterSystem
        query={query}
        setQuery={setQuery}
        ranges={ranges}
        setRanges={setRanges}
        history={history}
        addToHistory={addToHistory}
        presets={presets}
        savePreset={savePreset}
        applyPreset={applyPreset}
        clearFilters={clearFilters}
        placeholder="Search pools (e.g. DeFi AND Low Risk)..."
      />

      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white m-0">Available Pools</h3>
        <span className="text-[#5e8c96] text-sm">
          {filteredPools.length === savingsPools.length
            ? `Showing ${filteredPools.length} pools`
            : `Found ${filteredPools.length} of ${savingsPools.length} pools`}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-4" aria-live="polite" aria-busy="true">
          <div className="inline-flex items-center gap-2 text-xs text-[#7fa9b0]">
            <Loader2 size={14} className="animate-spin text-cyan-400" />
            Loading available pools...
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[260px] animate-pulse rounded-2xl border border-white/5 bg-white/5"
              />
            ))}
          </div>
        </div>
      ) : filteredPools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPools.map((pool) => (
            <SavingsPoolCard
              key={pool.id}
              pool={pool}
              onDeposit={handleDeposit}
              isDepositing={activeDepositId === pool.id}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Search size={32} className="text-[#5e8c96]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No pools found
          </h3>
          <p className="text-[#5e8c96] max-w-md">
            Try adjusting your search terms or filters to find what you&apos;re
            looking for.
          </p>
          <button
            onClick={clearFilters}
            className="mt-6 px-6 py-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl font-medium hover:bg-cyan-500/20 transition-all"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
}
