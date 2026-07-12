"use client";

import { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import { IconUser } from "@/components/ui/Icons";

export function ProfileManager() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.profileImage) {
          setImage(data.user.profileImage);
        }
      });
  }, []);

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
        setImage(data.path);
        router.refresh();
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
    <Card title="User Identity Profile" subtitle="Update your profile avatar and credential preferences">
      <div className="flex flex-col sm:flex-row items-center gap-6 p-4">
        <div className="relative group">
          <div 
            className="w-24 h-24 rounded-full border-2 border-indigo-500/40 shadow-xl overflow-hidden flex items-center justify-center"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            {image ? (
              <img src={image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <IconUser size={36} />
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full border border-white/20 shadow-md cursor-pointer flex items-center justify-center transition-transform hover:scale-110" style={{ background: "var(--surface-3)", color: "var(--text-heading)" }}>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs font-medium text-slate-300">
            Click the indicator button on your avatar to upload a new profile image (PNG, JPG, WebP).
          </p>
          {uploading && <p className="text-xs font-bold font-mono mt-2 animate-pulse text-indigo-400">Uploading new avatar...</p>}
        </div>
      </div>
    </Card>
  );
}
