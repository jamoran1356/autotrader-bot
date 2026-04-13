import { Connection } from "@solana/web3.js";

export function createBagsClient() {
  const apiKey = process.env.BAGS_API_KEY;
  if (!apiKey) {
    return null;
  }

  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
    "processed",
  );

  return {
    apiKey,
    connection,
    commitment: "processed" as const,
  };
}