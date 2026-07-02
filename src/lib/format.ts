export function inr(value: number, opts?: { compact?: boolean; decimals?: number }) {
  const n = Number.isFinite(value) ? value : 0;
  if (opts?.compact) {
    const abs = Math.abs(n);
    if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    if (abs >= 1e3) return `₹${(n / 1e3).toFixed(1)} K`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: opts?.decimals ?? 0,
    minimumFractionDigits: opts?.decimals ?? 0,
  }).format(n);
}

export function num(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

export function pct(value: number, decimals = 1): string {
  return `${value >= 0 ? "" : ""}${value.toFixed(decimals)}%`;
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function shortDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function daysUntil(d: string | Date): number {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - now.getTime()) / 86400000);
}
