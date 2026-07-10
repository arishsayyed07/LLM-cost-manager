import { useState } from "react";
import { BudgetConfig } from "../types";
import { formatUSD } from "../utils/helpers";
import { ShieldCheck, Settings, Save } from "lucide-react";

interface BudgetSettingsProps {
  budgets: BudgetConfig[];
  onUpdateBudget: (department: string, limit: number) => Promise<void>;
}

export default function BudgetSettings({ budgets, onUpdateBudget }: BudgetSettingsProps) {
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const startEdit = (dept: string, limit: number) => {
    setEditingDept(dept);
    setNewLimit(limit.toString());
  };

  const handleSave = async (dept: string) => {
    const parsed = parseFloat(newLimit);
    if (isNaN(parsed) || parsed < 0) return;
    
    setLoading(true);
    await onUpdateBudget(dept, parsed);
    setEditingDept(null);
    setLoading(false);
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-5 shadow-lg" id="budget-settings">
      <div className="flex items-center gap-2 mb-1">
        <Settings className="w-4 h-4 text-slate-400" />
        <h4 className="text-sm font-semibold text-white tracking-tight">Enterprise Quotas & Thresholds</h4>
      </div>
      <p className="text-xs text-slate-400 mb-4">Set strict spending upper-bounds for departments</p>

      <div className="space-y-4">
        {budgets.map((b) => {
          const isEditing = editingDept === b.department;
          const percentage = Math.min((b.currentSpend / b.monthlyLimit) * 100, 100);
          const isNearCap = percentage >= 80;

          return (
            <div key={b.department} className="p-3 bg-slate-900/60 border border-slate-800/60 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300">{b.department}</span>
                
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      value={newLimit}
                      onChange={(e) => setNewLimit(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded text-xs px-2 py-0.5 w-20 text-white focus:outline-none focus:border-violet-500 font-mono"
                    />
                    <button
                      disabled={loading}
                      onClick={() => handleSave(b.department)}
                      className="p-1 rounded bg-violet-600 hover:bg-violet-500 text-white transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      {formatUSD(b.currentSpend)} / <span className="text-white">{formatUSD(b.monthlyLimit)}</span>
                    </span>
                    <button
                      onClick={() => startEdit(b.department, b.monthlyLimit)}
                      className="text-[10px] text-violet-400 hover:text-white hover:bg-violet-600/20 px-1.5 py-0.5 rounded border border-violet-500/20 transition-all cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isNearCap ? 'bg-rose-500' : 'bg-violet-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-slate-500 font-mono">Usage Rate</span>
                <span className={`text-[10px] font-bold font-mono ${isNearCap ? 'text-rose-400' : 'text-slate-400'}`}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
