"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

import type { Match } from "@/lib/txline";
import { impliedWinPct } from "@/lib/trainingMatches";
import { setQueue } from "@/lib/trainingQueue";
import { DivisionRing } from "../DivisionRing";

function initials(team: string): string {
  return team
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TrainingPath({
  matches,
  points,
  streak,
  doneIds,
}: {
  matches: Match[];
  points: number;
  streak: number;
  doneIds: string[];
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<string[]>(matches.map((m) => m.id));

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleStart() {
    if (selected.length === 0) return;
    const ordered = matches.map((m) => m.id).filter((id) => selected.includes(id));
    setQueue(ordered);
    router.push(`/training/${ordered[0]}`);
  }

  return (
    <div
      className="flex flex-col gap-5 rounded-xl border p-6"
      style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p
            className="scoreboard text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--floodlight)" }}
          >
            Training dashboard
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--chalk-faint)" }}>
            Pick the matches for this session, then work through them one by one.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <DivisionRing points={points} />
          <div className="text-right">
            <p className="scoreboard text-2xl font-bold" style={{ color: "var(--chalk)" }}>
              {streak}
            </p>
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--chalk-dim)" }}>
              Streak
            </p>
          </div>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {matches.map((match) => {
          const winPct = impliedWinPct(match);
          const isDone = doneIds.includes(match.id);
          const isSelected = selected.includes(match.id);
          return (
            <motion.li
              key={match.id}
              initial={false}
              animate={{ borderColor: isSelected ? "var(--floodlight)" : "var(--line)" }}
              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
              style={{ background: "var(--night-3)" }}
              onClick={() => toggle(match.id)}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(match.id)}
                onClick={(e) => e.stopPropagation()}
                style={{ accentColor: "var(--floodlight)" }}
                className="h-4 w-4 shrink-0"
              />
              <div
                className="scoreboard flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: "var(--floodlight-dim)", color: "var(--floodlight)" }}
              >
                {initials(match.homeTeam)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: "var(--chalk)" }}>
                  {match.homeTeam} vs {match.awayTeam}
                </p>
                {winPct && (
                  <p className="scoreboard text-xs" style={{ color: "var(--chalk-faint)" }}>
                    {winPct.home}% / {winPct.draw}% / {winPct.away}%
                  </p>
                )}
              </div>
              {isDone && (
                <span className="scoreboard text-xs font-bold" style={{ color: "var(--cap-gold)" }}>
                  ✓ done
                </span>
              )}
            </motion.li>
          );
        })}
      </ul>

      <motion.button
        whileHover={reduceMotion || selected.length === 0 ? undefined : { scale: 1.02 }}
        whileTap={reduceMotion || selected.length === 0 ? undefined : { scale: 0.98 }}
        onClick={handleStart}
        disabled={selected.length === 0}
        className="cursor-pointer self-start rounded-md px-6 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: "var(--cap-gold)", color: "var(--night)" }}
      >
        Start session ({selected.length})
      </motion.button>
    </div>
  );
}
