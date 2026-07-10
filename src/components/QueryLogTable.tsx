import { useState } from "react";
import { QueryLog } from "../types";
import { MODEL_CONFIGS, DEPT_CONFIGS, formatUSD, formatInt } from "../utils/helpers";
import { Search, Info, Chrome, ShieldAlert, ArrowUpDown, ChevronDown, ChevronUp, Eye } from "lucide-react";

interface QueryLogTableProps {
  logs: QueryLog[];
}

export default function QueryLogTable({ logs }: QueryLogTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedModel, setSelectedModel] = useState("all");
  const [selectedSource, setSelectedSource] = useState<"all" | "corporate" | "extension">("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === "all" || log.department === selectedDept;
    const matchesModel = selectedModel === "all" || log.model === selectedModel;
    const matchesSource = selectedSource === "all" || log.source === selectedSource;

    return matchesSearch && matchesDept && matchesModel && matchesSource;
  });

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  // Extract unique departments and models for dropdowns
  const departments = Array.from(new Set(logs.map(l => l.department))).filter(Boolean);
  const models = Array.from(new Set(logs.map(l => l.model))).filter(Boolean);

  return (
    <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-5 shadow-lg" id="query-logs-section">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/60">
        <div>
          <h4 className="text-sm font-semibold text-white tracking-tight">Granular Query Audit Telemetry</h4>
          <p className="text-xs text-slate-400 mt-0.5">Real-time captured prompt payloads, tokens, and cost breakdown</p>
        </div>

        {/* Source selector filters */}
        <div className="flex gap-1.5 self-start">
          <button
            onClick={() => setSelectedSource("all")}
            className={`px-3 py-1 text-xs rounded-md font-medium border transition-all cursor-pointer ${
              selectedSource === "all"
                ? "bg-slate-800 border-slate-700 text-white"
                : "bg-slate-900/40 border-slate-800/50 text-slate-400 hover:text-slate-300"
            }`}
          >
            All Channels
          </button>
          <button
            onClick={() => setSelectedSource("corporate")}
            className={`px-3 py-1 text-xs rounded-md font-medium border transition-all cursor-pointer ${
              selectedSource === "corporate"
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                : "bg-slate-900/40 border-slate-800/50 text-slate-400 hover:text-slate-300"
            }`}
          >
            Corporate Apps
          </button>
          <button
            onClick={() => setSelectedSource("extension")}
            className={`px-3 py-1 text-xs rounded-md font-medium border transition-all cursor-pointer ${
              selectedSource === "extension"
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : "bg-slate-900/40 border-slate-800/50 text-slate-400 hover:text-slate-300"
            }`}
          >
            Chrome Extension
          </button>
        </div>
      </div>

      {/* Filter Inputs Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search prompt, response, or user email..."
            className="w-full bg-slate-950 border border-slate-800/80 rounded-lg text-xs pl-9 pr-4 py-2 text-white focus:outline-none focus:border-violet-500 placeholder-slate-600"
          />
        </div>

        {/* Dept filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-slate-950 border border-slate-800/80 rounded-lg text-xs px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500"
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        {/* Model filter */}
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-slate-950 border border-slate-800/80 rounded-lg text-xs px-3 py-2 text-slate-300 focus:outline-none focus:border-violet-500"
        >
          <option value="all">All Models</option>
          {models.map((model) => {
            const label = MODEL_CONFIGS[model]?.short || model;
            return <option key={model} value={model}>{label}</option>;
          })}
        </select>
      </div>

      {/* Query List / Table */}
      <div className="border border-slate-800/60 rounded-xl overflow-hidden bg-slate-950/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800/60 text-slate-400 font-semibold">
                <th className="p-3.5 pl-4">Timestamp / Cost Center</th>
                <th className="p-3.5">Prompt Overview</th>
                <th className="p-3.5">Model</th>
                <th className="p-3.5 text-right">Tokens</th>
                <th className="p-3.5 text-right pr-4">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 font-mono">
                    No matching API transactions recorded for current query parameters.
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 30).map((log) => {
                  const mConfig = MODEL_CONFIGS[log.model] || { short: log.model, color: "text-slate-400", bg: "bg-slate-800", border: "border-slate-700" };
                  const dConfig = DEPT_CONFIGS[log.department] || { color: "text-slate-400", bg: "bg-slate-800", border: "border-slate-700" };
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <tr 
                      key={log.id} 
                      id={`row-${log.id}`}
                      className={`hover:bg-slate-900/40 transition-colors cursor-pointer ${isExpanded ? "bg-slate-900/30" : ""}`}
                      onClick={() => toggleExpand(log.id)}
                    >
                      {/* Left: Time and Dept */}
                      <td className="p-3.5 pl-4">
                        <p className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: '2-digit' })}{" "}
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded shrink-0 border ${dConfig.bg} ${dConfig.color} ${dConfig.border}`}>
                            {log.department === "Personal (Chrome Extension)" ? "Extension" : log.department}
                          </span>
                          {log.source === 'extension' && <Chrome className="w-3 h-3 text-amber-400 shrink-0" />}
                        </div>
                      </td>

                      {/* Middle: Prompt text */}
                      <td className="p-3.5 font-medium max-w-[280px]">
                        <p className="text-slate-300 truncate font-sans">{log.prompt}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">{log.user}</p>
                      </td>

                      {/* Target Model badge */}
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${mConfig.bg} ${mConfig.color} ${mConfig.border}`}>
                          {mConfig.short}
                        </span>
                      </td>

                      {/* Tokens count */}
                      <td className="p-3.5 text-right font-mono text-slate-400">
                        <p className="font-semibold text-slate-300">{formatInt(log.promptTokens + log.responseTokens)}</p>
                        <p className="text-[9px] text-slate-500">In: {log.promptTokens}</p>
                      </td>

                      {/* Right: Calculated USD Cost */}
                      <td className="p-3.5 text-right pr-4 font-mono font-bold">
                        <span className={`${log.cost > 0.01 ? "text-amber-400" : "text-emerald-400"}`}>
                          {formatUSD(log.cost)}
                        </span>
                        
                        {/* Nested detail expander button */}
                        <div className="inline-flex ml-2.5 text-slate-500 hover:text-slate-300 transition-all">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>

                        {/* Expandable prompt-response detail tray */}
                        {isExpanded && (
                          <div 
                            className="text-left bg-slate-950 border border-slate-800 p-4 rounded-lg mt-3 shadow-2xl col-span-5 w-full block absolute left-0 right-0 z-10"
                            onClick={(e) => e.stopPropagation()} // Prevent double trigger
                          >
                            <div className="flex justify-between items-center pb-2 mb-3 border-b border-slate-800">
                              <span className="font-bold text-white text-xs">Request Telemetry Details</span>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {log.id}</span>
                            </div>

                            <div className="space-y-3.5">
                              <div>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Prompt:</span>
                                <div className="mt-1 bg-slate-900/60 p-3 rounded border border-slate-800 font-mono text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                                  {log.prompt}
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">AI Response:</span>
                                <div className="mt-1 bg-slate-900/60 p-3 rounded border border-slate-800 font-mono text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                                  {log.response}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-1">
                                <div>
                                  <span className="text-[10px] text-slate-500">USER TARGET</span>
                                  <p className="text-white font-semibold mt-0.5 truncate">{log.user}</p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500">COST CENTER</span>
                                  <p className="text-white font-semibold mt-0.5">{log.department}</p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500">TOKEN COST BASIS</span>
                                  <p className="text-white mt-0.5">
                                    {log.promptTokens} input / {log.responseTokens} output
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500">EXACT CHARGE</span>
                                  <p className="text-emerald-400 font-bold mt-0.5 font-mono">{formatUSD(log.cost)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
