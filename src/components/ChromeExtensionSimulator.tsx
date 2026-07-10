import { useState } from "react";
import { Chrome, Shield, ArrowRight, Save, Info, AlertCircle } from "lucide-react";
import { formatUSD } from "../utils/helpers";

interface ChromeExtensionSimulatorProps {
  onNewLogAdded: () => void;
}

export default function ChromeExtensionSimulator({ onNewLogAdded }: ChromeExtensionSimulatorProps) {
  const [selectedWeb, setSelectedWeb] = useState<"chatgpt" | "claude" | "gemini">("chatgpt");
  const [prompt, setPrompt] = useState("Explain memoization in Javascript with a simple example");
  const [response, setResponse] = useState("Memoization is an optimization technique used to speed up computer programs by storing the results of expensive function calls and returning the cached result when the same inputs occur again.");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const webOptions = {
    chatgpt: {
      name: "ChatGPT (openai.com)",
      defaultModel: "gpt-4o",
      color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      badge: "GPT-4o"
    },
    claude: {
      name: "Claude AI (claude.ai)",
      defaultModel: "claude-3-5-sonnet",
      color: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      badge: "Claude 3.5"
    },
    gemini: {
      name: "Gemini App (gemini.google.com)",
      defaultModel: "gemini-3.5-flash",
      color: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      badge: "Gemini Flash"
    }
  };

  const handleIntercept = async () => {
    if (!prompt.trim() || !response.trim()) return;

    setLoading(true);
    setSuccessMsg("");

    const activeConfig = webOptions[selectedWeb];

    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          response,
          model: activeConfig.defaultModel,
          department: "Personal (Chrome Extension)",
          user: "personal.user@chrome-ext.com",
          source: "extension",
          // Calculate simulated tokens
          promptTokens: Math.round(prompt.length / 3.8),
          responseTokens: Math.round(response.length / 3.8)
        })
      });

      if (!res.ok) throw new Error("Inbound transmission failed");

      setSuccessMsg(`Telemetry intercept captured! Standard telemetry parsed and logged under "${activeConfig.badge}"`);
      onNewLogAdded();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="extension-simulator">
      {/* Simulation Workspace */}
      <div className="lg:col-span-3 bg-[#0f172a] border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1 rounded-md bg-amber-500/10 text-amber-400">
              <Chrome className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white tracking-tight">Chrome Extension Tracker Simulator</h4>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Simulate a user prompting on consumer portals (ChatGPT, Claude, Gemini). The extension automatically extracts logs and proxies them to the database.
          </p>

          {/* Tab Selector for Target Website */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(["chatgpt", "claude", "gemini"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedWeb(key)}
                className={`p-2 rounded-lg border text-xs font-semibold text-left transition-all cursor-pointer ${
                  selectedWeb === key
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-slate-900/40 border-slate-800/50 text-slate-400 hover:border-slate-800 hover:text-slate-300"
                }`}
              >
                {key === "chatgpt" ? "OpenAI Portal" : key === "claude" ? "Claude.ai" : "Gemini App"}
              </button>
            ))}
          </div>

          <div className="space-y-3.5 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Active Tracker: {webOptions[selectedWeb].name}
              </span>
              <span className="text-[9px] font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                Ext Version v1.0.4
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Captured User Prompt</label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Captured AI Response</label>
              <textarea
                rows={4}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
              />
            </div>

            <button
              onClick={handleIntercept}
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? "Transmitting log payload..." : "Intercept & Log usage"}</span>
            </button>
          </div>

          {successMsg && (
            <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex items-start gap-2 animate-fadeIn">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Extension architecture and details */}
      <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between" id="extension-architecture">
        <div>
          <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3 tracking-wider">How This Pipeline Works</h4>
          
          <div className="space-y-4 text-xs text-slate-300">
            <div className="flex gap-2.5">
              <span className="bg-slate-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-400 font-mono shrink-0">1</span>
              <div>
                <p className="font-semibold text-white">DOM Event Observers</p>
                <p className="text-[11px] text-slate-400 mt-0.5">The extension registers a MutationObserver inside ChatGPT, Claude, or Gemini tab to monitor prompt form submit triggers.</p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <span className="bg-slate-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-400 font-mono shrink-0">2</span>
              <div>
                <p className="font-semibold text-white">Secure Local Buffering</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Prompt contents are parsed, coupled with context clues (active website model selectors), and buffered locally inside Chrome storage.</p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <span className="bg-slate-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-400 font-mono shrink-0">3</span>
              <div>
                <p className="font-semibold text-white">Central FastAPI / Node Ingestion</p>
                <p className="text-[11px] text-slate-400 mt-0.5">The extension securely triggers a POST request to your central endpoint API to log the expense, keeping corporate databases in-sync.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300">FastAPI Hook Ready:</span> The extension simulator targets the same unified telemetry database schema.
          </div>
        </div>
      </div>
    </div>
  );
}
