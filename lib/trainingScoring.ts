import type { BoxScore } from "./trainingBoxScores";

export type YellowBand = "0-2" | "3-5" | "6+";
export type FoulsBand = "0-15" | "16-25" | "26+";

export type TrainingPrediction = {
  homeScore: number;
  awayScore: number;
  redCard: "home" | "away" | "none";
  yellowBand: YellowBand;
  foulsBand: FoulsBand;
  penaltyAwarded: boolean;
  manOfTheMatch: string;
};

export type ScoreLine = {
  label: string;
  correct: boolean;
  points: number;
};

export type TrainingResult = {
  lines: ScoreLine[];
  total: number;
};

export function yellowBandFor(count: number): YellowBand {
  if (count <= 2) return "0-2";
  if (count <= 5) return "3-5";
  return "6+";
}

export function foulsBandFor(count: number): FoulsBand {
  if (count <= 15) return "0-15";
  if (count <= 25) return "16-25";
  return "26+";
}

function outcomeOf(homeScore: number, awayScore: number): "home" | "draw" | "away" {
  if (homeScore > awayScore) return "home";
  if (homeScore < awayScore) return "away";
  return "draw";
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

  const actualYellowBand = yellowBandFor(box.yellowCards);
  lines.push({
    label: "Yellow cards",
    correct: pred.yellowBand === actualYellowBand,
    points: pred.yellowBand === actualYellowBand ? 10 : 0,
  });

  const actualFoulsBand = foulsBandFor(box.fouls);
  lines.push({
    label: "Total fouls",
    correct: pred.foulsBand === actualFoulsBand,
    points: pred.foulsBand === actualFoulsBand ? 10 : 0,
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
