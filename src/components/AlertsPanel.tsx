import { Alert } from "../types";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";

interface AlertsPanelProps {
  alerts: Alert[];
  onResolve: (id: string) => void;
}

export default function AlertsPanel({ alerts, onResolve }: AlertsPanelProps) {
  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl p-5 shadow-lg" id="alerts-panel">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <span>Budget & Overage Alerts</span>
            {activeAlerts.length > 0 && (
              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] px-1.5 py-0.5 rounded font-bold font-mono">
                {activeAlerts.length} ACTIVE
              </span>
            )}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">Automated warning threshold checks (80% / 100%)</p>
        </div>
      </div>

      {activeAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-slate-800 rounded-lg">
          <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400 mb-2">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-300">All departments are green</p>
          <p className="text-[11px] text-slate-500 mt-0.5">No budget overages detected in this billing cycle</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              id={alert.id}
              className={`flex items-start gap-3 p-3.5 rounded-lg border text-xs transition-all duration-300 ${
                alert.type === 'critical'
                  ? 'bg-rose-500/5 border-rose-500/20 text-rose-200'
                  : 'bg-amber-500/5 border-amber-500/20 text-amber-200'
              }`}
            >
              <div className={`p-1.5 rounded-md mt-0.5 ${alert.type === 'critical' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                    {alert.department}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="mt-1 font-medium leading-relaxed">{alert.message}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => onResolve(alert.id)}
                    className="text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded border border-slate-700/50 transition-all cursor-pointer"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
