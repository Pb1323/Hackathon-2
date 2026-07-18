"use client";

import { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { Keypair } from "@solana/web3.js";

import type { Match } from "@/lib/txline";
import {
  ensureFunded,
  submitPrediction,
  submitPredictionWithKeypair,
  type PredictionPayload,
} from "@/lib/predictionMemo";
import { pointsForPick, type Pick } from "@/lib/scoring";
import { getOrCreateGuestKeypair } from "@/lib/guestWallet";
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

  const [guestKeypair, setGuestKeypair] = useState<Keypair | null>(null);
  const [guestStatus, setGuestStatus] = useState<"idle" | "funding">("idle");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0); // bump to re-read localStorage

  const effectiveKey =
    wallet.publicKey?.toBase58() ?? guestKeypair?.publicKey.toBase58() ?? null;

  const caps: Cap[] = useMemo(
    () => (effectiveKey ? getCaps(effectiveKey) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveKey, version]
  );
  const points = totalPoints(caps);
  const streak = currentStreak(caps);

  const finished = matches.filter((m) => m.status === "finished");
  const upcoming = matches.filter((m) => m.status !== "finished");

  async function handleTryGuest() {
    setError(null);
    setGuestStatus("funding");
    try {
      const kp = getOrCreateGuestKeypair();
      await ensureFunded(connection, kp.publicKey);
      setGuestKeypair(kp);
    } catch {
      setError(
        "Devnet's faucet is rate-limited right now — wait a minute and try again, or connect Phantom instead."
      );
    } finally {
      setGuestStatus("idle");
    }
  }

  async function handlePredict(match: Match, pick: Pick) {
    if (!effectiveKey) return;
    setError(null);
    setPending(match.id);
    try {
      const payload: PredictionPayload = {
        matchId: match.id,
        pick,
        predictedAt: new Date().toISOString(),
      };
      const signature = guestKeypair
        ? await submitPredictionWithKeypair(connection, guestKeypair, payload)
        : await submitPrediction(connection, wallet, payload);

      if (match.status === "finished") {
        const { correct, points: earned } = pointsForPick(match, pick, streak);
        addCap(effectiveKey, {
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

  const you = effectiveKey
    ? { label: `${effectiveKey.slice(0, 4)}…${effectiveKey.slice(-4)}`, points }
    : null;

  return (
    <div className="flex flex-col gap-8">
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-5"
        style={{ background: "var(--turf-panel)", borderColor: "var(--pitch-line)" }}
      >
        {effectiveKey ? (
          <DivisionRing points={points} />
        ) : (
          <p className="text-sm" style={{ color: "var(--chalk-dim)" }}>
            Connect Phantom, or try instantly with a disposable devnet key —
            no installs needed.
          </p>
        )}
        <div className="flex items-center gap-3">
          {effectiveKey && (
            <div className="text-right">
              <p className="scoreboard text-2xl font-bold" style={{ color: "var(--chalk)" }}>
                {streak}
              </p>
              <p className="text-xs uppercase tracking-widest" style={{ color: "var(--chalk-dim)" }}>
                Streak
              </p>
            </div>
          )}
          {!wallet.publicKey && !guestKeypair && (
            <button
              onClick={handleTryGuest}
              disabled={guestStatus === "funding"}
              className="rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
              style={{ background: "var(--cap-gold)", color: "var(--turf)" }}
            >
              {guestStatus === "funding" ? "Funding devnet key…" : "Try instantly"}
            </button>
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
              walletKey={effectiveKey}
              pending={pending === match.id}
              alreadyCapped={effectiveKey ? hasCapForMatch(effectiveKey, match.id) : false}
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
              walletKey={effectiveKey}
              pending={pending === match.id}
              alreadyCapped={effectiveKey ? hasCapForMatch(effectiveKey, match.id) : false}
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
              className="flex-1 cursor-pointer rounded-md border px-3 py-2 text-sm font-semibold capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                borderColor: "var(--pitch-line)",
                color: "var(--chalk)",
                background: "var(--turf-panel-2)",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = "var(--floodlight-dim)";
                  e.currentTarget.style.borderColor = "var(--floodlight)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--turf-panel-2)";
                e.currentTarget.style.borderColor = "var(--pitch-line)";
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
