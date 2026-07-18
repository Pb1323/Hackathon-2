// A lightweight session queue so picking several matches from the training
// hub steps you through them one at a time, instead of dumping you back at
// the hub after each one. sessionStorage (not localStorage) on purpose —
// this is a single browsing-session's plan, not something to persist forever.

const KEY = "kickoff-calls:training-queue";

export function setQueue(matchIds: string[]) {
  sessionStorage.setItem(KEY, JSON.stringify(matchIds));
}

export function getQueue(): string[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Returns the next match id after `currentId` in the queue, or null if
// `currentId` is the last one (or isn't in the queue at all).
export function nextInQueue(currentId: string): string | null {
  const queue = getQueue();
  const index = queue.indexOf(currentId);
  if (index === -1 || index === queue.length - 1) return null;
  return queue[index + 1];
}

export function queuePosition(currentId: string): { position: number; total: number } | null {
  const queue = getQueue();
  const index = queue.indexOf(currentId);
  if (index === -1) return null;
  return { position: index + 1, total: queue.length };
}
