import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata = {
  title: "Reset Password — PersonalCFO",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center fade-in-up">
          <div className="inline-flex w-14 h-14 rounded-2xl grid place-items-center text-2xl mb-4 shadow-lg animate-pulse" style={{ background: "var(--primary-soft)" }}>
            🔍
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
        </div>
      </div>
    }>
      <ResetPasswordClient />
    </Suspense>
  );
}
