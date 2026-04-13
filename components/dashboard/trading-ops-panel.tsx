"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { depositWalletBalance, executeControlledTestTrade, getWalletStatus } from "@/lib/api";
import type { WalletStatus } from "@/lib/types";

const DEFAULT_PAIR = "BTC_USDT";
const DEFAULT_AMOUNT = "0.01";

export function TradingOpsPanel() {
  const [walletStatus, setWalletStatus] = useState<WalletStatus | null>(null);
  const [depositAmount, setDepositAmount] = useState(DEFAULT_AMOUNT);
  const [tradePair, setTradePair] = useState(DEFAULT_PAIR);
  const [tradeAmount, setTradeAmount] = useState(DEFAULT_AMOUNT);
  const [forceConfirmations, setForceConfirmations] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const [isSubmitting, startSubmit] = useTransition();

  const refreshWalletStatus = () => {
    startRefresh(async () => {
      setError(null);
      try {
        const nextStatus = await getWalletStatus();
        setWalletStatus(nextStatus);
      } catch (refreshError) {
        setError(refreshError instanceof Error ? refreshError.message : "Unable to fetch wallet status.");
      }
    });
  };

  useEffect(() => {
    refreshWalletStatus();
  }, []);

  const handleDeposit = () => {
    startSubmit(async () => {
      setFeedback(null);
      setError(null);

      try {
        const result = await depositWalletBalance(depositAmount);
        setFeedback(`Deposit confirmed: ${result.amount} HSK in tx ${shortHash(result.txHash)}`);
        const nextStatus = await getWalletStatus();
        setWalletStatus(nextStatus);
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Deposit failed.");
      }
    });
  };

  const handleTestTrade = () => {
    startSubmit(async () => {
      setFeedback(null);
      setError(null);

      try {
        const result = await executeControlledTestTrade({
          pair: tradePair.trim().toUpperCase(),
          amount: tradeAmount,
          forceConfirmations,
        });

        setFeedback(
          `Test trade submitted for ${tradePair.trim().toUpperCase()} in tx ${shortHash(result.txHash)}${
            result.forcedConfirmations ? " with forced 4/4 confirmations" : ""
          }.`,
        );

        const nextStatus = await getWalletStatus();
        setWalletStatus(nextStatus);
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Test trade failed.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Wallet ops and controlled test trade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Bot wallet status</p>
              <p className="text-xs text-[var(--muted)]">Live data from backend and AutoTrader contract on HashKey testnet.</p>
            </div>
            <Button variant="secondary" onClick={refreshWalletStatus} disabled={isRefreshing || isSubmitting}>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Metric label="Wallet" value={walletStatus?.walletBalance ? `${walletStatus.walletBalance} HSK` : "--"} />
            <Metric label="Contract" value={walletStatus?.contractBalance ? `${walletStatus.contractBalance} HSK` : "--"} />
            <Metric label="Address" value={walletStatus?.address ? shortAddress(walletStatus.address) : "--"} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">Deposit balance into contract</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Moves HSK from the bot wallet into the contract balance used for execution.</p>
            <label className="mt-4 block text-sm text-[var(--muted)]">
              Amount
              <input
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
                inputMode="decimal"
              />
            </label>
            <Button className="mt-4 w-full justify-center" onClick={handleDeposit} disabled={isSubmitting || isRefreshing}>
              {isSubmitting ? "Processing..." : "Deposit to contract"}
            </Button>
          </div>

          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">Controlled test trade</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Runs a manual testnet trade using live pair data. If the pair is below 4/4, you can force a controlled test execution.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block text-sm text-[var(--muted)]">
                Pair
                <input
                  value={tradePair}
                  onChange={(event) => setTradePair(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
                  placeholder="BTC_USDT"
                />
              </label>
              <label className="block text-sm text-[var(--muted)]">
                Amount
                <input
                  value={tradeAmount}
                  onChange={(event) => setTradeAmount(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)]"
                  inputMode="decimal"
                />
              </label>
            </div>

            <label className="mt-4 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={forceConfirmations}
                onChange={(event) => setForceConfirmations(event.target.checked)}
                className="mt-1"
              />
              <span>Force 4/4 confirmations for a controlled test when live analysis is below threshold.</span>
            </label>

            <Button className="mt-4 w-full justify-center" onClick={handleTestTrade} disabled={isSubmitting || isRefreshing}>
              {isSubmitting ? "Submitting..." : "Run controlled test trade"}
            </Button>
          </div>
        </div>

        {feedback ? <p className="text-sm text-[var(--success)]">{feedback}</p> : null}
        {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function shortHash(value?: string) {
  return value ? `${value.slice(0, 10)}...${value.slice(-6)}` : "pending";
}