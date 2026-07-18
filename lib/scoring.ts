import type { Match } from "./txline";

export type Pick = "home" | "draw" | "away";

export const DIVISIONS = [
  { name: "Sunday League", min: 0 },
  { name: "Championship", min: 20 },
  { name: "International", min: 50 },
  { name: "World Class", min: 100 },
] as const;

export function divisionForPoints(points: number) {
  return [...DIVISIONS].reverse().find((d) => points >= d.min) ?? DIVISIONS[0];
}

export function outcomeForMatch(match: Match): Pick | null {
  if (match.homeScore == null || match.awayScore == null) return null;
  if (match.homeScore > match.awayScore) return "home";
  if (match.homeScore < match.awayScore) return "away";
  return "draw";
}

export function pointsForPick(
  match: Match,
  pick: Pick,
  streak: number
): { correct: boolean; points: number } {
  const outcome = outcomeForMatch(match);
  const correct = outcome === pick;
  if (!correct) return { correct: false, points: 0 };

  let points = 10;
  const odds = match.odds?.[pick];
  if (odds && odds >= 2.5) points += 5; // called an underdog
  points += Math.min(streak, 5) * 2; // streak bonus, capped at +10

  return { correct: true, points };
}
