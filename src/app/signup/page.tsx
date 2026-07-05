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

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
      } else {
        setSession(data.session);
        setSuccess(true);
        setTimeout(() => {
          window.location.replace("/");
        }, 400);
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md !p-6 sm:!p-8" variant="glass">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3 float-anim">🎯</div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            Create Account
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Your financial data will be private to this account.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
            Account created. Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
              placeholder="••••••••"
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
              Must be at least 8 characters.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="quick-add-btn w-full py-3 rounded-lg font-semibold transition-all duration-200"
            style={{ background: "var(--success)", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium" style={{ color: "var(--primary)" }}>
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
