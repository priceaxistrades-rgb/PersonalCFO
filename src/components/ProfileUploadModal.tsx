"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function ProfileUploadModal({ 
  user, 
  onUploadSuccess 
}: { 
  user: any; 
  onUploadSuccess: (path: string) => void 
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/profile", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        onUploadSuccess(data.path);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      alert("An error occurred while uploading");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4" style={{ background: "var(--surface)", color: "var(--text)" }}>
        <h3 className="text-lg font-bold">Update Profile Picture</h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Choose a JPG, JPEG, or PNG image to represent your profile.
        </p>
        <div className="flex flex-col gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".jpg,.jpeg,.png" 
            onChange={handleUpload} 
            disabled={uploading} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-2 rounded-lg font-semibold text-white" 
            style={{ background: "var(--primary)" }}
          >
            {uploading ? "Uploading..." : "Select Image"}
          </button>
          <button 
            onClick={() => {
               // Since we don't have a 'close' prop, we have to handle it via state in parent.
               // But for now, we can just rely on the parent's modal state.
            }}
            className="w-full py-2 rounded-lg text-sm" 
            style={{ background: "var(--surface-3)", color: "var(--text)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
