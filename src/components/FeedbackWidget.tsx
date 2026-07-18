"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";

type FeedbackCategory = "bug" | "idea" | "usability" | "performance" | "other";

const CATEGORIES: Array<{ value: FeedbackCategory; label: string }> = [
  { value: "bug", label: "Bug" },
  { value: "idea", label: "Idea" },
  { value: "usability", label: "Usability" },
  { value: "performance", label: "Performance" },
  { value: "other", label: "Other" },
];

export function FeedbackWidget() {
  const { session, loading: sessionLoading } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => messageRef.current?.focus(), 120);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && status !== "sending") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, status]);

  if (sessionLoading || !session) return null;

  const close = () => {
    if (status === "sending") return;
    setOpen(false);
    if (status === "success") {
      setRating(0);
      setCategory("bug");
      setMessage("");
      setStatus("idle");
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!rating) {
      setError("Please select a rating.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Please write at least 10 characters.");
      return;
    }

    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          category,
          message: message.trim(),
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not send feedback");
      setStatus("success");
    } catch (submissionError) {
      setStatus("error");
      setError(submissionError instanceof Error ? submissionError.message : "Could not send feedback");
    }
  };

  return (
    <>
      <button
        type="button"
        className="feedback-launcher"
        onClick={() => { setOpen(true); setStatus("idle"); setError(""); }}
        aria-label="Send feedback"
        title="Send feedback"
      >
        <span aria-hidden="true">✦</span>
        <strong>Feedback</strong>
      </button>

      {open && (
        <div className="feedback-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <section className="feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
            <header className="feedback-header">
              <div>
                <p>Tester channel</p>
                <h2 id="feedback-title">Help improve PersonalCFO</h2>
                <span>Your page and device details are attached automatically.</span>
              </div>
              <button type="button" onClick={close} aria-label="Close feedback form">✕</button>
            </header>

            {status === "success" ? (
              <div className="feedback-success" role="status">
                <span aria-hidden="true">✓</span>
                <h3>Feedback sent</h3>
                <p>Thank you. Your report has been delivered directly to the PersonalCFO team.</p>
                <button type="button" className="btn btn-primary" onClick={close}>Done</button>
              </div>
            ) : (
              <form onSubmit={submit} className="feedback-form">
                <fieldset>
                  <legend>How was this experience?</legend>
                  <div className="feedback-rating">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        aria-label={`${value} out of 5 stars`}
                        aria-pressed={rating === value}
                        className={value <= rating ? "feedback-star-active" : ""}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label>
                  <span>Feedback type</span>
                  <select className="input" value={category} onChange={(event) => setCategory(event.target.value as FeedbackCategory)}>
                    {CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>

                <label>
                  <span>What should we know?</span>
                  <textarea
                    ref={messageRef}
                    className="input"
                    rows={5}
                    maxLength={2000}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Tell us what happened, what you expected, or what would make this easier…"
                    required
                  />
                  <small>{message.length}/2000 · Current page: {pathname}</small>
                </label>

                {error && <p className="feedback-error" role="alert">{error}</p>}

                <button type="submit" className="btn btn-primary feedback-submit" disabled={status === "sending"}>
                  {status === "sending" ? "Sending…" : "Send feedback →"}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
