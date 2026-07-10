import { useMemo } from "react";
import { QueryLog } from "../types";
import { MODEL_CONFIGS, DEPT_CONFIGS, formatUSD } from "../utils/helpers";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

interface AnalyticsChartsProps {
  logs: QueryLog[];
}

export default function AnalyticsCharts({ logs }: AnalyticsChartsProps) {
  // 1. Spend Over Time (Last 15 days)
  const spendOverTimeData = useMemo(() => {
    const dailyMap: Record<string, { date: string; corporate: number; personal: number; total: number }> = {};
    
    // Sort logs oldest to newest for chronological flow in chart
    const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    sortedLogs.forEach(log => {
      const dateStr = new Date(log.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { date: dateStr, corporate: 0, personal: 0, total: 0 };
      }
      
      const cost = log.cost || 0;
      if (log.source === "extension") {
        dailyMap[dateStr].personal += cost;
      } else {
        dailyMap[dateStr].corporate += cost;
      }
      dailyMap[dateStr].total += cost;
    });

    return Object.values(dailyMap).slice(-10); // Take last 10 days of activity for visual balance
  }, [logs]);

  // 2. Spend by Department
  const spendByDeptData = useMemo(() => {
    const deptMap: Record<string, number> = {};
    logs.forEach(log => {
      const dept = log.department || "Other";
      deptMap[dept] = (deptMap[dept] || 0) + (log.cost || 0);
    });

    return Object.entries(deptMap).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(4)),
      color: DEPT_CONFIGS[name]?.color ? `var(--color-${DEPT_CONFIGS[name].color.replace('text-', '')})` : '#a78bfa'
    })).sort((a, b) => b.value - a.value);
  }, [logs]);

  // 3. Spend by Model
  const spendByModelData = useMemo(() => {
    const modelMap: Record<string, number> = {};
    logs.forEach(log => {
      const model = log.model || "unknown";
      modelMap[model] = (modelMap[model] || 0) + (log.cost || 0);
    });

    return Object.entries(modelMap).map(([name, value]) => ({
      name: MODEL_CONFIGS[name]?.short || name,
      value: Number(value.toFixed(4)),
      color: MODEL_CONFIGS[name]?.color ? `var(--color-${MODEL_CONFIGS[name].color.replace('text-', '')})` : '#a78bfa'
    })).sort((a, b) => b.value - a.value);
  }, [logs]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a]/95 border border-slate-800 rounded-lg p-3 shadow-xl backdrop-blur-sm">
          <p className="text-xs font-semibold text-slate-400 font-mono mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs font-medium">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-slate-300 capitalize">{entry.name}:</span>
              <span className="text-white font-mono font-semibold">{formatUSD(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-[#0f172a]/95 border border-slate-800 rounded-lg p-3 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color || data.color }} />
            <span>{data.name}</span>
          </div>
          <p className="text-xs font-bold text-violet-400 font-mono mt-1">
            Cost: {formatUSD(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="analytics-section">
      {/* Spend Over Time (Area Chart) */}
      <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between" id="chart-spend-over-time">
        <div>
          <h4 className="text-sm font-semibold text-white tracking-tight">API Cost Trendline</h4>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">Historical daily cost distribution across channels</p>
        </div>
        <div className="h-64 w-full">
          {spendOverTimeData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">No telemetry data recorded yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendOverTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCorporate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPersonal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 10 }} />
                <Area type="monotone" dataKey="corporate" name="Corporate Stack" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCorporate)" />
                <Area type="monotone" dataKey="personal" name="Chrome Extension" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPersonal)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Spend by Model (Pie Chart) */}
      <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between" id="chart-spend-by-model">
        <div>
          <h4 className="text-sm font-semibold text-white tracking-tight">Spend by LLM Model</h4>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">Cost share across foundational providers</p>
        </div>
        <div className="h-64 w-full flex flex-col items-center justify-center">
          {spendByModelData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">No models queried yet</div>
          ) : (
            <>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendByModelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {spendByModelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full mt-3 text-[11px]">
                {spendByModelData.slice(0, 4).map((m, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                    <span className="text-slate-400 truncate">{m.name}:</span>
                    <span className="text-white font-mono font-medium shrink-0 ml-auto">{formatUSD(m.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Spend by Department (Bar Chart) */}
      <div className="lg:col-span-3 bg-[#0f172a] border border-slate-800/80 rounded-xl p-5 shadow-lg" id="chart-spend-by-dept">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-white tracking-tight">Departmental Budget Allocation</h4>
          <p className="text-xs text-slate-400 mt-0.5">Real-time spend comparison against core business teams</p>
        </div>
        <div className="h-52 w-full">
          {spendByDeptData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">No logs recorded</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendByDeptData} layout="vertical" margin={{ top: 5, right: 10, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Department Spend" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {spendByDeptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
