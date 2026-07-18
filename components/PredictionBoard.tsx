"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import type { Match } from "@/lib/txline";
import { submitPrediction, type PredictionPayload } from "@/lib/predictionMemo";

type Pick = PredictionPayload["pick"];

type SubmittedPrediction = {
  matchId: string;
  pick: Pick;
  signature: string;
};

export function PredictionBoard({ matches }: { matches: Match[] }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [pending, setPending] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Record<string, SubmittedPrediction>>({});
  const [error, setError] = useState<string | null>(null);

  async function handlePredict(match: Match, pick: Pick) {
    setError(null);
    setPending(match.id);
    try {
      const signature = await submitPrediction(connection, wallet, {
        matchId: match.id,
        pick,
        predictedAt: new Date().toISOString(),
      });
      setSubmitted((prev) => ({
        ...prev,
        [match.id]: { matchId: match.id, pick, signature },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit prediction");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">
          {wallet.publicKey ? "Wallet connected" : "Connect a devnet wallet to predict"}
        </span>
        <WalletMultiButton />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {matches.map((match) => {
          const result = submitted[match.id];
          return (
            <div
              key={match.id}
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    {match.competition}
                  </p>
                  <p className="text-lg font-medium">
                    {match.homeTeam} vs {match.awayTeam}
                  </p>
                </div>
                <p className="text-xs text-neutral-500">
                  {new Date(match.kickoffISO).toLocaleString()}
                </p>
              </div>

              {result ? (
                <p className="mt-4 text-sm text-emerald-600">
                  Locked in: <strong>{result.pick}</strong> —{" "}
                  <a
                    className="underline"
                    href={`https://explorer.solana.com/tx/${result.signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    view on-chain proof
                  </a>
                </p>
              ) : (
                <div className="mt-4 flex gap-2">
                  {(["home", "draw", "away"] as const).map((pick) => (
                    <button
                      key={pick}
                      disabled={!wallet.publicKey || pending === match.id}
                      onClick={() => handlePredict(match, pick)}
                      className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium capitalize transition-colors hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-900"
                    >
                      {pick}
                      {match.odds && (
                        <span className="ml-1 text-neutral-500">
                          {match.odds[pick]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
