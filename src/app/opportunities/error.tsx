"use client";

import { ErrorFallback } from "@/components/ErrorFallback";

export default function OpportunitiesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback error={error} reset={reset} title="Opportunity Scanner Error" />;
}
