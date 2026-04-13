import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPremiumSignalPaymentRequest } from "@/lib/stellar";

export function X402PaymentCard({ botId }: { botId: string }) {
  const paymentRequest = getPremiumSignalPaymentRequest(botId);

  return (
    <Card className="bg-[linear-gradient(135deg,#fff8ef_0%,#ffffff_100%)]">
      <CardHeader>
        <Badge tone="accent">Stellar x402</Badge>
        <CardTitle className="mt-3 text-2xl font-semibold">Unlock premium signals with micropayments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[18px] border border-[var(--border)] bg-white/80 p-4 text-sm leading-7 text-[var(--muted)]">
          <p><strong>Bot:</strong> {paymentRequest.botId}</p>
          <p><strong>Price:</strong> {paymentRequest.amount}</p>
          <p><strong>Network:</strong> {paymentRequest.network}</p>
          <p><strong>Protocol:</strong> {paymentRequest.protocol}</p>
          <p><strong>Contract:</strong> {paymentRequest.contractId}</p>
        </div>
        <Button variant="secondary" className="w-full justify-center">
          Simulate premium payment
        </Button>
      </CardContent>
    </Card>
  );
}