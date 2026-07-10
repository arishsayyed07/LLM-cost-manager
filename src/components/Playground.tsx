import { useState, FormEvent } from "react";
import { Sparkles, Send, HelpCircle, AlertCircle, CheckCircle2, Search, Check, ChevronDown } from "lucide-react";
import { QueryLog } from "../types";
import { formatUSD, MODEL_CONFIGS } from "../utils/helpers";

interface PlaygroundProps {
  onNewLogAdded: () => void;
}

const PR_RATES: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.005, output: 0.015 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  "claude-3-5-sonnet": { input: 0.003, output: 0.015 },
  "claude-3-5-haiku": { input: 0.0008, output: 0.004 },
  "gemini-3.1-pro-preview": { input: 0.00125, output: 0.00375 },
  "gemini-3.5-flash": { input: 0.000075, output: 0.0003 },
  "gemini-2.5-flash": { input: 0.000075, output: 0.0003 },
  "gemini-2.5-pro": { input: 0.00125, output: 0.00375 },
  "deepseek-v3": { input: 0.00014, output: 0.00028 },
  "deepseek-r1": { input: 0.00055, output: 0.00219 },
};

export default function Playground({ onNewLogAdded }: PlaygroundProps) {
  const [prompt, setPrompt] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [userEmail, setUserEmail] = useState("dev.lead@enterprise.com");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Search inputs
  const [presetSearch, setPresetSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [comparisonSearch, setComparisonSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const samplePrompts = [
    {
      title: "Query Optimizer",
      text: "Explain the performance trade-offs of using B-Tree index vs Hash index in PostgreSQL.",
      dept: "Engineering"
    },
    {
      title: "Product Outline",
      text: "Draft a 4-bullet functional specification outline for a real-time multiplayer cursor drawing board.",
      dept: "Product"
    },
    {
      title: "Marketing Taglines",
      text: "Generate 3 high-impact promotional copy slogans for a SaaS billing optimization platform.",
      dept: "Marketing"
    },
    {
      title: "Support Auto-Reply",
      text: "Compose a polite, empathetic support agent response explaining a 2-hour maintenance window for critical security patching.",
      dept: "Customer Support"
    }
  ];

  const handleQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/playground", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          department,
          user: userEmail,
          model: selectedModel,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to execute playground query.");
      }

      setResult(data.log);
      onNewLogAdded(); // Refresh parent stats & logs
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Compare model costs for this specific query size
  const getComparison = () => {
    const pTokens = Math.max(10, Math.round((prompt || "Sample prompt placeholder").length / 3.8));
    const rTokens = result ? result.responseTokens : Math.round(pTokens * 1.5);

    const models = Object.entries(MODEL_CONFIGS).map(([key, cfg]) => {
      const r = PR_RATES[key] || { input: 0.001, output: 0.003 };
      const cost = (pTokens / 1000) * r.input + (rTokens / 1000) * r.output;
      return {
        key,
        name: cfg.name,
        short: cfg.short,
        provider: cfg.provider,
        cost,
        active: key === selectedModel,
        color: cfg.color,
        bg: cfg.bg,
        border: cfg.border
      };
    });

    // Filter based on comparison search
    const filtered = models.filter(m => 
      m.name.toLowerCase().includes(comparisonSearch.toLowerCase()) ||
      m.provider.toLowerCase().includes(comparisonSearch.toLowerCase())
    );

    // Sort by cost ASC
    return filtered.sort((a, b) => a.cost - b.cost);
  };

  const comparison = getComparison();

  // Filter presets
  const filteredPresets = samplePrompts.filter(preset =>
    preset.title.toLowerCase().includes(presetSearch.toLowerCase()) ||
    preset.text.toLowerCase().includes(presetSearch.toLowerCase()) ||
    preset.dept.toLowerCase().includes(presetSearch.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="playground-container">
      {/* Playground input form */}
      <div className="lg:col-span-3 bg-[#0f172a] border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between" id="playground-input-panel">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-violet-500/10 text-violet-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-white tracking-tight">Enterprise Query Playground</h4>
            </div>
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono px-2 py-0.5 rounded font-bold uppercase">
              Real-Time execution
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Test prompts on real or simulated AI models. Real-time cost, token count, and telemetry are logged dynamically to your cost database.
          </p>

          {/* Quick presets with search option */}
          <div className="mb-5 bg-slate-950/40 border border-slate-800/60 rounded-lg p-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Quick Presets</span>
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter presets..."
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[11px] pl-7 text-slate-300 focus:outline-none focus:border-violet-500 placeholder-slate-600 font-sans"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {filteredPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(preset.text);
                    setDepartment(preset.dept);
                  }}
                  className="text-xs bg-slate-900 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-800/80 text-slate-300 px-2.5 py-1.5 rounded transition-all cursor-pointer text-left font-medium flex items-center gap-1.5"
                >
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                    {preset.dept}
                  </span>
                  <span>{preset.title}</span>
                </button>
              ))}
              {filteredPresets.length === 0 && (
                <span className="text-[11px] text-slate-500 italic">No presets match your filter criteria.</span>
              )}
            </div>
          </div>

          <form onSubmit={handleQuery} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">User Identifier</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs p-2.5 text-white focus:outline-none focus:border-violet-500 font-mono"
                  placeholder="dev.sarah@enterprise.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Cost Center Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs p-2.5 text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Product">Product</option>
                </select>
              </div>
            </div>

            {/* Model Target - Searchable Dropdown */}
            <div className="relative">
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Model Target (Searchable)</label>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-xs p-2.5 text-left text-slate-200 font-mono font-medium flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className={MODEL_CONFIGS[selectedModel]?.color || "text-indigo-400"}>
                    {MODEL_CONFIGS[selectedModel]?.name || selectedModel}
                  </span>
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border ${MODEL_CONFIGS[selectedModel]?.bg} ${MODEL_CONFIGS[selectedModel]?.color} ${MODEL_CONFIGS[selectedModel]?.border}`}>
                    {MODEL_CONFIGS[selectedModel]?.provider}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 right-0 mt-1.5 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-slate-800 bg-slate-950 flex items-center gap-2">
                    <Search className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
                    <input
                      type="text"
                      placeholder="Search 11+ models by provider or name..."
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      className="w-full bg-transparent border-0 text-xs text-white focus:ring-0 focus:outline-none placeholder-slate-600 font-sans"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-900">
                    {Object.entries(MODEL_CONFIGS)
                      .filter(([key, cfg]) => {
                        const s = modelSearch.toLowerCase();
                        return (
                          cfg.name.toLowerCase().includes(s) ||
                          cfg.short.toLowerCase().includes(s) ||
                          cfg.provider.toLowerCase().includes(s) ||
                          key.toLowerCase().includes(s)
                        );
                      })
                      .map(([key, cfg]) => {
                        const isSelected = key === selectedModel;
                        const rate = PR_RATES[key] || { input: 0.001, output: 0.003 };
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setSelectedModel(key);
                              setDropdownOpen(false);
                              setModelSearch("");
                            }}
                            className={`w-full text-left p-2.5 text-xs flex items-center justify-between transition-colors hover:bg-slate-900/40 ${
                              isSelected ? 'bg-violet-600/10 text-violet-400 font-semibold' : 'text-slate-300'
                            }`}
                          >
                            <div className="min-w-0 pr-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={isSelected ? 'text-violet-400' : 'text-slate-200'}>
                                  {cfg.name}
                                </span>
                                <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                  {cfg.provider}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                                Input: ${(rate.input * 1000).toFixed(4)}/1k | Output: ${(rate.output * 1000).toFixed(4)}/1k tokens
                              </span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-violet-400 shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Prompt Input</label>
              <textarea
                required
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs p-3 text-white focus:outline-none focus:border-violet-500 placeholder-slate-600 leading-relaxed font-sans"
                placeholder="Enter standard or complex system tasks..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-violet-900/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Invoking {MODEL_CONFIGS[selectedModel]?.short || "AI"} Model...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Request & Log Expense</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Real-time details / Output metrics */}
      <div className="lg:col-span-2 flex flex-col gap-4" id="playground-output-panel">
        {/* Cost comparison calculator */}
        <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col max-h-[350px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Multi-Model Cost Estimation</h4>
            
            {/* Search comparison list */}
            <div className="relative">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter comparison..."
                value={comparisonSearch}
                onChange={(e) => setComparisonSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[9px] pl-5 text-slate-300 focus:outline-none focus:border-violet-500 placeholder-slate-600"
              />
            </div>
          </div>
          
          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {comparison?.map((m) => {
              const baselineKey = "gpt-4o";
              const baselineCost = comparison.find(c => c.key === baselineKey)?.cost || 0.01;
              const multiplier = m.cost > 0 ? (baselineCost / m.cost) : 1;
              const isBest = m.active;

              return (
                <div 
                  key={m.key} 
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                    isBest 
                      ? 'bg-violet-600/10 border-violet-500/40 shadow-sm' 
                      : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`font-semibold leading-tight ${isBest ? 'text-violet-400' : 'text-slate-200'}`}>
                        {m.short}
                      </p>
                      <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded border ${m.bg} ${m.color} ${m.border}`}>
                        {m.provider}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 leading-tight">
                      {m.key === baselineKey 
                        ? 'Base Comparison Standard' 
                        : multiplier >= 1 
                          ? `⚡ ${(multiplier).toFixed(1)}x cheaper than GPT-4o` 
                          : `⚠️ ${(1 / multiplier).toFixed(1)}x costlier than GPT-4o`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-mono font-bold ${isBest ? 'text-violet-300' : 'text-white'}`}>
                      {formatUSD(m.cost)}
                    </p>
                    <p className="text-[9px] text-slate-600 font-mono">Estimated</p>
                  </div>
                </div>
              );
            })}
            {comparison.length === 0 && (
              <p className="text-xs text-slate-500 text-center italic py-4">No model comparison matched "{comparisonSearch}"</p>
            )}
          </div>
        </div>

        {/* Live response block */}
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between min-h-[250px]">
          <div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800/60">
              <span className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Real-time Telemetry</span>
              {result && (
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-bold font-mono uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> success
                </span>
              )}
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Query Failed</p>
                  <p className="mt-1 opacity-90">{error}</p>
                </div>
              </div>
            )}

            {!result && !error && !loading && (
              <div className="flex flex-col items-center justify-center text-center py-12 text-slate-600">
                <HelpCircle className="w-8 h-8 opacity-60 mb-2 animate-pulse" />
                <p className="text-xs font-semibold">Waiting for query...</p>
                <p className="text-[11px] mt-0.5">Select your model, enter a prompt, and submit to see live cost and output.</p>
              </div>
            )}

            {loading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-slate-900 rounded w-1/3" />
                <div className="h-2 bg-slate-900 rounded w-full" />
                <div className="h-2 bg-slate-900 rounded w-5/6" />
                <div className="h-2 bg-slate-900 rounded w-4/5" />
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Response:</span>
                  <div className="mt-1 text-xs text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800/60 font-mono max-h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                    {result.response}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                  <div className="bg-slate-900/40 p-2 rounded border border-slate-800/60">
                    <p className="text-slate-500 text-[9px] uppercase">Input Tokens</p>
                    <p className="text-slate-300 font-semibold mt-0.5">{result.promptTokens}</p>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded border border-slate-800/60">
                    <p className="text-slate-500 text-[9px] uppercase">Output Tokens</p>
                    <p className="text-slate-300 font-semibold mt-0.5">{result.responseTokens}</p>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded border border-slate-800/60">
                    <p className="text-slate-500 text-[9px] uppercase">Actual Cost</p>
                    <p className="text-emerald-400 font-bold mt-0.5">{formatUSD(result.cost)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
