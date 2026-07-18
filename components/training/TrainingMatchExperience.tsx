"use client";

import Link from "next/link";
import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { Keypair } from "@solana/web3.js";

import type { Match } from "@/lib/txline";
import type { BoxScore } from "@/lib/trainingBoxScores";
import {
  ensureFunded,
  submitPrediction,
  submitPredictionWithKeypair,
} from "@/lib/predictionMemo";
import { getOrCreateGuestKeypair } from "@/lib/guestWallet";
import { addCap } from "@/lib/store";
import {
  scoreTrainingPrediction,
  type FoulsBand,
  type TrainingPrediction,
  type TrainingResult,
  type YellowBand,
} from "@/lib/trainingScoring";
import { PitchDiagram } from "./PitchDiagram";

type Step = "briefing" | "predict" | "review" | "revealed";

const DEFAULT_PREDICTION: TrainingPrediction = {
  homeScore: 1,
  awayScore: 1,
  redCard: "none",
  yellowBand: "0-2",
  foulsBand: "0-15",
  penaltyAwarded: false,
  manOfTheMatch: "",
};

function makeSimulatedSignature(): string {
  return `simulated-${Date.now().toString(36)}`;
}

export function TrainingMatchExperience({
  match,
  box,
}: {
  match: Match;
  box: BoxScore;
}) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [guestKeypair, setGuestKeypair] = useState<Keypair | null>(null);
  const [guestStatus, setGuestStatus] = useState<"idle" | "funding">("idle");

  const [step, setStep] = useState<Step>("briefing");
  const [prediction, setPrediction] = useState<TrainingPrediction>(DEFAULT_PREDICTION);
  const [locking, setLocking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<TrainingResult | null>(null);
  const [simulated, setSimulated] = useState(false);

  const effectiveKey =
    wallet.publicKey?.toBase58() ?? guestKeypair?.publicKey.toBase58() ?? null;

  async function handleTryGuest() {
    setNotice(null);
    setGuestStatus("funding");
    const kp = getOrCreateGuestKeypair();
    setGuestKeypair(kp);
    try {
      await ensureFunded(connection, kp.publicKey);
    } catch {
      setNotice(
        "No devnet SOL available anywhere right now — this session's predictions will run in simulate mode (recorded locally, not yet on-chain)."
      );
    } finally {
      setGuestStatus("idle");
    }
  }

  async function handleLockIn() {
    if (!effectiveKey) return;
    setLocking(true);
    setNotice(null);
    try {
      const payload = {
        matchId: match.id,
        prediction,
        submittedAt: new Date().toISOString(),
      };

      let wasSimulated = false;
      try {
        if (guestKeypair) {
          await submitPredictionWithKeypair(connection, guestKeypair, payload);
        } else {
          await submitPrediction(connection, wallet, payload);
        }
      } catch {
        wasSimulated = true;
        setNotice(
          "No devnet SOL to broadcast this on-chain right now — your sheet is locked in and scored locally as simulated instead."
        );
      }

      const scored = scoreTrainingPrediction(box, prediction);
      addCap(effectiveKey, {
        matchId: match.id,
        pick: `${prediction.homeScore}-${prediction.awayScore}`,
        correct: scored.total > 0,
        points: scored.total,
        signature: wasSimulated ? makeSimulatedSignature() : "on-chain",
        simulated: wasSimulated,
      });

      setSimulated(wasSimulated);
      setResult(scored);
      setStep("revealed");
    } finally {
      setLocking(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <Link href="/" className="text-xs" style={{ color: "var(--floodlight)" }}>
        ← Back to matches
      </Link>

      <header className="flex flex-col gap-1">
        <span
          className="scoreboard text-xs uppercase tracking-[0.2em]"
          style={{ color: "var(--floodlight)" }}
        >
          {match.competition}
        </span>
        <h1 className="text-2xl font-bold" style={{ color: "var(--chalk)" }}>
          {match.homeTeam} vs {match.awayTeam}
        </h1>
      </header>

      {step === "briefing" && (
        <section className="flex flex-col gap-5">
          <PitchDiagram
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            homeLoadout={match.homeLoadout ?? []}
            awayLoadout={match.awayLoadout ?? []}
          />
          <div
            className="rounded-lg border p-4"
            style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
          >
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--chalk-dim)" }}
            >
              Pre-match
            </p>
            <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--chalk-dim)" }}>
              {(match.preview ?? []).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
          <button
            onClick={() => setStep("predict")}
            className="cursor-pointer self-start rounded-md px-5 py-3 text-sm font-bold transition-[filter] hover:brightness-110"
            style={{ background: "var(--cap-gold)", color: "var(--night)" }}
          >
            I&apos;ve seen enough — make my calls
          </button>
        </section>
      )}

      {step === "predict" && (
        <PredictionSheetForm
          match={match}
          value={prediction}
          onChange={setPrediction}
          onSubmit={() => setStep("review")}
        />
      )}

      {step === "review" && (
        <section className="flex flex-col gap-5">
          <div
            className="flex flex-col gap-3 rounded-lg border p-4"
            style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--chalk-dim)" }}
            >
              Your prediction sheet
            </p>
            <ReviewLine label="Full-time score">
              {match.homeTeam} {prediction.homeScore} – {prediction.awayScore} {match.awayTeam}
            </ReviewLine>
            <ReviewLine label="Red card">
              {prediction.redCard === "none" ? "No red card" : `${prediction.redCard === "home" ? match.homeTeam : match.awayTeam} sent off`}
            </ReviewLine>
            <ReviewLine label="Yellow cards">{prediction.yellowBand}</ReviewLine>
            <ReviewLine label="Total fouls">{prediction.foulsBand}</ReviewLine>
            <ReviewLine label="Penalty awarded">{prediction.penaltyAwarded ? "Yes" : "No"}</ReviewLine>
            <ReviewLine label="Man of the Match">{prediction.manOfTheMatch}</ReviewLine>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setStep("predict")}
              className="cursor-pointer text-sm underline"
              style={{ color: "var(--chalk-dim)" }}
            >
              Change my calls
            </button>

            <div className="flex items-center gap-3">
              {!wallet.publicKey && !guestKeypair && (
                <button
                  onClick={handleTryGuest}
                  disabled={guestStatus === "funding"}
                  className="cursor-pointer rounded-md px-4 py-2.5 text-sm font-bold transition-[filter] hover:brightness-110 disabled:opacity-60"
                  style={{ background: "var(--cap-gold)", color: "var(--night)" }}
                >
                  {guestStatus === "funding" ? "Preparing key…" : "Try instantly"}
                </button>
              )}
              <WalletMultiButton />
            </div>
          </div>

          {notice && (
            <p
              className="rounded-md px-4 py-2 text-sm"
              style={{ background: "var(--cap-gold-dim)", color: "var(--cap-gold)" }}
            >
              {notice}
            </p>
          )}

          <button
            onClick={handleLockIn}
            disabled={!effectiveKey || locking}
            className="cursor-pointer self-start rounded-md px-5 py-3 text-sm font-bold transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "var(--floodlight)", color: "var(--night)" }}
          >
            {locking ? "Locking in…" : "Lock in predictions"}
          </button>
        </section>
      )}

      {step === "revealed" && result && (
        <section className="flex flex-col gap-5">
          <div
            className="rounded-lg border p-4"
            style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
          >
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--chalk-dim)" }}
            >
              Full-time report
            </p>
            <p className="scoreboard mb-3 text-xl font-bold" style={{ color: "var(--chalk)" }}>
              {match.homeTeam} {box.homeScore} – {box.awayScore} {match.awayTeam}
            </p>
            <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--chalk-dim)" }}>
              {box.report.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div
            className="rounded-lg border p-4"
            style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
          >
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--chalk-dim)" }}
            >
              Your sheet, marked
            </p>
            <ul className="flex flex-col gap-2">
              {result.lines.map((line) => (
                <li key={line.label} className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--chalk-dim)" }}>{line.label}</span>
                  <span
                    className="scoreboard font-semibold"
                    style={{ color: line.correct ? "var(--pitch)" : "var(--chalk-faint)" }}
                  >
                    {line.correct ? `+${line.points}` : "0"}
                  </span>
                </li>
              ))}
            </ul>
            <div
              className="mt-3 flex items-center justify-between border-t pt-3"
              style={{ borderColor: "var(--line)" }}
            >
              <span className="text-sm font-semibold" style={{ color: "var(--chalk)" }}>
                Total
              </span>
              <span className="scoreboard text-xl font-bold" style={{ color: "var(--cap-gold)" }}>
                {result.total} pts
              </span>
            </div>
            {simulated && (
              <p className="mt-2 text-xs" style={{ color: "var(--chalk-faint)" }}>
                Simulated — not yet broadcast on-chain.
              </p>
            )}
          </div>

          <Link
            href="/"
            className="self-start rounded-md px-5 py-3 text-sm font-bold"
            style={{ background: "var(--cap-gold)", color: "var(--night)" }}
          >
            Back to matches
          </Link>
        </section>
      )}
    </div>
  );

  function ReviewLine({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: "var(--chalk-faint)" }}>{label}</span>
        <span style={{ color: "var(--chalk)" }}>{children}</span>
      </div>
    );
  }
}

