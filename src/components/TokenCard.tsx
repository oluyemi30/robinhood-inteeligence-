import React from 'react';
import {
  ExternalLink,
  Flame,
  Shield,
  Zap,
  Star,
  Clock,
  Droplets,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import { TokenWithMetrics } from '../types';

interface TokenCardProps {
  token: TokenWithMetrics;
  onSelect: (token: TokenWithMetrics) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (address: string) => void;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  token,
  onSelect,
  isWatchlisted,
  onToggleWatchlist,
}) => {
  const { metadata: meta, metrics: m } = token;

  const ageSeconds = Math.max(1, Math.round((Date.now() - meta.launchTimestamp) / 1000));
  const ageDisplay =
    ageSeconds < 60
      ? `${ageSeconds}s ago`
      : ageSeconds < 3600
      ? `${Math.round(ageSeconds / 60)}m ago`
      : `${(ageSeconds / 3600).toFixed(1)}h ago`;

  const getMomentumBadge = (score: number, tier: string) => {
    if (score >= 80) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
          <Flame className="w-3 h-3 animate-pulse text-amber-400" /> {tier} ({score})
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
          <Zap className="w-3 h-3 text-indigo-400" /> {tier} ({score})
        </span>
      );
    }
    if (score <= 25) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-rose-400" /> {tier} ({score})
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-white/[0.08]">
        {tier} ({score})
      </span>
    );
  };

  const getRiskBadge = (score: number, tier: string) => {
    if (score >= 70) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
          <Shield className="w-3 h-3 text-rose-400" /> RISK: {tier} ({score})
        </span>
      );
    }
    if (score >= 45) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
          <Shield className="w-3 h-3 text-amber-400" /> {tier} ({score})
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
        <Shield className="w-3 h-3 text-emerald-400" /> SAFE ({score})
      </span>
    );
  };

  const getLaunchpadColor = (launchpad: string) => {
    switch (launchpad) {
      case 'hood.fun':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'LaunchHood':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'Bags.fm':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-white/[0.08]';
    }
  };

  return (
    <div
      id={`token-card-${meta.symbol.toLowerCase()}`}
      onClick={() => onSelect(token)}
      className="bg-slate-800/70 backdrop-blur-md hover:bg-slate-800/90 border border-white/[0.08] hover:border-indigo-500/40 transition-all duration-200 rounded-2xl p-4 sm:p-5 cursor-pointer shadow-lg shadow-slate-950/30 hover:shadow-indigo-950/30 group relative overflow-hidden"
    >
      {/* Top Header: Symbol, Name, Launchpad, Star */}
      <div className="flex items-start justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-800 to-slate-800 border border-white/[0.1] flex items-center justify-center text-base font-black text-indigo-400 shadow-inner group-hover:scale-105 transition-transform">
            ${meta.symbol.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base leading-tight">${meta.symbol}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getLaunchpadColor(meta.launchpad)}`}>
                {meta.launchpad}
              </span>
              {m.isGraduated && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Uniswap v3
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="truncate max-w-[130px] font-medium">{meta.name}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3 h-3 text-slate-400" />
                {ageDisplay}
              </span>
            </div>
          </div>
        </div>

        <button
          id={`star-${meta.symbol.toLowerCase()}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWatchlist(meta.address);
          }}
          className={`p-2 rounded-xl border transition-colors ${
            isWatchlisted
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-white/[0.08] hover:bg-slate-800/60'
          }`}
          title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      {/* Core Numbers Grid */}
      <div className="grid grid-cols-3 gap-2.5 py-3 px-3.5 bg-slate-900/60 rounded-xl border border-white/[0.06] mb-3.5">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Market Cap</div>
          <div className="text-xs font-bold font-mono text-white mt-0.5">
            ${Math.round(m.marketCapUsd).toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Liquidity</div>
          <div className="text-xs font-bold font-mono text-indigo-300 mt-0.5">
            ${Math.round(m.liquidityUsd).toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">5m Change</div>
          <div
            className={`text-xs font-bold font-mono flex items-center gap-0.5 mt-0.5 ${
              m.priceChange5m >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {m.priceChange5m >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {m.priceChange5m >= 0 ? `+${m.priceChange5m}%` : `${m.priceChange5m}%`}
          </div>
        </div>
      </div>

      {/* Volume & Order Flow */}
      <div className="space-y-2 mb-3.5 text-xs">
        <div className="flex justify-between items-center text-slate-300">
          <span className="text-[11px] text-slate-400 font-medium">Volume 5m:</span>
          <span className="font-mono font-medium text-slate-200">
            ${Math.round(m.volume5m).toLocaleString()}{' '}
            <span className="text-indigo-400 text-[11px]">({m.volumeAcceleration}x acc)</span>
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span className="text-[11px] text-slate-400 font-medium">Buys / Sells (5m):</span>
          <span className="font-mono font-medium">
            <span className="text-emerald-400">{m.buys5m}</span> / <span className="text-rose-400">{m.sells5m}</span>{' '}
            <span className="text-slate-400 text-[11px]">(ratio: {m.buySellRatio})</span>
          </span>
        </div>

        {/* Buy Pressure Visual Bar */}
        <div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
            <span className="uppercase tracking-wider font-semibold">Buy Pressure</span>
            <span className="font-mono font-semibold text-emerald-400">{m.buyPressureScore}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, Math.min(100, m.buyPressureScore))}%` }}
            ></div>
          </div>
        </div>

        {/* Bonding Curve Progress */}
        <div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
            <span className="uppercase tracking-wider font-semibold">Bonding Curve Target (Uniswap v3)</span>
            <span className="font-mono font-semibold text-indigo-400">{m.bondingCurveProgress}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(3, Math.min(100, m.bondingCurveProgress))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Footer Badges: Momentum, Risk, Overall Score */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 flex-wrap">
          {getMomentumBadge(m.momentumScore, m.momentumTier)}
          {getRiskBadge(m.riskScore, m.riskTier)}
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Score</span>
          <span className="font-mono font-bold text-sm text-indigo-400">{m.overallScore}/100</span>
        </div>
      </div>
    </div>
  );
};
