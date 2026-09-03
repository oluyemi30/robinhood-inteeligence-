import React from 'react';
import { WhaleTransaction, WalletStats } from '../types';
import { TrendingUp, TrendingDown, ExternalLink, Award, ShieldAlert, Zap } from 'lucide-react';

interface WhaleTrackerViewProps {
  whales: WhaleTransaction[];
  onSelectTokenAddress: (address: string) => void;
}

export const WhaleTrackerView: React.FC<WhaleTrackerViewProps> = ({ whales, onSelectTokenAddress }) => {
  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-slate-800/70 backdrop-blur-md border border-white/[0.08] shadow-xl shadow-slate-950/30">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🐋</span> Robinhood Chain Whale Order Radar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic threshold: Orders &gt; $3,000 USD or &gt;1% of pool liquidity with wallet win rate profiling
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono font-semibold">
            Active Whales Monitored: {whales.length}
          </span>
        </div>
      </div>

      {/* Whale Table / List */}
      <div className="bg-slate-800/70 backdrop-blur-md border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl shadow-slate-950/30">
        {whales.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No large whale orders detected in current window. Click "Simulate Pipeline Events &gt; Simulate Whale Trade" above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-white/[0.08] text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Side / Size</th>
                  <th className="py-3.5 px-4">Token</th>
                  <th className="py-3.5 px-4">Wallet Address</th>
                  <th className="py-3.5 px-4">Win Rate / Volume</th>
                  <th className="py-3.5 px-4">Confidence</th>
                  <th className="py-3.5 px-4">Time</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-mono">
                {whales.map((w) => {
                  const isBuy = w.side === 'BUY';
                  return (
                    <tr key={w.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                              isBuy
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {w.side}
                          </span>
                          <span className="font-bold text-white text-sm">
                            ${Math.round(w.amountUsd).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onSelectTokenAddress(w.tokenAddress)}
                          className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
                        >
                          ${w.tokenSymbol}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{w.wallet.slice(0, 8)}...{w.wallet.slice(-6)}</span>
                          <a
                            href={`https://explorer.robinhood.com/address/${w.wallet}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-slate-300"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{w.walletStats.winRatePercent}%</span>
                          <span className="text-slate-400 text-[11px]">({w.walletStats.totalTrades} trades)</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Vol: ${Math.round(w.walletStats.totalVolumeUsd).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            w.confidence === 'HIGH'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : w.confidence === 'MEDIUM'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-slate-800 text-slate-400 border border-white/[0.08]'
                          }`}
                        >
                          {w.confidence}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(w.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectTokenAddress(w.tokenAddress)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-indigo-600 hover:text-white text-slate-200 text-xs transition-all border border-white/[0.08] hover:border-indigo-400/30 font-sans font-medium"
                        >
                          Inspect Token
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
