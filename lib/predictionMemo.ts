// Anchors a prediction on-chain via the Solana Memo program — no custom
// smart contract needed. The memo content is a compact JSON payload; the
// transaction's block time + signature become the tamper-proof "this
// prediction existed before kickoff" proof.

import {
  Connection,
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

export function buildMemoInstruction(
  payload: PredictionPayload,
  signer: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [{ pubkey: signer, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(JSON.stringify(payload), "utf-8"),
  });
}

export async function submitPrediction(
  connection: Connection,
  wallet: WalletContextState,
  payload: PredictionPayload
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
