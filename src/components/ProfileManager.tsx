"use client";

import { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { useRouter } from "next/navigation";

export function ProfileManager() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Fetch current profile image
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
    <Card title="👤 User Profile" subtitle="Update your identity and profile picture">
      <div className="flex flex-col sm:flex-row items-center gap-6 p-4">
        <div className="relative group">
          <div 
            className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center text-3xl font-bold"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            {image ? (
              <img src={image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              "👤"
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border shadow-sm cursor-pointer flex items-center justify-center hover:bg-gray-50 transition-colors">
            <span className="text-xs">📷</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Click the camera icon to change your profile picture.
          </p>
          {uploading && <p className="text-xs mt-2 animate-pulse" style={{ color: "var(--primary)" }}>Uploading image...</p>}
        </div>
      </div>
    </Card>
  );
}
