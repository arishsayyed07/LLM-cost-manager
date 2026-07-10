import { useState, useEffect } from "react";
import { OptimizationSuggestion } from "../types";
import { formatUSD } from "../utils/helpers";
import { Sparkles, ArrowRight, Zap, RefreshCw, AlertCircle, TrendingDown } from "lucide-react";

export default function OptimizationEngine() {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/optimize");
      const data = await res.json();
      
      if (data.success) {
        setSuggestions(data.suggestions);
      } else {
        // Fallback or static suggestions are still populated by backend
        setSuggestions(data.suggestions || []);
        setError(data.message || "Failed to trigger real-time LLM suggestions. Displaying robust default suggestions.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to reach server optimizer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const totalEstimatedSavings = suggestions.reduce((sum, s) => sum + s.estimatedSavings, 0);

  return (
    <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-5 shadow-lg" id="optimization-engine">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white tracking-tight">AI Cost Reduction Engine</h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Gemini analyzes your live telemetry data to suggest model pruning, migrations, or caching options</p>
        </div>

        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs px-3 py-1.5 rounded-lg text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          <span>{loading ? "Analyzing..." : "Refresh Insights"}</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[11px] text-indigo-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary dashboard for optimizations */}
      {!loading && suggestions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/60 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Estimated Monthly Savings</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">{formatUSD(totalEstimatedSavings)}/mo</p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/60 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Optimization Actions</p>
              <p className="text-lg font-bold text-white mt-0.5">{suggestions.length} suggestions</p>
            </div>
          </div>
        </div>
      )}

      {/* Suggestion list */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 space-y-2">
              <div className="h-4 bg-slate-900 rounded w-1/4" />
              <div className="h-2 bg-slate-900 rounded w-full" />
              <div className="h-2 bg-slate-900 rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500">
          <Sparkles className="w-8 h-8 opacity-40 mx-auto mb-2 animate-bounce" />
          <p className="text-xs font-semibold">Ready for insights</p>
          <p className="text-[11px] mt-0.5">Click refresh above to run a telemetry analysis scan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((s) => (
            <div
              key={s.id}
              id={s.id}
              className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/10">
                    {s.category}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">Complexity:</span>
                    <span className={`text-[10px] font-bold ${
                      s.complexity === 'Low' ? 'text-emerald-400' : s.complexity === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {s.complexity}
                    </span>
                  </div>
                </div>

                <h5 className="text-xs font-semibold text-white leading-snug">{s.title}</h5>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{s.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Estimated Savings</p>
                  <p className="font-bold text-emerald-400 mt-0.5">{formatUSD(s.estimatedSavings)}/mo</p>
                </div>

                <button className="text-[10px] font-semibold text-indigo-400 hover:text-white hover:bg-indigo-600/20 px-2.5 py-1 rounded border border-indigo-500/10 transition-all cursor-pointer flex items-center gap-1">
                  <span>Implement</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
