import { SectionTitle, Badge } from "@/components/ui/Card";
import { FinancialTwinClient } from "./FinancialTwinClient";

export const dynamic = "force-dynamic";

export default function AIPage() {
  return (
    <div className="space-y-6">
      <SectionTitle
        title="AI Financial Twin"
        subtitle="Your digital financial profile — ask anything about your money"
        action={<Badge tone="primary">🤖 AI</Badge>}
      />
      <FinancialTwinClient />
    </div>
  );
}
