"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Kpi";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num } from "@/lib/format";

const CATEGORIES = ["Financial", "Savings", "Investment", "Tax", "Purchase", "Health", "Education", "Travel"];
const STATUSES = ["Planned", "InProgress", "Done"];

const CAT_TONE: Record<string, "primary" | "success" | "warning" | "danger" | "neutral"> = {
  Financial: "primary",
  Savings: "success",
  Investment: "primary",
  Tax: "warning",
  Purchase: "danger",
  Health: "success",
  Education: "primary",
  Travel: "primary",
};

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

export function AnnualManager({ 
  initialPlans, 
  years 
}: { 
  initialPlans: any[]; 
  years: number[];
}) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    title: "",
    category: "Financial",
    targetAmount: 0,
    progress: 0,
    status: "Planned",
  });

  const save = async () => {
    if (!form.title) return;
    
    const url = editing ? "/api/manage/annual" : "/api/manage/annual";
    const method = editing ? "PATCH" : "POST";
    const body = editing ? { id: editing, ...form } : form;
    
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    setEditing(null);
    setShowAdd(false);
    setForm({ year: new Date().getFullYear(), title: "", category: "Financial", targetAmount: 0, progress: 0, status: "Planned" });
    router.refresh();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this goal?")) return;
    await fetch("/api/manage/annual", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  };

  const resetAll = async () => {
    if (!confirm("Reset all annual plans? This will delete all goals.")) return;
    for (const plan of plans) {
      await fetch("/api/manage/annual", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: plan.id }),
      });
    }
    router.refresh();
  };

  const startEdit = (plan: any) => {
    setEditing(plan.id);
    setForm({
      year: plan.year,
      title: plan.title,
      category: plan.category,
      targetAmount: Number(plan.targetAmount),
      progress: plan.progress,
      status: plan.status,
    });
    setShowAdd(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setShowAdd(false);
    setForm({ year: new Date().getFullYear(), title: "", category: "Financial", targetAmount: 0, progress: 0, status: "Planned" });
  };

  // Group by year
  const yearsList = [...new Set(plans.map((p) => p.year))].sort();

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--primary)" }}
        >
          {showAdd ? "Cancel" : "+ Add Goal"}
        </button>
        {plans.length > 0 && (
          <button
            onClick={resetAll}
            className="px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors hover:bg-red-500/20"
            style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
          >
            Reset All Milestones
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <Card title={editing ? "Edit Goal" : "Add New Goal"} className="!p-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Year
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm border mt-1"
                style={inputStyle}
              />
            </label>
            <label className="text-xs font-medium sm:col-span-2" style={{ color: "var(--text-muted)" }}>
              Goal Title
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Save for Europe Trip"
                className="w-full px-3 py-2 rounded-lg text-sm border mt-1"
                style={inputStyle}
              />
            </label>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border mt-1"
                style={inputStyle}
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Target Amount (₹)
              <input
                type="number"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm border mt-1"
                style={inputStyle}
              />
            </label>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Progress (%)
              <input
                type="range"
                min="0"
                max="100"
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                className="w-full mt-2"
              />
              <div className="text-center text-xs mt-1">{form.progress}%</div>
            </label>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border mt-1"
                style={inputStyle}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s === "InProgress" ? "In Progress" : s}</option>)}
              </select>
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={save}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "var(--success)" }}
            >
              {editing ? "Update" : "Save"}
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: "var(--surface-3)", color: "var(--text)" }}
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* Goals by Year */}
      {yearsList.length === 0 ? (
        <Card className="!p-12 text-center border-dashed border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 grid place-items-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
          </div>
          <h3 className="text-base font-extrabold mb-1" style={{ color: "var(--text-heading)" }}>No Goals Configured</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Start planning your financial year by adding goals
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--primary)" }}
          >
            + Add First Goal
          </button>
        </Card>
      ) : (
        yearsList.map((year) => {
          const yearPlans = plans.filter((p) => p.year === year);
          return (
            <Card key={year} title={`${year} Goals`} subtitle={`${yearPlans.length} goals`}>
              <Table headers={["Goal", "Category", "Target", "Progress", "Status", "Actions"]} right={[2, 3, 5]}>
                {yearPlans.map((p) => (
                  <Tr key={p.id}>
                    <Td strong>{p.title}</Td>
                    <Td>
                      <Badge tone={CAT_TONE[p.category] || "neutral"}>{p.category}</Badge>
                    </Td>
                    <Td right>{inr(Number(p.targetAmount), { compact: true })}</Td>
                    <Td>
                      <div className="w-24">
                        <Progress 
                          value={p.progress} 
                          tone={p.progress >= 100 ? "success" : p.progress >= 50 ? "primary" : "warning"} 
                          height={6} 
                        />
                        <span className="text-xs" style={{ color: "var(--text-faint)" }}>{p.progress}%</span>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={p.status === "Done" ? "success" : p.status === "InProgress" ? "primary" : "neutral"}>
                        {p.status === "InProgress" ? "In Progress" : p.status}
                      </Badge>
                    </Td>
                    <Td right>
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => startEdit(p)}
                          className="px-2 py-1 rounded text-xs"
                          style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => del(p.id)}
                          className="px-2 py-1 rounded text-xs text-white"
                          style={{ background: "var(--danger)" }}
                        >
                          Del
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Table>
            </Card>
          );
        })
      )}
    </div>
  );
}
