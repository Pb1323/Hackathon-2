const HOME_POSITIONS = [
  { x: 130, y: 90 },
  { x: 170, y: 190 },
  { x: 130, y: 290 },
];

const AWAY_POSITIONS = [
  { x: 470, y: 90 },
  { x: 430, y: 190 },
  { x: 470, y: 290 },
];

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
  return (
    <svg
      viewBox="0 0 600 380"
      className="h-auto w-full"
      role="img"
      aria-label={`Key players to watch: ${homeTeam} — ${homeLoadout.join(", ")}. ${awayTeam} — ${awayLoadout.join(", ")}.`}
    >
      <rect x="0" y="0" width="600" height="380" rx="8" fill="var(--night-3)" />
      <g stroke="var(--pitch)" strokeWidth="2" fill="none" opacity="0.55">
        <rect x="16" y="16" width="568" height="348" />
        <line x1="300" y1="16" x2="300" y2="364" />
        <circle cx="300" cy="190" r="48" />
        <circle cx="300" cy="190" r="2.5" fill="var(--pitch)" />
        <rect x="16" y="110" width="70" height="160" />
        <rect x="514" y="110" width="70" height="160" />
        <rect x="16" y="152" width="26" height="76" />
        <rect x="558" y="152" width="26" height="76" />
      </g>

      {HOME_POSITIONS.map((pos, i) => (
        <g key={homeLoadout[i]}>
          <circle cx={pos.x} cy={pos.y} r="10" fill="var(--floodlight)" />
          <text
            x={pos.x}
            y={pos.y - 18}
            textAnchor="middle"
            fontSize="14"
            fontWeight={600}
            fill="var(--chalk)"
          >
            {homeLoadout[i]}
          </text>
        </g>
      ))}

      {AWAY_POSITIONS.map((pos, i) => (
        <g key={awayLoadout[i]}>
          <circle cx={pos.x} cy={pos.y} r="10" fill="var(--cap-gold)" />
          <text
            x={pos.x}
            y={pos.y - 18}
            textAnchor="middle"
            fontSize="14"
            fontWeight={600}
            fill="var(--chalk)"
          >
            {awayLoadout[i]}
          </text>
        </g>
      ))}

      <text x="20" y="374" fontSize="12" fill="var(--chalk-faint)">
        {homeTeam}
      </text>
      <text x="580" y="374" textAnchor="end" fontSize="12" fill="var(--chalk-faint)">
        {awayTeam}
      </text>
    </svg>
  );
}
