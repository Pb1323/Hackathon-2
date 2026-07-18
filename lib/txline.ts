// TxLINE client stub — TxOdds' Solana-anchored live odds/scores feed.
// Fill in the real endpoint + auth header once you get an API key at the venue.
// Docs will be handed out on the day; this shape is a best guess and should be
// adjusted to match the real response schema as soon as you have it.

export type Match = {
  id: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  kickoffISO: string;
  status: "scheduled" | "live" | "finished";
  homeScore?: number;
  awayScore?: number;
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
};

const TXLINE_BASE_URL = process.env.TXLINE_BASE_URL ?? "https://api.txline.example";
const TXLINE_API_KEY = process.env.TXLINE_API_KEY;

// Placeholder fixtures so the UI works before the real API key arrives.
const MOCK_MATCHES: Match[] = [
  {
    id: "wc-final",
    competition: "World Cup Final",
    homeTeam: "Team A",
    awayTeam: "Team B",
    kickoffISO: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    status: "scheduled",
    odds: { home: 2.1, draw: 3.4, away: 2.9 },
  },
];

export async function getUpcomingMatches(): Promise<Match[]> {
  if (!TXLINE_API_KEY) {
    return MOCK_MATCHES;
  }

  const res = await fetch(`${TXLINE_BASE_URL}/matches?status=scheduled`, {
    headers: { Authorization: `Bearer ${TXLINE_API_KEY}` },
    // Live odds change fast — never cache this.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`TxLINE request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getMatchResult(matchId: string): Promise<Match> {
  if (!TXLINE_API_KEY) {
    const match = MOCK_MATCHES.find((m) => m.id === matchId);
    if (!match) throw new Error(`Unknown mock match: ${matchId}`);
    return match;
  }

  const res = await fetch(`${TXLINE_BASE_URL}/matches/${matchId}`, {
    headers: { Authorization: `Bearer ${TXLINE_API_KEY}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`TxLINE request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
