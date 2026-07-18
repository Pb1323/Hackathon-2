import { getUpcomingMatches } from "@/lib/txline";
import { PredictionBoard } from "@/components/PredictionBoard";

export default async function Home() {
  const matches = await getUpcomingMatches();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Kickoff Calls — earn your caps
        </h1>
        <p className="text-sm text-neutral-500">
          In football, a &ldquo;cap&rdquo; means you played for your country —
          permanent, unrevokable, yours forever. Here, every correct
          prediction earns a cap too: signed on Solana devnet via the Memo
          program, checked against TxLINE&apos;s live scores, and impossible
          to fake or take back. Rack up enough and you get promoted —
          Sunday League, Championship, International, World Class.
        </p>
      </header>

      <PredictionBoard matches={matches} />
    </main>
  );
}
