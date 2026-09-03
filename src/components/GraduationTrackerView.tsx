import React from 'react';
import { TokenWithMetrics } from '../types';
import { ShieldCheck, ArrowRight, ExternalLink, Zap, Flame, Award } from 'lucide-react';

interface GraduationTrackerViewProps {
  tokens: TokenWithMetrics[];
  onSelectToken: (token: TokenWithMetrics) => void;
}

export const GraduationTrackerView: React.FC<GraduationTrackerViewProps> = ({
  tokens,
  onSelectToken,
}) => {
  const graduating = tokens.filter((t) => t.metrics.bondingCurveProgress >= 40 || t.metrics.isGraduated);

  return (
    <div className="space-y-4">
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/70 backdrop-blur-md border border-white/[0.08] shadow-xl shadow-slate-950/30 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" /> Bonding Curve Graduation & DEX Migration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitors launchpad bonding curves (hood.fun, LaunchHood, Bags.fm) approaching 100% curve completion and Uniswap v3 pool seeding.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono font-semibold">
            {graduating.filter((t) => t.metrics.isGraduated).length} Graduated • {graduating.filter((t) => !t.metrics.isGraduated).length} Near Target
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {graduating.map((token) => {
          const m = token.metrics;
          const meta = token.metadata;
          const isGrad = m.isGraduated;

          return (
            <div
              key={meta.address}
              onClick={() => onSelectToken(token)}
              className="p-5 rounded-2xl bg-slate-800/70 backdrop-blur-md border border-white/[0.08] hover:border-indigo-400/40 transition-all cursor-pointer shadow-xl shadow-slate-950/30 space-y-3.5 hover:shadow-indigo-950/20 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-800 to-slate-800 border border-white/[0.1] flex items-center justify-center font-black text-indigo-400 text-sm group-hover:scale-105 transition-transform shadow-inner">
                    ${meta.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">${meta.symbol}</span>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-900/80 text-indigo-300 border border-white/[0.08] font-semibold">
                        {meta.launchpad}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{meta.name}</div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono ${
                    isGrad
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {isGrad ? 'MIGRATED TO DEX' : `${m.bondingCurveProgress}% CURVE`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Curve Progress</span>
                  <span className="font-mono text-white font-bold">{m.bondingCurveProgress}% / 100%</span>
                </div>
                <div className="h-2 w-full bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isGrad ? 'bg-emerald-400' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, m.bondingCurveProgress)}%` }}
                  ></div>
                </div>
              </div>

              {/* Milestones Flow */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 py-1.5 px-3 rounded-xl bg-slate-900/60 border border-white/[0.06]">
                <span className={m.bondingCurveProgress >= 25 ? 'text-indigo-400 font-bold' : 'text-slate-600'}>25%</span>
                <span>•</span>
                <span className={m.bondingCurveProgress >= 50 ? 'text-indigo-400 font-bold' : 'text-slate-600'}>50%</span>
                <span>•</span>
                <span className={m.bondingCurveProgress >= 75 ? 'text-indigo-400 font-bold' : 'text-slate-600'}>75%</span>
                <span>•</span>
                <span className={m.bondingCurveProgress >= 90 ? 'text-amber-400 font-bold' : 'text-slate-600'}>90%</span>
                <span>•</span>
                <span className={isGrad ? 'text-emerald-400 font-bold' : 'text-slate-600'}>Uniswap v3 🚀</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs p-3 rounded-xl bg-slate-900/40 border border-white/[0.05]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Market Cap</span>
                  <div className="font-mono font-bold text-white mt-0.5">${Math.round(m.marketCapUsd).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Liquidity</span>
                  <div className="font-mono font-bold text-indigo-300 mt-0.5">${Math.round(m.liquidityUsd).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Target DEX</span>
                  <div className="font-mono font-bold text-emerald-400 mt-0.5 truncate">Uniswap v3</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
