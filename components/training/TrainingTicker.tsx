"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { Match } from "@/lib/txline";
import { impliedWinPct } from "@/lib/trainingMatches";

function code(team: string): string {
  return team.slice(0, 3).toUpperCase();
}

export function TrainingTicker({ match }: { match: Match }) {
  const reduceMotion = useReducedMotion();
  const pct = impliedWinPct(match);
  if (!pct) return null;

  const favorite = pct.home >= pct.away && pct.home >= pct.draw ? "home" : pct.away >= pct.draw ? "away" : "draw";

  const quotes = [
    { key: "home", label: code(match.homeTeam), value: pct.home },
    { key: "draw", label: "DRW", value: pct.draw },
    { key: "away", label: code(match.awayTeam), value: pct.away },
  ] as const;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: -12 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-wrap items-center gap-4 rounded-lg border px-4 py-2.5"
      style={{ background: "var(--night-3)", borderColor: "var(--line)" }}
    >
      <span
        className="scoreboard text-xs font-bold tracking-wider"
        style={{ color: "var(--chalk-faint)" }}
      >
        {code(match.homeTeam)}/{code(match.awayTeam)}
      </span>

      <div className="flex flex-1 flex-wrap items-center gap-2">
        {quotes.map((q) => (
          <span
            key={q.key}
            className="scoreboard flex items-center gap-1.5 rounded px-2 py-1 text-xs font-bold"
            style={{
              background: q.key === favorite ? "var(--pitch-dim)" : "transparent",
              color: q.key === favorite ? "var(--pitch)" : "var(--chalk-dim)",
            }}
          >
            {q.label} <span>{q.value}%</span>
            {q.key === favorite && <span aria-hidden>▲</span>}
          </span>
        ))}
      </div>

      <span
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--chalk-faint)" }}
      >
        Simulated market
      </span>
    </motion.div>
  );
}
