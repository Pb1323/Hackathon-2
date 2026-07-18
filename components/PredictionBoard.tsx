"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { Keypair } from "@solana/web3.js";

import type { Match } from "@/lib/txline";
import { impliedWinPct } from "@/lib/trainingMatches";
import { TRAINING_BOX_SCORES } from "@/lib/trainingBoxScores";
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

// A placeholder id for a simulated (never broadcast) prediction — kept out
// of the component body since it calls the impure Date.now().
function makeSimulatedSignature(): string {
  return `simulated-${Date.now().toString(36)}`;
}

export function PredictionBoard({ matches }: { matches: Match[] }) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [guestKeypair, setGuestKeypair] = useState<Keypair | null>(null);
  const [guestStatus, setGuestStatus] = useState<"idle" | "funding">("idle");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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
    setNotice(null);
    setGuestStatus("funding");
    const kp = getOrCreateGuestKeypair();
    // Set the guest key regardless of funding outcome — with zero balance,
    // predictions still work in simulate mode (see handlePredict below).
    setGuestKeypair(kp);
    try {
      await ensureFunded(connection, kp.publicKey);
    } catch {
      setNotice(
        "No devnet SOL available anywhere right now (faucet and relay both dry) — predictions will run in simulate mode: recorded locally, not yet broadcast on-chain. They'll anchor for real the moment funding is available."
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

      let signature: string;
      let simulated = false;
      try {
        signature = guestKeypair
          ? await submitPredictionWithKeypair(connection, guestKeypair, payload)
          : await submitPrediction(connection, wallet, payload);
      } catch {
        // No devnet SOL to pay the transaction fee anywhere at hand — fall
        // back to a local, honestly-labeled simulated record instead of
        // blocking testing entirely.
        simulated = true;
        signature = makeSimulatedSignature();
        setNotice(
          "No devnet SOL to broadcast this on-chain right now — recorded locally as simulated instead."
        );
      }

      if (match.status === "finished") {
        const { correct, points: earned } = pointsForPick(match, pick, streak);
        addCap(effectiveKey, {
          matchId: match.id,
          pick,
          correct,
          points: earned,
          signature,
          simulated,
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
        style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
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
              className="cursor-pointer rounded-md px-4 py-2.5 text-sm font-bold shadow-[0_1px_0_oklch(1_0_0/0.3)_inset,0_4px_14px_oklch(0.78_0.16_70/0.25)] transition-[background,transform,box-shadow] duration-150 hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              style={{ background: "var(--cap-gold)", color: "var(--night)" }}
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

      {notice && (
        <p
          className="rounded-md px-4 py-2 text-sm"
          style={{ background: "var(--cap-gold-dim)", color: "var(--cap-gold)" }}
        >
          {notice}
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
              simulated={caps.find((c) => c.matchId === match.id)?.simulated ?? false}
              onPredict={(pick) => handlePredict(match, pick)}
            />
          ))}
        </Section>
      )}

      {finished.length > 0 && (
        <Section
          title="Training mode — settle instantly"
          note="Simulated form guide and results, for practicing calls any time"
        >
          {finished.map((match) =>
            TRAINING_BOX_SCORES[match.id] ? (
              <TrainingModeCard key={match.id} match={match} />
            ) : (
              <MatchCard
                key={match.id}
                match={match}
                walletKey={effectiveKey}
                pending={pending === match.id}
                alreadyCapped={effectiveKey ? hasCapForMatch(effectiveKey, match.id) : false}
                simulated={caps.find((c) => c.matchId === match.id)?.simulated ?? false}
                onPredict={(pick) => handlePredict(match, pick)}
              />
            )
          )}
        </Section>
      )}
    </div>
  );
}

