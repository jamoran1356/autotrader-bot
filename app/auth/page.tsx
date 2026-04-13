import { AuthHub } from "@/components/account/auth-hub";

export default function AuthPage() {
  return (
    <div className="page-shell space-y-8">
      <section className="space-y-4">
        <span className="eyebrow">Account Access</span>
        <h1 className="text-4xl font-semibold tracking-tight">Log in, create an account, and connect your wallets</h1>
        <p className="max-w-3xl text-base leading-8 text-[var(--muted)]">
          Configure identity and network context before running or publishing bots. Wallets can be linked across HashKey, Stellar, and Solana flows.
        </p>
      </section>

      <AuthHub />
    </div>
  );
}
