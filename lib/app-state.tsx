"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { BlockchainName, TradingNetwork } from "@/lib/types";

type WalletLinks = {
  evm: string | null;
  solana: string | null;
  stellar: string | null;
};

type AppStateValue = {
  selectedNetwork: TradingNetwork;
  setSelectedNetwork: (network: TradingNetwork) => void;
  blockchainFilters: BlockchainName[];
  toggleBlockchainFilter: (chain: BlockchainName) => void;
  clearBlockchainFilters: () => void;
  walletLinks: WalletLinks;
  linkWallet: (chain: "evm" | "solana" | "stellar", address: string) => void;
};

const NETWORK_KEY = "autotrader_selected_network";
const FILTERS_KEY = "autotrader_blockchain_filters";
const WALLETS_KEY = "autotrader_wallet_links";

const defaultWallets: WalletLinks = {
  evm: null,
  solana: null,
  stellar: null,
};

const AppStateContext = createContext<AppStateValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [selectedNetwork, setSelectedNetwork] = useState<TradingNetwork>(() =>
    readJson<TradingNetwork>(NETWORK_KEY, "all"),
  );
  const [blockchainFilters, setBlockchainFilters] = useState<BlockchainName[]>(() =>
    readJson<BlockchainName[]>(FILTERS_KEY, []),
  );
  const [walletLinks, setWalletLinks] = useState<WalletLinks>(() =>
    readJson<WalletLinks>(WALLETS_KEY, defaultWallets),
  );

  useEffect(() => {
    localStorage.setItem(NETWORK_KEY, JSON.stringify(selectedNetwork));
  }, [selectedNetwork]);

  useEffect(() => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(blockchainFilters));
  }, [blockchainFilters]);

  useEffect(() => {
    localStorage.setItem(WALLETS_KEY, JSON.stringify(walletLinks));
  }, [walletLinks]);

  const value = useMemo<AppStateValue>(
    () => ({
      selectedNetwork,
      setSelectedNetwork,
      blockchainFilters,
      toggleBlockchainFilter: (chain) => {
        setBlockchainFilters((current) =>
          current.includes(chain) ? current.filter((item) => item !== chain) : [...current, chain],
        );
      },
      clearBlockchainFilters: () => setBlockchainFilters([]),
      walletLinks,
      linkWallet: (chain, address) => {
        setWalletLinks((current) => ({ ...current, [chain]: address }));
      },
    }),
    [selectedNetwork, blockchainFilters, walletLinks],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }

  return context;
}
