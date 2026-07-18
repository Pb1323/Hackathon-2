import type { BoxScore } from "./trainingBoxScores";

export type TrainingPrediction = {
  homeScore: number;
  awayScore: number;
  redCard: "home" | "away" | "none";
  yellowCards: number;
  fouls: number;
  penaltyAwarded: boolean;
  manOfTheMatch: string;
};

export type ScoreLine = {
  label: string;
  correct: boolean;
  points: number;
  detail?: string;
};

export type TrainingResult = {
  lines: ScoreLine[];
  total: number;
};

function outcomeOf(homeScore: number, awayScore: number): "home" | "draw" | "away" {
  if (homeScore > awayScore) return "home";
  if (homeScore < awayScore) return "away";
  return "draw";
}

// Free numeric guesses get tiered credit instead of an all-or-nothing band —
// spot on scores full marks, close scores something for the effort.
function tieredPoints(guess: number, actual: number, exact: number, within: number, tolerance: number) {
  const diff = Math.abs(guess - actual);
  if (diff === 0) return exact;
  if (diff <= tolerance) return within;
  return 0;
}

export function scoreTrainingPrediction(
  box: BoxScore,
  pred: TrainingPrediction
): TrainingResult {
  const lines: ScoreLine[] = [];

  const exactScore = pred.homeScore === box.homeScore && pred.awayScore === box.awayScore;
  if (exactScore) {
    lines.push({ label: "Exact scoreline", correct: true, points: 20 });
  } else {
    const outcomeCorrect =
      outcomeOf(pred.homeScore, pred.awayScore) === outcomeOf(box.homeScore, box.awayScore);
    lines.push({
      label: outcomeCorrect ? "Correct result, wrong scoreline" : "Scoreline",
      correct: outcomeCorrect,
      points: outcomeCorrect ? 5 : 0,
    });
  }

  lines.push({
    label: "Red card",
    correct: pred.redCard === box.redCard,
    points: pred.redCard === box.redCard ? 10 : 0,
  });

  const yellowPts = tieredPoints(pred.yellowCards, box.yellowCards, 15, 8, 1);
  lines.push({
    label: "Yellow cards",
    correct: yellowPts > 0,
    points: yellowPts,
    detail: yellowPts === 15 ? "spot on" : yellowPts === 8 ? "within 1" : undefined,
  });

  const foulsPts = tieredPoints(pred.fouls, box.fouls, 15, 8, 3);
  lines.push({
    label: "Total fouls",
    correct: foulsPts > 0,
    points: foulsPts,
    detail: foulsPts === 15 ? "spot on" : foulsPts === 8 ? "within 3" : undefined,
  });

  lines.push({
    label: "Penalty awarded",
    correct: pred.penaltyAwarded === box.penaltyAwarded,
    points: pred.penaltyAwarded === box.penaltyAwarded ? 10 : 0,
  });

  lines.push({
    label: "Man of the Match",
    correct: pred.manOfTheMatch === box.manOfTheMatch,
    points: pred.manOfTheMatch === box.manOfTheMatch ? 20 : 0,
  });

  const total = lines.reduce((sum, l) => sum + l.points, 0);
  return { lines, total };
}
