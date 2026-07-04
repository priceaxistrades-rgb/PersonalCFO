"use client";

import { useState } from "react";
import { inr } from "@/lib/format";
import { usePrivacy } from "@/lib/privacy";

function HiddenChart({ height = 180 }: { height?: number }) {
  return (
    <div
      className="w-full rounded-xl grid place-items-center text-sm border"
      style={{ height, background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-muted)" }}
    >
      <div className="text-center">
        <div className="text-2xl mb-1">🙈</div>
        <div className="font-medium">Values hidden</div>
        <div className="text-xs mt-1">Use any KPI eye button to show financial values.</div>
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

  // Use passed size or default
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
    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
      <svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`} className="shrink-0 max-w-[160px] sm:max-w-none">
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
                style={{ transition: "stroke-width .15s", cursor: "pointer" }}
              />
            );
          })}
        </g>
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          fontSize="11"
          fill="var(--text-muted)"
        >
          {active !== null ? data[active].label : centerLabel}
        </text>
        <text
          x="50%"
          y="58%"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="var(--text)"
        >
          {active !== null
            ? `${((data[active].value / total) * 100).toFixed(0)}%`
            : centerValue}
        </text>
      </svg>
      <div className="grid grid-cols-1 gap-1.5 w-full">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 text-xs py-0.5"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ background: d.color || PALETTE[i % PALETTE.length] }}
              />
              <span className="truncate" style={{ color: "var(--text-muted)" }}>
                {d.label}
              </span>
            </span>
            <span className="font-semibold whitespace-nowrap" style={{ color: "var(--text)" }}>
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
  const pad = { l: 8, r: 8, t: 12, b: 22 };
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
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
          <line
            key={i}
            x1={pad.l}
            x2={width - pad.r}
            y1={pad.t + innerH * g}
            y2={pad.t + innerH * g}
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))}
        {series.map((s, si) => {
          const color = s.color || PALETTE[si % PALETTE.length];
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          const area = `${pts} ${x(n - 1)},${pad.t + innerH} ${x(0)},${pad.t + innerH}`;
          return (
            <g key={si}>
              {si === 0 && (
                <polygon points={area} fill={color} opacity="0.08" />
              )}
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
                  r={hover === i ? 4 : 2.5}
                  fill={color}
                />
              ))}
            </g>
          );
        })}
        {labels.map((_, i) => (
          <rect
            key={i}
            x={x(i) - innerW / (2 * Math.max(n - 1, 1))}
            y={0}
            width={innerW / Math.max(n - 1, 1)}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={pad.t}
            y2={pad.t + innerH}
            stroke="var(--text-faint)"
            strokeDasharray="3 3"
          />
        )}
        {labels.map((l, i) => (
          <text
            key={i}
            x={x(i)}
            y={height - 6}
            textAnchor="middle"
            fontSize="10"
            fill="var(--text-faint)"
          >
            {l}
          </text>
        ))}
      </svg>
      {hover !== null && (
        <div className="flex items-center justify-center gap-4 mt-1 text-xs flex-wrap">
          <span style={{ color: "var(--text-muted)" }}>{labels[hover]}</span>
          {series.map((s, si) => (
            <span key={si} className="font-semibold inline-flex items-center gap-1" style={{ color: "var(--text)" }}>
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: s.color || PALETTE[si % PALETTE.length] }}
              />
              {s.name}: {format(s.values[hover])}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-center gap-4 mt-1 text-xs flex-wrap">
        {series.map((s, si) => (
          <span key={si} className="inline-flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <span
              className="w-2.5 h-2.5 rounded-full"
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
    <div className="w-full">
      <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end h-full group"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span
              className="text-[10px] font-semibold mb-1 transition-opacity"
              style={{ color: "var(--text)", opacity: hover === i ? 1 : 0 }}
            >
              {format(d.value)}
            </span>
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${(d.value / max) * 100}%`,
                background: d.color || PALETTE[i % PALETTE.length],
                opacity: hover === null || hover === i ? 1 : 0.55,
                minHeight: 2,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 sm:gap-3 mt-2">
        {data.map((d, i) => (
          <span
            key={i}
            className="flex-1 text-center text-[10px] truncate"
            style={{ color: "var(--text-faint)" }}
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
    <div className="w-full">
      <div className="flex items-end gap-3 sm:gap-5" style={{ height }}>
        {groups.map((g, gi) => (
          <div key={gi} className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="flex items-end gap-1 w-full h-full justify-center">
              {series.map((s, si) => (
                <div
                  key={si}
                  className="rounded-t transition-all"
                  title={`${s.name}: ${inr(s.values[gi])}`}
                  style={{
                    width: "32%",
                    height: `${(s.values[gi] / max) * 100}%`,
                    background: s.color,
                    minHeight: 2,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 sm:gap-5 mt-2">
        {groups.map((g, i) => (
          <span key={i} className="flex-1 text-center text-[10px] truncate" style={{ color: "var(--text-faint)" }}>
            {g}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 mt-2 text-xs">
        {series.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
