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
      "Argentina start the sharper of the two sides, pressing high and forcing Brazil into uncomfortable ball retention in their own third.",
      "Julián Álvarez opens the scoring on 34' after a driving Di María run splits the Brazil back line.",
      "Brazil respond well after the break — Vinícius Jr. drags a foul out of the Argentina box, and Neymar levels from the resulting penalty on 58'.",
      "Argentina retake the lead on 76' — Messi finishes a one-two on the edge of the area after a foul-strewn, scrappy final quarter.",
      "Four bookings across the match but no red card — a niggly, feisty derby that Argentina edge 2–1, Messi named Man of the Match.",
    ],
  },
};

export function getBoxScore(matchId: string): BoxScore | null {
  return TRAINING_BOX_SCORES[matchId] ?? null;
}
