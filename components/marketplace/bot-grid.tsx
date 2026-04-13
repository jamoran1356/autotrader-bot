import { BotCard } from "@/components/marketplace/bot-card";
import type { BotProfile } from "@/lib/types";

export function BotGrid({ bots }: { bots: BotProfile[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {bots.map((bot) => (
        <BotCard key={bot.id} bot={bot} />
      ))}
    </div>
  );
}