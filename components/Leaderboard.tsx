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
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Cap leaderboard
        </h2>
        <p className="mt-1 text-xs text-neutral-400">
          Placeholder rivals shown below until more real players connect a wallet.
        </p>
      </div>
      <ol className="divide-y divide-neutral-100 dark:divide-neutral-900">
        {rows.map((row, i) => (
          <li
            key={row.label + i}
            className={`flex items-center justify-between px-4 py-2 text-sm ${
              you && row.label === you.label
                ? "bg-amber-50 font-semibold dark:bg-amber-950/30"
                : ""
            }`}
          >
            <span>
              #{i + 1} {row.label}
            </span>
            <span>{row.points} pts</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
