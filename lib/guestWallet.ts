// A disposable, in-browser devnet keypair so you can test the full predict
// -> sign -> settle loop without installing a wallet extension. This is
// purely a local testing convenience — it is not how a real user would use
// the product, but it means anyone can try it in seconds.

import { Keypair } from "@solana/web3.js";

const KEY = "kickoff-calls:guest-secret";

export function getOrCreateGuestKeypair(): Keypair {
  const stored = localStorage.getItem(KEY);
  if (stored) {
    try {
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(stored)));
    } catch {
      // fall through and regenerate
    }
  }
  const kp = Keypair.generate();
  localStorage.setItem(KEY, JSON.stringify(Array.from(kp.secretKey)));
  return kp;
}
