// ─── ExportService.ts ─────────────────────────────────────────────────────────
// Centralised helpers for CSV, JSON and PDF exports across all Nestera pages.

export type ExportFormat = "csv" | "json" | "pdf";

export type ExportLogEntry = {
  id: string;
  dataType: string;
  format: ExportFormat;
  filename: string;
  exportedAt: string; // ISO string
  rowCount: number;
};

const HISTORY_KEY = "nestera_export_history";

// ─── History ──────────────────────────────────────────────────────────────────

export function getExportHistory(): ExportLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function logExport(entry: Omit<ExportLogEntry, "id" | "exportedAt">) {
  const history = getExportHistory();
  const newEntry: ExportLogEntry = {
    ...entry,
    id: crypto.randomUUID(),
    exportedAt: new Date().toISOString(),
  };
  history.unshift(newEntry);
  // Keep last 50
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  return newEntry;
}

// ─── Download helpers ─────────────────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

function csvEscape(value: unknown): string {
  const str = String(value ?? "");
  const needsQuotes = /[",\n\r]/.test(str);
  const escaped = str.replaceAll('"', '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function buildCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(",")),
  ];
  return lines.join("\n") + "\n";
}

export function exportCsv(
  rows: Record<string, unknown>[],
  dataType: string,
  customFilename?: string,
) {
  const filename = customFilename ?? `nestera-${dataType}-${isoDate()}.csv`;
  const content = buildCsv(rows);
  triggerDownload(content, filename, "text/csv;charset=utf-8");
  logExport({ dataType, format: "csv", filename, rowCount: rows.length });
}

// ─── JSON ─────────────────────────────────────────────────────────────────────

export function exportJson(
  data: unknown,
  dataType: string,
  customFilename?: string,
) {
  const filename = customFilename ?? `nestera-${dataType}-${isoDate()}.json`;
  const content = JSON.stringify(
    { exportedAt: new Date().toISOString(), dataType, data },
    null,
    2,
  );
  triggerDownload(content, filename, "application/json");
  const rows = Array.isArray(data) ? data.length : 1;
  logExport({ dataType, format: "json", filename, rowCount: rows });
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

export async function exportPdf(
  rows: Record<string, unknown>[],
  dataType: string,
  title: string,
  customFilename?: string,
) {
  if (rows.length === 0) return;

  // Lazy-load jsPDF to keep initial bundle small
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const filename = customFilename ?? `nestera-${dataType}-${isoDate()}.pdf`;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header
  doc.setFillColor(6, 26, 26);
  doc.rect(0, 0, 297, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("NESTERA", 10, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(93, 224, 224);
  doc.text(title, 45, 14);

  // Date
  doc.setFontSize(8);
  doc.setTextColor(150, 200, 200);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 200, 14);

  // Table
  const headers = Object.keys(rows[0]);
  const body = rows.map((r) => headers.map((h) => String(r[h] ?? "")));

  autoTable(doc, {
    head: [headers],
    body,
    startY: 26,
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 3,
      fillColor: [14, 35, 48],
      textColor: [220, 240, 240],
    },
    headStyles: {
      fillColor: [6, 61, 61],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [10, 26, 34] },
    margin: { left: 10, right: 10 },
  });

  doc.save(filename);
  logExport({ dataType, format: "pdf", filename, rowCount: rows.length });
}

// ─── Date range filter ────────────────────────────────────────────────────────

/**
 * Filter rows by a date field that lives in the given key.
 * Accepts both ISO strings (2023-10-25) and display strings ("Oct 25, 2023").
 */
export function filterByDateRange<T extends Record<string, unknown>>(
  rows: T[],
  dateKey: keyof T,
  from: Date | null,
  to: Date | null,
): T[] {
  if (!from && !to) return rows;
  return rows.filter((row) => {
    const raw = row[dateKey];
    const d = new Date(String(raw));
    if (isNaN(d.getTime())) return true; // can't parse – keep
    if (from && d < from) return false;
    if (to) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      if (d > endOfDay) return false;
    }
    return true;
  });
}
