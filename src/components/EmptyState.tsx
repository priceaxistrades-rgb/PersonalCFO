"use client";

import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: string;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, icon, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="card p-10 sm:p-16 text-center fade-in-up">
      <div className="text-6xl mb-5 float-anim">{icon}</div>
      <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-heading)" }}>{title}</h3>
      <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>{description}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {action && (
          <Link href={action.href} className="btn btn-primary px-5 py-2.5">
            + {action.label}
          </Link>
        )}
        {secondaryAction && (
          <button onClick={secondaryAction.onClick} className="btn btn-secondary px-5 py-2.5">
            📁 {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyTransactions({ type = "all" }: { type?: "income" | "expense" | "all" }) {
  const config = {
    income:  { title: "No Income Recorded", description: "Start tracking your earnings by adding your first income entry.", icon: "💰", action: { label: "Add Income", href: "/income" } },
    expense: { title: "No Expenses Yet", description: "Track where your money goes by adding your first expense.", icon: "🧾", action: { label: "Add Expense", href: "/expenses" } },
    all:     { title: "No Transactions", description: "Your financial journey starts here. Add your first transaction to see insights.", icon: "📊", action: { label: "Add Transaction", href: "/expenses" } },
  };
  return <EmptyState {...config[type]} />;
}

export function EmptyAccounts() { return <EmptyState title="No Accounts Added" description="Add your bank accounts, cash, and wallets to track your balances." icon="🏦" action={{ label: "Add Account", href: "/settings" }} />; }
export function EmptyInvestments() { return <EmptyState title="No Investments Tracked" description="Start building your portfolio by adding stocks, mutual funds, and other investments." icon="📈" action={{ label: "Add Investment", href: "/investments" }} />; }
export function EmptyDebts() { return <EmptyState title="No Loans or Debts" description="Track your EMIs and outstanding loans to manage your liabilities better." icon="🏦" action={{ label: "Add Loan", href: "/debt" }} />; }
export function EmptyGoals() { return <EmptyState title="No Savings Goals" description="Set financial goals like Emergency Fund, Vacation, or Retirement to stay motivated." icon="🎯" action={{ label: "Create Goal", href: "/savings" }} />; }
export function EmptyBills() { return <EmptyState title="No Bills Added" description="Never miss a payment. Add your recurring bills and get reminders." icon="🔔" action={{ label: "Add Bill", href: "/bills" }} />; }

export function EmptyDashboard() {
  return (
    <div className="space-y-6 fade-in-up">
      <div className="card p-10 sm:p-16 text-center">
        <div className="text-7xl mb-6 float-anim">👋</div>
        <h3 className="text-2xl font-extrabold mb-3" style={{ color: "var(--text-heading)" }}>Welcome to Personal CFO!</h3>
        <p className="text-sm mb-8 max-w-lg mx-auto" style={{ color: "var(--text-muted)" }}>
          Your financial journey starts here. Choose how you&apos;d like to get started:
        </p>
        <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          <Link href="/settings" className="card p-6 text-left transition-all duration-200 hover:translate-y-[-3px]" style={{ background: "var(--surface-2)" }}>
            <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl mb-4" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>✏️</div>
            <h4 className="font-bold mb-1" style={{ color: "var(--text-heading)" }}>Start Fresh</h4>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Add your accounts, investments, and transactions manually</p>
          </Link>
          <Link href="/settings?tab=import" className="card p-6 text-left transition-all duration-200 hover:translate-y-[-3px]" style={{ background: "var(--surface-2)" }}>
            <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl mb-4" style={{ background: "linear-gradient(135deg, var(--success), #059669)" }}>📁</div>
            <h4 className="font-bold mb-1" style={{ color: "var(--text-heading)" }}>Import Data</h4>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Upload Excel files from your bank or previous tracking</p>
          </Link>
        </div>
      </div>

      <div className="card p-6">
        <h4 className="font-bold mb-5" style={{ color: "var(--text-heading)" }}>🚀 Quick Setup Guide</h4>
        <div className="space-y-3">
          {[
            { step: 1, text: "Add family members" },
            { step: 2, text: "Add your bank accounts" },
            { step: 3, text: "Record your first transaction" },
            { step: 4, text: "Set a savings goal" },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-4">
              <div
                className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold shrink-0"
                style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
              >
                {item.step}
              </div>
              <span className="text-sm" style={{ color: "var(--text)" }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
