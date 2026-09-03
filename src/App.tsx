import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TokenCard } from './components/TokenCard';
import { TokenDetailModal } from './components/TokenDetailModal';
import { WhaleTrackerView } from './components/WhaleTrackerView';
import { GraduationTrackerView } from './components/GraduationTrackerView';
import { TelegramBotTerminal } from './components/TelegramBotTerminal';
import { PaperTradingView } from './components/PaperTradingView';
import { BacktestingView } from './components/BacktestingView';
import { SystemHealthModal } from './components/SystemHealthModal';
import { TokenWithMetrics, WhaleTransaction, TelegramAlert, SystemStatus } from './types';
import { Search, SlidersHorizontal, Flame, Zap, Award, Star, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('radar');
  const [tokens, setTokens] = useState<TokenWithMetrics[]>([]);
  const [whales, setWhales] = useState<WhaleTransaction[]>([]);
  const [alerts, setAlerts] = useState<TelegramAlert[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [selectedToken, setSelectedToken] = useState<TokenWithMetrics | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'TRENDING' | 'MOVERS' | 'GRADUATING' | 'WATCHLIST' | 'RISK'>('ALL');
  const [launchpadFilter, setLaunchpadFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'SCORE' | 'MOMENTUM' | 'VOLUME' | 'NEWEST'>('SCORE');
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [liveEventBanner, setLiveEventBanner] = useState<string | null>(null);

  // Initial Fetch
  const fetchAllData = async () => {
    try {
      const [tokensRes, whalesRes, alertsRes, statusRes] = await Promise.all([
        fetch('/api/tokens/new').then((r) => r.json()),
        fetch('/api/whales').then((r) => r.json()),
        fetch('/api/telegram/alerts').then((r) => r.json()),
        fetch('/api/system/status').then((r) => r.json()),
      ]);

      if (Array.isArray(tokensRes)) setTokens(tokensRes);
      if (Array.isArray(whalesRes)) setWhales(whalesRes);
      if (Array.isArray(alertsRes)) setAlerts(alertsRes);
      if (statusRes && statusRes.network) setSystemStatus(statusRes);
    } catch (err) {
      // safe fallback
    }
  };

  useEffect(() => {
    fetchAllData();

    // Setup Server-Sent Events (SSE) for real-time order flow and alerts
    const eventSource = new EventSource('/api/stream');

    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'TOKEN_UPDATED' || payload.type === 'TOKEN_METRICS_UPDATED') {
          const updatedToken = payload.data as TokenWithMetrics;
          setTokens((prev) => {
            const index = prev.findIndex((t) => t.metadata.address.toLowerCase() === updatedToken.metadata.address.toLowerCase());
            if (index >= 0) {
              const copy = [...prev];
              copy[index] = updatedToken;
              return copy;
            } else {
              return [updatedToken, ...prev];
            }
          });
        } else if (payload.type === 'WHALE') {
          const whaleTx = payload.data as WhaleTransaction;
          setWhales((prev) => [whaleTx, ...prev]);
          setLiveEventBanner(`🐋 Whale Order: ${whaleTx.side} $${whaleTx.tokenSymbol} ($${Math.round(whaleTx.amountUsd).toLocaleString()})`);
          setTimeout(() => setLiveEventBanner(null), 5000);
        } else if (payload.type === 'GRADUATION') {
          setLiveEventBanner(`🎓 Token Graduated: $${payload.data.token.metadata.symbol} reached 100% curve!`);
          setTimeout(() => setLiveEventBanner(null), 5000);
        }
      } catch (err) {
        // Safe json parse
      }
    };

    const interval = setInterval(fetchAllData, 10000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, []);

  // Simulation Triggers
  const handleSimulateNewToken = async () => {
    try {
      const res = await fetch('/api/simulate/new-token', { method: 'POST' });
      const data = await res.json();
      if (data.token) {
        setTokens((prev) => [data.token, ...prev]);
        setLiveEventBanner(`🚨 New Token Detected: $${data.token.metadata.symbol} on ${data.token.metadata.launchpad}!`);
        setTimeout(() => setLiveEventBanner(null), 5000);
        fetchAllData();
      }
    } catch (err) {}
  };

  const handleSimulateWhale = async () => {
    try {
      const res = await fetch('/api/simulate/whale', { method: 'POST' });
      const data = await res.json();
      if (data.whaleTx) {
        setWhales((prev) => [data.whaleTx, ...prev]);
        fetchAllData();
      }
    } catch (err) {}
  };

  const handleSimulateLiquidityDrop = async () => {
    try {
      const res = await fetch('/api/simulate/liquidity-drop', { method: 'POST' });
      const data = await res.json();
      if (data.alert) {
        setAlerts((prev) => [data.alert, ...prev]);
        setLiveEventBanner(`🚨 Liquidity Warning Alert Dispatched for $${data.token.metadata.symbol}!`);
        setTimeout(() => setLiveEventBanner(null), 5000);
        fetchAllData();
      }
    } catch (err) {}
  };

  const handleTriggerTestAlert = async () => {
    const res = await fetch('/api/telegram/test-alert', { method: 'POST' });
    const data = await res.json();
    if (data.alert) {
      setAlerts((prev) => [data.alert, ...prev]);
    }
  };

  const handleToggleWatchlist = (address: string) => {
    const key = address.toLowerCase();
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleExecutePaperTrade = async (params: {
    tokenAddress: string;
    side: 'BUY' | 'SELL';
    amountUsd: number;
    slippageTolerancePercent?: number;
  }) => {
    const res = await fetch('/api/paper-trading/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Paper trade failed');
    }
    return res.json();
  };

  // Filter and Sort Tokens
  const filteredTokens = tokens
    .filter((t) => {
      const meta = t.metadata;
      const m = t.metrics;

      // Search match
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          meta.name.toLowerCase().includes(q) ||
          meta.symbol.toLowerCase().includes(q) ||
          meta.address.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Launchpad match
      if (launchpadFilter !== 'ALL' && meta.launchpad !== launchpadFilter) {
        return false;
      }

      // Filter Mode
      if (filterMode === 'TRENDING') return m.overallScore >= 75;
      if (filterMode === 'MOVERS') return m.volumeAcceleration >= 2.0 || m.priceChange5m >= 20;
      if (filterMode === 'GRADUATING') return m.bondingCurveProgress >= 40 || m.isGraduated;
      if (filterMode === 'WATCHLIST') return watchlist.has(meta.address.toLowerCase());
      if (filterMode === 'RISK') return m.riskScore >= 60;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'SCORE') return b.metrics.overallScore - a.metrics.overallScore;
      if (sortBy === 'MOMENTUM') return b.metrics.momentumScore - a.metrics.momentumScore;
      if (sortBy === 'VOLUME') return b.metrics.volume5m - a.metrics.volume5m;
      if (sortBy === 'NEWEST') return b.metadata.launchTimestamp - a.metadata.launchTimestamp;
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Live Push Banner */}
      {liveEventBanner && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white px-4 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2 animate-pulse sticky top-0 z-50 shadow-lg shadow-indigo-950/40">
          <Zap className="w-3.5 h-3.5" />
          <span>{liveEventBanner}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        systemStatus={systemStatus}
        onRefresh={fetchAllData}
        onSimulateNewToken={handleSimulateNewToken}
        onSimulateWhale={handleSimulateWhale}
        onSimulateLiquidityDrop={handleSimulateLiquidityDrop}
        onOpenSystemHealth={() => setIsHealthOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: TRENCH RADAR */}
        {activeTab === 'radar' && (
          <div className="space-y-5">
            {/* Filter & Search Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/70 backdrop-blur-md border border-white/[0.08] shadow-xl shadow-slate-950/30 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by token symbol, name, or contract address..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 font-mono transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Sort:</span>
                  {(['SCORE', 'MOMENTUM', 'VOLUME', 'NEWEST'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={`px-3 py-1.5 rounded-xl border font-mono text-xs transition-all ${
                        sortBy === s
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold shadow-sm'
                          : 'bg-slate-900/50 text-slate-400 border-white/[0.06] hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-3 border-t border-white/[0.06] text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'ALL', label: 'All Tokens', icon: SlidersHorizontal },
                    { id: 'TRENDING', label: 'Trending (Score ≥75)', icon: Flame },
                    { id: 'MOVERS', label: 'Fast Movers', icon: Zap },
                    { id: 'GRADUATING', label: 'Bonding Curves & DEX', icon: Award },
                    { id: 'WATCHLIST', label: `Watchlist (${watchlist.size})`, icon: Star },
                    { id: 'RISK', label: 'High Risk Flagged', icon: AlertTriangle },
                  ].map((mode) => {
                    const Icon = mode.icon;
                    const active = filterMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setFilterMode(mode.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap text-xs ${
                          active
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold shadow-md shadow-indigo-950/50 border border-indigo-400/30'
                            : 'bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-white/[0.08]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Launchpad:</span>
                  {['ALL', 'hood.fun', 'LaunchHood', 'Bags.fm'].map((lp) => (
                    <button
                      key={lp}
                      onClick={() => setLaunchpadFilter(lp)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors ${
                        launchpadFilter === lp
                          ? 'bg-slate-700/80 text-white font-semibold border border-white/[0.1]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      {lp}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Token Cards Grid */}
            {filteredTokens.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs rounded-2xl bg-slate-800/50 backdrop-blur-md border border-white/[0.08]">
                No tokens match your current filter query.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTokens.map((token) => (
                  <TokenCard
                    key={token.metadata.address}
                    token={token}
                    onSelect={(t) => setSelectedToken(t)}
                    isWatchlisted={watchlist.has(token.metadata.address.toLowerCase())}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: WHALE TRACKER */}
        {activeTab === 'whales' && (
          <WhaleTrackerView
            whales={whales}
            onSelectTokenAddress={(addr) => {
              const t = tokens.find((x) => x.metadata.address.toLowerCase() === addr.toLowerCase());
              if (t) setSelectedToken(t);
            }}
          />
        )}

        {/* VIEW 3: GRADUATION & DEX */}
        {activeTab === 'graduating' && (
          <GraduationTrackerView
            tokens={tokens}
            onSelectToken={(t) => setSelectedToken(t)}
          />
        )}

        {/* VIEW 4: TELEGRAM BOT & ALERTS */}
        {activeTab === 'telegram' && (
          <TelegramBotTerminal
            alerts={alerts}
            onTriggerTestAlert={handleTriggerTestAlert}
            onInspectTokenAddress={(addr) => {
              const t = tokens.find((x) => x.metadata.address.toLowerCase() === addr.toLowerCase());
              if (t) setSelectedToken(t);
            }}
          />
        )}

        {/* VIEW 5: PAPER TRADING */}
        {activeTab === 'paper' && (
          <PaperTradingView
            onSelectTokenAddress={(addr) => {
              const t = tokens.find((x) => x.metadata.address.toLowerCase() === addr.toLowerCase());
              if (t) setSelectedToken(t);
            }}
            onExecutePaperTrade={handleExecutePaperTrade}
          />
        )}

        {/* VIEW 6: HISTORICAL BACKTESTING */}
        {activeTab === 'backtest' && <BacktestingView />}
      </main>

      {/* Modal Inspector */}
      {selectedToken && (
        <TokenDetailModal
          token={selectedToken}
          onClose={() => setSelectedToken(null)}
          onExecutePaperTrade={handleExecutePaperTrade}
        />
      )}

      {/* Infrastructure Health Modal */}
      <SystemHealthModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
        status={systemStatus}
      />
    </div>
  );
}
