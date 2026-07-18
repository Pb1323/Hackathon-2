"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { Keypair } from "@solana/web3.js";

import type { Match } from "@/lib/txline";
import type { BoxScore } from "@/lib/trainingBoxScores";
import { ensureFunded, submitPrediction, submitPredictionWithKeypair } from "@/lib/predictionMemo";
import { getOrCreateGuestKeypair } from "@/lib/guestWallet";
import { addCap } from "@/lib/store";
import {
  scoreTrainingPrediction,
  type TrainingPrediction,
  type TrainingResult,
} from "@/lib/trainingScoring";
import { getCommunityPredictions } from "@/lib/communityPredictions";
import { PitchDiagram } from "./PitchDiagram";
import { ImmersiveBackground } from "./ImmersiveBackground";
import { CommunityScorecard } from "./CommunityScorecard";
import { TrainingTicker } from "./TrainingTicker";

type Step = "briefing" | "predict" | "review" | "revealed";

const DEFAULT_PREDICTION: TrainingPrediction = {
  homeScore: 1,
  awayScore: 1,
  redCard: "none",
  yellowCards: 3,
  fouls: 18,
  penaltyAwarded: false,
  manOfTheMatch: "",
  firstToScore: "home",
  firstSubOff: "",
};

// Depth wrapper for the "look at me" surfaces — real 3D mouse-tilt via
// react-parallax-tilt (github.com/mkosir/react-parallax-tilt, MIT), skipped
// entirely under prefers-reduced-motion rather than just disabling the tilt.
function DepthCard({
  children,
  reduceMotion,
  className,
}: {
  children: React.ReactNode;
  reduceMotion: boolean;
  className?: string;
}) {
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <Tilt
      tiltMaxAngleX={6}
      tiltMaxAngleY={6}
      perspective={1200}
      scale={1.01}
      transitionSpeed={1200}
      glareEnable
      glareMaxOpacity={0.12}
      glareColor="#ffffff"
      glarePosition="all"
      className={className}
    >
      {children}
    </Tilt>
  );
}

function triggerHaptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(18);
  }
}

function makeSimulatedSignature(): string {
  return `simulated-${Date.now().toString(36)}`;
}

const stepVariants = {
  enter: { opacity: 0, y: 28 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -28 },
};

