"use client";

import { usePrivacy } from "@/lib/privacy";

export function PrivacyToggle() {
  const { globalHidden, toggle } = usePrivacy();

  return (
    <button
      onClick={() => toggle("global", "global")}
      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-lg"
      title={globalHidden ? "Show Values" : "Hide Values"}
    >
      {globalHidden ? "👁️" : "🙈"}
    </button>
  );
}
