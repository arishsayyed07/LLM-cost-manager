import { useEffect, useState } from "react";
import { QueryLog, BudgetConfig, Alert, DashboardStats } from "./types";
import StatsCards from "./components/StatsCards";
import AnalyticsCharts from "./components/AnalyticsCharts";
import AlertsPanel from "./components/AlertsPanel";
import BudgetSettings from "./components/BudgetSettings";
import Playground from "./components/Playground";
import ChromeExtensionSimulator from "./components/ChromeExtensionSimulator";
import OptimizationEngine from "./components/OptimizationEngine";
import QueryLogTable from "./components/QueryLogTable";
import { Cpu, RefreshCw, BarChart2, ShieldAlert, Zap, Compass, Sparkles, BookOpen, Trash2 } from "lucide-react";

export default function App() {
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [budgets, setBudgets] = useState<BudgetConfig[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "optimizer" | "playground" | "extension" | "audit">("dashboard");

  // Fetch unified dashboard telemetry
  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/dashboard");
      const data = await response.json();
      setLogs(data.logs);
      setBudgets(data.budgets);
      setStats(data.stats);
      setAlerts(data.alerts);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateBudget = async (department: string, limit: number) => {
    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department, monthlyLimit: limit }),
      });
      if (response.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to update budget:", err);
    }
  };

  const handleResolveAlert = (id: string) => {
    // Client-side acknowledge/filter out
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleResetDataset = async () => {
    if (!window.confirm("Are you sure you want to restore the pre-seeded telemetry data?")) return;
    setLoading(true);
    try {
      const response = await fetch("/api/reset", { method: "POST" });
      if (response.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to reset dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  const cumulativeBudgetCap = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0f19] text-slate-400">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <Cpu className="w-5 h-5 text-violet-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="mt-4 font-mono text-xs font-semibold uppercase tracking-widest text-slate-400">Loading Cost Telemetry...</p>
        <p className="text-[11px] text-slate-600 mt-1">Establishing secure WebSocket database tunnel</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-violet-600/30 selection:text-white">
      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-[#0f172a]/60 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-violet-900/30">
              <Cpu className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight leading-none">LLM Cost Sentinel</h1>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold font-mono px-1.5 py-0.2 rounded-full uppercase">
                  Live Telemetry
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Multi-model token analytics, budget guardrails & extension captures</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
            {/* Database seed reset */}
            <button
              onClick={handleResetDataset}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 border border-slate-800 hover:border-rose-500/10 text-xs transition-all flex items-center gap-1.5 cursor-pointer font-medium"
              title="Reset dataset to healthy sample distribution"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset telemetry database</span>
            </button>

            {/* Live refresh */}
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-violet-400" : ""}`} />
              <span>{refreshing ? "Refreshing..." : "Sync"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-800/60 pb-1 flex flex-wrap gap-1.5" id="nav-tabs">
          {[
            { id: "dashboard", label: "Operations Center", icon: BarChart2 },
            { id: "optimizer", label: "AI Optimization", icon: Zap },
            { id: "playground", label: "Query Playground", icon: Sparkles },
            { id: "extension", label: "Extension Simulator", icon: Compass },
            { id: "audit", label: "Granular Audit Trail", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#0f172a] border-slate-700/80 text-violet-400 font-bold shadow-md"
                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-violet-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        {activeTab === "dashboard" && stats && (
          <div className="space-y-6">
            {/* Summary Statistics Cards */}
            <StatsCards stats={stats} budgetCap={cumulativeBudgetCap} />

            {/* Visual Charts Section */}
            <AnalyticsCharts logs={logs} />

            {/* Alerts & Budget Limit Control Center */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <BudgetSettings budgets={budgets} onUpdateBudget={handleUpdateBudget} />
              </div>
              <div className="lg:col-span-2">
                <AlertsPanel alerts={alerts} onResolve={handleResolveAlert} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "optimizer" && (
          <OptimizationEngine />
        )}

        {activeTab === "playground" && (
          <Playground onNewLogAdded={fetchDashboardData} />
        )}

        {activeTab === "extension" && (
          <ChromeExtensionSimulator onNewLogAdded={fetchDashboardData} />
        )}

        {activeTab === "audit" && (
          <QueryLogTable logs={logs} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 bg-[#070b13]/80">
        <p>© 2026 LLM Cost Sentinel Dashboard. All rights reserved.</p>
        <p className="mt-1 font-mono text-[10px] text-slate-600">Enterprise deployment status: 200 OK | Port: 3000 | Engine: Node ESM + D3 Recharts</p>
      </footer>
    </div>
  );
}
