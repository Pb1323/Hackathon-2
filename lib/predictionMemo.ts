// Anchors a prediction on-chain via the Solana Memo program — no custom
// smart contract needed. The memo content is a compact JSON payload; the
// transaction's block time + signature become the tamper-proof "this
// prediction existed before kickoff" proof.

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

export type PredictionPayload = {
  matchId: string;
  pick: "home" | "draw" | "away";
  predictedAt: string; // ISO timestamp, client-side, informational only
};

export function buildMemoInstruction<T>(
  payload: T,
  signer: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [{ pubkey: signer, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(JSON.stringify(payload), "utf-8"),
  });
}

export async function submitPrediction<T>(
  connection: Connection,
  wallet: WalletContextState,
  payload: T
): Promise<string> {
  if (!wallet.publicKey || !wallet.sendTransaction) {
    throw new Error("Wallet not connected");
  }

  const instruction = buildMemoInstruction(payload, wallet.publicKey);
  const transaction = new Transaction().add(instruction);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

  const signature = await wallet.sendTransaction(transaction, connection);
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  return signature;
}

// Same anchoring, but signed by a local disposable keypair instead of a
// wallet extension — used by the guest/no-install testing flow.
export async function submitPredictionWithKeypair<T>(
  connection: Connection,
  payer: Keypair,
  payload: T
): Promise<string> {
  const instruction = buildMemoInstruction(payload, payer.publicKey);
  const transaction = new Transaction().add(instruction);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payer.publicKey;
  transaction.sign(payer);

  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  return signature;
}

export async function ensureFunded(
  connection: Connection,
  publicKey: PublicKey,
  minLamports = 0.02 * LAMPORTS_PER_SOL
): Promise<void> {
  const balance = await connection.getBalance(publicKey);
  if (balance >= minLamports) return;

  // The public devnet faucet is IP-rate-limited and easily exhausted when a
  // whole venue shares one IP, so route through our own pre-funded relay
  // instead of calling connection.requestAirdrop directly.
  const res = await fetch("/api/fund", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey: publicKey.toBase58() }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Funding relay failed (${res.status})`);
  }
}
