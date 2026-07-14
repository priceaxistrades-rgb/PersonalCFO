/**
 * React error boundary for graceful recovery from client-rendering failures.
 * Database migrations are deployment operations and are never executed from
 * this browser-facing component.
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
};

function isSchemaError(err: Error): boolean {
  const msg = err.message?.toLowerCase() || "";
  return (
    msg.includes("does not exist") ||
    msg.includes("failed query") ||
    (msg.includes("column") && msg.includes("not found")) ||
    (msg.includes("relation") && msg.includes("does not exist")) ||
    (msg.includes("type") && msg.includes("does not exist")) ||
    msg.includes("invalid input value for enum") ||
    msg.includes("cannot cast type")
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.name || "unnamed"}]`, error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const schemaMismatch = this.state.error ? isSchemaError(this.state.error) : false;

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
        {schemaMismatch && (
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            This appears to be a database version mismatch. An administrator should run
            <code className="mx-1 rounded px-1.5 py-0.5" style={{ background: "var(--surface-3)" }}>
              npm run db:push
            </code>
            from the deployment environment.
          </p>
        )}
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          className="btn btn-secondary px-4 py-2 text-sm"
          aria-label="Try again"
        >
          Try Again
        </button>
      </div>
    );
  }
}
