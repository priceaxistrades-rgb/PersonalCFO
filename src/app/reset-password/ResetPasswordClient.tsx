"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";

type TokenStatus = "checking" | "valid" | "invalid" | "expired" | "used" | "not_found";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>(() => token ? "checking" : "not_found");
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.valid) {
          setTokenStatus("valid");
        } else if (data.reason === "expired") {
          setTokenStatus("expired");
        } else if (data.reason === "already_used") {
          setTokenStatus("used");
        } else {
          setTokenStatus("not_found");
        }
      })
      .catch(() => {
        if (active) setTokenStatus("invalid");
      });
    return () => { active = false; };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password, confirmPassword: form.confirmPassword }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to reset password");
        if (data.error?.includes("expired") || data.error?.includes("invalid")) {
          setTokenStatus("expired");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const passwordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const levels = [
      { label: "Very Weak", color: "var(--danger)" },
      { label: "Weak", color: "var(--danger)" },
      { label: "Fair", color: "var(--warning)" },
      { label: "Good", color: "var(--primary)" },
      { label: "Strong", color: "var(--success)" },
      { label: "Very Strong", color: "var(--success)" },
    ];
    return { score, ...levels[score] };
  };

  const strength = passwordStrength(form.password);

  // ─── Checking State ──────────────────────────────────────────
  if (tokenStatus === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center fade-in-up">
          <div className="inline-flex w-14 h-14 rounded-2xl grid place-items-center text-2xl mb-4 shadow-lg animate-pulse" style={{ background: "var(--primary-soft)" }}>
            🔍
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Verifying reset link…</p>
        </div>
      </div>
    );
  }

  // ─── Invalid / Expired Token State ──────────────────────────
  if (tokenStatus === "expired" || tokenStatus === "not_found" || tokenStatus === "invalid" || tokenStatus === "used") {
    const messages: Record<string, { icon: string; title: string; desc: string }> = {
      expired: { icon: "⏰", title: "Link Expired", desc: "This reset link has expired. Please request a new one." },
      not_found: { icon: "❌", title: "Invalid Link", desc: "This reset link doesn't exist or has already been used." },
      invalid: { icon: "⚠️", title: "Invalid Link", desc: "This reset link is not valid. Please request a new one." },
      used: { icon: "✅", title: "Already Used", desc: "This reset link has already been used. Please request a new one if needed." },
    };
    const msg = messages[tokenStatus] || messages.invalid;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md fade-in-up">
          <Card variant="glass" className="!p-6 sm:!p-8 text-center">
            <div className="inline-flex w-14 h-14 rounded-2xl grid place-items-center text-3xl mb-4 shadow-lg" style={{ background: "var(--danger-soft)" }}>
              {msg.icon}
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-heading)" }}>{msg.title}</h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{msg.desc}</p>
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--primary)" }}
            >
              ← Back to Sign In
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Success State ─────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md fade-in-up">
          <Card variant="glass" className="!p-6 sm:!p-8 text-center">
            <div className="inline-flex w-14 h-14 rounded-2xl grid place-items-center text-3xl mb-4 shadow-lg" style={{ background: "var(--success-soft)" }}>
              🎉
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-heading)" }}>Password Reset!</h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              Your password has been successfully changed. You can now sign in with your new password.
            </p>
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
            >
              Sign In →
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Reset Form ────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl grid place-items-center text-3xl mb-4 shadow-lg float-anim" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            🔐
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-heading)" }}>Set New Password</h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Enter your new password below</p>
        </div>

        <Card variant="glass" className="!p-6 sm:!p-8">
          {error && (
            <div className="mb-5 p-3 rounded-lg text-sm font-medium" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                  className="input pr-10"
                  placeholder="Min 8 characters"
                  style={{ minHeight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${(strength.score / 5) * 100}%`, background: strength.color }}
                      />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {form.password.length < 8 && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>8+ chars</span>}
                    {!/[A-Z]/.test(form.password) && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>Uppercase</span>}
                    {!/[0-9]/.test(form.password) && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>Number</span>}
                    {!/[^A-Za-z0-9]/.test(form.password) && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>Symbol</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                  className="input pr-10"
                  placeholder="Re-enter new password"
                  style={{ minHeight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showConfirm ? "🙈" : "👁️"}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--danger)" }}>Passwords don&apos;t match</p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 8 && (
                <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--success)" }}>✓ Passwords match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !form.password || !form.confirmPassword || form.password !== form.confirmPassword || form.password.length < 8}
              className="quick-add-btn w-full py-3.5 rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Remember your password?{" "}
            <Link href="/login" className="font-bold" style={{ color: "var(--primary)" }}>Sign in</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
