"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

import type { CommunityPredictions } from "@/lib/communityPredictions";

function TickingCount({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 55, damping: 20 });

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  useEffect(() => {
    if (reduceMotion) return;
    return spring.on("change", (latest) => {
      if (ref.current) ref.current.textContent = Math.round(latest).toLocaleString();
    });
  }, [spring, reduceMotion]);

  return (
    <span ref={ref} className="scoreboard">
      {reduceMotion || !inView ? value.toLocaleString() : "0"}
    </span>
  );
}

export function CommunityScorecard({ data }: { data: CommunityPredictions }) {
  const reduceMotion = useReducedMotion();
  const maxPct = Math.max(...data.scorelines.map((s) => s.pct));

  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
    >
      <div className="mb-4 flex items-baseline justify-between">
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--chalk-dim)" }}
        >
          What everyone else is calling
        </p>
        <p className="scoreboard text-sm" style={{ color: "var(--chalk-faint)" }}>
          <TickingCount value={data.totalPredictors} /> predictions in
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {data.scorelines.map((row, i) => (
          <div key={row.score} className="flex items-center gap-3">
            <span
              className="scoreboard w-12 shrink-0 text-sm font-semibold"
              style={{ color: "var(--chalk)" }}
            >
              {row.score}
            </span>
            <div
              className="h-3 flex-1 overflow-hidden rounded-full"
              style={{ background: "var(--night-3)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: row.pct === maxPct ? "var(--cap-gold)" : "var(--floodlight)" }}
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${row.pct}%` }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span
              className="scoreboard w-10 shrink-0 text-right text-sm"
              style={{ color: "var(--chalk-faint)" }}
            >
              {row.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
