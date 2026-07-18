"use client";

import { motion, useReducedMotion } from "framer-motion";

// Positions assume loadout order: [GK, 4x DEF, 3x MID, 3x FWD] — a classic
// 4-3-3, laid out left-to-right on a horizontal pitch.
const HOME_POSITIONS = [
  { x: 60, y: 300 },
  { x: 150, y: 90 },
  { x: 150, y: 230 },
  { x: 150, y: 370 },
  { x: 150, y: 510 },
  { x: 300, y: 150 },
  { x: 300, y: 300 },
  { x: 300, y: 450 },
  { x: 440, y: 150 },
  { x: 440, y: 300 },
  { x: 440, y: 450 },
];
const AWAY_POSITIONS = HOME_POSITIONS.map((p) => ({ x: 1000 - p.x, y: p.y }));

export function PitchDiagram({
  homeTeam,
  awayTeam,
  homeLoadout,
  awayLoadout,
}: {
  homeTeam: string;
  awayTeam: string;
  homeLoadout: string[];
  awayLoadout: string[];
}) {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 1000 600"
      className="h-auto w-full"
      role="img"
      aria-label={`Starting XI. ${homeTeam}: ${homeLoadout.join(", ")}. ${awayTeam}: ${awayLoadout.join(", ")}.`}
    >
      <defs>
        <radialGradient id="pitch-sheen" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="var(--night-3)" />
          <stop offset="100%" stopColor="var(--night-2)" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="1000" height="600" rx="14" fill="url(#pitch-sheen)" />
      <g stroke="var(--pitch)" strokeWidth="2.5" fill="none" opacity="0.55">
        <rect x="24" y="24" width="952" height="552" />
        <line x1="500" y1="24" x2="500" y2="576" />
        <circle cx="500" cy="300" r="78" />
        <circle cx="500" cy="300" r="3" fill="var(--pitch)" />
        <rect x="24" y="180" width="120" height="240" />
        <rect x="856" y="180" width="120" height="240" />
        <rect x="24" y="250" width="44" height="100" />
        <rect x="932" y="250" width="44" height="100" />
      </g>

      {HOME_POSITIONS.map((pos, i) => (
        <PlayerMark
          key={homeLoadout[i]}
          pos={pos}
          name={homeLoadout[i]}
          color="var(--floodlight)"
          delay={i * 0.04}
          reduceMotion={!!reduceMotion}
        />
      ))}
      {AWAY_POSITIONS.map((pos, i) => (
        <PlayerMark
          key={awayLoadout[i]}
          pos={pos}
          name={awayLoadout[i]}
          color="var(--cap-gold)"
          delay={0.44 + i * 0.04}
          reduceMotion={!!reduceMotion}
        />
      ))}

      <text x="30" y="596" fontSize="16" fontWeight={700} fill="var(--chalk-dim)">
        {homeTeam}
      </text>
      <text x="970" y="596" textAnchor="end" fontSize="16" fontWeight={700} fill="var(--chalk-dim)">
        {awayTeam}
      </text>
    </svg>
  );
}

function PlayerMark({
  pos,
  name,
  color,
  delay,
  reduceMotion,
}: {
  pos: { x: number; y: number };
  name: string;
  color: string;
  delay: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.g
      initial={reduceMotion ? false : { opacity: 0, scale: 0.4 }}
      animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <circle cx={pos.x} cy={pos.y} r="9" fill={color} />
      <text
        x={pos.x}
        y={pos.y - 16}
        textAnchor="middle"
        fontSize="12.5"
        fontWeight={600}
        fill="var(--chalk)"
      >
        {name}
      </text>
    </motion.g>
  );
}
