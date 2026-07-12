import { SectionTitle, Badge } from "@/components/ui/Card";
import { FinancialTwinClient } from "./FinancialTwinClient";
import { IconAI } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default function AIPage() {
  return (
    <div className="space-y-6">
      <SectionTitle
        title="AI Financial Twin"
        subtitle="Your digital financial profile — ask anything about your cash flow and advisory targets"
        action={<Badge tone="primary" className="flex items-center gap-1.5"><IconAI size={14} /> AI Engine</Badge>}
      />

      <FinancialTwinClient />
    </div>
  );
}
