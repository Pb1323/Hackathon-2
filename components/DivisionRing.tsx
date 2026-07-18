"use client";

import { DIVISIONS, divisionForPoints } from "@/lib/scoring";

const SIZE = 108;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DivisionRing({ points }: { points: number }) {
  const division = divisionForPoints(points);
  const index = DIVISIONS.findIndex((d) => d.name === division.name);
  const next = DIVISIONS[index + 1];

  const progress = next
    ? (points - division.min) / (next.min - division.min)
    : 1;
  const offset = CIRCUMFERENCE * (1 - Math.min(Math.max(progress, 0), 1));

  return (
    <div className="flex items-center gap-4">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
        role="img"
        aria-label={`${points} points, ${Math.round(progress * 100)}% toward ${next ? next.name : "top division"}`}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--pitch-line)"
          strokeWidth={STROKE}
        />
        <circle
          className="ring-progress"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--cap-gold)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
        <text
          x={SIZE / 2}
          y={SIZE / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="scoreboard rotate-90"
          fill="var(--chalk)"
          fontSize="22"
          fontWeight={700}
          style={{ transformOrigin: "center", transformBox: "fill-box" }}
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
