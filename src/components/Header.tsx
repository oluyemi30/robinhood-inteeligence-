import React, { useState } from 'react';
import {
  Activity,
  ShieldCheck,
  Send,
  Zap,
  TrendingUp,
  RotateCw,
  PlusCircle,
  AlertTriangle,
  Brain,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { SystemStatus } from '../types';

interface HeaderProps {
  systemStatus: SystemStatus | null;
  onRefresh: () => void;
  onSimulateNewToken: () => void;
  onSimulateWhale: () => void;
  onSimulateLiquidityDrop: () => void;
  onOpenSystemHealth: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus,
  onRefresh,
  onSimulateNewToken,
  onSimulateWhale,
  onSimulateLiquidityDrop,
  onOpenSystemHealth,
  activeTab,
  setActiveTab,
}) => {
  const [showSimMenu, setShowSimMenu] = useState(false);

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/[0.08] sticky top-0 z-40">
      {/* Top Banner: Robinhood Chain network status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between text-xs border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/70 text-slate-200 border border-white/[0.08] px-3 py-1 rounded-full font-mono text-xs shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
            <span className="font-semibold text-white">Robinhood Chain</span>
            <span className="text-slate-400 hidden sm:inline">(Orbit L2)</span>
            <span className="text-indigo-400 font-bold">#4663</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-400">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Block:</span>
            <span className="font-mono text-slate-200">#{systemStatus?.latestBlock || '18,420,250'}</span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Latency:</span>
            <span className="font-mono text-indigo-400 font-semibold">{systemStatus?.detectionLatencyMs || 1420}ms</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="system-health-btn"
            onClick={onOpenSystemHealth}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-white/[0.08] hover:border-white/[0.15] text-xs shadow-sm"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Infrastructure Health</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </button>

          <div className="relative">
            <button
              id="simulate-actions-dropdown"
              onClick={() => setShowSimMenu(!showSimMenu)}
              className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all shadow-md shadow-indigo-950/40 border border-indigo-400/20 text-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Pipeline Events</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showSimMenu && (
              <div
                className="absolute right-0 mt-1.5 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl shadow-2xl p-2 z-50 text-xs"
                onMouseLeave={() => setShowSimMenu(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Real-time Simulation Trigger
                </div>
                <button
                  onClick={() => {
                    setShowSimMenu(false);
                    onSimulateNewToken();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800/70 text-slate-200 flex items-center gap-2.5 transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-white">Simulate New Launch</div>
                    <div className="text-[10px] text-slate-400">hood.fun / LaunchHood curve creation</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowSimMenu(false);
                    onSimulateWhale();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800/70 text-slate-200 flex items-center gap-2.5 transition-colors"
                >
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="font-semibold text-white">Simulate Whale Trade</div>
                    <div className="text-[10px] text-slate-400">$6k - $18k large swap order</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowSimMenu(false);
                    onSimulateLiquidityDrop();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800/70 text-slate-200 flex items-center gap-2.5 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold text-white">Simulate Liquidity Collapse</div>
                    <div className="text-[10px] text-slate-400">Trigger P0 Critical Alert warning</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            id="refresh-feed-btn"
            onClick={onRefresh}
            title="Refresh active telemetry"
            className="p-1.5 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors border border-white/[0.08]"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold shadow-lg shadow-indigo-950/50 border border-indigo-400/20 text-lg">
              RH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">Robinhood Chain</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold tracking-wide">
                  Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-400">Meme Coin Radar, Whale Profiler & Telegram Bot</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto py-1">
            {[
              { id: 'radar', label: 'Trench Radar', icon: Zap },
              { id: 'whales', label: 'Whale Tracker', icon: TrendingUp },
              { id: 'graduating', label: 'Graduation & DEX', icon: ShieldCheck },
              { id: 'telegram', label: 'Telegram Alerts', icon: Send, badge: systemStatus?.alertsSentCount },
              { id: 'paper', label: 'Paper Trading', icon: Activity },
              { id: 'backtest', label: 'Historical Replay', icon: Brain },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800/90 text-indigo-400 border border-indigo-500/40 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-indigo-500 text-white'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