function PredictionSheetForm({
  match,
  value,
  onChange,
  onSubmit,
}: {
  match: Match;
  value: TrainingPrediction;
  onChange: (p: TrainingPrediction) => void;
  onSubmit: () => void;
}) {
  const players = [...(match.homeLoadout ?? []), ...(match.awayLoadout ?? [])];
  const canSubmit = value.manOfTheMatch !== "";

  return (
    <section
      className="flex flex-col gap-6 rounded-lg border p-5"
      style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
    >
      <Field label="Full-time score">
        <div className="flex items-center gap-3">
          <NumberStepper
            value={value.homeScore}
            onChange={(n) => onChange({ ...value, homeScore: n })}
            label={match.homeTeam}
          />
          <span style={{ color: "var(--chalk-faint)" }}>–</span>
          <NumberStepper
            value={value.awayScore}
            onChange={(n) => onChange({ ...value, awayScore: n })}
            label={match.awayTeam}
          />
        </div>
      </Field>

      <Field label="Red card?">
        <ChoiceRow
          options={[
            { value: "none", label: "No red card" },
            { value: "home", label: match.homeTeam },
            { value: "away", label: match.awayTeam },
          ]}
          selected={value.redCard}
          onSelect={(v) => onChange({ ...value, redCard: v as TrainingPrediction["redCard"] })}
        />
      </Field>

      <Field label="Total yellow cards">
        <ChoiceRow
          options={(["0-2", "3-5", "6+"] as YellowBand[]).map((v) => ({ value: v, label: v }))}
          selected={value.yellowBand}
          onSelect={(v) => onChange({ ...value, yellowBand: v as YellowBand })}
        />
      </Field>

      <Field label="Total fouls">
        <ChoiceRow
          options={(["0-15", "16-25", "26+"] as FoulsBand[]).map((v) => ({ value: v, label: v }))}
          selected={value.foulsBand}
          onSelect={(v) => onChange({ ...value, foulsBand: v as FoulsBand })}
        />
      </Field>

      <Field label="Penalty awarded?">
        <ChoiceRow
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          selected={value.penaltyAwarded ? "yes" : "no"}
          onSelect={(v) => onChange({ ...value, penaltyAwarded: v === "yes" })}
        />
      </Field>

      <Field label="Man of the Match">
        <ChoiceRow
          options={players.map((p) => ({ value: p, label: p }))}
          selected={value.manOfTheMatch}
          onSelect={(v) => onChange({ ...value, manOfTheMatch: v })}
          wrap
        />
      </Field>

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="cursor-pointer self-start rounded-md px-5 py-3 text-sm font-bold transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: "var(--floodlight)", color: "var(--night)" }}
      >
        Review my sheet
      </button>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--chalk-dim)" }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function NumberStepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs" style={{ color: "var(--chalk-faint)" }}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-8 w-8 cursor-pointer rounded-md border text-sm"
          style={{ borderColor: "var(--line)", color: "var(--chalk)" }}
        >
          −
        </button>
        <span className="scoreboard w-6 text-center text-lg font-bold" style={{ color: "var(--chalk)" }}>
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(9, value + 1))}
          className="h-8 w-8 cursor-pointer rounded-md border text-sm"
          style={{ borderColor: "var(--line)", color: "var(--chalk)" }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function ChoiceRow({
  options,
  selected,
  onSelect,
  wrap,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
  wrap?: boolean;
}) {
  return (
    <div className={`flex gap-2 ${wrap ? "flex-wrap" : ""}`}>
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className="cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: isSelected ? "var(--floodlight)" : "var(--line)",
              background: isSelected ? "var(--floodlight-dim)" : "var(--night-3)",
              color: "var(--chalk)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
