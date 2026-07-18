import { SectionTitle, Badge } from "@/components/ui/Card";
import { getAccounts } from "@/lib/data";
import { RecurringClient } from "./RecurringClient";
export const dynamic = "force-dynamic";
export default async function RecurringPage(){const accounts=await getAccounts();return <div className="space-y-6"><SectionTitle title="Recurring Transactions" subtitle="Schedule salary, rent, subscriptions and other repeating cash flow." action={<Badge tone="primary">Automation</Badge>}/><RecurringClient accounts={accounts.map(a=>({id:a.id,name:a.name,type:a.type}))}/></div>}
