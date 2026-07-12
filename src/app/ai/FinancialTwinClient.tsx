"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { inr } from "@/lib/format";
import type { TwinProfile, TwinResponse, TwinScenario } from "@/lib/financial-twin";
import {
  IconAI, IconSimulator, IconAlert, IconArrowRight,
  IconSparkles, IconSavings, IconNetWorth, IconHealth, IconTarget
} from "@/components/ui/Icons";

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
  label: string;
  question: string;
};

const QUICK_QUESTIONS: QuickQuestion[] = [
  { label: "Can I afford this?", question: "Can I afford a ₹50,000 purchase?" },
  { label: "Job loss impact", question: "What happens if I lose my job?" },
  { label: "Buy a house?", question: "Should I buy a house worth ₹50L?" },
  { label: "Retire early?", question: "Can I retire early?" },
  { label: "Save more", question: "How can I save more?" },
  { label: "Am I stressed?", question: "Am I financially stressed?" },
  { label: "Debt freedom", question: "When will I be debt-free?" },
  { label: "Emergency fund", question: "Is my emergency fund sufficient?" },
];

const SIMULATOR_OPTIONS = [
  { id: "salaryIncrease", label: "Salary Increase", defaultPct: 20 },
  { id: "salaryDecrease", label: "Salary Decrease", defaultPct: 20 },
  { id: "housePurchase", label: "House Purchase", defaultAmt: 5000000 },
  { id: "carPurchase", label: "Car Purchase", defaultAmt: 1000000 },
  { id: "jobLoss", label: "Job Loss", defaultPct: 100 },
  { id: "inflation", label: "Inflation", defaultPct: 8 },
];

