"use client";

import { Card } from "@/components/ui/Card";
import { inr, num } from "@/lib/format";
import { getGroupForCategory } from "@/lib/categories";

interface Insight {
  title: string;
  message: string;
  icon: string;
  tone: "success" | "warning" | "danger" | "primary";
}

export function FinancialInsights({ txns, bills }: { txns: any[]; bills: any[] }) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthTxns = txns.filter(t => {
    const d = new Date(t.txnDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevMonth = prevMonthDate.getMonth();
  const prevYear = prevMonthDate.getFullYear();

  const prevMonthTxns = txns.filter(t => {
    const d = new Date(t.txnDate);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  const insights: Insight[] = [];

  // 1. Spend Leak Insight
  const thisMonthExp = txns.filter(t => t.type === "expense" && new Date(t.txnDate).getMonth() === currentMonth);
  const prevMonthExp = txns.filter(t => t.type === "expense" && new Date(t.txnDate).getMonth() === prevMonth);

  const getCatSum = (list: any[]) => {
    const map = new Map<string, number>();
    list.forEach(t => map.set(t.category, (map.get(t.category) || 0) + num(t.amount)));
    return map;
  };

  const thisMap = getCatSum(thisMonthExp);
  const prevMap = getCatSum(prevMonthExp);

  let maxIncreaseCat = "";
  let maxIncreaseVal = 0;

  thisMap.forEach((val, cat) => {
    const prevVal = prevMap.get(cat) || 0;
    const diff = val - prevVal;
    if (diff > maxIncreaseVal) {
      maxIncreaseVal = diff;
      maxIncreaseCat = cat;
    }
  });

  if (maxIncreaseCat && maxIncreaseVal > 500) {
    insights.push({
      title: "Spending Leak",
      message: `Your spending on ${maxIncreaseCat} increased by ${inr(maxIncreaseVal)} compared to last month.`,
      icon: "⚠️",
      tone: "warning"
    });
  }

  // 2. Savings Potential
  const lifestyleSpend = thisMonthExp
    .filter(t => getGroupForCategory(t.category) === "Lifestyle")
    .reduce((sum, t) => sum + num(t.amount), 0);

  if (lifestyleSpend > 10000) {
    insights.push({
      title: "Savings Opportunity",
      message: `You spent ${inr(lifestyleSpend)} on lifestyle. Reducing this by 20% could add ${inr(lifestyleSpend * 0.2)} to your goals.`,
      icon: "💡",
      tone: "primary"
    });
  }

  // 3. Bill Coverage
  const totalUpcomingBills = bills.filter(b => !b.paid).reduce((sum, b) => sum + num(b.amount), 0);
  const totalCash = 0; // This would need account data, but we can check current flow
  const currentIncome = thisMonthTxns.filter(t => t.type === "income").reduce((sum, t) => sum + num(t.amount), 0);

  if (totalUpcomingBills > currentIncome && totalUpcomingBills > 0) {
    insights.push({
      title: "Cash Flow Warning",
      message: `Upcoming bills (${inr(totalUpcomingBills)}) exceed this month's income (${inr(currentIncome)}).`,
      icon: "🚨",
      tone: "danger"
    });
  } else if (totalUpcomingBills === 0) {
    insights.push({
      title: "All Clear",
      message: "You have no unpaid bills for this period. Great job!",
      icon: "✅",
      tone: "success"
    });
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {insights.map((ins, i) => (
        <Card key={i} className="p-4 border-l-4" style={{ borderLeftColor: `var(--${ins.tone})` }}>
          <div className="flex gap-3">
            <span className="text-2xl">{ins.icon}</span>
            <div>
              <h4 className="text-sm font-bold" style={{ color: "var(--text)" }}>{ins.title}</h4>
              <p className="text-xs opacity-70" style={{ color: "var(--text-muted)" }}>{ins.message}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
