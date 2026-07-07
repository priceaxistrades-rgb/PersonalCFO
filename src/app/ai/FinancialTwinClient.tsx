"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard, Progress } from "@/components/ui/Kpi";
import { inr } from "@/lib/format";
import type { TwinProfile, TwinResponse, TwinScenario } from "@/lib/financial-twin";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  category?: string;
  icon?: string;
  confidence?: "high" | "medium" | "low";
  metrics?: Record<string, string>;
  actions?: string[];
  warnings?: string[];
  timestamp: Date;
};

type QuickQuestion = {
  icon: string;
  label: string;
  question: string;
};

const QUICK_QUESTIONS: QuickQuestion[] = [
  { icon: "🛒", label: "Can I afford this?", question: "Can I afford a ₹50,000 purchase?" },
  { icon: "⚠️", label: "Job loss impact", question: "What happens if I lose my job?" },
  { icon: "🏠", label: "Buy a house?", question: "Should I buy a house worth ₹50L?" },
  { icon: "🏝️", label: "Retire early?", question: "Can I retire early?" },
  { icon: "💰", label: "Save more", question: "How can I save more?" },
  { icon: "😰", label: "Am I stressed?", question: "Am I financially stressed?" },
  { icon: "🎯", label: "Debt freedom", question: "When will I be debt-free?" },
  { icon: "🛟", label: "Emergency fund", question: "Is my emergency fund sufficient?" },
];

const SIMULATOR_OPTIONS = [
  { id: "salaryIncrease", label: "Salary Increase", icon: "📈", defaultPct: 20 },
  { id: "salaryDecrease", label: "Salary Decrease", icon: "📉", defaultPct: 20 },
  { id: "housePurchase", label: "House Purchase", icon: "🏠", defaultAmt: 5000000 },
  { id: "carPurchase", label: "Car Purchase", icon: "🚗", defaultAmt: 1000000 },
  { id: "jobLoss", label: "Job Loss", icon: "⚠️", defaultPct: 100 },
  { id: "inflation", label: "Inflation", icon: "📊", defaultPct: 8 },
];

