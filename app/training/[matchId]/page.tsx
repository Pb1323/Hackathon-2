import Link from "next/link";

import { getMatchResult } from "@/lib/txline";
import { getBoxScore } from "@/lib/trainingBoxScores";
import { TrainingMatchExperience } from "@/components/training/TrainingMatchExperience";

export default async function TrainingMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;

  const box = getBoxScore(matchId);
  if (!box) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-16">
        <Link href="/" className="text-xs" style={{ color: "var(--floodlight)" }}>
          ← Back to matches
        </Link>
        <p style={{ color: "var(--chalk-dim)" }}>
          The full training experience for this match isn&apos;t built yet — starting
          with one match end-to-end first. Try the Argentina vs Brazil training match
          from the home page.
        </p>
      </div>
    );
  }

  const match = await getMatchResult(matchId);

  return <TrainingMatchExperience match={match} box={box} />;
}
