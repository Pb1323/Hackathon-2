# Kickoff Calls

Built for the **TxOdds x Solana World Cup Hackathon** (London, Encode Hub, 18–19 Jul 2026).

Predict a World Cup match result before kickoff. Your pick is signed as a
Solana devnet transaction (Memo program — no custom smart contract) so it's
provably timestamped before TxLINE reports the real result. Live odds/scores
come from TxOdds' TxLINE feed.

## Setup

```bash
npm install
copy .env.local.example .env.local   # PowerShell: Copy-Item .env.local.example .env.local
npm run dev
```

Fill in `TXLINE_API_KEY` in `.env.local` once you get it from TxOdds at the
venue — until then, `lib/txline.ts` serves placeholder fixtures so the UI
still works end-to-end.

Open [http://localhost:3000](http://localhost:3000). You'll need a Solana
wallet browser extension (e.g. Phantom) set to **devnet** to submit a
prediction — airdrop yourself devnet SOL for gas via
`solana airdrop 1 <your-address> --url devnet` or the wallet's built-in faucet.

## How it works

- `lib/txline.ts` — TxLINE API client (falls back to mock fixtures without a key).
- `lib/predictionMemo.ts` — builds/sends the Memo-program transaction that
  anchors a prediction on-chain.
- `components/PredictionBoard.tsx` — wallet connect + match list + prediction UI.
- `app/providers.tsx` — Solana wallet-adapter context (devnet by default).

## Still to do before submission

- Swap in the real TxLINE API key + confirm the actual response schema.
- Add result settlement (compare prediction memo against final TxLINE score).
- Leaderboard / scoring across predictions (stretch goal).
