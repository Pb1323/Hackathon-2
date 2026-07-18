import { getUpcomingMatches } from "@/lib/txline";
import { PredictionBoard } from "@/components/PredictionBoard";

export default async function Home() {
  const matches = await getUpcomingMatches();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Kickoff Calls
        </h1>
        <p className="text-sm text-neutral-500">
          Predict the result before kickoff. Your call gets signed on Solana
          devnet via the Memo program — a tamper-proof, timestamped record
          that you called it before TxLINE reported the result.
        </p>
      </header>

      <PredictionBoard matches={matches} />
    </main>
  );
}
