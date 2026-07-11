"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

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
        // In development, show the reset URL directly
        if (data.devResetUrl) {
          setDevResetUrl(data.devResetUrl);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not process request");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setForgotLoading(false);
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

        {!showForgot ? (
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
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setError(""); }}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: "var(--primary)" }}
                >
                  Forgot Password?
                </button>
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
        ) : (
          <Card variant="glass" className="!p-6 sm:!p-8">
            <button
              onClick={() => { setShowForgot(false); setForgotSent(false); setError(""); }}
              className="text-xs font-semibold mb-4 flex items-center gap-1"
              style={{ color: "var(--primary)" }}
            >
              ← Back to Sign In
            </button>

            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-heading)" }}>🔐 Reset Password</h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            {forgotSent ? (
              <div className="p-4 rounded-lg text-center" style={{ background: "var(--success-soft)", border: "1px solid var(--success)" }}>
                <p className="text-2xl mb-2">✉️</p>
                <p className="text-sm font-bold" style={{ color: "var(--success)" }}>Reset link sent!</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Check your inbox at <strong>{forgotEmail}</strong> for the password reset link.
                </p>
                {devResetUrl && (
                  <div className="mt-3 p-2.5 rounded-lg text-left" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--warning)" }}>🛠️ Dev Mode — Reset URL:</p>
                    <a
                      href={devResetUrl}
                      className="text-xs font-medium break-all underline"
                      style={{ color: "var(--primary)" }}
                    >
                      {devResetUrl}
                    </a>
                  </div>
                )}
                {!devResetUrl && (
                  <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                    💡 Check your spam/junk folder if you don't see the email.
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg text-sm font-medium" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{error}</div>
                )}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="input"
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={forgotLoading} className="quick-add-btn w-full py-3.5 rounded-xl text-sm disabled:opacity-50">
                  {forgotLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
