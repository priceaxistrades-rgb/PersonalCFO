"use client";

import { useState } from "react";
import { useMemberFilter } from "@/lib/filters";

export function MemberSelector({ 
  members 
}: { 
  members: { id: number; name: string; color: string; role: string }[] 
}) {
  const { 
    selectedIds, 
    toggleId, 
    selectOnly, 
    clear, 
    hasSelection,
    quickFilter,
    setQuickFilter,
    activeProfile,
    setActiveProfile
  } = useMemberFilter();
  
  const [showAll, setShowAll] = useState(false);
  const [showCustomSelect, setShowCustomSelect] = useState(true);

  const self = members.find((m) => m.role === "Self");
  const spouse = members.find((m) => m.role === "Spouse");
  const children = members.filter((m) => m.role === "Child");

  const getMemberName = (id: number) => members.find((m) => m.id === id)?.name?.split(" ")[0] ?? "";

  const handleQuickFilter = (type: "all" | "self" | "spouse" | "children") => {
    setQuickFilter(type);
    switch (type) {
      case "all":
        clear();
        setActiveProfile(null);
        break;
      case "self":
        if (self) {
          selectOnly(self.id);
          setActiveProfile(self.name);
        }
        break;
      case "spouse":
        if (spouse) {
          selectOnly(spouse.id);
          setActiveProfile(spouse.name);
        }
        break;
      case "children":
        if (children.length) {
          selectOnly(children[0]?.id);
          setActiveProfile("Children");
        }
        break;
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick Filter Buttons - Mobile Optimized */}
      <div className="flex flex-nowrap overflow-x-auto hide-scrollbar gap-2 pb-1">
        <span className="text-xs font-semibold uppercase tracking-wide mr-1 shrink-0 flex items-center" style={{ color: "var(--text-muted)" }}>
          View:
        </span>
        
        <button
          onClick={() => handleQuickFilter("all")}
          className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
            quickFilter === "all" ? "ring-2" : ""
          }`}
          style={{
            background: quickFilter === "all" ? "var(--primary)" : "var(--surface-2)",
            color: quickFilter === "all" ? "#fff" : "var(--text)",
          }}
        >
          👨‍👩‍👧‍👦 All
        </button>

        {self && (
          <button
            onClick={() => handleQuickFilter("self")}
            className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              quickFilter === "self" ? "ring-2" : ""
            }`}
            style={{
              background: quickFilter === "self" ? self.color : "var(--surface-2)",
              color: quickFilter === "self" ? "#fff" : "var(--text)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
            Me
          </button>
        )}

        {spouse && (
          <button
            onClick={() => handleQuickFilter("spouse")}
            className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              quickFilter === "spouse" ? "ring-2" : ""
            }`}
            style={{
              background: quickFilter === "spouse" ? spouse.color : "var(--surface-2)",
              color: quickFilter === "spouse" ? "#fff" : "var(--text)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
            {spouse.name.split(" ")[0]}
          </button>
        )}

        {children.length > 0 && (
          <button
            onClick={() => handleQuickFilter("children")}
            className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              quickFilter === "children" ? "ring-2" : ""
            }`}
            style={{
              background: quickFilter === "children" ? "var(--warning)" : "var(--surface-2)",
              color: quickFilter === "children" ? "#fff" : "var(--text)",
            }}
          >
            👶 Kids
          </button>
        )}
      </div>

      {/* Multi-Select Member Pills - Collapsible */}
      <div className="card p-3 sm:p-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowCustomSelect((value) => !value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setShowCustomSelect((value) => !value);
            }
          }}
          className="flex items-center justify-between gap-2 mb-2 cursor-pointer select-none rounded-xl"
          title={showCustomSelect ? "Click to hide custom member selection" : "Click to view custom member selection"}
        >
          <div className="min-w-0">
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              🎯 Custom Select
            </span>
            {hasSelection && (
              <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                {selectedIds.length} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasSelection && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clear();
                }}
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
              >
                Clear
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCustomSelect(!showCustomSelect);
              }}
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{ background: "var(--surface-3)", color: "var(--text)" }}
            >
              {showCustomSelect ? "Hide" : "View"}
            </button>
            {showCustomSelect && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAll(!showAll);
                }}
                className="text-xs px-2 py-1 rounded-full lg:hidden"
                style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
              >
                {showAll ? "Less" : "More"}
              </button>
            )}
          </div>
        </div>

        <div
          className="overflow-hidden"
          style={{
            maxHeight: showCustomSelect ? 180 : 0,
            opacity: showCustomSelect ? 1 : 0,
            transition: "max-height 180ms ease, opacity 140ms ease",
          }}
        >
          <div className={`flex flex-wrap gap-2 ${showAll ? "" : "max-h-[72px] overflow-hidden"} lg:max-h-none`}>
            {members.map((m) => {
              const isActive = selectedIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleId(m.id)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isActive ? "ring-2" : ""
                  }`}
                  style={{
                    background: isActive ? m.color : "var(--surface-3)",
                    color: isActive ? "#fff" : "var(--text)",
                    opacity: hasSelection && !isActive ? 0.5 : 1,
                  }}
                  title="Tap to toggle"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: isActive ? "#fff" : m.color }}
                  />
                  <span className="truncate max-w-[80px]">{m.name.split(" ")[0]}</span>
                  {isActive && <span className="text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>

          <p className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>
            💡 Tap to select multiple members
          </p>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {hasSelection && (
        <div 
          className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl"
          style={{ background: "var(--primary-soft)" }}
        >
          <span className="text-xl sm:text-2xl">👤</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--primary)" }}>
              Viewing: {activeProfile || selectedIds.map(getMemberName).join(" + ")}
            </p>
          </div>
          <button
            onClick={clear}
            className="text-xs px-2 py-1 rounded-full shrink-0"
            style={{ background: "var(--surface)", color: "var(--text-muted)" }}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