function TrainingModeCard({ match }: { match: Match }) {
  const winPct = impliedWinPct(match);
  return (
    <Link
      href={`/training/${match.id}`}
      className="block rounded-lg border p-4 transition-colors hover:border-[var(--floodlight)]"
      style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
    >
      <p className="text-xs uppercase tracking-widest" style={{ color: "var(--chalk-dim)" }}>
        {match.competition}
      </p>
      <p className="text-lg font-medium" style={{ color: "var(--chalk)" }}>
        {match.homeTeam} vs {match.awayTeam}
      </p>
      {match.homeLoadout && match.awayLoadout && (
        <p className="mt-1 text-xs" style={{ color: "var(--chalk-faint)" }}>
          {match.homeLoadout.join(", ")} · {match.awayLoadout.join(", ")}
        </p>
      )}
      {winPct && (
        <p className="scoreboard mt-2 text-xs" style={{ color: "var(--chalk-faint)" }}>
          Win% — {match.homeTeam} {winPct.home}% · Draw {winPct.draw}% · {match.awayTeam} {winPct.away}%
        </p>
      )}
      <p className="mt-3 text-sm font-semibold" style={{ color: "var(--floodlight)" }}>
        Open full training mode →
      </p>
    </Link>
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
  simulated,
  onPredict,
}: {
  match: Match;
  walletKey: string | null;
  pending: boolean;
  alreadyCapped: boolean;
  simulated: boolean;
  onPredict: (pick: Pick) => void;
}) {
  const isFinished = match.status === "finished";

  // Track the moment a cap is first earned so the badge plays its reveal once,
  // then settles into a static "Cap earned" state on future renders.
  const [justCapped, setJustCapped] = useState(false);
  const wasCapped = useRef(alreadyCapped);
  useEffect(() => {
    if (alreadyCapped && !wasCapped.current) {
      setJustCapped(true);
      const t = setTimeout(() => setJustCapped(false), 1600);
      wasCapped.current = true;
      return () => clearTimeout(t);
    }
    wasCapped.current = alreadyCapped;
  }, [alreadyCapped]);

  return (
    <div
      className="rounded-lg border p-4 transition-colors"
      style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
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

      {match.homeLoadout && match.awayLoadout && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p style={{ color: "var(--chalk-faint)" }}>{match.homeTeam} loadout</p>
            <p style={{ color: "var(--chalk-dim)" }}>{match.homeLoadout.join(", ")}</p>
          </div>
          <div className="text-right">
            <p style={{ color: "var(--chalk-faint)" }}>{match.awayTeam} loadout</p>
            <p style={{ color: "var(--chalk-dim)" }}>{match.awayLoadout.join(", ")}</p>
          </div>
        </div>
      )}

      {(() => {
        const winPct = impliedWinPct(match);
        if (!winPct) return null;
        return (
          <div className="scoreboard mt-2 flex gap-3 text-xs" style={{ color: "var(--chalk-faint)" }}>
            <span>Win% — {match.homeTeam} {winPct.home}%</span>
            <span>Draw {winPct.draw}%</span>
            <span>{match.awayTeam} {winPct.away}%</span>
          </div>
        );
      })()}

      {alreadyCapped ? (
        <div className="mt-4 flex items-center gap-2.5">
          <span className={`relative h-8 w-8 shrink-0 ${justCapped ? "motion-safe:animate-cap-in" : ""}`}>
            {justCapped && (
              <span
                className="motion-safe:animate-cap-glow absolute -inset-2 rounded-full"
                style={{ background: "radial-gradient(circle, var(--cap-gold-dim), transparent 70%)" }}
                aria-hidden
              />
            )}
            <svg width="32" height="32" viewBox="0 0 32 32" className="relative">
              <circle cx="16" cy="16" r="14" fill="var(--night-3)" stroke="var(--cap-gold)" strokeWidth="2" />
              <circle cx="16" cy="16" r="8" fill="none" stroke="var(--cap-gold)" strokeWidth="1.5" />
              <polygon points="11,27 16,22 21,27 16,30" fill="var(--cap-gold)" />
            </svg>
            {justCapped && (
              <span className="absolute inset-0 overflow-hidden rounded-full" aria-hidden>
                <span
                  className="motion-safe:animate-cap-shine absolute -top-2 left-0 h-[140%] w-2"
                  style={{ background: "linear-gradient(oklch(1 0 0 / 0), oklch(1 0 0 / 0.8), oklch(1 0 0 / 0))" }}
                />
              </span>
            )}
          </span>
          <p className="text-sm font-semibold" style={{ color: "var(--cap-gold)" }}>
            Cap earned for this match
            {simulated && (
              <span className="ml-2 text-xs font-normal" style={{ color: "var(--chalk-dim)" }}>
                (simulated — not yet on-chain)
              </span>
            )}
          </p>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          {(["home", "draw", "away"] as const).map((pick) => (
            <button
              key={pick}
              disabled={!walletKey || pending}
              onClick={() => onPredict(pick)}
              className="flex-1 cursor-pointer rounded-md border px-3 py-2.5 text-sm font-semibold capitalize shadow-[0_1px_0_oklch(1_0_0/0.04)_inset] transition-[background,border-color,transform,box-shadow] duration-150 hover:enabled:border-[var(--floodlight)] hover:enabled:bg-[var(--floodlight-dim)] hover:enabled:shadow-[0_0_0_3px_var(--floodlight-dim)] active:enabled:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                borderColor: "var(--line)",
                color: "var(--chalk)",
                background: "var(--night-3)",
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
