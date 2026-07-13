"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Card";
import {
  IconDashboard, IconLock, IconCheck, IconArrowRight
} from "@/components/ui/Icons";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); setLoading(false); }
      else { window.location.replace("/"); return; }
    } catch { setError("Network error. Please try again."); }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotSent(true);
        if (data.devResetUrl) {
          setDevResetUrl(data.devResetUrl);
        }
      } else {
        setError(data.error || "Could not process request");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setForgotLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-bg select-none">
      {/* ─── LEFT SHOWCASE PANEL (Sovereign Wealth Cockpit Preview) ─── */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 xl:p-16 relative overflow-hidden border-r border-white/[0.08]" style={{ background: "linear-gradient(135deg, #0a0f24, #07080c)" }}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mt-32 -mr-32" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mb-32 -ml-32" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl grid place-items-center text-white shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <IconDashboard size={20} />
            </span>
            <div>
              <p className="font-extrabold tracking-tight text-base text-white leading-tight">Personal CFO</p>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400 mt-0.5">Sovereign Wealth OS v5.5</p>
            </div>
          </div>
          <Badge tone="success" className="font-mono text-[10px] py-1 px-3 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1" /> AES-256 Storage
          </Badge>
        </div>

        <div className="relative z-10 my-auto space-y-8 max-w-xl">
          <div className="space-y-3">
            <Badge tone="primary" className="font-mono uppercase tracking-widest px-3 py-1">Secure Terminal Access</Badge>
            <h2 className="text-3xl xl:text-5xl font-black tracking-tight text-white leading-[1.1]">
              Re-enter your consolidated financial cockpit.
            </h2>
            <p className="text-sm xl:text-base font-medium text-slate-300 leading-relaxed pt-1">
              Connect to your live NSE/BSE equity portfolios, AMFI mutual fund NAV engines, and AI advisory diagnostics inside your dedicated household PostgreSQL schema.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Consolidated Household Net Worth</span>
                <p className="text-2xl xl:text-3xl font-mono font-black text-white tracking-tight mt-0.5">₹1,42,80,000</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">AI Health Index</span>
                <p className="text-xl font-mono font-bold text-emerald-400 mt-0.5">Grade A+ (96/100)</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <span className="text-[10px] font-bold text-slate-400 block font-sans">Live Feeds</span>
                <span className="text-xs font-bold text-indigo-300 mt-1 block">NSE + AMFI Polling</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <span className="text-[10px] font-bold text-slate-400 block font-sans">Isolation</span>
                <span className="text-xs font-bold text-emerald-300 mt-1 block">Multi-Member Scope</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <span className="text-[10px] font-bold text-slate-400 block font-sans">Encryption</span>
                <span className="text-xs font-bold text-amber-300 mt-1 block">Bcrypt HTTP-Only</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-white/[0.08] pt-6">
          <span>© 2026 Sovereign Personal CFO</span>
          <span className="flex items-center gap-1.5"><IconLock size={13} className="text-emerald-400" /> Zero third-party telemetry</span>
        </div>
      </div>

      {/* ─── RIGHT AUTHENTICATION PANEL ─── */}
      <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 sm:p-12 relative bg-surface">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <Link href="/" className="lg:hidden flex items-center gap-2 font-extrabold text-white">
              <span className="w-7 h-7 rounded-lg bg-indigo-500 text-white grid place-items-center"><IconDashboard size={15} /></span>
              <span>Personal CFO</span>
            </Link>
            <div className="ml-auto flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>New household?</span>
              <Link href="/signup" className="btn btn-secondary px-3 py-1.5 text-xs font-bold border border-white/10 hover:border-indigo-500/40 text-white">
                Register Workspace →
              </Link>
            </div>
          </div>

          {!showForgot ? (
            <div className="p-8 sm:p-10 rounded-3xl border border-white/[0.08] bg-surface-2 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />

              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 grid place-items-center mb-4 border border-indigo-500/20 shadow-sm">
                  <IconLock size={20} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Unlock Workspace</h1>
                <p className="text-xs sm:text-sm font-medium text-slate-400 leading-relaxed">
                  Enter your sovereign administrator credentials to decrypt session state and launch your financial cockpit.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl text-xs font-bold border border-red-500/40 bg-red-500/10 text-red-400 animate-fade-in flex items-center gap-2">
                  <span>✕</span> <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                    Sovereign Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="input font-mono text-sm rounded-xl py-3 border-white/10 focus:border-indigo-500"
                    placeholder="yash@sovereign-cfo.com"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-mono font-extrabold uppercase tracking-wider text-slate-300">
                      Master Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(true); setError(""); }}
                      className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300"
                    >
                      Forgot credential?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="input font-mono text-sm rounded-xl py-3 border-white/10 focus:border-indigo-500"
                    placeholder="••••••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full py-4 rounded-xl text-sm font-extrabold shadow-xl hover:-translate-y-0.5 transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      <span>Decrypting Session…</span>
                    </>
                  ) : (
                    <>
                      <span>Launch Financial Cockpit</span>
                      <IconArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setError("");
                  try {
                    const res = await fetch("/api/auth/demo", { method: "POST" });
                    if (res.ok) {
                      window.location.replace("/");
                      return;
                    } else {
                      const data = await res.json().catch(() => ({}));
                      setError(data.error || "Demo initialization failed");
                    }
                  } catch {
                    setError("Network error. Please try again.");
                  }
                  setLoading(false);
                }}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-mono font-extrabold border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
              >
                <span>⚡ Launch Instant Demo Cockpit (1-Click)</span>
              </button>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5"><IconCheck size={12} className="text-emerald-400" /> Signed HTTP-Only Cookie</span>
                <span>Zero Password Log</span>
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-10 rounded-3xl border border-white/[0.08] bg-surface-2 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-indigo-500" />

              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Reset Credentials</h2>
                <p className="text-xs sm:text-sm font-medium text-slate-400 leading-relaxed">
                  Enter your registered administrator email address to generate a cryptographic password reset token.
                </p>
              </div>

              {error && <div className="p-3.5 rounded-2xl text-xs font-bold border border-red-500/40 bg-red-500/10 text-red-400 flex items-center gap-2"><span>✕</span> <span>{error}</span></div>}
              {forgotSent && (
                <div className="p-4 rounded-2xl text-xs font-bold border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 space-y-2">
                  <p className="flex items-center gap-2"><IconCheck size={16} /> Reset link sent to your email!</p>
                  {devResetUrl && (
                    <div className="mt-2 p-3 rounded-xl bg-surface border border-white/10 text-[11px] font-mono text-slate-300 break-all">
                      <p className="text-indigo-400 font-bold mb-1">Development Mode Link:</p>
                      <a href={devResetUrl} className="underline hover:text-white">{devResetUrl}</a>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="input font-mono text-sm rounded-xl py-3 border-white/10 focus:border-indigo-500"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn btn-primary w-full py-3.5 rounded-xl text-xs font-extrabold shadow-lg disabled:opacity-50"
                >
                  {forgotLoading ? "Generating Token…" : "Generate Reset Token →"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => { setShowForgot(false); setError(""); setForgotSent(false); }}
                className="btn btn-secondary w-full py-2.5 text-xs font-bold rounded-xl"
              >
                ← Return to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
