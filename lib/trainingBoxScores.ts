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
  firstToScore: "home" | "away";
  firstSubOff: string;
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
    manOfTheMatch: "Lionel Messi",
    firstToScore: "home",
    firstSubOff: "Nicolás Otamendi",
    report: [
      "Argentina start like they mean business — pressing high, snapping into every second ball, and Brazil can't find a foothold in the opening exchanges.",
      "34' — GOAL. Di María drives at pace, Brazil's line drops off half a yard too late, and Julián Álvarez slides the finish under Alisson. Bedlam in the away end.",
      "Brazil respond after the break. Vinícius Jr. gets in behind, clips the heel of Tagliafico in the box, and the referee points straight to the spot — Neymar sends Martínez the wrong way, 58', 1–1.",
      "63' — the first change of the night. Otamendi, still shaken from a knock in the build-up to the equalizer, is withdrawn for fresher legs at the back.",
      "The game turns feral in the final quarter. Four bookings in twenty minutes, niggling fouls everywhere, neither side willing to blink.",
      "76' — Messi. Of course it's Messi. A one-two on the edge of the box, half a yard of space, and the finish feels inevitable before it even happens. Argentina 2–1.",
      "Final whistle: a spiteful, brilliant occasion. Argentina survive a Brazilian onslaught in the last ten minutes, and Messi walks off with the match ball in his pocket.",
    ],
  },
  "training-fra-eng": {
    homeScore: 1,
    awayScore: 1,
    redCard: "none",
    yellowCards: 3,
    fouls: 19,
    penaltyAwarded: false,
    manOfTheMatch: "Jude Bellingham",
    firstToScore: "home",
    firstSubOff: "N'Golo Kanté",
    report: [
      "France start brightly, Dembélé causing early problems down the right, and it's no surprise when the breakthrough comes.",
      "23' — GOAL. Mbappé drifts in from the left, exchanges a one-two with Griezmann, and finishes low past Pickford. France 1–0.",
      "England needed a spark, and Bellingham provides it — driving from midfield, dragging defenders out of position, growing into the game by the minute.",
      "58' — the leveler. Bellingham finds space at the back post and heads home a Trippier delivery. 1–1.",
      "63' — the first change of the night. Kanté, carrying a tight hamstring since the hour mark, is withdrawn as a precaution.",
      "Both sides create half-chances late on but neither keeper is seriously tested again — a fair result, honestly reflecting the balance of the game.",
      "Final whistle: 1–1, honours even, Bellingham's growing influence the story of the night.",
    ],
  },
  "training-esp-ger": {
    homeScore: 3,
    awayScore: 1,
    redCard: "away",
    yellowCards: 5,
    fouls: 24,
    penaltyAwarded: true,
    manOfTheMatch: "Lamine Yamal",
    firstToScore: "home",
    firstSubOff: "Álvaro Morata",
    report: [
      "Spain waste no time asserting control — quick, patient buildup, Germany chasing shadows inside the first ten minutes.",
      "14' — GOAL. Yamal skips two challenges on the right and squares for Morata to tap home. Spain 1–0, barely a bead of sweat broken.",
      "28' — PENALTY. Rüdiger clips Nico Williams inside the area, the referee points to the spot, and Rodri sends Neuer the wrong way. 2–0.",
      "Germany push back before the break — Musiala pulls one back on 39' with a slaloming run and a cool finish. 2–1 at the interval.",
      "Spain reassert control after the restart. 67' — Yamal again, this time the provider, teeing up Morata for his second of the night. 3–1.",
      "71' — the first change of the afternoon, Morata withdrawn with the game long since settled.",
      "88' — RED CARD. Tah lunges late on Yamal out of pure frustration and walks for an early bath.",
      "Final whistle: a comprehensive Spain win, Yamal announcing himself as the tournament's best young talent.",
    ],
  },
};

export function getBoxScore(matchId: string): BoxScore | null {
  return TRAINING_BOX_SCORES[matchId] ?? null;
}
