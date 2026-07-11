"use client";

import { ErrorFallback } from "@/components/ErrorFallback";

export default function BriefError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback error={error} reset={reset} title="Morning Brief Error" />;
}
