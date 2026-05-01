/**
 * Escapes a value for CSV format.
 */
export function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const needsQuotes = /[",\n]/.test(str);
  const escaped = str.replaceAll('"', '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

/**
 * Converts an array of objects to a CSV string.
 */
export function toCsv<T extends Record<string, any>>(rows: T[], includeFields?: (keyof T)[]): string {
  if (rows.length === 0) return "";
  
  const header = includeFields || (Object.keys(rows[0]) as (keyof T)[]);
  const lines = [
    header.map(f => String(f)).join(","),
    ...rows.map((r) =>
      header
        .map((field) => csvEscape(r[field]))
        .join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}

/**
 * Triggers a download of a text file.
 */
export function downloadTextFile(filename: string, content: string, mimeType = "text/csv") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
