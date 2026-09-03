import React, { useState, useEffect } from 'react';
import { PaperPosition } from '../types';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, Trash2, ArrowUpRight } from 'lucide-react';

interface PaperTradingViewProps {
  onSelectTokenAddress: (address: string) => void;
  onExecutePaperTrade: (params: {
    tokenAddress: string;
    side: 'BUY' | 'SELL';
    amountUsd: number;
    slippageTolerancePercent?: number;
  }) => Promise<any>;
}

export const PaperTradingView: React.FC<PaperTradingViewProps> = ({
  onSelectTokenAddress,
  onExecutePaperTrade,
}) => {
  const [portfolio, setPortfolio] = useState<{
    initialBalanceUsd: number;
    availableCashUsd: number;
    positionsValueUsd: number;
    totalPortfolioValueUsd: number;
    realizedPnlUsd: number;
    unrealizedPnlUsd: number;
    totalPnlPercent: number;
    openPositions: PaperPosition[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [closingToken, setClosingToken] = useState<string | null>(null);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/paper-trading/positions');
      const data = await res.json();
      setPortfolio(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const handleClosePosition = async (tokenAddress: string, currentValueUsd: number) => {
    setClosingToken(tokenAddress);
    try {
      await onExecutePaperTrade({
        tokenAddress,
        side: 'SELL',
        amountUsd: currentValueUsd,
      });
      await loadPortfolio();
    } finally {
      setClosingToken(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Portfolio Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400">Total Portfolio Value</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            ${portfolio?.totalPortfolioValueUsd.toLocaleString() || '10,000'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Initial Base: $10,000</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400">Available Paper Cash</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            ${portfolio?.availableCashUsd.toLocaleString() || '10,000'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Dry powder for executions</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400">Active Positions Value</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            ${portfolio?.positionsValueUsd.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {portfolio?.openPositions.length || 0} open positions
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400">Total Simulated PnL</div>
          <div
            className={`text-xl font-bold font-mono mt-1 flex items-center gap-1 ${
              (portfolio?.totalPnlPercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {(portfolio?.totalPnlPercent || 0) >= 0 ? '+' : ''}
            {portfolio?.totalPnlPercent || 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Realized: ${portfolio?.realizedPnlUsd || 0}
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Open Paper Positions</h3>
          <button
            onClick={loadPortfolio}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {portfolio?.openPositions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs rounded-xl bg-slate-950 border border-slate-800/80">
            No open paper positions. Click any token in the Trench Radar to simulate an instant test buy order!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] font-sans uppercase">
                <tr>
                  <th className="py-2.5 px-3">Token</th>
                  <th className="py-2.5 px-3">Invested</th>
                  <th className="py-2.5 px-3">Current Value</th>
                  <th className="py-2.5 px-3">Unrealized PnL</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {portfolio?.openPositions.map((pos) => {
                  const isProfit = pos.unrealizedPnlUsd >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-slate-850 transition-colors">
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onSelectTokenAddress(pos.tokenAddress)}
                          className="font-bold text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          ${pos.tokenSymbol}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-white">${Math.round(pos.investedUsd).toLocaleString()}</td>
                      <td className="py-3 px-3 text-cyan-400">${Math.round(pos.currentValueUsd).toLocaleString()}</td>
                      <td className={`py-3 px-3 font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}${Math.round(pos.unrealizedPnlUsd)} ({isProfit ? '+' : ''}{pos.unrealizedPnlPercent}%)
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleClosePosition(pos.tokenAddress, pos.currentValueUsd)}
                          disabled={closingToken === pos.tokenAddress}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-sans text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {closingToken === pos.tokenAddress ? 'Closing...' : 'Close (Sell)'}
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
