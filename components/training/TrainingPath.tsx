"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import type { Match } from "@/lib/txline";
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
  match,
  points,
  streak,
  done,
}: {
  match: Match;
  points: number;
  streak: number;
  done: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="flex flex-col gap-6 rounded-xl border p-6"
      style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--chalk-dim)" }}
          >
            Your training progress
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--chalk-faint)" }}>
            Every full training session earns real points, on a real path.
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

      <div className="relative flex flex-col items-center gap-3 py-4">
        <svg
          className="pointer-events-none absolute left-1/2 top-0 h-full w-2 -translate-x-1/2"
          viewBox="0 0 8 200"
          preserveAspectRatio="none"
          aria-hidden
        >
          <line
            x1="4"
            y1="0"
            x2="4"
            y2="200"
            stroke="var(--line)"
            strokeWidth="3"
            strokeDasharray="2 10"
            strokeLinecap="round"
          />
        </svg>

        <Link href={`/training/${match.id}`} className="relative z-10">
          <motion.div
            whileHover={reduceMotion ? undefined : { scale: 1.06 }}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
            className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 text-center"
            style={{
              background: done ? "var(--cap-gold)" : "var(--floodlight)",
              borderColor: "var(--night-3)",
              color: "var(--night)",
              boxShadow: done
                ? "0 0 0 6px var(--cap-gold-dim)"
                : "0 0 0 6px var(--floodlight-dim)",
            }}
          >
            {done ? (
              <span className="text-2xl">✓</span>
            ) : (
              <>
                <span className="scoreboard text-xs font-bold">{initials(match.homeTeam)}</span>
                <span className="text-[10px] font-bold">vs</span>
                <span className="scoreboard text-xs font-bold">{initials(match.awayTeam)}</span>
              </>
            )}
          </motion.div>
        </Link>

        <div className="relative z-10 text-center">
          <p className="text-sm font-semibold" style={{ color: "var(--chalk)" }}>
            {match.homeTeam} vs {match.awayTeam}
          </p>
          <p className="text-xs" style={{ color: "var(--chalk-faint)" }}>
            {done ? "Completed — replay any time" : "Full training session · pitch, briefing, order ticket"}
          </p>
        </div>

        <Link
          href={`/training/${match.id}`}
          className="relative z-10 rounded-md px-6 py-2.5 text-sm font-bold"
          style={{ background: "var(--cap-gold)", color: "var(--night)" }}
        >
          {done ? "Train again" : "Start"}
        </Link>
      </div>
    </div>
  );
}
