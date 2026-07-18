// Simulated aggregate predictions — a seeded distribution so the briefing
// page has a "crowd" to compare against, same demo-data pattern as
// SEEDED_LEADERBOARD in lib/store.ts. Not live data.

export type ScorelineGuess = { score: string; pct: number };

export type CommunityPredictions = {
  totalPredictors: number;
  scorelines: ScorelineGuess[];
};

export const COMMUNITY_PREDICTIONS: Record<string, CommunityPredictions> = {
  "training-arg-bra": {
    totalPredictors: 1842,
    scorelines: [
      { score: "2–1", pct: 24 },
      { score: "1–1", pct: 18 },
      { score: "1–0", pct: 14 },
      { score: "2–0", pct: 12 },
      { score: "0–0", pct: 9 },
      { score: "Other", pct: 23 },
    ],
  },
};

export function getCommunityPredictions(matchId: string): CommunityPredictions | null {
  return COMMUNITY_PREDICTIONS[matchId] ?? null;
}
