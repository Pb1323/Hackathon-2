"use client";

import { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import type { Match } from "@/lib/txline";
import { submitPrediction, type PredictionPayload } from "@/lib/predictionMemo";
import { pointsForPick, type Pick } from "@/lib/scoring";
import {
  addCap,
  currentStreak,
  getCaps,
  hasCapForMatch,
  totalPoints,
  type Cap,
} from "@/lib/store";
import { DivisionRing } from "./DivisionRing";
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
    <div className="flex flex-col gap-8">
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-5"
        style={{ background: "var(--turf-panel)", borderColor: "var(--pitch-line)" }}
      >
        {walletKey ? (
          <DivisionRing points={points} />
        ) : (
          <p className="text-sm" style={{ color: "var(--chalk-dim)" }}>
            Connect a devnet wallet to start earning caps.
          </p>
        )}
        <div className="flex items-center gap-4">
          {walletKey && (
            <div className="text-right">
              <p className="scoreboard text-2xl font-bold" style={{ color: "var(--chalk)" }}>
                {streak}
              </p>
              <p className="text-xs uppercase tracking-widest" style={{ color: "var(--chalk-dim)" }}>
                Streak
              </p>
            </div>
          )}
          <WalletMultiButton />
        </div>
      </div>

      {error && (
        <p
          className="rounded-md px-4 py-2 text-sm"
          style={{ background: "var(--live-dim)", color: "var(--live)" }}
        >
          {error}
        </p>
      )}

      <Leaderboard you={you} />

      {upcoming.length > 0 && (
        <Section title="Call it before kickoff" live>
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
        </Section>
      )}

      {finished.length > 0 && (
        <Section title="Practice matches — settle instantly" note="Demo data, for trying the scoring engine now">
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
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  note,
  live,
  children,
}: {
  title: string;
  note?: string;
  live?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {live && <span className="live-dot" aria-hidden />}
        <h2
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--chalk-dim)" }}
        >
          {title}
        </h2>
      </div>
      {note && (
        <p className="-mt-2 text-xs" style={{ color: "var(--chalk-dim)" }}>
          {note}
        </p>
      )}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
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
    <div
      className="rounded-lg border p-4"
      style={{ background: "var(--turf-panel)", borderColor: "var(--pitch-line)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p
            className="text-xs uppercase tracking-widest"
            style={{ color: "var(--chalk-dim)" }}
          >
            {match.competition}
          </p>
          <p className="text-lg font-medium" style={{ color: "var(--chalk)" }}>
            {match.homeTeam} vs {match.awayTeam}
            {isFinished && (
              <span className="scoreboard ml-2" style={{ color: "var(--cap-gold)" }}>
                {match.homeScore}–{match.awayScore}
              </span>
            )}
          </p>
        </div>
        <p className="scoreboard text-xs" style={{ color: "var(--chalk-dim)" }}>
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
        <p
          className="mt-4 flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--cap-gold)" }}
        >
          Cap earned for this match
        </p>
      ) : (
        <div className="mt-4 flex gap-2">
          {(["home", "draw", "away"] as const).map((pick) => (
            <button
              key={pick}
              disabled={!walletKey || pending}
              onClick={() => onPredict(pick)}
              className="flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors disabled:opacity-40"
              style={{ borderColor: "var(--pitch-line)", color: "var(--chalk)" }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) e.currentTarget.style.background = "var(--turf-panel-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {pending ? "Signing…" : pick}
              {match.odds && !pending && (
                <span className="scoreboard ml-1" style={{ color: "var(--chalk-dim)" }}>
                  {match.odds[pick]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
