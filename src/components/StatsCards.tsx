import { DashboardStats } from "../types";
import { formatUSD, formatInt } from "../utils/helpers";
import { TrendingUp, Cpu, Hash, Sparkles } from "lucide-react";

interface StatsCardsProps {
  stats: DashboardStats;
  budgetCap: number;
}

export default function StatsCards({ stats, budgetCap }: StatsCardsProps) {
  const percentOfBudget = budgetCap > 0 ? (stats.totalSpend / budgetCap) * 100 : 0;

  const cardItems = [
    {
      id: "stat-spend",
      title: "Total AI Spending",
      value: formatUSD(stats.totalSpend),
      subtext: `${percentOfBudget.toFixed(1)}% of cumulative budget`,
      icon: TrendingUp,
      color: "text-emerald-400",
      accent: "bg-emerald-500/5",
      border: "border-emerald-500/10",
      extra: (
        <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${percentOfBudget > 90 ? 'bg-rose-500' : percentOfBudget > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(percentOfBudget, 100)}%` }}
          />
        </div>
      )
    },
    {
      id: "stat-queries",
      title: "Total API Requests",
      value: formatInt(stats.totalQueries),
      subtext: "Enterprise + Extension",
      icon: Hash,
      color: "text-blue-400",
      accent: "bg-blue-500/5",
      border: "border-blue-500/10",
      extra: (
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Corporate: {formatInt(stats.totalQueries - Math.round(stats.totalQueries * 0.25))}</span>
          <span>Extension: {formatInt(Math.round(stats.totalQueries * 0.25))}</span>
        </div>
      )
    },
    {
      id: "stat-avg",
      title: "Avg Cost / Request",
      value: formatUSD(stats.avgCostPerQuery),
      subtext: "Across all active models",
      icon: Sparkles,
      color: "text-violet-400",
      accent: "bg-violet-500/5",
      border: "border-violet-500/10",
      extra: (
        <div className="mt-2 text-[11px] text-slate-400 leading-tight">
          Gemini Flash stays ultra-low at <span className="text-violet-400 font-mono font-bold">$0.0003</span> average
        </div>
      )
    },
    {
      id: "stat-tokens",
      title: "Tokens Processed",
      value: `${(stats.totalTokens / 1000000).toFixed(2)}M`,
      subtext: `${formatInt(stats.totalTokens)} total raw tokens`,
      icon: Cpu,
      color: "text-cyan-400",
      accent: "bg-cyan-500/5",
      border: "border-cyan-500/10",
      extra: (
        <div className="mt-2 text-[11px] text-slate-400 leading-tight flex justify-between">
          <span>1M Gemini Flash: $0.35</span>
          <span>1M GPT-4o: $20.00</span>
        </div>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
      {cardItems.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            id={card.id}
            className={`bg-[#0f172a] border ${card.border} rounded-xl p-5 hover:border-slate-700 transition-all duration-300 shadow-lg flex flex-col justify-between`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-2xl font-bold text-white mt-1 tracking-tight font-sans">{card.value}</h3>
              </div>
              <div className={`p-2 rounded-lg ${card.accent} ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60">
              <span className="text-xs text-slate-400">{card.subtext}</span>
              {card.extra}
            </div>
          </div>
        );
      })}
    </div>
  );
}
