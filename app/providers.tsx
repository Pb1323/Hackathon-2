"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { Toaster } from "sonner";

import "@solana/wallet-adapter-react-ui/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet"),
    []
  );

  // Modern wallet-adapter auto-detects installed wallets (Phantom, Solflare,
  // etc.) via the Wallet Standard — no explicit adapter list needed.
  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{ commitment: "confirmed", disableRetryOnRateLimit: true }}
    >
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          {children}
          <Toaster theme="dark" position="bottom-right" richColors />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