export function FinancialTwinClient() {
  const [profile, setProfile] = useState<TwinProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "simulator">("chat");
  const [simScenario, setSimScenario] = useState<string>("salaryIncrease");
  const [simAmount, setSimAmount] = useState<number>(20);
  const [simIsPercent, setSimIsPercent] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch twin profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/ai/twin");
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.data) {
            setProfile(data.data.profile);
            // Load recent queries as chat history
            if (data.data.recentQueries?.length) {
              const history: ChatMessage[] = [];
              for (const q of data.data.recentQueries.slice(0, 10).reverse()) {
                history.push({
                  id: `q-${q.id}`,
                  role: "user",
                  content: q.question,
                  timestamp: new Date(q.createdAt),
                });
                history.push({
                  id: `a-${q.id}`,
                  role: "assistant",
                  content: q.answer,
                  category: q.category,
                  confidence: q.confidence as "high" | "medium" | "low",
                  timestamp: new Date(q.createdAt),
                });
              }
              setMessages(history);
            }
          }
        }
      } catch {
        // silently fail
      } finally {
        setProfileLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (question: string, amount?: number) => {
    if (!question.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, amount }),
      });

      const data = await res.json();
      if (data.ok && data.data) {
        const resp: TwinResponse = data.data.response;
        setProfile(data.data.profile);
        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: resp.answer,
          category: resp.category,
          icon: resp.icon,
          confidence: resp.confidence,
          metrics: resp.metrics,
          actions: resp.actions,
          warnings: resp.warnings,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        setMessages(prev => [...prev, {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I couldn't process that. Please try again.",
          timestamp: new Date(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: "assistant",
        content: "Connection error. Please check your internet and try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, []);

  const runSimulation = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, number> = {};
      if (simIsPercent) {
        params.percent = simAmount;
      } else {
        params.amount = simAmount;
      }

      const res = await fetch("/api/ai/twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: simScenario, params, question: "" }),
      });

      const data = await res.json();
      if (data.ok && data.data) {
        const resp = data.data.response as TwinScenario;
        setProfile(data.data.profile);
        const msg: ChatMessage = {
          id: `s-${Date.now()}`,
          role: "assistant",
          content: `**${resp.name}**\n\n${resp.description}\n\n📊 **Impact:**\n• Net worth change: ${resp.impact.netWorthChange >= 0 ? "+" : ""}${inr(resp.impact.netWorthChange, { compact: true })}\n• Monthly change: ${resp.impact.monthlyChange >= 0 ? "+" : ""}${inr(resp.impact.monthlyChange, { compact: true })}/mo\n• Emergency months change: ${resp.impact.emergencyMonthsChange >= 0 ? "+" : ""}${resp.impact.emergencyMonthsChange.toFixed(1)} mo\n• Savings rate change: ${resp.impact.savingsRateChange >= 0 ? "+" : ""}${resp.impact.savingsRateChange.toFixed(1)}%\n\n⚡ **Risk Level:** ${resp.risk.toUpperCase()}\n\n💡 **Recommendation:** ${resp.recommendation}`,
          category: resp.name,
          icon: "🔬",
          confidence: "medium",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, msg]);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [simScenario, simAmount, simIsPercent]);

  const handleSimScenarioChange = (id: string) => {
    setSimScenario(id);
    const opt = SIMULATOR_OPTIONS.find(o => o.id === id);
    if (opt) {
      if (opt.defaultAmt !== undefined) {
        setSimAmount(opt.defaultAmt);
        setSimIsPercent(false);
      } else if (opt.defaultPct !== undefined) {
        setSimAmount(opt.defaultPct);
        setSimIsPercent(true);
      }
    }
  };

  if (profileLoading) {
    return (
      <Card>
        <div className="space-y-4">
          <div className="h-8 shimmer rounded-lg w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 shimmer rounded-xl" />)}
          </div>
          <div className="h-64 shimmer rounded-xl" />
        </div>
      </Card>
    );
  }

  const scoreTone = profile?.healthScore
    ? profile.healthScore >= 75 ? "success" : profile.healthScore >= 50 ? "warning" : "danger"
    : "primary";

  return (
    <div className="space-y-4">
      {/* Profile KPI Row */}
      {profile && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 kpi-scroll lg:grid stagger-wide slide-in-up">
          <KpiCard label="Net Worth" value={inr(profile.netWorth, { compact: true })} icon="💎" tone="primary" sub={profile.netWorth >= 0 ? "Positive" : "Negative"} />
          <KpiCard label="Cash Runway" value={`${profile.cashRunway.toFixed(1)} mo`} icon="⏳" tone={profile.cashRunway >= 6 ? "success" : profile.cashRunway >= 3 ? "warning" : "danger"} sub="Months of coverage" />
          <KpiCard label="Savings Rate" value={`${profile.savingsRate.toFixed(0)}%`} icon="💰" tone={profile.savingsRate >= 20 ? "success" : "warning"} sub="Of income" />
          <KpiCard label="Health Score" value={`${profile.healthScore}/100`} icon={profile.healthScore >= 75 ? "🎉" : profile.healthScore >= 50 ? "💪" : "⚠️"} tone={scoreTone} sub="Click for details" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 no-print" role="tablist">
        {(["chat", "simulator"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            className="px-4 py-2.5 rounded-xl text-sm font-bold capitalize transition-all"
            style={{
              background: activeTab === tab ? "var(--primary)" : "var(--surface-2)",
              color: activeTab === tab ? "#fff" : "var(--text-muted)",
              border: activeTab === tab ? "2px solid var(--primary)" : "2px solid var(--border)",
            }}
          >
            {tab === "chat" ? "💬 Ask Your Twin" : "🔬 Life Simulator"}
          </button>
        ))}
      </div>

      {/* Chat Interface */}
      {activeTab === "chat" && (
        <Card className="flex flex-col" style={{ minHeight: "500px" }}>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4" style={{ maxHeight: "60vh" }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-2xl grid place-items-center text-3xl mb-4 shadow-lg gradient-primary">
                  🤖
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-heading)" }}>
                  Your Financial Twin
                </h3>
                <p className="text-sm max-w-md" style={{ color: "var(--text-muted)" }}>
                  I understand your complete financial picture. Ask me anything — from &quot;Can I afford this?&quot; to &quot;What if I lose my job?&quot;
                </p>
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 ${
                    msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
                  }`}
                  style={{
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, var(--primary), var(--primary-dark))"
                      : "var(--surface-2)",
                    color: msg.role === "user" ? "#fff" : "var(--text)",
                    border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                  }}
                >
                  {/* Category badge for assistant */}
                  {msg.role === "assistant" && msg.category && (
                    <div className="flex items-center gap-2 mb-2">
                      {msg.icon && <span className="text-sm">{msg.icon}</span>}
                      <Badge tone={msg.confidence === "high" ? "success" : msg.confidence === "low" ? "warning" : "primary"}>
                        {msg.category}
                      </Badge>
                    </div>
                  )}

                  {/* Message content */}
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {formatMessage(msg.content)}
                  </div>

                  {/* Metrics */}
                  {msg.role === "assistant" && msg.metrics && Object.keys(msg.metrics).length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {Object.entries(msg.metrics).map(([key, val]) => (
                        <div
                          key={key}
                          className="px-2.5 py-2 rounded-lg text-xs"
                          style={{ background: "var(--surface-3)" }}
                        >
                          <p style={{ color: "var(--text-faint)" }}>{key}</p>
                          <p className="font-bold mt-0.5" style={{ color: "var(--text-heading)" }}>{val}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {msg.role === "assistant" && msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                        Recommended Actions
                      </p>
                      {msg.actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span style={{ color: "var(--primary)" }}>→</span>
                          <span style={{ color: "var(--text-muted)" }}>{action}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {msg.role === "assistant" && msg.warnings && msg.warnings.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {msg.warnings.map((warning, i) => (
                        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                          <span>⚠️</span>
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl rounded-bl-sm p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg grid place-items-center text-sm gradient-primary">🤖</div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--primary)", animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--primary)", animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--primary)", animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="flex flex-wrap gap-2 mb-3 no-print">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q.label}
                onClick={() => sendMessage(q.question)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{
                  background: "var(--surface-3)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  minHeight: "36px",
                }}
              >
                {q.icon} {q.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 no-print">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask your Financial Twin anything..."
              className="input flex-1"
              disabled={loading}
              style={{ minHeight: "44px" }}
              aria-label="Type your financial question"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="btn btn-primary px-5"
              style={{ minHeight: "44px" }}
              aria-label="Send question"
            >
              {loading ? "⏳" : "➤"}
            </button>
          </div>
        </Card>
      )}

      {/* Life Simulator */}
      {activeTab === "simulator" && (
        <Card>
          <div className="space-y-5">
            <div className="text-center mb-2">
              <div className="inline-flex w-14 h-14 rounded-2xl grid place-items-center text-3xl mb-3 shadow-lg" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#fff" }}>
                🔬
              </div>
              <h3 className="text-lg font-bold" style={{ color: "var(--text-heading)" }}>Life Simulator</h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>What if...? See how life events impact your finances</p>
            </div>

            {/* Scenario Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SIMULATOR_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleSimScenarioChange(opt.id)}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    background: simScenario === opt.id ? "var(--primary-soft)" : "var(--surface-2)",
                    border: simScenario === opt.id ? "2px solid var(--primary)" : "2px solid var(--border)",
                  }}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <p className="text-xs font-bold mt-1" style={{ color: simScenario === opt.id ? "var(--primary)" : "var(--text-muted)" }}>
                    {opt.label}
                  </p>
                </button>
              ))}
            </div>

            {/* Amount/Percent Input */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-faint)" }}>
                  {simIsPercent ? "Percentage (%)" : "Amount (₹)"}
                </label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={e => setSimAmount(Number(e.target.value))}
                  className="input"
                  placeholder={simIsPercent ? "e.g. 20" : "e.g. 5000000"}
                  style={{ minHeight: "44px" }}
                  aria-label={simIsPercent ? "Percentage value" : "Amount in rupees"}
                />
              </div>
              <button
                onClick={runSimulation}
                disabled={loading}
                className="btn btn-primary px-6 whitespace-nowrap"
                style={{ minHeight: "44px" }}
              >
                {loading ? "⏳ Running..." : "▶ Simulate"}
              </button>
            </div>

            {/* Recent simulation results shown in chat */}
            {messages.length > 0 && messages[messages.length - 1].category && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-faint)" }}>
                  Latest Simulation Result
                </p>
                <div
                  className="p-4 rounded-xl"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text)" }}>
                    {formatMessage(messages[messages.length - 1].content)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

/** Simple markdown-like formatting for messages */
function formatMessage(text: string): string {
  // Convert **bold** to visual emphasis
  return text
    .replace(/\*\*(.*?)\*\*/g, "▸ $1")
    .replace(/•/g, "  •");
}
