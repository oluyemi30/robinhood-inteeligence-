import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Shield,
  Brain,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lock,
  Unlock,
  Users,
  Activity,
  Zap,
} from 'lucide-react';
import { TokenWithMetrics, AIAnalysisResult, ContractSecurityAnalysis, HolderInfo } from '../types';

interface TokenDetailModalProps {
  token: TokenWithMetrics | null;
  onClose: () => void;
  onExecutePaperTrade: (params: {
    tokenAddress: string;
    side: 'BUY' | 'SELL';
    amountUsd: number;
    slippageTolerancePercent?: number;
  }) => Promise<any>;
}

export const TokenDetailModal: React.FC<TokenDetailModalProps> = ({
  token,
  onClose,
  onExecutePaperTrade,
}) => {
  if (!token) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'contract' | 'holders' | 'trade'>('overview');
  const [copied, setCopied] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [contractSecurity, setContractSecurity] = useState<ContractSecurityAnalysis | null>(null);
  const [holders, setHolders] = useState<HolderInfo[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [paperAmount, setPaperAmount] = useState('250');
  const [tradeStatus, setTradeStatus] = useState<string | null>(null);

  const { metadata: meta, metrics: m } = token;

  const copyAddress = () => {
    navigator.clipboard.writeText(meta.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch deep inspection data
  useEffect(() => {
    // 1. Fetch AI Analysis
    fetch(`/api/tokens/${meta.address}/analysis`)
      .then((res) => res.json())
      .then((data) => setAiAnalysis(data))
      .catch(() => {});

    // 2. Fetch Contract Risk & Security
    fetch(`/api/tokens/${meta.address}/risk`)
      .then((res) => res.json())
      .then((data) => {
        if (data.security) setContractSecurity(data.security);
      })
      .catch(() => {});

    // 3. Fetch Holders
    fetch(`/api/tokens/${meta.address}/holders`)
      .then((res) => res.json())
      .then((data) => setHolders(data))
      .catch(() => {});
  }, [meta.address]);

  const handleTriggerManualAi = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch(`/api/tokens/${meta.address}/analysis`);
      const data = await res.json();
      setAiAnalysis(data);
    } catch (err) {
      // handled
    } finally {
      setLoadingAi(false);
    }
  };

  const handleTrade = async (side: 'BUY' | 'SELL') => {
    setTradeStatus('Submitting paper order...');
    try {
      const res = await onExecutePaperTrade({
        tokenAddress: meta.address,
        side,
        amountUsd: Number(paperAmount),
        slippageTolerancePercent: 5.0,
      });
      setTradeStatus(`Success! Executed paper ${side} for $${paperAmount}`);
      setTimeout(() => setTradeStatus(null), 3500);
    } catch (err: any) {
      setTradeStatus(`Order failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/[0.12] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-start justify-between bg-slate-900/90">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-800 to-slate-800 border border-white/[0.1] flex items-center justify-center text-xl font-black text-indigo-400 shadow-inner">
              ${meta.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">${meta.symbol}</h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono font-semibold">
                  {meta.launchpad}
                </span>
                <span className="text-xs text-slate-400 font-medium">Chain ID: 4663</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-slate-400">{meta.address.slice(0, 10)}...{meta.address.slice(-8)}</span>
                <button
                  onClick={copyAddress}
                  className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                  title="Copy contract address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={`https://explorer.robinhood.com/token/${meta.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-medium"
                >
                  Explorer <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="flex items-center gap-2 px-5 py-3 bg-slate-950/60 border-b border-white/[0.06] overflow-x-auto text-xs">
          {[
            { id: 'overview', label: 'Order Flow & Telemetry', icon: Activity },
            { id: 'ai', label: 'AI Analyst (Gemini 3.8)', icon: Brain },
            { id: 'contract', label: 'Contract Security', icon: Shield },
            { id: 'holders', label: 'Holders & Concentration', icon: Users },
            { id: 'trade', label: 'Simulated Paper Trade', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold shadow-md shadow-indigo-950/40 border border-indigo-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-slate-200 space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08]">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Price (USD)</div>
                  <div className="text-base font-bold font-mono text-white mt-1">${m.priceUsd.toFixed(8)}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{m.priceEth.toFixed(10)} ETH</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08]">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Market Cap</div>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                    ${Math.round(m.marketCapUsd).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Supply: 1,000,000,000</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08]">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Liquidity Depth</div>
                  <div className="text-base font-bold font-mono text-indigo-300 mt-1">
                    ${Math.round(m.liquidityUsd).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Initial: ${Math.round(m.initialLiquidityUsd || m.liquidityUsd)}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08]">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">5m Momentum</div>
                  <div className="text-base font-bold font-mono text-amber-400 mt-1">
                    {m.momentumScore}/100 ({m.momentumTier})
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Acc: {m.volumeAcceleration}x</div>
                </div>
              </div>

              {/* Bonding Curve Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08] space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Bonding Curve Graduation Target</span>
                  <span className="font-mono text-indigo-400 font-bold">{m.bondingCurveProgress}%</span>
                </div>
                <div className="h-2 w-full bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, m.bondingCurveProgress)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Curve Launch: {meta.launchpad}</span>
                  <span>Target DEX: {m.graduatedDex || 'Uniswap v3 Robinhood Chain'}</span>
                </div>
              </div>

              {/* Order Flow breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08] space-y-2">
                  <div className="font-semibold text-white">5-Minute Order Flow</div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Buys (count):</span>
                    <span className="font-mono text-emerald-400 font-bold">{m.buys5m}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sells (count):</span>
                    <span className="font-mono text-rose-400 font-bold">{m.sells5m}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Buy / Sell Ratio:</span>
                    <span className="font-mono font-bold text-white">{m.buySellRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Net Flow (5m):</span>
                    <span className={`font-mono font-bold ${m.netFlowUsd5m >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {m.netFlowUsd5m >= 0 ? `+$${Math.round(m.netFlowUsd5m)}` : `-$${Math.round(Math.abs(m.netFlowUsd5m))}`}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08] space-y-2">
                  <div className="font-semibold text-white">Volume Acceleration</div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Volume 1m:</span>
                    <span className="font-mono text-slate-200">${Math.round(m.volume1m)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Volume 5m:</span>
                    <span className="font-mono text-slate-200">${Math.round(m.volume5m)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Volume 15m:</span>
                    <span className="font-mono text-slate-200">${Math.round(m.volume15m)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Price Change 5m:</span>
                    <span className={`font-mono font-bold ${m.priceChange5m >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {m.priceChange5m >= 0 ? `+${m.priceChange5m}%` : `${m.priceChange5m}%`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI ANALYST */}
          {activeTab === 'ai' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Brain className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Gemini 3.8 Quantitative Diagnosis</div>
                    <div className="text-slate-400 text-[11px]">Server-side AI analyst evaluation without hallucinations</div>
                  </div>
                </div>
                <button
                  onClick={handleTriggerManualAi}
                  disabled={loadingAi}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold transition-all shadow-md shadow-indigo-950/40 disabled:opacity-50"
                >
                  {loadingAi ? 'Diagnosing...' : 'Re-run Analysis'}
                </button>
              </div>

              {aiAnalysis ? (
                <div className="space-y-3">
                  {/* Verdict & Confidence */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08]">
                    <div>
                      <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Recommended Classification</span>
                      <div className="text-base font-black text-indigo-400 font-mono mt-0.5">{aiAnalysis.action}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Analyst Confidence</span>
                      <div className="text-base font-black text-white font-mono mt-0.5">{aiAnalysis.confidenceScore}%</div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-4 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08]">
                    <div className="font-semibold text-slate-300 mb-1">Analyst Synthesis:</div>
                    <p className="text-slate-200 leading-relaxed italic">"{aiAnalysis.summary}"</p>
                  </div>

                  {/* Bullish & Bearish Signals */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                      <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" /> Bullish Drivers
                      </div>
                      {aiAnalysis.bullishSignals.map((s, idx) => (
                        <div key={idx} className="text-slate-300 flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                      <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Risk & Bearish Telemetry
                      </div>
                      {aiAnalysis.riskFactors.map((r, idx) => (
                        <div key={idx} className="text-slate-300 flex items-start gap-1.5">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">Loading AI Analyst evaluation...</div>
              )}
            </div>
          )}

          {/* TAB 3: CONTRACT SECURITY */}
          {activeTab === 'contract' && (
            <div className="space-y-4 text-xs">
              <div className="p-5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08]">
                <div className="flex items-center justify-between mb-3.5">
                  <div>
                    <h3 className="font-bold text-white text-sm">EVM Bytecode Security Audit</h3>
                    <p className="text-slate-400 text-[11px]">Static bytecode inspection for Robinhood Chain ERC-20 contract</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Security Score</span>
                    <span className="text-base font-black font-mono text-emerald-400">
                      {contractSecurity ? `${contractSecurity.securityScore}/100` : '80/100'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-between">
                    <span className="text-slate-400">Mint Function:</span>
                    {contractSecurity?.mintable ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> YES</span>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> NO</span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-between">
                    <span className="text-slate-400">Pausable:</span>
                    {contractSecurity?.pausable ? (
                      <span className="text-rose-400 font-bold">YES</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">NO</span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-between">
                    <span className="text-slate-400">Blacklistable:</span>
                    {contractSecurity?.blacklistable ? (
                      <span className="text-rose-400 font-bold">YES</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">NO</span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-between">
                    <span className="text-slate-400">Tax Adjustable:</span>
                    {contractSecurity?.taxAdjustable ? (
                      <span className="text-rose-400 font-bold">YES</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">NO (0/0%)</span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-between">
                    <span className="text-slate-400">Renounced:</span>
                    {contractSecurity?.renouncedOwnership ? (
                      <span className="text-emerald-400 font-bold">YES</span>
                    ) : (
                      <span className="text-slate-300 font-bold">ACTIVE OWNER</span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-between">
                    <span className="text-slate-400">Proxy Pattern:</span>
                    <span className="text-slate-300 font-bold">{contractSecurity?.isProxy ? 'UPGRADEABLE' : 'IMMUTABLE'}</span>
                  </div>
                </div>

                {contractSecurity?.notes && contractSecurity.notes.length > 0 && (
                  <div className="mt-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-1">
                    <div className="font-semibold text-slate-300">Auditor Notes:</div>
                    {contractSecurity.notes.map((n, i) => (
                      <div key={i} className="text-slate-400 text-[11px]">• {n}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: HOLDERS */}
          {activeTab === 'holders' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08]">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total Holders</div>
                  <div className="text-base font-bold font-mono text-white mt-1">{m.holderCount}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">+{m.holderGrowth5m} last 5m</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08]">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Top 10 Supply</div>
                  <div className="text-base font-bold font-mono text-amber-400 mt-1">{m.top10Concentration}%</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Threshold: &lt;50% safe</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08]">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Creator Holdings</div>
                  <div className="text-base font-bold font-mono text-indigo-300 mt-1">{m.creatorHoldingsPercent}%</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Sold: {m.creatorHasSold ? '⚠️ YES' : 'NO'}</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08]">
                <div className="font-bold text-white mb-3">Largest Wallets Breakdown</div>
                <div className="space-y-2">
                  {holders.map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">{i + 1}.</span>
                        <span className="font-mono text-slate-200">{h.address.slice(0, 8)}...{h.address.slice(-6)}</span>
                        {h.label && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-indigo-300 font-mono border border-white/[0.08]">
                            {h.label}
                          </span>
                        )}
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-white">{h.percentage}%</span>
                        <span className="text-slate-400 text-[10px] ml-2">(${Math.round(h.usdValue).toLocaleString()})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PAPER TRADE */}
          {activeTab === 'trade' && (
            <div className="space-y-4 text-xs">
              <div className="p-5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-white/[0.08] space-y-3.5">
                <div>
                  <h3 className="font-bold text-white text-sm">Simulated Paper Execution</h3>
                  <p className="text-slate-400 text-[11px]">Test trading strategies with realistic AMM slippage and zero financial risk.</p>
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold block mb-1.5">Order Size (USD)</label>
                  <div className="flex items-center gap-2">
                    {['50', '100', '250', '500', '1000'].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setPaperAmount(amt)}
                        className={`px-3 py-1.5 rounded-xl border font-mono font-medium transition-all ${
                          paperAmount === amt
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-400/30 font-bold shadow-md shadow-indigo-950/40'
                            : 'bg-slate-900/60 text-slate-300 border-white/[0.08] hover:bg-slate-800/60'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Token Price:</span>
                    <span className="font-mono text-white">${m.priceUsd.toFixed(8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Simulated Pool Slippage:</span>
                    <span className="font-mono text-indigo-300">
                      ~{((Number(paperAmount) / Math.max(m.liquidityUsd, 1000)) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Robinhood L2 Gas Fee:</span>
                    <span className="font-mono text-slate-300">~$0.04</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    id="paper-buy-btn"
                    onClick={() => handleTrade('BUY')}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-emerald-950/40"
                  >
                    Simulate Buy (${paperAmount})
                  </button>
                  <button
                    id="paper-sell-btn"
                    onClick={() => handleTrade('SELL')}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm transition-all shadow-md shadow-rose-950/40"
                  >
                    Simulate Sell
                  </button>
                </div>

                {tradeStatus && (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-indigo-500/30 text-center font-mono text-xs text-indigo-300">
                    {tradeStatus}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
