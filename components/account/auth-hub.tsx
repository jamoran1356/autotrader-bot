"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/lib/app-state";
import {
  fetchCurrentUser,
  getAuthUser,
  isLoggedIn,
  loginWithPassword,
  registerWithPassword,
  updateWalletAddress,
} from "@/lib/auth-client";
import type { TradingNetwork } from "@/lib/types";

type SolanaProvider = {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
};

type FormMode = "login" | "register";

const networkOptions: Array<{ label: string; value: TradingNetwork }> = [
  { label: "All networks", value: "all" },
  { label: "HashKey testnet", value: "hashkey-testnet" },
  { label: "Stellar testnet", value: "stellar-testnet" },
  { label: "Solana devnet", value: "solana-devnet" },
];

export function AuthHub() {
  const { selectedNetwork, setSelectedNetwork, walletLinks, linkWallet } = useAppState();
  const [mode, setMode] = useState<FormMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("demo@autotrader.bot");
  const [password, setPassword] = useState("demo12345");
  const [stellarAddress, setStellarAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const syncAuth = async () => {
      const hasSession = isLoggedIn();
      setLoggedIn(hasSession);
      if (hasSession) {
        await fetchCurrentUser();
      }
    };

    void syncAuth();

    const listener = () => {
      void syncAuth();
    };

    window.addEventListener("autotrader-auth-change", listener);
    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener("autotrader-auth-change", listener);
      window.removeEventListener("storage", listener);
    };
  }, []);

  const currentUser = getAuthUser();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);

    try {
      if (mode === "login") {
        await loginWithPassword(email.trim(), password);
        setMessage("Login successful.");
      } else {
        await registerWithPassword(displayName.trim(), email.trim(), password);
        setMessage("Account created and session started.");
      }
      setLoggedIn(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication request failed.");
    } finally {
      setBusy(false);
    }
  };

  const pushWallet = async (chain: "evm" | "solana" | "stellar", address: string) => {
    linkWallet(chain, address);

    if (!isLoggedIn()) {
      setMessage(`${chain.toUpperCase()} wallet saved locally. Log in to sync with backend.`);
      return;
    }

    await updateWalletAddress(`${chain}:${address}`);
    setMessage(`${chain.toUpperCase()} wallet linked and synced.`);
  };

  const connectEvm = async () => {
    const provider = (window as Window & { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
    if (!provider) {
      setError("No EVM wallet found. Install MetaMask.");
      return;
    }

    setError(null);

    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const account = accounts?.[0];
      if (!account) {
        setError("No EVM account returned.");
        return;
      }

      await pushWallet("evm", account);
    } catch {
      setError("EVM wallet connection failed.");
    }
  };

  const connectSolana = async () => {
    const provider = (window as Window & { solana?: SolanaProvider }).solana;
    if (!provider?.isPhantom) {
      setError("No Phantom wallet found.");
      return;
    }

    setError(null);

    try {
      const result = await provider.connect();
      const address = result.publicKey.toString();
      await pushWallet("solana", address);
    } catch {
      setError("Solana wallet connection failed.");
    }
  };

  const connectStellar = async () => {
    const address = stellarAddress.trim();
    if (!address) {
      setError("Enter a Stellar public address first.");
      return;
    }

    setError(null);
    try {
      await pushWallet("stellar", address);
      setStellarAddress("");
    } catch {
      setError("Stellar wallet sync failed.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("login")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                mode === "login" ? "bg-[var(--primary)] text-white" : "border border-[var(--border)] bg-white text-[var(--muted)]"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                mode === "register" ? "bg-[var(--primary)] text-white" : "border border-[var(--border)] bg-white text-[var(--muted)]"
              }`}
            >
              Create account
            </button>
          </div>
          <CardTitle className="mt-4 text-2xl font-semibold">
            {mode === "login" ? "Access your bot workspace" : "Create your trader profile"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <Field label="Display name" value={displayName} onChange={setDisplayName} placeholder="Alice Quant" />
            ) : null}
            <Field label="Email" value={email} onChange={setEmail} placeholder="you@domain.com" type="email" />
            <Field label="Password" value={password} onChange={setPassword} placeholder="At least 8 characters" type="password" />
            <Button type="submit" className="w-full justify-center" disabled={busy}>
              {busy ? "Processing..." : mode === "login" ? "Log in" : "Create account"}
            </Button>
          </form>
          {error ? <p className="mt-4 text-sm text-[#b42318]">{error}</p> : null}
          {message ? <p className="mt-4 text-sm text-[var(--success)]">{message}</p> : null}
          <p className="mt-4 text-sm text-[var(--muted)]">
            Active user: {loggedIn ? currentUser?.displayName || currentUser?.email : "Not authenticated"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Network and wallet linking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-2 text-sm">
            <span className="font-semibold text-[var(--foreground)]">Execution network</span>
            <select
              value={selectedNetwork}
              onChange={(event) => setSelectedNetwork(event.target.value as TradingNetwork)}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            >
              {networkOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={connectEvm}
            className="flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-left"
          >
            <span className="text-sm font-semibold">Connect EVM wallet</span>
            <span className="text-xs text-[var(--muted)]">{short(walletLinks.evm) || "Not linked"}</span>
          </button>

          <button
            onClick={connectSolana}
            className="flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-left"
          >
            <span className="text-sm font-semibold">Connect Solana wallet</span>
            <span className="text-xs text-[var(--muted)]">{short(walletLinks.solana) || "Not linked"}</span>
          </button>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="mb-2 text-sm font-semibold">Link Stellar public key</p>
            <div className="flex gap-2">
              <input
                value={stellarAddress}
                onChange={(event) => setStellarAddress(event.target.value)}
                placeholder="G..."
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              />
              <Button variant="secondary" onClick={connectStellar}>
                <Wallet className="h-4 w-4" />
                Link
              </Button>
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">Current: {short(walletLinks.stellar) || "Not linked"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function short(value: string | null) {
  if (!value) {
    return "";
  }

  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "email" | "password";
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-semibold text-[var(--foreground)]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        required
      />
    </label>
  );
}
