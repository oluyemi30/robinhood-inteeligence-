import React from 'react';
import { X, Activity, Server, Cpu, Database, Send, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';
import { SystemStatus, ProviderHealth } from '../types';

interface SystemHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SystemStatus | null;
}

export const SystemHealthModal: React.FC<SystemHealthModalProps> = ({ isOpen, onClose, status }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/[0.12] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Robinhood Chain Infrastructure Health</h3>
              <p className="text-slate-400 text-[11px]">Real-time telemetry of blockchain node, indexers & AI engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Robinhood Chain Specs */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08] space-y-2.5">
            <div className="font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> Network: Robinhood Chain Mainnet
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px] pt-1">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Chain ID</span>
                <span className="font-bold text-white mt-0.5 block">4663</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Architecture</span>
                <span className="font-bold text-white mt-0.5 block">Arbitrum Orbit L2</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Block Time</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">~250ms</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Detection Latency</span>
                <span className="font-bold text-indigo-300 mt-0.5 block">{status?.detectionLatencyMs || 1420}ms</span>
              </div>
            </div>
          </div>

          {/* Providers List */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">Provider & Integration Subsystems</h4>
            {status?.providers.map((p, i) => {
              const isOk = p.status === 'CONNECTED';
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.06] flex items-center justify-between hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isOk ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : p.status === 'DEGRADED' ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-slate-500'
                      }`}
                    ></span>
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{p.name}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            isOk
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
                              : p.status === 'DEGRADED'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                              : 'bg-slate-800 text-slate-400 border border-white/[0.08]'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">{p.details}</div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[11px]">
                    <span className="text-indigo-300 font-bold">{p.latencyMs}ms</span>
                    <span className="text-slate-500 text-[10px] block">Errors: {p.errorCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
