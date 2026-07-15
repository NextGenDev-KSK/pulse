/** Client-side CSV / JSON export helpers. */

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Characters that make a spreadsheet treat a cell as a formula. Prefixing an
// apostrophe forces the cell to be read as text (OWASP CSV-injection defence).
const FORMULA_LEAD = /^[=+\-@\t\r]/;
function neutralizeFormula(str: string): string {
  return FORMULA_LEAD.test(str) ? `'${str}` : str;
}

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value))
    return `"${neutralizeFormula(value.join("; ")).replace(/"/g, '""')}"`;
  if (typeof value === "object")
    return `"${neutralizeFormula(JSON.stringify(value)).replace(/"/g, '""')}"`;
  const str = neutralizeFormula(String(value));
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function exportCsv(
  filename: string,
  rows: Record<string, unknown>[],
) {
  if (rows.length === 0) {
    download(filename, "", "text/csv");
    return;
  }
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => toCsvValue(row[h])).join(",")),
  ];
  download(filename, lines.join("\n"), "text/csv;charset=utf-8");
}

export function exportJson(filename: string, data: unknown) {
  download(filename, JSON.stringify(data, null, 2), "application/json");
}

export function timestampedName(base: string, ext: string) {
  const d = new Date();
  const stamp = `${d.getFullYear()}${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${d.getDate().toString().padStart(2, "0")}-${d
    .getHours()
    .toString()
    .padStart(2, "0")}${d.getMinutes().toString().padStart(2, "0")}`;
  return `${base}-${stamp}.${ext}`;
}
