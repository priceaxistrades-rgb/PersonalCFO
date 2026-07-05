"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { useSession } from "@/lib/session";

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl grid place-items-center text-3xl mb-4 shadow-lg float-anim" style={{ background: "linear-gradient(135deg, var(--success), #059669)" }}>
            🎯
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-heading)" }}>Create Account</h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Your financial data stays private</p>
        </div>

        <Card variant="glass" className="!p-6 sm:!p-8">
          {error && <div className="mb-5 p-3 rounded-lg text-sm font-medium" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{error}</div>}
          {success && <div className="mb-5 p-3 rounded-lg text-sm font-medium" style={{ background: "var(--success-soft)", color: "var(--success)" }}>Account created! Redirecting...</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Full Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input" placeholder="Your name" /></div>
            <div><label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Email Address</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="input" placeholder="you@example.com" /></div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} className="input" placeholder="••••••••" />
              <p className="text-[11px] mt-1.5" style={{ color: "var(--text-faint)" }}>At least 8 characters</p>
            </div>
            <button type="submit" disabled={loading} className="quick-add-btn w-full py-3.5 rounded-xl text-sm disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--success), #059669)", borderColor: "var(--success)" }}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-bold" style={{ color: "var(--primary)" }}>Sign in</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
