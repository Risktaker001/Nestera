import React from "react";
import { Skeleton } from "./LoadingState";

export function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:gap-[18px]">
        <div className="flex-1 space-y-4">
          <Skeleton variant="rect" className="h-[160px] w-full rounded-[18px]" />
          <div className="space-y-3">
            <Skeleton variant="text" className="w-32 h-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton variant="rect" className="h-[120px] rounded-xl" />
              <Skeleton variant="rect" className="h-[120px] rounded-xl" />
            </div>
          </div>
        </div>
        <div className="w-full md:w-[360px] space-y-4">
          <Skeleton variant="rect" className="h-[200px] rounded-xl" />
          <Skeleton variant="rect" className="h-[150px] rounded-xl" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton variant="text" className="w-48 h-8" />
        <Skeleton variant="rect" className="h-[300px] rounded-2xl" />
      </div>
    </div>
  );
}

export function SavingsPoolsSkeleton() {
  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="rect" className="h-[120px] rounded-2xl" />
        ))}
      </div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="w-48 h-8" />
          <div className="flex gap-2">
            <Skeleton variant="rect" className="w-32 h-10 rounded-xl" />
            <Skeleton variant="rect" className="w-32 h-10 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} variant="rect" className="h-[280px] rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TransactionsSkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between mb-6">
        <Skeleton variant="text" className="w-48 h-8" />
        <Skeleton variant="rect" className="w-32 h-10 rounded-xl" />
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#0f2c2c]/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="text" className="flex-1 h-4" />
          ))}
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="px-6 py-5 border-b border-white/5 flex gap-4 items-center">
            <Skeleton variant="circle" className="w-8 h-8" />
            <Skeleton variant="text" className="flex-1 h-5" />
            <Skeleton variant="text" className="w-24 h-5" />
            <Skeleton variant="text" className="w-32 h-5" />
            <Skeleton variant="rect" className="w-20 h-6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton variant="rect" className="h-[400px] rounded-2xl" />
        <Skeleton variant="rect" className="h-[400px] rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} variant="rect" className="h-[180px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function ProposalsSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-64 h-10" />
        <Skeleton variant="rect" className="w-40 h-10 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 rounded-2xl border border-white/10 bg-[#0f2c2c]/50 space-y-4">
            <div className="flex justify-between">
              <Skeleton variant="text" className="w-3/4 h-6" />
              <Skeleton variant="rect" className="w-20 h-6 rounded-full" />
            </div>
            <Skeleton variant="text" className="w-full h-4" />
            <Skeleton variant="text" className="w-2/3 h-4" />
            <div className="pt-4 flex justify-between items-center">
              <div className="flex gap-2">
                <Skeleton variant="circle" className="w-8 h-8" />
                <Skeleton variant="circle" className="w-8 h-8" />
              </div>
              <Skeleton variant="text" className="w-24 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="w-full max-w-2xl space-y-8">
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton variant="text" className="w-32 h-4" />
            <Skeleton variant="rect" className="w-full h-12 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="pt-6 border-t border-white/10 space-y-4">
        <Skeleton variant="text" className="w-48 h-6" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Skeleton variant="text" className="w-40 h-5" />
              <Skeleton variant="text" className="w-64 h-3" />
            </div>
            <Skeleton variant="rect" className="w-12 h-6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
