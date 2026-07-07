/**
 * ═══════════════════════════════════════════════════════════════
 * REACT ERROR BOUNDARIES — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Catches runtime errors in component subtrees and displays
 * a graceful fallback instead of a blank white screen.
 *
 * Detects schema migration issues and offers a "Fix Database"
 * button that calls /api/migrate.
 * ═══════════════════════════════════════════════════════════════
 */

"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  name?: string;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  migrating: boolean;
  migrationResult: string | null;
};

/** Heuristic: detect database schema mismatch errors */
function isSchemaError(err: Error): boolean {
  const msg = err.message?.toLowerCase() || "";
  return (
    msg.includes("does not exist") ||
    msg.includes("failed query") ||
    msg.includes("column") && msg.includes("not found") ||
    msg.includes("relation") && msg.includes("does not exist") ||
    msg.includes("type") && msg.includes("does not exist") ||
    msg.includes("invalid input value for enum") ||
    msg.includes("cannot cast type")
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, migrating: false, migrationResult: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.name || "unnamed"}]`, error, info.componentStack);
  }

  handleMigrate = async () => {
    this.setState({ migrating: true, migrationResult: null });
    try {
      const res = await fetch("/api/migrate");
      const data = await res.json();
      if (data.success) {
        this.setState({
          migrating: false,
          migrationResult: `✅ ${data.message}`,
        });
        // Auto-reload after 2 seconds to apply changes
        setTimeout(() => window.location.reload(), 2000);
      } else {
        this.setState({
          migrating: false,
          migrationResult: `❌ ${data.message}`,
        });
      }
    } catch (e: any) {
      this.setState({
        migrating: false,
        migrationResult: `❌ Network error: ${e.message}`,
      });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const showMigrate = this.state.error ? isSchemaError(this.state.error) : false;

      return (
        <div
          role="alert"
          className="p-6 rounded-xl fade-in"
          style={{
            background: "var(--danger-soft, rgba(239,68,68,0.08))",
            border: "1px solid var(--danger, #ef4444)",
            color: "var(--text)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl" aria-hidden="true">⚠️</span>
            <h3 className="text-lg font-bold" style={{ color: "var(--danger, #ef4444)" }}>
              Something went wrong
            </h3>
          </div>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            {this.props.name
              ? `The "${this.props.name}" section encountered an error.`
              : "An unexpected error occurred."}
          </p>
          <p className="text-xs mb-4 font-mono break-all" style={{ color: "var(--text-faint)" }}>
            {this.state.error?.message || "Unknown error"}
          </p>

          {showMigrate && (
            <div className="mb-4 p-3 rounded-lg" style={{ background: "var(--surface-3, rgba(255,255,255,0.05))" }}>
              <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
                🔧 This looks like a database schema mismatch. Click below to auto-migrate your database.
              </p>
              <button
                onClick={this.handleMigrate}
                disabled={this.state.migrating}
                className="px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: this.state.migrating ? "var(--surface-3)" : "var(--primary, #6366f1)",
                  color: "#fff",
                  opacity: this.state.migrating ? 0.6 : 1,
                  cursor: this.state.migrating ? "not-allowed" : "pointer",
                }}
                aria-label="Run database migration"
              >
                {this.state.migrating ? "⏳ Migrating..." : "🔧 Fix Database Schema"}
              </button>
              {this.state.migrationResult && (
                <p className="text-xs mt-2 font-mono" style={{ color: "var(--text-muted)" }}>
                  {this.state.migrationResult}
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, migrationResult: null });
            }}
            className="btn btn-secondary px-4 py-2 text-sm"
            aria-label="Try again"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
