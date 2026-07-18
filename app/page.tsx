import { getUpcomingMatches } from "@/lib/txline";
import { PredictionBoard } from "@/components/PredictionBoard";

export default async function Home() {
  const matches = await getUpcomingMatches();

  return (
    <div className="min-h-full" style={{ background: "var(--night)" }}>
      <header
        className="relative overflow-hidden border-b"
        style={{ borderColor: "var(--line)" }}
      >
        {/* Bespoke graphic: floodlight beams + pitch markings, seen from the tunnel */}
        <svg
          className="pointer-events-none absolute -inset-x-[5%] -inset-y-[10%] h-[140%] w-[110%] motion-safe:animate-flood-sweep"
          viewBox="0 0 1000 400"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--floodlight)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--floodlight)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points="60,0 220,0 340,400 10,400" fill="url(#beam)" />
          <polygon points="780,0 940,0 990,400 660,400" fill="url(#beam)" />
        </svg>
        <svg
          className="pointer-events-none absolute bottom-[-90px] left-1/2 -translate-x-1/2 opacity-50"
          width="640"
          height="200"
          viewBox="0 0 640 200"
          aria-hidden="true"
        >
          <line x1="0" y1="4" x2="640" y2="4" stroke="var(--pitch)" strokeWidth="2" />
          <circle cx="320" cy="4" r="52" fill="none" stroke="var(--pitch)" strokeWidth="2" />
          <path d="M 40 4 v 90 h 140 v -90" fill="none" stroke="var(--pitch)" strokeWidth="2" />
          <path d="M 600 4 v 90 h -140 v -90" fill="none" stroke="var(--pitch)" strokeWidth="2" />
        </svg>

        <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-3 px-6 py-12">
          <span
            className="scoreboard text-xs uppercase tracking-[0.2em]"
            style={{ color: "var(--floodlight)" }}
          >
            TxOdds x Solana &middot; World Cup Hackathon
          </span>
          <h1
            className="text-4xl font-extrabold tracking-tight sm:text-[46px]"
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
