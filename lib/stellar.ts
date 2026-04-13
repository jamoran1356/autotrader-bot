export const stellarConfig = {
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org",
  friendbotUrl:
    process.env.NEXT_PUBLIC_STELLAR_FRIENDBOT_URL || "https://friendbot-testnet.stellar.org",
};

export function getPremiumSignalPaymentRequest(botId: string) {
  return {
    botId,
    amount: "0.50 XLM",
    network: "Stellar Testnet",
    protocol: "x402",
    contractId:
      process.env.NEXT_PUBLIC_STELLAR_CONTRACT_ADDRESS || "PENDING_STELLAR_DEPLOY",
  };
}