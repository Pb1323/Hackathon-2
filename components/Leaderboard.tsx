"use client";

import { SEEDED_LEADERBOARD } from "@/lib/store";

export function Leaderboard({
  you,
}: {
  you: { label: string; points: number } | null;
}) {
  const rows = [...SEEDED_LEADERBOARD];
  if (you) rows.push(you);
  rows.sort((a, b) => b.points - a.points);

  return (
    <div
      className="rounded-lg border"
      style={{ background: "var(--turf-panel)", borderColor: "var(--pitch-line)" }}
    >
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--pitch-line)" }}>
        <h2
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--chalk-dim)" }}
        >
          Cap leaderboard
        </h2>
        <p className="mt-1 text-xs" style={{ color: "var(--chalk-dim)" }}>
          Placeholder rivals shown below until more real players connect a wallet.
        </p>
      </div>
      <ol className="flex flex-col">
        {rows.map((row, i) => {
          const isYou = you && row.label === you.label;
          return (
            <li
              key={row.label + i}
              className="flex items-center justify-between px-4 py-2.5 text-sm"
              style={{
                borderTop: i > 0 ? "1px solid var(--pitch-line)" : undefined,
                background: isYou ? "var(--cap-gold-dim)" : undefined,
              }}
            >
              <span className="flex items-center gap-3">
                <span
                  className="scoreboard w-6 text-xs"
                  style={{ color: i < 3 ? "var(--cap-gold)" : "var(--chalk-dim)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ color: "var(--chalk)", fontWeight: isYou ? 600 : 400 }}>
                  {row.label}
                  {isYou && (
                    <span className="ml-2 text-xs" style={{ color: "var(--cap-gold)" }}>
                      you
                    </span>
                  )}
                </span>
              </span>
              <span className="scoreboard" style={{ color: "var(--chalk)" }}>
                {row.points} pts
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