export function FinancialTwinClient() {
  const [profile, setProfile] = useState<TwinProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"chat" | "simulator">("chat");
  const [simScenario, setSimScenario] = useState<string>("salaryIncrease");
  const [simAmount, setSimAmount] = useState<number>(20);
  const [simIsPercent, setSimIsPercent] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      setProfileError("");
      setProfileLoading(true);
      try {
        const res = await fetch("/api/ai/twin");
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.data) {
            setProfile(data.data.profile);
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
          } else {
            setProfileError(data.error || "Failed to load your financial profile. Please try again.");
          }
        } else {
          setProfileError(res.status === 401
            ? "Please sign in to access your Financial Twin."
            : "Failed to load your financial profile. Please try again.");
        }
      } catch (err) {
        setProfileError("Connection error. Please check your internet and try again.");
      } finally {
        setProfileLoading(false);
      }
    }
    fetchProfile();
  }, []);

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
          content: "Sorry, I couldn't process that right now. Please try again.",
          timestamp: new Date(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: "assistant",
        content: "Connection error. Please check your network and try again.",
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
          content: `**${resp.name}**\n\n${resp.description}\n\n**Impact Analysis:**\n• Net worth impact: ${resp.impact.netWorthChange >= 0 ? "+" : ""}${inr(resp.impact.netWorthChange, { compact: true })}\n• Monthly inflow impact: ${resp.impact.monthlyChange >= 0 ? "+" : ""}${inr(resp.impact.monthlyChange, { compact: true })}/mo\n• Emergency runway delta: ${resp.impact.emergencyMonthsChange >= 0 ? "+" : ""}${resp.impact.emergencyMonthsChange.toFixed(1)} mo\n• Savings rate delta: ${resp.impact.savingsRateChange >= 0 ? "+" : ""}${resp.impact.savingsRateChange.toFixed(1)}%\n\n**Calculated Risk Level:** ${resp.risk.toUpperCase()}\n\n**AI Strategic Recommendation:** ${resp.recommendation}`,
          category: resp.name,
          confidence: "medium",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, msg]);
      } else {
        setMessages(prev => [...prev, {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: "Simulation calculation failed. Please try again.",
          timestamp: new Date(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: "assistant",
        content: "Connection error during simulation execution. Please try again.",
        timestamp: new Date(),
      }]);
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

  const retryProfile = useCallback(() => {
    setProfileError("");
    setProfileLoading(true);
    setProfile(null);
    setMessages([]);
    fetch("/api/ai/twin")
      .then(res => {
        if (res.ok) return res.json();
        throw new Error(res.status === 401 ? "Please sign in" : "Failed to load profile");
      })
      .then(data => {
        if (data.ok && data.data) {
          setProfile(data.data.profile);
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
        } else {
          setProfileError(data.error || "Failed to load profile");
        }
      })
      .catch(err => {
        setProfileError(err instanceof Error ? err.message : "Connection error. Please try again.");
      })
      .finally(() => setProfileLoading(false));
  }, []);

  if (profileLoading) {
    return (
      <Card>
        <div className="space-y-4 p-4">
          <div className="h-8 skeleton-block rounded-lg w-56" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 skeleton-block rounded-2xl" />)}
          </div>
          <div className="h-96 skeleton-block rounded-2xl" />
        </div>
      </Card>
    );
  }

  if (profileError) {
    return (
      <Card className="text-center py-12 border-red-500/30 bg-red-500/5">
        <div className="inline-flex w-16 h-16 rounded-2xl grid place-items-center text-red-400 bg-red-500/20 mb-4">
          <IconAlert size={28} />
        </div>
        <h3 className="text-lg font-bold mb-2 text-red-400">Unable to Connect to AI Financial Twin</h3>
        <p className="text-sm mb-6 max-w-md mx-auto text-slate-300">{profileError}</p>
        <button onClick={retryProfile} className="btn btn-primary px-6 py-2.5 text-xs font-bold rounded-xl shadow-md">
          Retry AI Connection
        </button>
      </Card>
    );
  }

  const scoreTone = profile?.healthScore
    ? profile.healthScore >= 75 ? "success" : profile.healthScore >= 50 ? "warning" : "danger"
    : "primary";

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 shrink-0">
            <IconAI size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>AI Financial Twin & Autonomous Advisory</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Autonomous v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Instant intelligence query engine, personalized wealth diagnostics, and what-if life simulation modeling</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab("chat");
              setTimeout(() => {
                const el = document.getElementById("ai-twin-chat-input") as HTMLInputElement | null;
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  el.focus();
                }
              }, 50);
            }}
            className="btn btn-primary px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>⚡ Ask AI Advisory Question</span>
          </button>
        </div>
      </div>

      {/* Profile KPI Row */}
      {profile && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard label="Household Net Worth" value={inr(profile.netWorth, { compact: true })} icon={<IconNetWorth size={18} />} tone="primary" sub={profile.netWorth >= 0 ? "Solvent" : "Deficit"} />
          <KpiCard label="Emergency Cash Runway" value={`${profile.cashRunway.toFixed(1)} mo`} icon={<IconSavings size={18} />} tone={profile.cashRunway >= 6 ? "success" : profile.cashRunway >= 3 ? "warning" : "danger"} sub="Capital reserve coverage" />
          <KpiCard label="Monthly Savings Rate" value={`${profile.savingsRate.toFixed(0)}%`} icon={<IconTarget size={18} />} tone={profile.savingsRate >= 20 ? "success" : "warning"} sub="Target: ≥ 20%" />
          <KpiCard label="AI Diagnosed Health" value={`${profile.healthScore}/100`} icon={<IconHealth size={18} />} tone={scoreTone} sub="Holistic wealth index" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 no-print p-1 rounded-2xl border w-fit" role="tablist" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
        {(["chat", "simulator"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 ${
              activeTab === tab ? "bg-primary text-white shadow-md scale-[1.02]" : "text-slate-400 hover:text-white"
            }`}
          >
            <span>{tab === "chat" ? "AI Advisory Chat" : "What-If Life Simulator"}</span>
          </button>
        ))}
      </div>

      {/* Chat Interface */}
      {activeTab === "chat" && (
        <Card className="flex flex-col border border-white/[0.08]" style={{ minHeight: "600px" }}>
          <div className="flex-1 overflow-y-auto space-y-4 mb-5 pr-1" style={{ maxHeight: "65vh" }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl grid place-items-center shadow-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white mb-4">
                  <IconAI size={30} />
                </div>
                <h3 className="text-xl font-extrabold mb-2 tracking-tight" style={{ color: "var(--text-heading)" }}>
                  Personalized AI Financial Twin
                </h3>
                <p className="text-sm max-w-lg font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  I maintain real-time awareness of your household cash flow, debt liabilities, tax brackets, and investment allocations. Ask me anything to receive analytical, customized recommendations.
                </p>
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 shadow-sm ${
                    msg.role === "user" ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm border border-white/[0.06]"
                  }`}
                  style={{
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, var(--primary), var(--primary-dark))"
                      : "var(--surface-2)",
                    color: msg.role === "user" ? "#fff" : "var(--text)",
                  }}
                >
                  {msg.role === "assistant" && msg.category && (
                    <div className="flex items-center gap-2 mb-3">
                      <Badge tone={msg.confidence === "high" ? "success" : msg.confidence === "low" ? "warning" : "primary"}>
                        {msg.category}
                      </Badge>
                    </div>
                  )}

                  <div className="text-sm whitespace-pre-wrap leading-relaxed font-medium">
                    {formatMessage(msg.content)}
                  </div>

                  {msg.role === "assistant" && msg.metrics && Object.keys(msg.metrics).length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(msg.metrics).map(([key, val]) => (
                        <div key={key} className="px-3 py-2 rounded-xl border border-white/[0.04]" style={{ background: "var(--surface-3)" }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{key}</p>
                          <p className="font-extrabold font-mono text-xs mt-0.5" style={{ color: "var(--text-heading)" }}>{val}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.role === "assistant" && msg.actions && msg.actions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                        Recommended Execution Steps
                      </p>
                      {msg.actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs font-semibold">
                          <span className="text-indigo-400 font-bold"><IconArrowRight size={14} /></span>
                          <span className="text-slate-300">{action}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.role === "assistant" && msg.warnings && msg.warnings.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {msg.warnings.map((warning, i) => (
                        <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold border border-red-500/30 bg-red-500/10 text-red-400">
                          <IconAlert size={16} />
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
                <div className="max-w-[75%] rounded-2xl rounded-bl-sm p-4 border border-white/[0.06]" style={{ background: "var(--surface-2)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl grid place-items-center text-sm bg-indigo-500/20 text-indigo-400">
                      <IconAI size={18} />
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <span className="text-xs font-bold text-slate-400 mr-2">Thinking & analyzing...</span>
                      <div className="w-2 h-2 rounded-full animate-bounce bg-primary" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full animate-bounce bg-primary" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full animate-bounce bg-primary" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Questions Chips */}
          <div className="flex flex-wrap gap-2 mb-4 no-print pt-3 border-t border-white/[0.06]">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q.label}
                onClick={() => sendMessage(q.question)}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 border border-white/[0.06] hover:border-indigo-500/40 bg-surface-2 flex items-center gap-1.5"
                style={{ background: "var(--surface-2)", color: "var(--text-heading)" }}
              >
                <span><IconSparkles size={14} className="text-indigo-400" /></span> <span>{q.label}</span>
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="flex gap-2.5 no-print">
            <input
              id="ai-twin-chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask your Financial Twin anything about your cash flow, goals, or tax options..."
              className="input flex-1 font-medium"
              disabled={loading}
              style={{ minHeight: "48px" }}
              aria-label="Type your financial question"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="btn btn-primary px-6 font-bold shadow-md rounded-xl flex items-center justify-center gap-1.5"
              style={{ minHeight: "48px" }}
              aria-label="Send question"
            >
              {loading ? <span className="animate-spin"><IconAI size={16} /></span> : <span>Send →</span>}
            </button>
          </div>
        </Card>
      )}

      {/* Life Simulator Tab */}
      {activeTab === "simulator" && (
        <Card className="border border-white/[0.08]">
          <div className="space-y-6 p-2">
            <div className="text-center pb-4 border-b border-white/[0.06]">
              <div className="inline-flex w-16 h-16 rounded-2xl grid place-items-center mb-3 shadow-lg text-white" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
                <IconSimulator size={28} />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-heading)" }}>Life Scenario Simulator</h3>
              <p className="text-xs font-medium mt-1 max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>Model critical financial milestones and stress test household resilience before commiting real capital.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SIMULATOR_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleSimScenarioChange(opt.id)}
                  className="p-4 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between"
                  style={{
                    background: simScenario === opt.id ? "var(--primary-soft)" : "var(--surface-2)",
                    borderColor: simScenario === opt.id ? "var(--primary)" : "var(--border)",
                  }}
                >
                  <span className="mb-2 text-indigo-400"><IconSimulator size={22} /></span>
                  <p className="text-xs font-extrabold tracking-tight" style={{ color: simScenario === opt.id ? "var(--text-heading)" : "var(--text-muted)" }}>
                    {opt.label}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-2">
              <div className="flex-1 w-full">
                <label className="text-[11px] font-extrabold uppercase tracking-wider mb-2 block text-slate-300">
                  {simIsPercent ? "Magnitude Percentage (%)" : "Target Capital Amount (₹)"}
                </label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={e => setSimAmount(Number(e.target.value))}
                  className="input font-mono font-bold text-base"
                  placeholder={simIsPercent ? "e.g. 20" : "e.g. 5000000"}
                  style={{ minHeight: "48px" }}
                />
              </div>
              <button
                onClick={runSimulation}
                disabled={loading}
                className="btn btn-primary px-8 font-extrabold shadow-lg rounded-xl whitespace-nowrap flex items-center justify-center gap-2"
                style={{ minHeight: "48px" }}
              >
                {loading ? "Running Simulation..." : "Execute Simulation →"}
              </button>
            </div>

            {messages.length > 0 && messages[messages.length - 1].category && (
              <div className="mt-6 pt-5 border-t border-white/[0.08]">
                <p className="text-xs font-extrabold uppercase tracking-widest mb-3 text-indigo-400">
                  Latest Simulation Impact Report
                </p>
                <div
                  className="p-5 rounded-2xl border border-white/[0.06]"
                  style={{ background: "var(--surface-2)" }}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed font-medium" style={{ color: "var(--text)" }}>
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

function formatMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "▸ $1")
    .replace(/•/g, "  •");
}
