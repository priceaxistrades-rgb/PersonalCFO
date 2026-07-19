"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function FileUploader({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ message: string; inserted: Record<string, number> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bankStatementMode, setBankStatementMode] = useState(true);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFiles = useCallback(async (files: File[]) => {
    setUploading(true);
    setError(null);
    setResult(null);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "auto");
      formData.append("source", bankStatementMode ? "bank_statement" : "general_import");

      try {
        const res = await fetch("/api/upload/excel", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          const detail = Array.isArray(data.details) && data.details.length > 0
            ? ` ${data.details.slice(0, 3).join("; ")}`
            : "";
          setError(`${data.error || "Upload failed"}${detail}`);
        } else {
          setResult(data);
          onSuccess?.();
          router.refresh();
        }
      } catch (e) {
        setError("Network error. Please try again.");
      }
    }

    setUploading(false);
  }, [bankStatementMode, onSuccess, router]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  }, [uploadFiles]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Clear the input so selecting the same file again still emits change.
    e.target.value = "";
    await uploadFiles(files);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={bankStatementMode} onChange={(event) => setBankStatementMode(event.target.checked)} className="mt-1" />
          <span>
            <strong style={{ color: "var(--text)" }}>Safe bank statement import</strong>
            <span className="block mt-1" style={{ color: "var(--text-muted)" }}>
              Transaction IDs, UTRs, RRN, cheque numbers and bank references are ignored and never saved. The original file is parsed in memory, not retained, and no AI, bank, analytics, or third-party financial service receives it. Saved transactions go only to your PersonalCFO account database.
            </span>
          </span>
        </label>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Choose a spreadsheet to import"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            document.getElementById("file-input")?.click();
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
          isDragging ? "border-primary bg-primary-soft scale-[1.02]" : "border-gray-300 hover:border-gray-400"
        }`}
        style={{
          borderColor: isDragging ? "var(--primary)" : "var(--border)",
          background: isDragging ? "var(--primary-soft)" : "var(--surface-2)",
        }}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.csv"
          multiple
          className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={handleFileSelect}
        />
        
        <div className="text-4xl mb-3">📁</div>
        <p className="font-medium mb-1" style={{ color: "var(--text)" }}>
          {uploading ? "Importing securely..." : bankStatementMode ? "Drop bank statement exports here" : "Drop Excel files here"}
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          or click to browse (.xlsx, .csv)
        </p>
        <div className="mt-4">
            <a
            href="/api/upload/template"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="text-xs font-medium underline hover:text-primary transition-colors"
            style={{ color: "var(--primary)" }}
          >
            📥 Download Import Template
          </a>
        </div>
        
        {uploading && (
          <div className="mt-4 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Success Result */}
      {result && (
        <div 
          className="rounded-xl p-4 border"
          style={{ background: "var(--success-soft)", borderColor: "var(--success)" }}
        >
          <p className="font-medium mb-2" style={{ color: "var(--success)" }}>
            ✅ {result.message}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {Object.entries(result.inserted).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2">
                <span style={{ color: "var(--text-muted)" }}>{type}:</span>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div 
          className="rounded-xl p-4 border"
          style={{ background: "var(--danger-soft)", borderColor: "var(--danger)" }}
        >
          <p style={{ color: "var(--danger)" }}>❌ {error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="card p-4 text-sm" style={{ color: "var(--text-muted)" }}>
        <p className="font-medium mb-2" style={{ color: "var(--text)" }}>
          📋 Supported Formats
        </p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Excel workbooks (.xlsx) or CSV files with rows for Transactions, Accounts, Investments, etc.</li>
          <li>CSV files with headers like: Date, Amount, Category, Description</li>
          <li>Bank statement exports: detects Debit/Credit, Withdrawal/Deposit, Narration and Particulars columns.</li>
          <li>Safe mode excludes transaction IDs, UTRs, RRN, cheque numbers and bank references before data is saved.</li>
        </ul>
        <p className="mt-3 text-xs">
          💡 Tip: Download our template from the Settings page for the correct format.
        </p>
      </div>
    </div>
  );
}
