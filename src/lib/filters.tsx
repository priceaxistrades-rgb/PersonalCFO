"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type QuickFilter = "all" | "self" | "spouse" | "children" | "parents" | "custom";

export type MemberFilterContextType = {
  selectedIds: number[];
  toggleId: (id: number) => void;
  selectIds: (ids: number[]) => void;
  selectOnly: (id: number) => void;
  clear: () => void;
  isSelected: (id: number) => boolean;
  hasSelection: boolean;
  quickFilter: QuickFilter;
  setQuickFilter: (filter: QuickFilter) => void;
  activeProfile: string | null;
  setActiveProfile: (name: string | null) => void;
};

const MemberFilterContext = createContext<MemberFilterContextType>({
  selectedIds: [],
  toggleId: () => {},
  selectIds: () => {},
  selectOnly: () => {},
  clear: () => {},
  isSelected: () => true,
  hasSelection: false,
  quickFilter: "all",
  setQuickFilter: () => {},
  activeProfile: null,
  setActiveProfile: () => {},
});

export function MemberFilterProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [quickFilter, setQuickFilterState] = useState<QuickFilter>("all");
  const [activeProfile, setActiveProfile] = useState<string | null>(null);

  const toggleId = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      return next;
    });
    setQuickFilterState("custom");
  }, []);

  const selectIds = useCallback((ids: number[]) => {
    setSelectedIds(ids);
    setQuickFilterState(ids.length === 0 ? "all" : "custom");
  }, []);

  const selectOnly = useCallback((id: number) => {
    setSelectedIds([id]);
    setQuickFilterState("custom");
  }, []);

  const clear = useCallback(() => {
    setSelectedIds([]);
    setQuickFilterState("all");
    setActiveProfile(null);
  }, []);

  const setQuickFilter = useCallback((filter: QuickFilter) => {
    setQuickFilterState(filter);
    // Reset selection when switching to "all"
    if (filter === "all") {
      setSelectedIds([]);
    }
  }, []);

  const isSelected = useCallback(
    (id: number) => selectedIds.length === 0 || selectedIds.includes(id),
    [selectedIds]
  );

  const hasSelection = selectedIds.length > 0;

  return (
    <MemberFilterContext.Provider
      value={{
        selectedIds,
        toggleId,
        selectIds,
        selectOnly,
        clear,
        isSelected,
        hasSelection,
        quickFilter,
        setQuickFilter,
        activeProfile,
        setActiveProfile,
      }}
    >
      {children}
    </MemberFilterContext.Provider>
  );
}

export const useMemberFilter = () => useContext(MemberFilterContext);
