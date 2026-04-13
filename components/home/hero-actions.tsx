"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { isLoggedIn as getIsLoggedIn } from "@/lib/auth-client";

export function HeroActions() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(getIsLoggedIn());
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("autotrader-auth-change", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("autotrader-auth-change", syncAuth);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <ButtonLink href="/marketplace" size="lg">
        Explore bots
        <ArrowRight className="h-4 w-4" />
      </ButtonLink>
      {isLoggedIn ? (
        <ButtonLink href="/dashboard" variant="secondary" size="lg">
          View portfolio
        </ButtonLink>
      ) : null}
    </div>
  );
}
