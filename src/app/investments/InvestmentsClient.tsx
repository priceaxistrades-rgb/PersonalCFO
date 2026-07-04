"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SectionTitle } from "@/components/ui/Card";
import { 
  useLiveInvestments, 
  InvestmentKpis, 
  InvestmentHoldings, 
  InvestmentAllocation, 
  InvestmentFooter, 
  type Investment, 
  type LiveInvestment 
} from "./LiveInvestmentsDashboard";
import { 
  InvestmentForm, 
  InvestmentManagementTable, 
  type InvestmentRow 
} from "../settings/InvestmentsManager";

export function InvestmentsPageClient({ 
  initialInvestments 
}: { 
  initialInvestments: Investment[] 
}) {
  const router = useRouter();
  const { liveInvestments, loading, updatedAt, error, loadQuotes } = useLiveInvestments(initialInvestments);
  
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentRow | null>(null);

  const handleSave = async (form: any) => {
    const payload = { 
      ...form, 
      symbol: form.symbol || null, 
      schemeCode: form.schemeCode || null, 
      units: form.units || null, 
      startDate: form.startDate || null 
    };
    
    await fetch("/api/manage/investments", {
      method: editingInvestment ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingInvestment ? { id: editingInvestment.id, ...payload } : payload),
    });
    
    setShowForm(false);
    setEditingInvestment(null);
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this investment?")) return;
    await fetch("/api/manage/investments", { 
      method: "DELETE", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ id }) 
    });
    router.refresh();
  };

  const startEdit = (i: InvestmentRow) => {
    setEditingInvestment(i);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Investment Dashboard"
        subtitle="Live portfolio value synced from stock prices and mutual fund NAVs"
      />

      {/* 1. KPIs */}
      <InvestmentKpis 
        liveInvestments={liveInvestments} 
        loading={loading} 
        updatedAt={updatedAt} 
        error={error} 
        loadQuotes={loadQuotes} 
      />

      {/* 2. Add/Edit Investment Form */}
      <div className="flex justify-end mb-2 no-print">
        <button 
          onClick={() => { 
            setShowForm(!showForm); 
            setEditingInvestment(null); 
          }} 
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" 
          style={{ background: "var(--primary)" }}
        >
          {showForm ? "Cancel" : "+ Add Investment"}
        </button>
      </div>
      
      {showForm && (
        <InvestmentForm 
          editingInvestment={editingInvestment} 
          onSave={handleSave} 
          onCancel={() => {
            setShowForm(false);
            setEditingInvestment(null);
          }} 
        />
      )}

      {/* 3. Live Holdings Table */}
      <InvestmentHoldings liveInvestments={liveInvestments} />

      {/* 4. Asset Allocation Chart */}
      <InvestmentAllocation liveInvestments={liveInvestments} />

      <InvestmentFooter />

      {/* 5. Management Table (Edit/Delete) */}
      <InvestmentManagementTable 
        investments={initialInvestments as unknown as InvestmentRow[]} 
        onEdit={startEdit} 
        onDelete={handleDelete} 
      />
    </div>
  );
}
