import { Trade, WhaleTransaction, WalletLabel } from '../types';

export interface WalletStats {
  address: `0x${string}`;
  totalTrades: number;
  profitableTrades: number;
  winRatePercent: number;
  avgReturnPercent: number;
  avgHoldingTimeMinutes: number;
  totalVolumeUsd: number;
  currentHoldingsUsd: number;
  labels: WalletLabel[];
}

export class WhaleTracker {
  private static instance: WhaleTracker;
  private walletStatsMap: Map<string, WalletStats> = new Map();

  private constructor() {
    this.seedKnownWallets();
  }

  public static getInstance(): WhaleTracker {
    if (!WhaleTracker.instance) {
      WhaleTracker.instance = new WhaleTracker();
    }
    return WhaleTracker.instance;
  }

  public calculateLargeTradeThreshold(poolLiquidityUsd: number): number {
    // Dynamic threshold: max($5,000, 1% of pool liquidity, or min $1,500 if low liquidity)
    const liquidityPercent = poolLiquidityUsd * 0.01;
    return Math.max(3000, Math.min(liquidityPercent, 25000));
  }

  public inspectTrade(trade: Trade, poolLiquidityUsd: number, tokenSymbol: string): WhaleTransaction | null {
    const threshold = this.calculateLargeTradeThreshold(poolLiquidityUsd);
    if (trade.amountUsd < threshold) {
      return null;
    }

    const stats = this.getOrCreateWalletStats(trade.trader);
    stats.totalTrades += 1;
    stats.totalVolumeUsd += trade.amountUsd;

    if (trade.side === 'BUY') {
      stats.currentHoldingsUsd += trade.amountUsd;
    } else {
      stats.currentHoldingsUsd = Math.max(0, stats.currentHoldingsUsd - trade.amountUsd);
    }

    let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (stats.totalTrades >= 20 && stats.winRatePercent >= 60) {
      confidence = 'HIGH';
    } else if (stats.totalTrades >= 5) {
      confidence = 'MEDIUM';
    }

    return {
      id: `whale-${trade.id}`,
      txHash: trade.txHash,
      tokenAddress: trade.tokenAddress,
      tokenSymbol,
      wallet: trade.trader,
      side: trade.side,
      amountUsd: trade.amountUsd,
      currentPositionUsd: stats.currentHoldingsUsd,
      poolLiquidityUsd,
      timestamp: trade.timestamp,
      walletStats: {
        totalTrades: stats.totalTrades,
        profitableTrades: stats.profitableTrades,
        winRatePercent: stats.winRatePercent,
        avgReturnPercent: stats.avgReturnPercent,
        avgHoldingTimeMinutes: stats.avgHoldingTimeMinutes,
        totalVolumeUsd: stats.totalVolumeUsd,
      },
      confidence,
    };
  }

  public getOrCreateWalletStats(wallet: string): WalletStats {
    const key = wallet.toLowerCase();
    const existing = this.walletStatsMap.get(key);
    if (existing) return existing;

    const initial: WalletStats = {
      address: wallet as `0x${string}`,
      totalTrades: 1,
      profitableTrades: 0,
      winRatePercent: 50,
      avgReturnPercent: 12.0,
      avgHoldingTimeMinutes: 24,
      totalVolumeUsd: 0,
      currentHoldingsUsd: 0,
      labels: ['WHALE'],
    };

    this.walletStatsMap.set(key, initial);
    return initial;
  }

  private seedKnownWallets() {
    const seed: WalletStats[] = [
      {
        address: '0x8888000000000000000000000000000000000042' as `0x${string}`,
        totalTrades: 48,
        profitableTrades: 33,
        winRatePercent: 68.7,
        avgReturnPercent: 84.5,
        avgHoldingTimeMinutes: 18,
        totalVolumeUsd: 420000,
        currentHoldingsUsd: 62000,
        labels: ['WHALE', 'PROFITABLE_TRADER'],
      },
      {
        address: '0x7777000000000000000000000000000000000019' as `0x${string}`,
        totalTrades: 36,
        profitableTrades: 26,
        winRatePercent: 72.2,
        avgReturnPercent: 114.0,
        avgHoldingTimeMinutes: 32,
        totalVolumeUsd: 310000,
        currentHoldingsUsd: 48000,
        labels: ['WHALE', 'EARLY_BUYER', 'PROFITABLE_TRADER'],
      },
      {
        address: '0x1111000000000000000000000000000000000088' as `0x${string}`,
        totalTrades: 194,
        profitableTrades: 98,
        winRatePercent: 50.5,
        avgReturnPercent: 8.5,
        avgHoldingTimeMinutes: 2,
        totalVolumeUsd: 890000,
        currentHoldingsUsd: 14000,
        labels: ['BOT', 'HIGH_FREQUENCY'],
      },
    ];

    for (const w of seed) {
      this.walletStatsMap.set(w.address.toLowerCase(), w);
    }
  }
}
