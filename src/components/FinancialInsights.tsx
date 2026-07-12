"use client";

import { Card } from "@/components/ui/Card";
import { inr, num } from "@/lib/format";
import { getGroupForCategory } from "@/lib/categories";
import { IconAlert, IconOpportunities, IconCheck, IconArrowRight } from "@/components/ui/Icons";
import { ReactNode } from "react";
import Link from "next/link";

interface Insight {
  title: string;
  message: string;
  icon: ReactNode;
  tone: "success" | "warning" | "danger" | "primary";
  action?: { label: string; href: string };
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
      title: "Spending Velocity Alert",
      message: `Your expenditure in '${maxIncreaseCat}' increased by ${inr(maxIncreaseVal)} compared to last month. Consider reviewing category allocation.`,
      icon: <IconAlert size={18} className="text-amber-400" />,
      tone: "warning",
      action: { label: "Review Expenses", href: "/expenses" }
    });
  }

  // 2. Savings Potential
  const lifestyleSpend = thisMonthExp
    .filter(t => getGroupForCategory(t.category) === "Lifestyle")
    .reduce((sum, t) => sum + num(t.amount), 0);

  if (lifestyleSpend > 10000) {
    insights.push({
      title: "Capital Optimization Opportunity",
      message: `Lifestyle expenditures total ${inr(lifestyleSpend)} this period. Rebalancing 20% would redirect ${inr(lifestyleSpend * 0.2)} directly into compounding assets.`,
      icon: <IconOpportunities size={18} className="text-indigo-400" />,
      tone: "primary",
      action: { label: "Invest Surplus", href: "/investments" }
    });
  }

  // 3. Bill Coverage
  const totalUpcomingBills = bills.filter(b => !b.paid).reduce((sum, b) => sum + num(b.amount), 0);
  const currentIncome = thisMonthTxns.filter(t => t.type === "income").reduce((sum, t) => sum + num(t.amount), 0);

  if (totalUpcomingBills > currentIncome && totalUpcomingBills > 0) {
    insights.push({
      title: "Liability Deficit Warning",
      message: `Pending scheduled payables (${inr(totalUpcomingBills)}) exceed logged cash inflows (${inr(currentIncome)}) this cycle.`,
      icon: <IconAlert size={18} className="text-red-400" />,
      tone: "danger",
      action: { label: "Manage Bills", href: "/bills" }
    });
  } else if (totalUpcomingBills === 0) {
    insights.push({
      title: "All Scheduled Payables Current",
      message: "You have zero unpaid recurring bills or subscriptions for this period. Household cash flow is unencumbered.",
      icon: <IconCheck size={18} className="text-emerald-400" />,
      tone: "success",
      action: { label: "View Payables", href: "/bills" }
    });
  }

  if (insights.length === 0) {
    return null;
  }

  // If exact 1 item: render as a full-width Sovereign Banner (`w-full`) so there's NO awkward 1/3-width box dangling!
  if (insights.length === 1) {
    const ins = insights[0];
    return (
      <div className="w-full animate-fade-in">
        <div 
          className="w-full p-4 rounded-2xl border flex items-center justify-between gap-4 flex-wrap shadow-sm transition-all"
          style={{ 
            background: ins.tone === "success" ? "var(--success-soft)" : ins.tone === "danger" ? "var(--danger-soft)" : ins.tone === "warning" ? "var(--warning-soft)" : "var(--primary-soft)",
            borderColor: ins.tone === "success" ? "rgba(16, 185, 129, 0.3)" : ins.tone === "danger" ? "rgba(244, 63, 94, 0.3)" : ins.tone === "warning" ? "rgba(245, 158, 11, 0.3)" : "rgba(99, 102, 241, 0.3)"
          }}
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0 shadow-sm border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {ins.icon}
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-extrabold tracking-tight truncate" style={{ color: "var(--text-heading)" }}>{ins.title}</h4>
              <p className="text-xs font-medium truncate sm:whitespace-normal" style={{ color: "var(--text)" }}>{ins.message}</p>
            </div>
          </div>
          {ins.action && (
            <Link 
              href={ins.action.href}
              className="btn btn-ghost px-3.5 py-1.5 text-xs font-bold shrink-0 rounded-xl bg-surface hover:bg-surface-2 border flex items-center gap-1.5 shadow-sm"
              style={{ borderColor: "var(--border)", color: "var(--text-heading)" }}
            >
              <span>{ins.action.label}</span>
              <IconArrowRight size={13} className="text-indigo-400" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  // 2 items: 2 equal grid columns (`grid-cols-1 md:grid-cols-2`)
  // 3+ items: 3 grid columns (`grid-cols-1 md:grid-cols-3`)
  return (
    <div className={`grid grid-cols-1 ${insights.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"} gap-4 w-full animate-fade-in`}>
      {insights.map((ins, i) => (
        <Card key={i} className="p-4.5 border-l-4 shadow-sm h-full flex flex-col justify-between" style={{ borderLeftColor: `var(--${ins.tone})` }}>
          <div className="flex items-start gap-3.5">
            <span className="shrink-0 mt-0.5">{ins.icon}</span>
            <div>
              <h4 className="text-sm font-extrabold tracking-tight" style={{ color: "var(--text-heading)" }}>{ins.title}</h4>
              <p className="text-xs font-medium leading-relaxed mt-1" style={{ color: "var(--text-muted)" }}>{ins.message}</p>
            </div>
          </div>
          {ins.action && (
            <div className="mt-3 pt-2.5 border-t flex justify-end" style={{ borderColor: "var(--border)" }}>
              <Link href={ins.action.href} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1">
                <span>{ins.action.label}</span> <IconArrowRight size={12} />
              </Link>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
