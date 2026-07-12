"use client";

import { useState } from "react";
import { inr } from "@/lib/format";
import { usePrivacy } from "@/lib/privacy";
import { IconLock } from "@/components/ui/Icons";

function HiddenChart({ height = 180 }: { height?: number }) {
  return (
    <div
      className="w-full rounded-2xl grid place-items-center text-sm border transition-all duration-300"
      style={{ height, background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-muted)" }}
    >
      <div className="text-center p-4">
        <IconLock size={28} className="mx-auto text-indigo-400 mb-2.5" />
        <div className="font-bold text-base" style={{ color: "var(--text-heading)" }}>Financial Data Shielded</div>
        <div className="text-xs mt-1 max-w-xs mx-auto" style={{ color: "var(--text-faint)" }}>
          Privacy mode is currently active. Toggle the eye icon on any KPI tile or global header to reveal live chart figures.
        </div>
      </div>
    </div>
  );
}

const PALETTE = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
  "#06b6d4",
  "#a855f7",
];

export function DonutChart({
  data,
  size = 200,
  thickness = 26,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const { globalHidden: hidden } = usePrivacy();
  const [active, setActive] = useState<number | null>(null);
  if (hidden) return <HiddenChart height={size} />;

  const chartSize = size;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circ = 2 * Math.PI * radius;
  const segments = data.reduce<{ dash: number; offset: number }[]>((acc, d) => {
    const offset = acc.reduce((sum, s) => sum + s.dash, 0);
    acc.push({ dash: (d.value / total) * circ, offset });
    return acc;
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
      <div className="relative shrink-0 flex items-center justify-center">
        <svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`} className="overflow-visible drop-shadow-sm">
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {data.map((d, i) => {
              const { dash, offset } = segments[i];
              return (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={d.color || PALETTE[i % PALETTE.length]}
                  strokeWidth={active === i ? thickness + 4 : thickness}
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeDashoffset={-offset}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  style={{ transition: "all 0.2s cubic-bezier(.16, 1, .3, 1)", cursor: "pointer", strokeLinecap: "round" }}
                />
              );
            })}
          </g>
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="var(--text-faint)"
            className="uppercase tracking-wider"
          >
            {active !== null ? data[active].label : centerLabel}
          </text>
          <text
            x="50%"
            y="57%"
            textAnchor="middle"
            fontSize="16"
            fontWeight="800"
            fill="var(--text-heading)"
            className="font-mono tabular-nums tracking-tight"
          >
            {active !== null
              ? `${((data[active].value / total) * 100).toFixed(1)}%`
              : centerValue}
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-1 gap-2 w-full max-h-[220px] overflow-y-auto pr-1">
        {data.map((d, i) => (
          <div
            key={i}
            className={`flex items-center justify-between gap-3 text-xs py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors ${active === i ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                style={{ background: d.color || PALETTE[i % PALETTE.length] }}
              />
              <span className="truncate font-medium" style={{ color: active === i ? "var(--text-heading)" : "var(--text-muted)" }}>
                {d.label}
              </span>
            </span>
            <span className="font-bold whitespace-nowrap font-mono tabular-nums" style={{ color: "var(--text)" }}>
              {inr(d.value, { compact: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineChart({
  series,
  labels,
  height = 220,
  format = (v) => inr(v, { compact: true }),
}: {
  series: { name: string; values: number[]; color?: string }[];
  labels: string[];
  height?: number;
  format?: (v: number) => string;
}) {
  const { globalHidden: hidden } = usePrivacy();
  const [hover, setHover] = useState<number | null>(null);
  if (hidden) return <HiddenChart height={height} />;

  const width = 600;
  const pad = { l: 8, r: 8, t: 16, b: 24 };
  const all = series.flatMap((s) => s.values);
  const max = Math.max(...all, 1);
  const min = Math.min(...all, 0);
  const range = max - min || 1;
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const n = labels.length;
  const x = (i: number) => pad.l + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - ((v - min) / range) * innerH;

  return (
    <div className="w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        style={{ height }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {series.map((s, si) => {
            const color = s.color || PALETTE[si % PALETTE.length];
            return (
              <linearGradient key={si} id={`grad-${si}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </linearGradient>
            );
          })}
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
          <line
            key={i}
            x1={pad.l}
            x2={width - pad.r}
            y1={pad.t + innerH * g}
            y2={pad.t + innerH * g}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray={i === 4 ? "none" : "3 3"}
          />
        ))}

        {/* Series area and polylines */}
        {series.map((s, si) => {
          const color = s.color || PALETTE[si % PALETTE.length];
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          const area = `${pts} ${x(n - 1)},${pad.t + innerH} ${x(0)},${pad.t + innerH}`;
          return (
            <g key={si}>
              <polygon points={area} fill={`url(#grad-${si})`} />
              <polyline
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.values.map((v, i) => (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(v)}
                  r={hover === i ? 5 : 3}
                  fill={hover === i ? "#fff" : color}
                  stroke={color}
                  strokeWidth={hover === i ? 2.5 : 0}
                  className="transition-all duration-150"
                />
              ))}
            </g>
          );
        })}

        {/* Hover trigger columns */}
        {labels.map((_, i) => (
          <rect
            key={i}
            x={x(i) - innerW / (2 * Math.max(n - 1, 1))}
            y={0}
            width={innerW / Math.max(n - 1, 1)}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            className="cursor-pointer"
          />
        ))}

        {/* Crosshair */}
        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={pad.t}
            y2={pad.t + innerH}
            stroke="var(--text-faint)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}

        {/* X labels */}
        {labels.map((l, i) => (
          <text
            key={i}
            x={x(i)}
            y={height - 6}
            textAnchor="middle"
            fontSize="10"
            fontWeight={hover === i ? "700" : "500"}
            fill={hover === i ? "var(--text-heading)" : "var(--text-faint)"}
            className="transition-colors font-mono"
          >
            {l}
          </text>
        ))}
      </svg>

      {/* Tooltip & Legend */}
      {hover !== null && (
        <div className="flex items-center justify-center gap-4 mt-2 px-3 py-1.5 rounded-lg text-xs flex-wrap border border-white/[0.08] shadow-md animate-fade-in" style={{ background: "var(--surface-2)" }}>
          <span className="font-bold text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{labels[hover]}</span>
          {series.map((s, si) => (
            <span key={si} className="font-bold inline-flex items-center gap-1.5 font-mono tabular-nums text-[13px]" style={{ color: "var(--text-heading)" }}>
              <span
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{ background: s.color || PALETTE[si % PALETTE.length] }}
              />
              <span className="font-sans font-medium text-xs text-slate-400">{s.name}:</span> {format(s.values[hover])}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-5 mt-3 text-xs flex-wrap">
        {series.map((s, si) => (
          <span key={si} className="inline-flex items-center gap-2 font-medium" style={{ color: "var(--text-muted)" }}>
            <span
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ background: s.color || PALETTE[si % PALETTE.length] }}
            />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  height = 220,
  format = (v) => inr(v, { compact: true }),
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  format?: (v: number) => string;
}) {
  const { globalHidden: hidden } = usePrivacy();
  const [hover, setHover] = useState<number | null>(null);
  if (hidden) return <HiddenChart height={height} />;

  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="w-full select-none">
      <div className="flex items-end gap-2 sm:gap-3.5" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span
              className="text-[11px] font-bold font-mono tabular-nums mb-1.5 transition-all duration-200"
              style={{ color: "var(--text-heading)", opacity: hover === i ? 1 : 0, transform: hover === i ? "translateY(0)" : "translateY(4px)" }}
            >
              {format(d.value)}
            </span>
            <div
              className="w-full rounded-t-lg transition-all duration-300 relative overflow-hidden"
              style={{
                height: `${(d.value / max) * 100}%`,
                background: d.color || PALETTE[i % PALETTE.length],
                opacity: hover === null || hover === i ? 1 : 0.6,
                minHeight: 4,
                boxShadow: hover === i ? "0 0 16px rgba(99, 102, 241, 0.4)" : "none",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 sm:gap-3.5 mt-2.5">
        {data.map((d, i) => (
          <span
            key={i}
            className={`flex-1 text-center text-[11px] font-medium truncate transition-colors ${hover === i ? "font-bold" : ""}`}
            style={{ color: hover === i ? "var(--text-heading)" : "var(--text-faint)" }}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function GroupedBarChart({
  groups,
  series,
  height = 240,
}: {
  groups: string[];
  series: { name: string; values: number[]; color: string }[];
  height?: number;
}) {
  const { globalHidden: hidden } = usePrivacy();
  if (hidden) return <HiddenChart height={height} />;

  const max = Math.max(...series.flatMap((s) => s.values), 1);
  return (
    <div className="w-full select-none">
      <div className="flex items-end gap-3 sm:gap-6" style={{ height }}>
        {groups.map((g, gi) => (
          <div key={gi} className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="flex items-end gap-1 sm:gap-1.5 w-full h-full justify-center">
              {series.map((s, si) => (
                <div
                  key={si}
                  className="rounded-t-md transition-all duration-300 relative overflow-hidden group hover:opacity-100"
                  title={`${s.name}: ${inr(s.values[gi])}`}
                  style={{
                    width: "32%",
                    height: `${(s.values[gi] / max) * 100}%`,
                    background: s.color,
                    minHeight: 4,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 sm:gap-6 mt-2.5">
        {groups.map((g, i) => (
          <span key={i} className="flex-1 text-center text-[11px] font-semibold truncate" style={{ color: "var(--text-faint)" }}>
            {g}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-center gap-5 mt-3 text-xs">
        {series.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-2 font-medium" style={{ color: "var(--text-muted)" }}>
            <span className="w-3 h-3 rounded-full shadow-sm" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
