"use client";

import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: string;
  action?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="card p-8 sm:p-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>
        {title}
      </h3>
      <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white"
            style={{ background: "var(--primary)" }}
          >
            + {action.label}
          </Link>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium"
            style={{ background: "var(--surface-3)", color: "var(--text)" }}
          >
            📁 {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function EmptyTransactions({ type = "all" }: { type?: "income" | "expense" | "all" }) {
  const config = {
    income: {
      title: "No Income Recorded",
      description: "Start tracking your earnings by adding your first income entry.",
      icon: "💰",
      action: { label: "Add Income", href: "/income" },
    },
    expense: {
      title: "No Expenses Yet",
      description: "Track where your money goes by adding your first expense.",
      icon: "🧾",
      action: { label: "Add Expense", href: "/expenses" },
    },
    all: {
      title: "No Transactions",
      description: "Your financial journey starts here. Add your first transaction to see insights.",
      icon: "📊",
      action: { label: "Add Transaction", href: "/expenses" },
    },
  };

  const c = config[type];
  return <EmptyState {...c} />;
}

export function EmptyAccounts() {
  return (
    <EmptyState
      title="No Accounts Added"
      description="Add your bank accounts, cash, and wallets to track your balances."
      icon="🏦"
      action={{ label: "Add Account", href: "/settings" }}
    />
  );
}

export function EmptyInvestments() {
  return (
    <EmptyState
      title="No Investments Tracked"
      description="Start building your portfolio by adding stocks, mutual funds, and other investments."
      icon="📈"
      action={{ label: "Add Investment", href: "/investments" }}
    />
  );
}

export function EmptyDebts() {
  return (
    <EmptyState
      title="No Loans or Debts"
      description="Track your EMIs and outstanding loans to manage your liabilities better."
      icon="🏦"
      action={{ label: "Add Loan", href: "/debt" }}
    />
  );
}

export function EmptyGoals() {
  return (
    <EmptyState
      title="No Savings Goals"
      description="Set financial goals like Emergency Fund, Vacation, or Retirement to stay motivated."
      icon="🎯"
      action={{ label: "Create Goal", href: "/savings" }}
    />
  );
}

export function EmptyBills() {
  return (
    <EmptyState
      title="No Bills Added"
      description="Never miss a payment. Add your recurring bills and get reminders."
      icon="🔔"
      action={{ label: "Add Bill", href: "/bills" }}
    />
  );
}

export function EmptyDashboard() {
  return (
    <div className="space-y-6">
      <div className="card p-8 sm:p-12 text-center">
        <div className="text-6xl mb-4">👋</div>
        <h3 className="text-xl font-semibold mb-3" style={{ color: "var(--text)" }}>
          Welcome to Personal CFO!
        </h3>
        <p className="text-sm mb-6 max-w-lg mx-auto" style={{ color: "var(--text-muted)" }}>
          Your financial journey starts here. Choose how you&apos;d like to get started:
        </p>
        
        <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          <Link
            href="/settings"
            className="card p-5 text-left hover:scale-[1.02] transition-transform"
            style={{ background: "var(--surface-2)" }}
          >
            <div className="text-3xl mb-3">✏️</div>
            <h4 className="font-semibold mb-1" style={{ color: "var(--text)" }}>
              Start Fresh
            </h4>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Add your accounts, investments, and transactions manually
            </p>
          </Link>
          
          <Link
            href="/settings?tab=import"
            className="card p-5 text-left hover:scale-[1.02] transition-transform"
            style={{ background: "var(--surface-2)" }}
          >
            <div className="text-3xl mb-3">📁</div>
            <h4 className="font-semibold mb-1" style={{ color: "var(--text)" }}>
              Import Data
            </h4>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Upload Excel files from your bank or previous tracking
            </p>
          </Link>
        </div>
      </div>
      
      {/* Quick Setup Guide */}
      <div className="card p-5">
        <h4 className="font-semibold mb-4" style={{ color: "var(--text)" }}>
          🚀 Quick Setup Guide
        </h4>
        <div className="space-y-3">
          {[
            { step: 1, text: "Add family members", done: false },
            { step: 2, text: "Add your bank accounts", done: false },
            { step: 3, text: "Record your first transaction", done: false },
            { step: 4, text: "Set a savings goal", done: false },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                style={{ 
                  background: item.done ? "var(--success)" : "var(--surface-3)",
                  color: item.done ? "#fff" : "var(--text-muted)"
                }}
              >
                {item.done ? "✓" : item.step}
              </div>
              <span className="text-sm" style={{ color: item.done ? "var(--text-muted)" : "var(--text)" }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
