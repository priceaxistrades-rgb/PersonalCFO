"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function FileUploader({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ message: string; inserted: Record<string, number> } | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      try {
        const res = await fetch("/api/upload/excel", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Upload failed");
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
  }, [onSuccess, router]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  }, [uploadFiles]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await uploadFiles(files);
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
          accept=".xlsx,.xls,.csv"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <div className="text-4xl mb-3">📁</div>
        <p className="font-medium mb-1" style={{ color: "var(--text)" }}>
          {uploading ? "Uploading..." : "Drop Excel files here"}
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          or click to browse (.xlsx, .xls, .csv)
        </p>
        
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
          <li>Excel files (.xlsx, .xls) with sheets for Transactions, Accounts, Investments, etc.</li>
          <li>CSV files with headers like: Date, Amount, Category, Description</li>
          <li>Bank statement exports (automatically detected)</li>
        </ul>
        <p className="mt-3 text-xs">
          💡 Tip: Download our template from the Settings page for the correct format.
        </p>
      </div>
    </div>
  );
}
