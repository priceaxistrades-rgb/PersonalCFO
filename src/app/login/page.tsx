"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl grid place-items-center text-3xl mb-4 shadow-lg float-anim" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            📊
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-heading)" }}>Welcome Back</h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Sign in to your Personal CFO workspace</p>
        </div>

        <Card variant="glass" className="!p-6 sm:!p-8">
          {error && (
            <div className="mb-5 p-3 rounded-lg text-sm font-medium" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Email Address</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="input" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="quick-add-btn w-full py-3.5 rounded-xl text-sm disabled:opacity-50">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-bold" style={{ color: "var(--primary)" }}>Create account</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
