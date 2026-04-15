"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/lib/app-state";
import {
  fetchCurrentUser,
  isLoggedIn,
  loginWithPassword,
  loginWithWallet,
  registerWithPassword,
} from "@/lib/auth-client";

type SolanaProvider = {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
};

type FormMode = "login" | "register";

export function AuthHub() {
  const router = useRouter();
  const { walletLinks, linkWallet } = useAppState();
  const [mode, setMode] = useState<FormMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("demo@autotrader.bot");
  const [password, setPassword] = useState("demo12345");
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);

    try {
      if (mode === "login") {
        await loginWithPassword(email.trim(), password);
      } else {
        await registerWithPassword(displayName.trim(), email.trim(), password);
      }
      setLoggedIn(true);
      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication request failed.");
    } finally {
      setBusy(false);
    }
  };

  const connectEvmAndAuth = async () => {
    const provider = (window as Window & { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
    if (!provider) {
      setError("No EVM wallet found. Install MetaMask.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const account = accounts?.[0];
      if (!account) { setError("No account returned."); return; }
      linkWallet("evm", account);
      await loginWithWallet(account, "evm");
      setLoggedIn(true);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet login failed.");
    } finally {
      setBusy(false);
    }
  };

  const connectSolanaAndAuth = async () => {
    const provider = (window as Window & { solana?: SolanaProvider }).solana;
    if (!provider?.isPhantom) {
      setError("No Phantom wallet found.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await provider.connect();
      const address = result.publicKey.toString();
      linkWallet("solana", address);
      await loginWithWallet(address, "solana");
      setLoggedIn(true);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Solana wallet login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Wallet auth — primary method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Connect wallet to start</CardTitle>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Instantly sign in with your wallet — no email or password needed. Your wallet becomes your identity.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            onClick={connectEvmAndAuth}
            disabled={busy}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-[var(--primary)]/30 bg-gradient-to-r from-[var(--primary-soft)] to-white px-5 py-4 text-left transition-all hover:border-[var(--primary)] hover:shadow-sm disabled:opacity-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-white">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">MetaMask / EVM Wallet</p>
              <p className="text-xs text-[var(--muted)]">HashKey Chain, Ethereum — recommended</p>
            </div>
          </button>

          <button
            onClick={connectSolanaAndAuth}
            disabled={busy}
            className="flex w-full items-center gap-4 rounded-2xl border border-[var(--border)] bg-white px-5 py-4 text-left transition-all hover:border-[var(--primary)] hover:shadow-sm disabled:opacity-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9945FF] text-white">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Phantom / Solana</p>
              <p className="text-xs text-[var(--muted)]">Solana devnet</p>
            </div>
          </button>

          {walletLinks.evm && (
            <p className="text-xs text-[var(--success)]">EVM connected: {short(walletLinks.evm)}</p>
          )}
          {walletLinks.solana && (
            <p className="text-xs text-[var(--success)]">Solana connected: {short(walletLinks.solana)}</p>
          )}

          {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}
          {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}

          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-[var(--muted)]">or use email</span></div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex gap-2">
              <button
                onClick={() => setMode("login")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  mode === "login" ? "bg-[var(--foreground)] text-white" : "border border-[var(--border)] bg-white text-[var(--muted)]"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setMode("register")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  mode === "register" ? "bg-[var(--foreground)] text-white" : "border border-[var(--border)] bg-white text-[var(--muted)]"
                }`}
              >
                Register
              </button>
            </div>
            <form className="space-y-3" onSubmit={handleSubmit}>
              {mode === "register" ? (
                <Field label="Display name" value={displayName} onChange={setDisplayName} placeholder="Alice Quant" />
              ) : null}
              <Field label="Email" value={email} onChange={setEmail} placeholder="you@domain.com" type="email" />
              <Field label="Password" value={password} onChange={setPassword} placeholder="At least 8 characters" type="password" />
              <Button type="submit" className="w-full justify-center" disabled={busy}>
                {busy ? "Processing..." : mode === "login" ? "Log in" : "Create account"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Info panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">How AutoTrader works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoStep number="1" title="Connect wallet or create account" description="Your wallet is your identity. One click sign-in with MetaMask or Phantom." />
          <InfoStep number="2" title="Configure AI provider" description="Add your OpenRouter, OpenAI, or Anthropic API key. The AI analyzes live market data before every trade." />
          <InfoStep number="3" title="Scan & analyze markets" description="Live technical analysis (RSI, MACD, ATR, volume) from Gate.io plus social sentiment from CryptoPanic." />
          <InfoStep number="4" title="AI-gated execution" description="The AI decides LONG, SHORT, or NO_TRADE with a confidence score. Only high-confidence signals execute on HashKey Chain." />
          <InfoStep number="5" title="Full audit trail" description="Every AI decision — reasoning, confidence, execution outcome — is permanently logged for transparency." />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
        {number}
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
        <p className="mt-0.5 text-xs text-[var(--muted)]">{description}</p>
      </div>
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
