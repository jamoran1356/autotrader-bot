"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, LayoutDashboard, Medal, MenuSquare, ShieldCheck, Wallet } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { clearAuthSession, getAuthUser, isLoggedIn as getIsLoggedIn, updateWalletAddress } from "@/lib/auth-client";
import { useAppState } from "@/lib/app-state";
import type { TradingNetwork } from "@/lib/types";

const baseNavItems = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/dashboard", label: "Dashboard" },
];

type EthereumProvider = {
  request: (args: { method: string }) => Promise<string[]>;
};

const networkOptions: Array<{ label: string; value: TradingNetwork }> = [
  { label: "All networks", value: "all" },
  { label: "HashKey testnet", value: "hashkey-testnet" },
  { label: "Stellar testnet", value: "stellar-testnet" },
  { label: "Solana devnet", value: "solana-devnet" },
];

export function SiteHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { selectedNetwork, setSelectedNetwork, linkWallet } = useAppState();

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(getIsLoggedIn());
      setDisplayName(getAuthUser()?.displayName ?? null);
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("autotrader-auth-change", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("autotrader-auth-change", syncAuth);
    };
  }, []);

  const navItems = baseNavItems;

  const toggleLogin = () => {
    if (isLoggedIn) {
      clearAuthSession();
    }
  };

  const connectWallet = async () => {
    const provider = (window as Window & { ethereum?: EthereumProvider }).ethereum;
    if (!provider) {
      alert("No EVM wallet detected. Please install MetaMask.");
      return;
    }

    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      if (accounts?.length) {
        const address = accounts[0];
        setWalletAddress(`${address.slice(0, 6)}...${address.slice(-4)}`);

        linkWallet("evm", address);

        if (getIsLoggedIn()) {
          await updateWalletAddress(address);
        }
      }
    } catch {
      alert("Wallet connection was rejected or failed.");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(246,244,239,0.92)] backdrop-blur-xl">
      <div className="page-shell flex items-center gap-3 py-3">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <p className="text-sm font-bold tracking-[0.2em] text-[var(--primary)] uppercase leading-none">AutoTrader</p>
          <p className="text-[11px] text-[var(--muted)] leading-tight mt-0.5 whitespace-nowrap">Auditable bot marketplace</p>
        </Link>

        {/* Nav — grows to fill space */}
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-white/80 p-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Actions cluster */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          {/* Network selector */}
          <label className="relative">
            <span className="sr-only">Trading network</span>
            <select
              value={selectedNetwork}
              onChange={(event) => setSelectedNetwork(event.target.value as TradingNetwork)}
              className="appearance-none whitespace-nowrap rounded-full border border-[var(--border)] bg-white/80 py-1.5 pl-3 pr-7 text-xs font-medium text-[var(--muted)] cursor-pointer"
            >
              {networkOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-[var(--muted)]" />
          </label>

          {/* Wallet */}
          <button
            onClick={connectWallet}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--border)] bg-white/80 px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-white"
          >
            <Wallet className="h-3.5 w-3.5 shrink-0" />
            {walletAddress ?? "Wallet"}
          </button>

          {/* Auth */}
          {isLoggedIn ? (
            <button
              onClick={toggleLogin}
              className="whitespace-nowrap rounded-full border border-[var(--border)] bg-white/80 px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:bg-white"
            >
              {displayName ? displayName : "Log out"}
            </button>
          ) : (
            <ButtonLink href="/auth" variant="secondary" className="px-3 py-1.5 whitespace-nowrap text-xs">
              Sign in
            </ButtonLink>
          )}

          {/* 4/4 badge */}
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-[rgba(15,159,111,0.1)] px-3 py-1.5 text-xs font-semibold text-[var(--success)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            4/4 live
          </span>

          {/* CTA — only when authenticated */}
          {isLoggedIn ? (
            <ButtonLink
              href="/dashboard"
              className="shrink-0 whitespace-nowrap px-4 py-2 border border-[#081947] bg-[#0f2f8a] text-[#ffffff] text-sm hover:bg-[#0a2265]"
            >
              Open dashboard
            </ButtonLink>
          ) : null}
        </div>

        {/* Mobile toggle */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-white/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            <MenuSquare className="h-4 w-4" />
            Menu
          </div>
        </div>
      </div>

      <div className="page-shell flex gap-2 overflow-x-auto pb-4 md:hidden">
        {isLoggedIn ? (
          <button
            onClick={toggleLogin}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm"
          >
            Log out
          </button>
        ) : (
          <Link className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm" href="/auth">
            Log in
          </Link>
        )}
        <button
          onClick={connectWallet}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm"
        >
          <Wallet className="h-4 w-4" />
          {walletAddress ?? "Wallet"}
        </button>
        <Link className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm" href="/marketplace">
          <ShieldCheck className="h-4 w-4" />
          Marketplace
        </Link>
        {isLoggedIn ? (
          <Link className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm" href="/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        ) : null}
        <label className="inline-flex items-center rounded-full border border-[var(--border)] bg-white px-3 py-2 text-sm">
          <select value={selectedNetwork} onChange={(event) => setSelectedNetwork(event.target.value as TradingNetwork)}>
            {networkOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <Link className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm" href="/leaderboard">
          <Medal className="h-4 w-4" />
          Leaderboard
        </Link>
      </div>
    </header>
  );
}