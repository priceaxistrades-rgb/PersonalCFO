"use client";

import Link from "next/link";
import { ReactNode } from "react";
import {
  IconIncome, IconExpenses, IconDashboard, IconSavings,
  IconInvestments, IconDebt, IconTarget, IconBills, IconSparkles,
  IconPlus, IconReports
} from "@/components/ui/Icons";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: ReactNode;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, icon, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="card p-10 sm:p-16 text-center animate-fade-in border border-dashed border-white/10 bg-surface/50">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 grid place-items-center mx-auto mb-5 shadow-inner">
        {icon}
      </div>
      <h3 className="text-xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-heading)" }}>{title}</h3>
      <p className="text-sm font-medium mb-8 max-w-md mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>{description}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {action && (
          <Link href={action.href} className="btn btn-primary px-6 py-2.5 font-bold shadow-md flex items-center justify-center gap-1.5">
            <IconPlus size={15} /> <span>{action.label}</span>
          </Link>
        )}
        {secondaryAction && (
          <button onClick={secondaryAction.onClick} className="btn btn-secondary px-6 py-2.5 font-bold flex items-center justify-center gap-1.5">
            <IconReports size={15} /> <span>{secondaryAction.label}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyTransactions({ type = "all" }: { type?: "income" | "expense" | "all" }) {
  const config: Record<string, { title: string; description: string; icon: ReactNode; action: { label: string; href: string } }> = {
    income:  { title: "No Income Recorded", description: "Start tracking your earnings by adding your first income entry.", icon: <IconIncome size={32} />, action: { label: "Add Income", href: "/income" } },
    expense: { title: "No Expenses Yet", description: "Track where your money goes by adding your first expense.", icon: <IconExpenses size={32} />, action: { label: "Add Expense", href: "/expenses" } },
    all:     { title: "No Transactions", description: "Your financial journey starts here. Add your first transaction to see insights.", icon: <IconDashboard size={32} />, action: { label: "Add Transaction", href: "/expenses" } },
  };
  return <EmptyState {...(config[type] || config.all)} />;
}

export function EmptyAccounts() { return <EmptyState title="No Accounts Added" description="Add your bank accounts, cash, and wallets to track your balances." icon={<IconSavings size={32} />} action={{ label: "Add Account", href: "/settings" }} />; }
export function EmptyInvestments() { return <EmptyState title="No Investments Tracked" description="Start building your portfolio by adding stocks, mutual funds, and other investments." icon={<IconInvestments size={32} />} action={{ label: "Add Investment", href: "/investments" }} />; }
export function EmptyDebts() { return <EmptyState title="No Loans or Debts" description="Track your EMIs and outstanding loans to manage your liabilities better." icon={<IconDebt size={32} />} action={{ label: "Add Loan", href: "/debt" }} />; }
export function EmptyGoals() { return <EmptyState title="No Savings Goals" description="Set financial goals like Emergency Fund, Vacation, or Retirement to stay motivated." icon={<IconTarget size={32} />} action={{ label: "Create Goal", href: "/savings" }} />; }
export function EmptyBills() { return <EmptyState title="No Bills Added" description="Never miss a payment. Add your recurring bills and get reminders." icon={<IconBills size={32} />} action={{ label: "Add Bill", href: "/bills" }} />; }

export function EmptyDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-10 sm:p-16 text-center border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 to-surface">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-300 grid place-items-center mx-auto mb-6 shadow-lg">
          <IconSparkles size={32} />
        </div>
        <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 text-white">Welcome to Sovereign Personal CFO</h3>
        <p className="text-sm font-medium mb-8 max-w-lg mx-auto text-slate-300 leading-relaxed">
          Your consolidated household wealth suite starts right here. Select an option below to initialize your financial accounts:
        </p>
        <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          <Link href="/settings" className="card p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500/40 bg-surface-2">
            <div className="w-12 h-12 rounded-xl grid place-items-center text-indigo-400 bg-indigo-500/10 mb-4 shadow-sm">
              <IconPlus size={24} />
            </div>
            <h4 className="font-extrabold text-base mb-1 text-white">Initialize Manual Accounts</h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">Add your bank accounts, capital investments, and cash flow items directly</p>
          </Link>
          <Link href="/settings?tab=import" className="card p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 bg-surface-2">
            <div className="w-12 h-12 rounded-xl grid place-items-center text-emerald-400 bg-emerald-500/10 mb-4 shadow-sm">
              <IconReports size={24} />
            </div>
            <h4 className="font-extrabold text-base mb-1 text-white">Import Historical Data</h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">Upload multi-sheet Excel (.xlsx) workbooks from your existing records</p>
          </Link>
        </div>
      </div>

      <div className="card p-6 border border-white/[0.08]">
        <h4 className="font-extrabold text-base tracking-tight mb-5 text-white flex items-center gap-2">
          <IconDashboard size={18} className="text-indigo-400" />
          <span>Quick Setup Checklist</span>
        </h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { step: 1, text: "Configure household profile members" },
            { step: 2, text: "Register primary bank accounts" },
            { step: 3, text: "Log initial salary or expense entry" },
            { step: 4, text: "Set emergency fund or retirement goal" },
          ].map((item) => (
            <div key={item.step} className="p-4 rounded-xl border border-white/[0.04] bg-surface-2 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs grid place-items-center shrink-0">
                {item.step}
              </span>
              <p className="text-xs font-semibold text-slate-300 leading-snug">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
