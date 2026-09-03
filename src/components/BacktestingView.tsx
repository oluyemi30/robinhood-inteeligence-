import React, { useState } from 'react';
import { BacktestSummary, BacktestSimulationResult } from '../engines/backtestingEngine';
import { Brain, Play, ShieldAlert, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

export const BacktestingView: React.FC = () => {
  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [running, setRunning] = useState(false);

  const handleRunSimulation = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/backtest/run', { method: 'POST' });
      const data = await res.json();
      setSummary(data);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/70 backdrop-blur-md border border-white/[0.08] shadow-xl shadow-slate-950/30 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" /> Historical Replay & Quantitative Backtesting
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Replays historical token launches across 30s, 1m, 3m, 5m, 10m intervals. Evaluates return distributions and rug avoidance to eliminate survivorship bias.
          </p>
        </div>
        <button
          onClick={handleRunSimulation}
          disabled={running}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-md shadow-indigo-950/40 disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{running ? 'Replaying Launches...' : 'Run Historical Replay'}</span>
        </button>
      </div>

      {summary ? (
        <div className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/70 backdrop-blur-md border border-white/[0.08] shadow-xl shadow-slate-950/30">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">High-Score Win Rate</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {summary.highScoreWinRatePercent}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Score &ge; 75 tokens</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/70 backdrop-blur-md border border-white/[0.08] shadow-xl shadow-slate-950/30">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Avg 15m Return (Top)</div>
              <div className="text-2xl font-bold font-mono text-indigo-300 mt-1">
                +{summary.highScoreAvg15mReturnPercent}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Across momentum runners</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/70 backdrop-blur-md border border-white/[0.08] shadow-xl shadow-slate-950/30">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Rug Avoidance Rate</div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {summary.rugAvoidanceRatePercent}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Flagged prior to dump</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/70 backdrop-blur-md border border-white/[0.08] shadow-xl shadow-slate-950/30">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">System Precision</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {summary.overallSystemPrecisionPercent}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {summary.totalTokensSimulated} tokens replayed
              </div>
            </div>
          </div>

          {/* Detailed Token Breakdown Table */}
          <div className="p-5 rounded-2xl bg-slate-800/70 backdrop-blur-md border border-white/[0.08] shadow-xl shadow-slate-950/30 space-y-3">
            <h3 className="text-base font-bold text-white">Replay Simulation Cohort Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-white/[0.08] text-[11px] font-sans uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Token / Launchpad</th>
                    <th className="py-3 px-3.5">Launch Score</th>
                    <th className="py-3 px-3.5">1m Momentum</th>
                    <th className="py-3 px-3.5">1m Risk</th>
                    <th className="py-3 px-3.5">15m Return</th>
                    <th className="py-3 px-3.5">Outcome</th>
                    <th className="py-3 px-3.5">AI Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {summary.results.map((r, i) => {
                    const isProfit = r.return15mPercent >= 0;
                    return (
                      <tr key={i} className="hover:bg-slate-750/50 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-white">${r.tokenSymbol}</div>
                          <div className="text-[10px] text-slate-400 font-sans">{r.launchpad}</div>
                        </td>
                        <td className="py-3 px-3.5 font-bold text-white">{r.scoreAtLaunch}/100</td>
                        <td className="py-3 px-3.5 text-indigo-300">{r.momentumScoreAt1m}/100</td>
                        <td className="py-3 px-3.5 text-rose-400">{r.riskScoreAt1m}/100</td>
                        <td className={`py-3 px-3.5 font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}{r.return15mPercent}%
                        </td>
                        <td className="py-3 px-3.5 font-sans">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              r.outcome === 'GRADUATED' || r.outcome === 'STRONG_RUNNER'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : r.outcome === 'RUG_PULL'
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400 border border-white/[0.08]'
                            }`}
                          >
                            {r.outcome}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-sans">
                          <span className="text-[11px] font-mono text-slate-300">{r.aiPredictedAction}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 text-xs rounded-2xl bg-slate-800/70 backdrop-blur-md border border-white/[0.08] shadow-xl shadow-slate-950/30 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
            <Brain className="w-6 h-6" />
          </div>
          <div className="font-medium text-slate-200">Historical Replay Engine Ready</div>
          <p className="max-w-md mx-auto text-slate-400">
            Click "Run Historical Replay" to evaluate how the deterministic scoring formula and Gemini AI analysis performed across recent Robinhood Chain meme coin launches.
          </p>
        </div>
      )}
    </div>
  );
};
