"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, fmtDate } from "@/lib/format";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

const PREDEFINED_CATEGORIES = [
  { label: "Emergency", icon: "🛟", desc: "6+ months of expenses" },
  { label: "Vacation", icon: "🏖️", desc: "Travel & leisure fund" },
  { label: "House", icon: "🏡", desc: "Down payment or renovation" },
  { label: "Car", icon: "🚗", desc: "Vehicle purchase" },
  { label: "Education", icon: "🎓", desc: "Tuition & learning" },
  { label: "Wedding", icon: "💍", desc: "Marriage expenses" },
  { label: "Retirement", icon: "🌅", desc: "Long-term retirement fund" },
  { label: "Medical", icon: "🏥", desc: "Health & medical fund" },
  { label: "Business", icon: "💼", desc: "Start or grow a business" },
  { label: "Gadget", icon: "📱", desc: "Tech & electronics" },
  { label: "Home Appliance", icon: "🔌", desc: "Furniture & appliances" },
  { label: "Charity", icon: "❤️", desc: "Giving & donations" },
] as const;

const ICONS = ["🎯", "🐖", "🏡", "🚗", "🎓", "💍", "🌅", "🛟", "🏖️", "🏥", "💼", "📱", "🔌", "❤️", "⭐", "💎"];

export function GoalsManager({ goals }: { goals: { id: number; name: string; category: string; target: string; saved: string; deadline: string | null; icon: string }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [form, setForm] = useState({ name: "", category: "Emergency", target: 0, saved: 0, deadline: "", icon: "🎯" });

  const handleCategorySelect = (cat: string, icon: string) => {
    if (cat === "Custom") {
      setIsCustomCategory(true);
      setForm({ ...form, category: "", icon: "⭐" });
    } else {
      setIsCustomCategory(false);
      setForm({ ...form, category: cat, icon });
    }
  };

  const save = async () => {
    if (!form.name) return;
    const finalCategory = isCustomCategory ? customCategory : form.category;
    if (!finalCategory) return;
    const payload = { ...form, category: finalCategory, deadline: form.deadline || null };
    await fetch("/api/manage/goals", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing, ...payload } : payload),
    });
    setEditing(null);
    setShowAdd(false);
    setIsCustomCategory(false);
    setCustomCategory("");
    setForm({ name: "", category: "Emergency", target: 0, saved: 0, deadline: "", icon: "🎯" });
    router.refresh();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this goal?")) return;
    await fetch("/api/manage/goals", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  const pct = (saved: number, target: number) => target > 0 ? Math.round((saved / target) * 100) : 0;

  return (
    <Card title="🎯 Savings Goals" subtitle={`${goals.length} goals`}>
      <div className="flex justify-end mb-3 no-print">
        <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary text-sm">
          {showAdd ? "Cancel" : "+ Add Goal"}
        </button>
      </div>

      {(showAdd || editing) && (
        <div className="space-y-4 mb-4 p-4 rounded-xl fade-in-up" style={{ background: "var(--surface-2)" }}>
          {/* Category Selection Grid */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>Choose Category</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {PREDEFINED_CATEGORIES.map((cat) => {
                const selected = !isCustomCategory && form.category === cat.label;
                return (
                  <button
                    key={cat.label}
                    onClick={() => handleCategorySelect(cat.label, cat.icon)}
                    className="p-2.5 rounded-lg text-center transition-all duration-150 active:scale-95"
                    style={{
                      background: selected ? "var(--primary-soft)" : "var(--surface-3)",
                      border: selected ? "2px solid var(--primary)" : "2px solid transparent",
                    }}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: selected ? "var(--primary)" : "var(--text-muted)" }}>{cat.label}</p>
                  </button>
                );
              })}
              <button
                onClick={() => handleCategorySelect("Custom", "⭐")}
                className="p-2.5 rounded-lg text-center transition-all duration-150 active:scale-95"
                style={{
                  background: isCustomCategory ? "var(--primary-soft)" : "var(--surface-3)",
                  border: isCustomCategory ? "2px solid var(--primary)" : "2px dashed var(--border)",
                }}
              >
                <span className="text-lg">✏️</span>
                <p className="text-[10px] font-bold mt-0.5" style={{ color: isCustomCategory ? "var(--primary)" : "var(--text-muted)" }}>Custom</p>
              </button>
            </div>
          </div>

          {isCustomCategory && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Custom Category Name</label>
              <input
                placeholder="e.g. Dream Project"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="input"
              />
            </div>
          )}

          <div className="grid sm:grid-cols-4 gap-3">
            <input placeholder="Goal Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            <input type="number" placeholder="Target Amount" value={form.target || ""} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} className="input" />
            <input type="number" placeholder="Saved So Far" value={form.saved || ""} onChange={(e) => setForm({ ...form, saved: Number(e.target.value) })} className="input" />
            <input type="date" placeholder="Deadline" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Icon</label>
              <div className="flex gap-1.5 flex-wrap">
                {ICONS.map((i) => (
                  <button
                    key={i}
                    onClick={() => setForm({ ...form, icon: i })}
                    className="w-8 h-8 rounded-lg grid place-items-center text-sm transition-all"
                    style={{
                      background: form.icon === i ? "var(--primary-soft)" : "var(--surface-3)",
                      border: form.icon === i ? "2px solid var(--primary)" : "2px solid transparent",
                    }}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="btn btn-success px-5 py-2.5">Save Goal</button>
            <button onClick={() => { setEditing(null); setShowAdd(false); setIsCustomCategory(false); }} className="btn btn-secondary px-5 py-2.5">Cancel</button>
          </div>
        </div>
      )}

      <Table headers={["Icon", "Name", "Category", "Target", "Saved", "Progress", "Deadline", "Actions"]} right={[3, 4, 5, 7]}>
        {goals.map((g) => (
          <Tr key={g.id}>
            <Td>{g.icon}</Td>
            <Td strong>{g.name}</Td>
            <Td><Badge>{g.category}</Badge></Td>
            <Td right>{inr(Number(g.target))}</Td>
            <Td right>{inr(Number(g.saved))}</Td>
            <Td right>{pct(Number(g.saved), Number(g.target))}%</Td>
            <Td muted>{g.deadline ? fmtDate(g.deadline) : "—"}</Td>
            <Td right>
              <div className="flex gap-2 justify-end no-print">
                <button onClick={() => { setEditing(g.id); setIsCustomCategory(!PREDEFINED_CATEGORIES.some(c => c.label === g.category)); setCustomCategory(!PREDEFINED_CATEGORIES.some(c => c.label === g.category) ? g.category : ""); setForm({ name: g.name, category: g.category, target: Number(g.target), saved: Number(g.saved), deadline: g.deadline || "", icon: g.icon }); }} className="btn btn-ghost text-[11px] px-2 py-1">Edit</button>
                <button onClick={() => del(g.id)} className="btn btn-danger text-[11px] px-2 py-1">Delete</button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}
