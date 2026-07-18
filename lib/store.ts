// Client-side ledger of a wallet's "caps" (settled predictions). This is a
// local cache for the leaderboard/streak UI — the actual proof of record is
// always the on-chain memo transaction, this just avoids re-scanning the
// chain on every render for a hackathon MVP.

export type Cap = {
  matchId: string;
  pick: string;
  correct: boolean;
  points: number;
  signature: string;
  // True when no devnet SOL was available to actually broadcast this — the
  // pick is recorded locally so testing isn't blocked, but it was never
  // anchored on-chain. `signature` is a local placeholder id, not a real one.
  simulated?: boolean;
};

const KEY = "kickoff-calls:caps";

function readAll(): Record<string, Cap[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, Cap[]>) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getCaps(wallet: string): Cap[] {
  return readAll()[wallet] ?? [];
}

export function hasCapForMatch(wallet: string, matchId: string): boolean {
  return getCaps(wallet).some((c) => c.matchId === matchId);
}

export function addCap(wallet: string, cap: Cap) {
  const all = readAll();
  all[wallet] = [...(all[wallet] ?? []), cap];
  writeAll(all);
}

export function totalPoints(caps: Cap[]): number {
  return caps.reduce((sum, c) => sum + c.points, 0);
}

export function currentStreak(caps: Cap[]): number {
  let streak = 0;
  for (let i = caps.length - 1; i >= 0; i--) {
    if (caps[i].correct) streak++;
    else break;
  }
  return streak;
}

// Seed a few other predictors so the leaderboard reads as a live league from
// the very first run, instead of an empty table.
export const SEEDED_LEADERBOARD: { label: string; points: number }[] = [
  { label: "8xQ2…mR4k", points: 145 },
  { label: "3fPz…9Ldc", points: 88 },
  { label: "Kj7T…w2Vn", points: 52 },
  { label: "Rz4X…c8Ym", points: 24 },
];
