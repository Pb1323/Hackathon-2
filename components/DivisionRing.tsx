"use client";

import { DIVISIONS, divisionForPoints } from "@/lib/scoring";

const SIZE = 112;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TICKS = 12;

export function DivisionRing({ points }: { points: number }) {
  const division = divisionForPoints(points);
  const index = DIVISIONS.findIndex((d) => d.name === division.name);
  const next = DIVISIONS[index + 1];

  const progress = next
    ? (points - division.min) / (next.min - division.min)
    : 1;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const offset = CIRCUMFERENCE * (1 - clamped);

  return (
    <div className="flex items-center gap-4">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`${points} points, ${Math.round(clamped * 100)}% toward ${next ? next.name : "top division"}`}
      >
        {/* Decorative scoreboard-dial ticks */}
        <g stroke="var(--line)" strokeWidth="2">
          {Array.from({ length: TICKS }).map((_, i) => {
            const angle = (i / TICKS) * Math.PI * 2;
            const cx = SIZE / 2;
            const cy = SIZE / 2;
            const rOuter = SIZE / 2 - 1;
            const rInner = SIZE / 2 - 4;
            return (
              <line
                key={i}
                x1={cx + rOuter * Math.cos(angle)}
                y1={cy + rOuter * Math.sin(angle)}
                x2={cx + rInner * Math.cos(angle)}
                y2={cy + rInner * Math.sin(angle)}
              />
            );
          })}
        </g>
        <g transform="rotate(-90 56 56)">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--night-3)"
            strokeWidth={STROKE}
          />
          <circle
            className="ring-progress"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--pitch)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </g>
        <text
          x={SIZE / 2}
          y={SIZE / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="scoreboard"
          fill="var(--chalk)"
          fontSize="22"
          fontWeight={700}
        >
          {points}
        </text>
      </svg>
      <div>
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--chalk-dim)" }}>
          Division
        </p>
        <p className="text-lg font-semibold" style={{ color: "var(--chalk)" }}>
          {division.name}
        </p>
        <p className="text-xs" style={{ color: "var(--chalk-dim)" }}>
          {next ? `${next.min - points} pts to ${next.name}` : "Top division"}
        </p>
      </div>
    </div>
  );
}
