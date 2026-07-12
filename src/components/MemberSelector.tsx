"use client";

import { useState } from "react";
import { useMemberFilter } from "@/lib/filters";
import { IconFamily, IconUser, IconTarget, IconCheck, IconSparkles } from "@/components/ui/Icons";

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
  const [showCustomSelect, setShowCustomSelect] = useState(false);

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
    <div className="space-y-3 no-print select-none">
      {/* Quick Filter Buttons - Sovereign Executive Dock */}
      <div className="flex items-center flex-nowrap overflow-x-auto hide-scrollbar gap-2 p-1.5 rounded-2xl border bg-surface-2 shadow-sm w-fit" style={{ borderColor: "var(--border)" }}>
        <span className="text-[11px] font-extrabold uppercase tracking-wider pl-2 pr-1 shrink-0 flex items-center text-slate-400">
          Profile Scope:
        </span>
        
        <button
          onClick={() => handleQuickFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            quickFilter === "all" ? "shadow-md scale-[1.02]" : "hover:bg-white/[0.04] text-slate-400"
          }`}
          style={{
            background: quickFilter === "all" ? "var(--primary)" : "transparent",
            color: quickFilter === "all" ? "#fff" : "var(--text)",
          }}
        >
          <IconFamily size={14} className="shrink-0" />
          <span>Consolidated Household</span>
        </button>

        {self && (
          <button
            onClick={() => handleQuickFilter("self")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              quickFilter === "self" ? "shadow-md scale-[1.02]" : "hover:bg-white/[0.04] text-slate-400"
            }`}
            style={{
              background: quickFilter === "self" ? self.color : "transparent",
              color: quickFilter === "self" ? "#fff" : "var(--text)",
              border: quickFilter === "self" ? "none" : `1px solid ${self.color}40`,
            }}
          >
            <span className="w-2 h-2 rounded-full shadow-sm" style={{ background: quickFilter === "self" ? "#fff" : self.color }} />
            <span>{self.name.split(" ")[0]}</span>
          </button>
        )}

        {spouse && (
          <button
            onClick={() => handleQuickFilter("spouse")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              quickFilter === "spouse" ? "shadow-md scale-[1.02]" : "hover:bg-white/[0.04] text-slate-400"
            }`}
            style={{
              background: quickFilter === "spouse" ? spouse.color : "transparent",
              color: quickFilter === "spouse" ? "#fff" : "var(--text)",
              border: quickFilter === "spouse" ? "none" : `1px solid ${spouse.color}40`,
            }}
          >
            <span className="w-2 h-2 rounded-full shadow-sm" style={{ background: quickFilter === "spouse" ? "#fff" : spouse.color }} />
            <span>{spouse.name.split(" ")[0]}</span>
          </button>
        )}

        {children.length > 0 && (
          <button
            onClick={() => handleQuickFilter("children")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              quickFilter === "children" ? "shadow-md scale-[1.02]" : "hover:bg-white/[0.04] text-slate-400"
            }`}
            style={{
              background: quickFilter === "children" ? "var(--warning)" : "transparent",
              color: quickFilter === "children" ? "#fff" : "var(--text)",
              border: quickFilter === "children" ? "none" : "1px solid var(--warning)",
            }}
          >
            <IconUser size={14} className="shrink-0" />
            <span>Children</span>
          </button>
        )}

        <button
          onClick={() => setShowCustomSelect(!showCustomSelect)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
            showCustomSelect ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300" : "border-white/[0.06] hover:bg-white/[0.04] text-slate-400"
          }`}
        >
          <IconTarget size={14} className="shrink-0 text-indigo-400" />
          <span>Custom Filter</span>
        </button>
      </div>

      {/* Multi-Select Member Pills - Collapsible */}
      {showCustomSelect && (
        <div className="card p-4 border border-indigo-500/30 bg-surface-2 animate-scale-in">
          <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="min-w-0 flex items-center gap-2">
              <IconTarget size={16} className="text-indigo-400 shrink-0" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                Granular Household Profile Isolation
              </span>
              {hasSelection && (
                <span className="badge badge-primary text-[10px] font-mono">
                  {selectedIds.length} active scope
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {hasSelection && (
                <button
                  onClick={() => clear()}
                  className="btn btn-ghost text-xs px-2.5 py-1 font-bold text-red-400 hover:bg-red-500/10 rounded-lg"
                >
                  Clear Scope
                </button>
              )}
              <button
                onClick={() => setShowCustomSelect(false)}
                className="btn btn-ghost w-7 h-7 rounded-lg text-xs font-mono font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          <div className={`flex flex-wrap gap-2 ${showAll ? "" : "max-h-[80px] overflow-hidden"} lg:max-h-none`}>
            {members.map((m) => {
              const isActive = selectedIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleId(m.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive ? "shadow-md scale-[1.02]" : "border border-white/[0.06] hover:bg-white/[0.04] opacity-70"
                  }`}
                  style={{
                    background: isActive ? m.color : "var(--surface)",
                    color: isActive ? "#fff" : "var(--text)",
                  }}
                  title="Tap to include or isolate member scope"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{ background: isActive ? "#fff" : m.color }}
                  />
                  <span className="truncate">{m.name.split(" ")[0]}</span>
                  {isActive && <IconCheck size={13} className="shrink-0" />}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] mt-3 font-medium text-slate-400 flex items-center gap-1.5">
            <IconSparkles size={14} className="text-indigo-400 shrink-0" />
            <span>Select multiple profile pills above to compute combined household subsets or isolate individual earnings/expenses.</span>
          </p>
        </div>
      )}

      {/* Active Filter Indicator */}
      {hasSelection && (
        <div 
          className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 animate-fade-in"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 grid place-items-center shrink-0">
              <IconUser size={16} />
            </span>
            <p className="text-xs font-bold truncate text-white">
              Active Scope: <span className="font-mono text-indigo-300">{activeProfile || selectedIds.map(getMemberName).join(" + ")}</span>
            </p>
          </div>
          <button
            onClick={clear}
            className="btn btn-secondary px-3 py-1.5 text-xs font-bold rounded-xl shrink-0"
          >
            Reset to All Household
          </button>
        </div>
      )}
    </div>
  );
}
