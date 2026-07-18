"use client";

import { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import type { Match } from "@/lib/txline";
import { submitPrediction, type PredictionPayload } from "@/lib/predictionMemo";
import { divisionForPoints, pointsForPick, type Pick } from "@/lib/scoring";
import {
  addCap,
  currentStreak,
  getCaps,
  hasCapForMatch,
  totalPoints,
  type Cap,
} from "@/lib/store";
import { Leaderboard } from "./Leaderboard";

export function PredictionBoard({ matches }: { matches: Match[] }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const walletKey = wallet.publicKey?.toBase58() ?? null;

  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0); // bump to re-read localStorage

  const caps: Cap[] = useMemo(
    () => (walletKey ? getCaps(walletKey) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [walletKey, version]
  );
  const points = totalPoints(caps);
  const streak = currentStreak(caps);
  const division = divisionForPoints(points);

  const finished = matches.filter((m) => m.status === "finished");
  const upcoming = matches.filter((m) => m.status !== "finished");

  async function handlePredict(match: Match, pick: Pick) {
    if (!walletKey) return;
    setError(null);
    setPending(match.id);
    try {
      const payload: PredictionPayload = {
        matchId: match.id,
        pick,
        predictedAt: new Date().toISOString(),
      };
      const signature = await submitPrediction(connection, wallet, payload);

      if (match.status === "finished") {
        const { correct, points: earned } = pointsForPick(match, pick, streak);
        addCap(walletKey, {
          matchId: match.id,
          pick,
          correct,
          points: earned,
          signature,
        });
        setVersion((v) => v + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit prediction");
    } finally {
      setPending(null);
    }
  }

  const you = walletKey
    ? { label: `${walletKey.slice(0, 4)}…${walletKey.slice(-4)}`, points }
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">
          {wallet.publicKey ? "Wallet connected" : "Connect a devnet wallet to earn caps"}
        </span>
        <WalletMultiButton />
      </div>

      {walletKey && (
        <div className="grid grid-cols-3 gap-3 rounded-lg border border-neutral-200 p-4 text-center dark:border-neutral-800">
          <div>
            <p className="text-2xl font-semibold">{points}</p>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Points</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{streak}</p>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Streak</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{division.name}</p>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Division</p>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <Leaderboard you={you} />

      {finished.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Full-time — earn a cap
          </h2>
          {finished.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              walletKey={walletKey}
              pending={pending === match.id}
              alreadyCapped={walletKey ? hasCapForMatch(walletKey, match.id) : false}
              onPredict={(pick) => handlePredict(match, pick)}
            />
          ))}
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Upcoming
          </h2>
          {upcoming.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              walletKey={walletKey}
              pending={pending === match.id}
              alreadyCapped={walletKey ? hasCapForMatch(walletKey, match.id) : false}
              onPredict={(pick) => handlePredict(match, pick)}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function MatchCard({
  match,
  walletKey,
  pending,
  alreadyCapped,
  onPredict,
}: {
  match: Match;
  walletKey: string | null;
  pending: boolean;
  alreadyCapped: boolean;
  onPredict: (pick: Pick) => void;
}) {
  const isFinished = match.status === "finished";
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            {match.competition}
          </p>
          <p className="text-lg font-medium">
            {match.homeTeam} vs {match.awayTeam}
            {isFinished && (
              <span className="ml-2 text-neutral-500">
                ({match.homeScore}–{match.awayScore})
              </span>
            )}
          </p>
        </div>
        <p className="text-xs text-neutral-500">
          {new Date(match.kickoffISO).toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {alreadyCapped ? (
        <p className="mt-4 text-sm text-emerald-600">Cap earned for this match.</p>
      ) : (
        <div className="mt-4 flex gap-2">
          {(["home", "draw", "away"] as const).map((pick) => (
            <button
              key={pick}
              disabled={!walletKey || pending}
              onClick={() => onPredict(pick)}
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium capitalize transition-colors hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              {pick}
              {match.odds && (
                <span className="ml-1 text-neutral-500">{match.odds[pick]}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
