export const networkConfig = {
  hashkeyTestnet: {
    label: "HashKey Testnet",
    chainId: 133,
    rpcUrl: process.env.NEXT_PUBLIC_HASHKEY_RPC_URL || "https://testnet.hsk.xyz",
    explorerUrl: "https://testnet-explorer.hsk.xyz",
    contractAddress:
      process.env.NEXT_PUBLIC_AUTOTRADER_CONTRACT_ADDRESS || "PENDING_HASHKEY_DEPLOY",
  },
  stellarTestnet: {
    label: "Stellar Testnet",
    rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org",
    explorerUrl: "https://stellar.expert/explorer/testnet",
    contractAddress:
      process.env.NEXT_PUBLIC_STELLAR_CONTRACT_ADDRESS || "PENDING_STELLAR_DEPLOY",
  },
  solanaDevnet: {
    label: "Solana Devnet",
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
    explorerUrl: "https://explorer.solana.com/?cluster=devnet",
  },
} as const;