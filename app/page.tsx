import { getUpcomingMatches } from "@/lib/txline";
import { PredictionBoard } from "@/components/PredictionBoard";

export default async function Home() {
  const matches = await getUpcomingMatches();

  return (
    <div className="min-h-full" style={{ background: "var(--turf)" }}>
      <header className="floodlight-field border-b" style={{ borderColor: "var(--pitch-line)" }}>
        <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-3 px-6 py-14">
          <span
            className="scoreboard text-xs uppercase tracking-[0.2em]"
            style={{ color: "var(--floodlight)" }}
          >
            TxOdds x Solana &middot; World Cup Hackathon
          </span>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ color: "var(--chalk)", textWrap: "balance" }}
          >
            Kickoff Calls
          </h1>
          <p className="max-w-[62ch] text-[15px] leading-relaxed" style={{ color: "var(--chalk-dim)" }}>
            In football, a &ldquo;cap&rdquo; means you played for your country —
            permanent, unrevokable, yours forever. Here, every correct
            prediction earns a cap too: signed on Solana devnet via the Memo
            program, checked against TxLINE&apos;s live scores, and impossible
            to fake or take back. Rack up enough and you get promoted —
            Sunday League, Championship, International, World Class.
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-10">
        <PredictionBoard matches={matches} />
      </main>
    </div>
  );
}