export function TrainingMatchExperience({ match, box }: { match: Match; box: BoxScore }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const reduceMotion = useReducedMotion();

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
    triggerHaptic();
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

  const titleWords = `${match.homeTeam} vs ${match.awayTeam}`.split(" ");
  const community = getCommunityPredictions(match.id);

  return (
    <div className="relative min-h-screen">
      <ImmersiveBackground />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs" style={{ color: "var(--floodlight)" }}>
            ← Back to matches
          </Link>
          <span
            className="scoreboard text-xs uppercase tracking-[0.2em]"
            style={{ color: "var(--floodlight)" }}
          >
            {match.competition}
          </span>
        </div>

        <TrainingTicker match={match} />

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: "var(--chalk)" }}>
          {titleWords.map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              className="inline-block pr-[0.22em]"
              initial={reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stepVariants}
            initial={reduceMotion ? undefined : "enter"}
            animate="center"
            exit={reduceMotion ? undefined : "exit"}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col gap-8 pb-16"
          >
            {step === "briefing" && (
              <section className="flex flex-col gap-6">
                <DepthCard reduceMotion={!!reduceMotion} className="rounded-xl">
                  <div
                    className="rounded-xl border p-4"
                    style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
                  >
                    <PitchDiagram
                      homeTeam={match.homeTeam}
                      awayTeam={match.awayTeam}
                      homeLoadout={match.homeLoadout ?? []}
                      awayLoadout={match.awayLoadout ?? []}
                    />
                  </div>
                </DepthCard>
                <div
                  className="rounded-xl border p-6"
                  style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
                >
                  <p
                    className="mb-3 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "var(--chalk-dim)" }}
                  >
                    Pre-match
                  </p>
                  <div className="flex max-w-[68ch] flex-col gap-3 text-[15px] leading-relaxed" style={{ color: "var(--chalk-dim)" }}>
                    {(match.preview ?? []).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
                {community && <CommunityScorecard data={community} />}
                <motion.button
                  whileHover={reduceMotion ? undefined : { scale: 1.03 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  onClick={() => setStep("predict")}
                  className="cursor-pointer self-start rounded-md px-6 py-3.5 text-base font-bold"
                  style={{ background: "var(--cap-gold)", color: "var(--night)" }}
                >
                  I&apos;ve seen enough — make my calls
                </motion.button>
              </section>
            )}

            {step === "predict" && (
              <PredictionSheetForm
                match={match}
                value={prediction}
                onChange={setPrediction}
                onSubmit={() => setStep("review")}
                reduceMotion={!!reduceMotion}
              />
            )}

            {step === "review" && (
              <section className="flex flex-col gap-6">
                <div
                  className="flex flex-col gap-3 rounded-xl border-2 p-6"
                  style={{ background: "var(--night-2)", borderColor: "var(--floodlight)" }}
                >
                  <p
                    className="scoreboard text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "var(--floodlight)" }}
                  >
                    Order ticket
                  </p>
                  <ReviewLine label="Full-time score">
                    {match.homeTeam} {prediction.homeScore} – {prediction.awayScore} {match.awayTeam}
                  </ReviewLine>
                  <ReviewLine label="Red card">
                    {prediction.redCard === "none"
                      ? "No red card"
                      : `${prediction.redCard === "home" ? match.homeTeam : match.awayTeam} sent off`}
                  </ReviewLine>
                  <ReviewLine label="Yellow cards">{prediction.yellowCards}</ReviewLine>
                  <ReviewLine label="Total fouls">{prediction.fouls}</ReviewLine>
                  <ReviewLine label="Penalty awarded">{prediction.penaltyAwarded ? "Yes" : "No"}</ReviewLine>
                  <ReviewLine label="Man of the Match">{prediction.manOfTheMatch}</ReviewLine>
                  <ReviewLine label="First to score">
                    {prediction.firstToScore === "home" ? match.homeTeam : match.awayTeam}
                  </ReviewLine>
                  <ReviewLine label="First substitution">{prediction.firstSubOff}</ReviewLine>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <button
                    onClick={() => setStep("predict")}
                    className="cursor-pointer text-sm underline"
                    style={{ color: "var(--chalk-dim)" }}
                  >
                    Edit order
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

                <motion.button
                  whileHover={reduceMotion ? undefined : { scale: 1.03 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  onClick={handleLockIn}
                  disabled={!effectiveKey || locking}
                  className="cursor-pointer self-start rounded-md px-6 py-3.5 text-base font-bold disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: "var(--floodlight)", color: "var(--night)" }}
                >
                  {locking ? "Placing order…" : "Place order"}
                </motion.button>
              </section>
            )}

            {step === "revealed" && result && (
              <section className="flex flex-col gap-6">
                <DepthCard reduceMotion={!!reduceMotion} className="rounded-xl">
                  <div
                    className="rounded-xl border p-6"
                    style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
                  >
                    <p
                      className="mb-2 text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "var(--chalk-dim)" }}
                    >
                      Full-time report
                    </p>
                    <p className="scoreboard mb-4 text-2xl font-bold" style={{ color: "var(--chalk)" }}>
                      {match.homeTeam} {box.homeScore} – {box.awayScore} {match.awayTeam}
                    </p>
                    <div className="flex max-w-[68ch] flex-col gap-3 text-[15px] leading-relaxed" style={{ color: "var(--chalk-dim)" }}>
                      {box.report.map((line, i) => (
                        <motion.p
                          key={line}
                          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: i * 0.12 }}
                        >
                          {line}
                        </motion.p>
                      ))}
                    </div>
                  </div>
                </DepthCard>

                <div
                  className="rounded-xl border p-6"
                  style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
                >
                  <p
                    className="mb-3 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "var(--chalk-dim)" }}
                  >
                    Your sheet, marked
                  </p>
                  <ul className="flex flex-col gap-2">
                    {result.lines.map((line, i) => (
                      <motion.li
                        key={line.label}
                        initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                        animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: 0.7 + i * 0.08 }}
                        className="flex items-center justify-between text-sm"
                      >
                        <span style={{ color: "var(--chalk-dim)" }}>
                          {line.label}
                          {line.detail && (
                            <span className="ml-2 text-xs" style={{ color: "var(--chalk-faint)" }}>
                              ({line.detail})
                            </span>
                          )}
                        </span>
                        <span
                          className="scoreboard font-semibold"
                          style={{ color: line.correct ? "var(--pitch)" : "var(--chalk-faint)" }}
                        >
                          {line.points > 0 ? `+${line.points}` : "0"}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                  <div
                    className="mt-3 flex items-center justify-between border-t pt-3"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <span className="text-sm font-semibold" style={{ color: "var(--chalk)" }}>
                      Total
                    </span>
                    <motion.span
                      initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                      animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.4, ease: [0.2, 1.4, 0.4, 1] }}
                      className="scoreboard text-2xl font-bold"
                      style={{ color: "var(--cap-gold)" }}
                    >
                      {result.total} pts
                    </motion.span>
                  </div>
                  {simulated && (
                    <p className="mt-2 text-xs" style={{ color: "var(--chalk-faint)" }}>
                      Simulated — not yet broadcast on-chain.
                    </p>
                  )}
                </div>

                <Link
                  href="/"
                  className="self-start rounded-md px-6 py-3.5 text-base font-bold"
                  style={{ background: "var(--cap-gold)", color: "var(--night)" }}
                >
                  Back to matches
                </Link>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ReviewLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: "var(--chalk-faint)" }}>{label}</span>
      <span style={{ color: "var(--chalk)" }}>{children}</span>
    </div>
  );
}

function PredictionSheetForm({
  match,
  value,
  onChange,
  onSubmit,
  reduceMotion,
}: {
  match: Match;
  value: TrainingPrediction;
  onChange: (p: TrainingPrediction) => void;
  onSubmit: () => void;
  reduceMotion: boolean;
}) {
  const canSubmit = value.manOfTheMatch !== "" && value.firstSubOff !== "";

  return (
    <section
      className="flex flex-col gap-7 rounded-xl border p-6 md:p-8"
      style={{ background: "var(--night-2)", borderColor: "var(--line)" }}
    >
      <p className="scoreboard text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--floodlight)" }}>
        Build your order
      </p>
      <Field label="Full-time score">
        <div className="flex items-center gap-4">
          <NumberStepper
            value={value.homeScore}
            onChange={(n) => onChange({ ...value, homeScore: n })}
            label={match.homeTeam}
            max={9}
          />
          <span style={{ color: "var(--chalk-faint)" }}>–</span>
          <NumberStepper
            value={value.awayScore}
            onChange={(n) => onChange({ ...value, awayScore: n })}
            label={match.awayTeam}
            max={9}
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
        <NumberStepper
          value={value.yellowCards}
          onChange={(n) => onChange({ ...value, yellowCards: n })}
          label="pick any number"
          max={12}
        />
      </Field>

      <Field label="Total fouls">
        <NumberStepper
          value={value.fouls}
          onChange={(n) => onChange({ ...value, fouls: n })}
          label="pick any number"
          max={45}
          step={1}
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
        <select
          value={value.manOfTheMatch}
          onChange={(e) => onChange({ ...value, manOfTheMatch: e.target.value })}
          className="rounded-md border px-3 py-2.5 text-sm"
          style={{ background: "var(--night-3)", borderColor: "var(--line)", color: "var(--chalk)" }}
        >
          <option value="" disabled>
            Choose a player…
          </option>
          <optgroup label={match.homeTeam}>
            {(match.homeLoadout ?? []).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </optgroup>
          <optgroup label={match.awayTeam}>
            {(match.awayLoadout ?? []).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </optgroup>
        </select>
      </Field>

      <Field label="Who scores first?">
        <ChoiceRow
          options={[
            { value: "home", label: match.homeTeam },
            { value: "away", label: match.awayTeam },
          ]}
          selected={value.firstToScore}
          onSelect={(v) => onChange({ ...value, firstToScore: v as TrainingPrediction["firstToScore"] })}
        />
      </Field>

      <Field label="First player substituted off">
        <select
          value={value.firstSubOff}
          onChange={(e) => onChange({ ...value, firstSubOff: e.target.value })}
          className="rounded-md border px-3 py-2.5 text-sm"
          style={{ background: "var(--night-3)", borderColor: "var(--line)", color: "var(--chalk)" }}
        >
          <option value="" disabled>
            Choose a player…
          </option>
          <optgroup label={match.homeTeam}>
            {(match.homeLoadout ?? []).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </optgroup>
          <optgroup label={match.awayTeam}>
            {(match.awayLoadout ?? []).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </optgroup>
        </select>
      </Field>

      <motion.button
        whileHover={reduceMotion || !canSubmit ? undefined : { scale: 1.03 }}
        whileTap={reduceMotion || !canSubmit ? undefined : { scale: 0.97 }}
        onClick={onSubmit}
        disabled={!canSubmit}
        className="cursor-pointer self-start rounded-md px-6 py-3.5 text-base font-bold disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: "var(--floodlight)", color: "var(--night)" }}
      >
        Review my sheet
      </motion.button>
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
  max,
  step = 1,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  max: number;
  step?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs" style={{ color: "var(--chalk-faint)" }}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - step))}
          className="h-9 w-9 cursor-pointer rounded-md border text-base"
          style={{ borderColor: "var(--line)", color: "var(--chalk)" }}
        >
          −
        </button>
        <span className="scoreboard w-8 text-center text-lg font-bold" style={{ color: "var(--chalk)" }}>
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="h-9 w-9 cursor-pointer rounded-md border text-base"
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
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
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
