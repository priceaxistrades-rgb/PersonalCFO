"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui/Card";
import { useSession } from "@/lib/session";
import {
  IconDashboard, IconUser, IconLock, IconCheck, IconSparkles, IconArrowRight
} from "@/components/ui/Icons";

export default function SignupPage() {
  const { setSession } = useSession();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); setLoading(false); return; }
    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed"); }
      else { setSession(data.session); setSuccess(true); setTimeout(() => { window.location.replace("/"); }, 400); }
    } catch { setError("Network error. Please try again."); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-bg select-none">
      {/* ─── LEFT SHOWCASE PANEL (Sovereign Wealth Cockpit Preview) ─── */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 xl:p-16 relative overflow-hidden border-r border-white/[0.08]" style={{ background: "linear-gradient(135deg, #0a0f24, #07080c)" }}>
        {/* Ambient glow fields */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mt-32 -mr-32" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mb-32 -ml-32" />

        {/* Top Brand Identity */}
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

        {/* Center Showcase Deck */}
        <div className="relative z-10 my-auto space-y-8 max-w-xl">
          <div className="space-y-3">
            <Badge tone="primary" className="font-mono uppercase tracking-widest px-3 py-1">Household Architecture</Badge>
            <h2 className="text-3xl xl:text-5xl font-black tracking-tight text-white leading-[1.1]">
              The consolidated operating deck for your family&apos;s net worth.
            </h2>
            <p className="text-sm xl:text-base font-medium text-slate-300 leading-relaxed pt-1">
              Synchronize live NSE/BSE stock portfolios, AMFI mutual fund rates, multi-member cash flows, and old vs new regime tax strategies—all securely isolated inside your own dedicated PostgreSQL schema.
            </p>
          </div>

          {/* Glass Preview Widget */}
          <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Sample Consolidated Valuation</span>
                <p className="text-2xl xl:text-3xl font-mono font-black text-white tracking-tight mt-0.5">₹1,42,80,000</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">AI Health Index</span>
                <p className="text-xl font-mono font-bold text-emerald-400 mt-0.5">Grade A+ (96/100)</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <span className="text-[10px] font-bold text-slate-400 block">Live Tickers</span>
                <span className="text-xs font-mono font-bold text-indigo-300 mt-1 block">NSE + AMFI NAVs</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <span className="text-[10px] font-bold text-slate-400 block">Multi-Member</span>
                <span className="text-xs font-mono font-bold text-emerald-300 mt-1 block">Isolated Subsets</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <span className="text-[10px] font-bold text-slate-400 block">Tax Engine</span>
                <span className="text-xs font-mono font-bold text-amber-300 mt-1 block">Old vs New Shield</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Trust Strip */}
        <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-white/[0.08] pt-6">
          <span>© 2026 Sovereign Personal CFO</span>
          <span className="flex items-center gap-1.5"><IconLock size={13} className="text-emerald-400" /> Zero third-party telemetry</span>
        </div>
      </div>

      {/* ─── RIGHT AUTHENTICATION PANEL ─── */}
      <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 sm:p-12 relative bg-surface">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Top Switcher */}
          <div className="flex items-center justify-between">
            <Link href="/" className="lg:hidden flex items-center gap-2 font-extrabold text-white">
              <span className="w-7 h-7 rounded-lg bg-indigo-500 text-white grid place-items-center"><IconDashboard size={15} /></span>
              <span>Personal CFO</span>
            </Link>
            <div className="ml-auto flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>Already registered?</span>
              <Link href="/login" className="btn btn-secondary px-3 py-1.5 text-xs font-bold border border-white/10 hover:border-indigo-500/40 text-white">
                Sign In →
              </Link>
            </div>
          </div>

          {/* Main Auth Card */}
          <div className="p-8 sm:p-10 rounded-3xl border border-white/[0.08] bg-surface-2 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Top Luminous Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />

            <div className="space-y-1.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 grid place-items-center mb-4 border border-indigo-500/20 shadow-sm">
                <IconSparkles size={20} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Initialize Workspace</h1>
              <p className="text-xs sm:text-sm font-medium text-slate-400 leading-relaxed">
                Configure your sovereign family administrator credentials to deploy your encrypted database schema.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl text-xs font-bold border border-red-500/40 bg-red-500/10 text-red-400 animate-fade-in flex items-center gap-2">
                <span>✕</span> <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3.5 rounded-2xl text-xs font-bold border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 animate-fade-in flex items-center gap-2">
                <IconCheck size={16} /> <span>Sovereign workspace deployed! Initializing session…</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                  Administrator Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="input font-medium text-sm rounded-xl py-3 border-white/10 focus:border-indigo-500"
                  placeholder="E.g. Yash Sharma"
                />
              </div>

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
                    Master Cryptographic Password
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">Min 8 chars</span>
                </div>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
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
                    <span>Deploying Schema…</span>
                  </>
                ) : (
                  <>
                    <span>Deploy Sovereign Workspace</span>
                    <IconArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5"><IconLock size={12} className="text-emerald-400" /> Signed bcrypt session</span>
              <span>100% Isolated Data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
