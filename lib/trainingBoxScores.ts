// Full simulated match reports for Training Mode — richer than the plain
// final score in trainingMatches.ts, this is what a locked-in prediction
// sheet gets checked against. Deliberately hand-authored per match (not
// randomly generated) so each training match tells a specific, consistent
// story. Start with one match end-to-end before expanding the catalogue.

export type BoxScore = {
  homeScore: number;
  awayScore: number;
  redCard: "home" | "away" | "none";
  yellowCards: number;
  fouls: number;
  penaltyAwarded: boolean;
  manOfTheMatch: string;
  report: string[];
};

export const TRAINING_BOX_SCORES: Record<string, BoxScore> = {
  "training-arg-bra": {
    homeScore: 2,
    awayScore: 1,
    redCard: "none",
    yellowCards: 4,
    fouls: 22,
    penaltyAwarded: true,
    manOfTheMatch: "Messi",
    report: [
      "Argentina start like they mean business — pressing high, snapping into every second ball, and Brazil can't find a foothold in the opening exchanges.",
      "34' — GOAL. Di María drives at pace, Brazil's line drops off half a yard too late, and Julián Álvarez slides the finish under Alisson. Bedlam in the away end.",
      "Brazil respond after the break. Vinícius Jr. gets in behind, clips the heel of Tagliafico in the box, and the referee points straight to the spot — Neymar sends Martínez the wrong way, 58', 1–1.",
      "The game turns feral in the final quarter. Four bookings in twenty minutes, niggling fouls everywhere, neither side willing to blink.",
      "76' — Messi. Of course it's Messi. A one-two on the edge of the box, half a yard of space, and the finish feels inevitable before it even happens. Argentina 2–1.",
      "Final whistle: a spiteful, brilliant occasion. Argentina survive a Brazilian onslaught in the last ten minutes, and Messi walks off with the match ball in his pocket.",
    ],
  },
};

export function getBoxScore(matchId: string): BoxScore | null {
  return TRAINING_BOX_SCORES[matchId] ?? null;
}
