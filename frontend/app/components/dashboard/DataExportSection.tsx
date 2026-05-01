"use client";

import React, { useState } from "react";
import { Download, FileText, Database, Loader2, CheckCircle2 } from "lucide-react";
import { exportJson, exportPdf } from "../../services/ExportService";
import { useToast } from "../../../context/ToastContext";

// Mock data for bulk export
const MOCK_BULK_DATA = {
  transactions: [
    { id: "1", type: "deposit", amount: 500, date: "2023-10-25" },
    { id: "2", type: "withdraw", amount: 150, date: "2023-10-24" },
  ],
  portfolio: [
    { asset: "USDC Flexible", balance: 2400 },
    { asset: "XLM Locked", balance: 5000 },
  ],
  goals: [
    { title: "Emergency Fund", target: 12000, current: 6400 },
  ],
};

// Mock data for tax report
const MOCK_TAX_DATA = [
  { year: "2023", type: "Interest Yield", amount_usd: "+$420.50" },
  { year: "2023", type: "Capital Gains", amount_usd: "+$124.00" },
  { year: "2023", type: "Staking Rewards", amount_usd: "+$85.20" },
];

export default function DataExportSection() {
  const toast = useToast();
  const [bulkLoading, setBulkLoading] = useState(false);
  const [taxLoading, setTaxLoading] = useState(false);

  const handleBulkExport = () => {
    setBulkLoading(true);
    try {
      exportJson(MOCK_BULK_DATA, "bulk-export", "nestera-complete-data.json");
      toast.success("Bulk Export Complete", "Your complete dataset has been downloaded.");
    } catch (err) {
      toast.error("Export Failed", "Failed to generate bulk export.");
    } finally {
      setTimeout(() => setBulkLoading(false), 500);
    }
  };

  const handleTaxReport = async () => {
    setTaxLoading(true);
    try {
      await exportPdf(MOCK_TAX_DATA, "tax-report", "Tax Year 2023 - Income Report", "nestera-tax-report-2023.pdf");
      toast.success("Tax Report Generated", "Your PDF tax report has been downloaded.");
    } catch (err) {
      toast.error("Export Failed", "Failed to generate tax report.");
    } finally {
      setTaxLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-linear-to-b from-[var(--color-card-start)] to-[var(--color-card-end)] p-6 md:p-8 mt-6">
      <h2 className="mb-1 text-lg font-semibold text-[var(--color-text)]">Data &amp; Privacy</h2>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        Manage your data exports and tax documentation.
      </p>
      
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bulk Export Card */}
        <div className="flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Database size={20} />
            </div>
            <h3 className="text-base font-semibold text-[var(--color-text)]">Bulk Data Export</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Download all your transactions, portfolio details, and goals data in a developer-friendly JSON format.
            </p>
          </div>
          <button
            onClick={handleBulkExport}
            disabled={bulkLoading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-50"
          >
            {bulkLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {bulkLoading ? "Exporting..." : "Export All Data"}
          </button>
        </div>

        {/* Tax Report Card */}
        <div className="flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <FileText size={20} />
            </div>
            <h3 className="text-base font-semibold text-[var(--color-text)]">Tax Report (2023)</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Generate a formatted PDF report of your yields, gains, and staking rewards for tax filing purposes.
            </p>
          </div>
          <button
            onClick={handleTaxReport}
            disabled={taxLoading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[#061a1a] hover:brightness-105 transition-colors disabled:opacity-50"
          >
            {taxLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {taxLoading ? "Generating..." : "Generate PDF"}
          </button>
        </div>
      </div>
    </section>
  );
}
