"use client";

import { ErrorFallback } from "@/components/ErrorFallback";

export default function WealthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback error={error} reset={reset} title="Wealth Timeline Error" />;
}
