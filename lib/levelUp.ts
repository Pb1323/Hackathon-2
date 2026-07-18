import { divisionForPoints } from "./scoring";

// Returns the new division's name if crossing into it, otherwise null.
export function checkLevelUp(prevPoints: number, newPoints: number): string | null {
  const prev = divisionForPoints(prevPoints).name;
  const next = divisionForPoints(newPoints).name;
  return next !== prev ? next : null;
}
