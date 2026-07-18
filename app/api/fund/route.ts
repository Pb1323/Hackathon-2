// Relay-funds a devnet address from a pre-funded "bank" wallet instead of
// hitting Solana's public RPC airdrop faucet, which is IP-rate-limited and
// gets exhausted fast when an entire hackathon venue shares one IP. Fund the
// bank once via https://faucet.solana.com, then every guest key gets topped
// up from here — devnet SOL only, worthless outside this app.

import { NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

const RELAY_AMOUNT_LAMPORTS = 0.03 * LAMPORTS_PER_SOL;

export async function POST(request: Request) {
  const { publicKey } = await request.json();
  if (typeof publicKey !== "string") {
    return NextResponse.json({ error: "Missing publicKey" }, { status: 400 });
  }

  const secretRaw = process.env.FAUCET_SECRET_KEY;
  if (!secretRaw) {
    return NextResponse.json(
      { error: "FAUCET_SECRET_KEY not configured on the server" },
      { status: 500 }
    );
  }

  let target: PublicKey;
  try {
    target = new PublicKey(publicKey);
  } catch {
    return NextResponse.json({ error: "Invalid publicKey" }, { status: 400 });
  }

  const bank = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secretRaw)));
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const connection = new Connection(endpoint, "confirmed");

  const bankBalance = await connection.getBalance(bank.publicKey);
  if (bankBalance < RELAY_AMOUNT_LAMPORTS) {
    return NextResponse.json(
      {
        error: `Bank wallet is empty (${bankBalance} lamports). Fund ${bank.publicKey.toBase58()} via https://faucet.solana.com first.`,
      },
      { status: 503 }
    );
  }

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: bank.publicKey,
      toPubkey: target,
      lamports: RELAY_AMOUNT_LAMPORTS,
    })
  );
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = bank.publicKey;
  transaction.sign(bank);

  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  return NextResponse.json({ signature });
}
