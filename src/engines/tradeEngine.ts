import { Trade, TokenMetrics } from '../types';

export class TradeEngine {
  public static calculateSide(trader: string, recipient: string, poolAddress: string): 'BUY' | 'SELL' {
    if (recipient.toLowerCase() === poolAddress.toLowerCase()) {
      return 'SELL';
    }
    return 'BUY';
  }

  public static calculateBuyPressureScore(metrics: Partial<TokenMetrics>): number {
    const buyVol = metrics.volume5m ? metrics.volume5m * ((metrics.buys5m || 1) / Math.max((metrics.buys5m || 0) + (metrics.sells5m || 0), 1)) : 0;
    const sellVol = metrics.volume5m ? metrics.volume5m - buyVol : 0;

    const ratio = (metrics.buys5m || 0) / Math.max(metrics.sells5m || 1, 1);
    const volumeRatio = buyVol / Math.max(sellVol, 1);

    // Normalize ratio 0 to 100
    let score = 50;
    if (ratio > 1) {
      score += Math.min(40, (ratio - 1) * 8);
    } else {
      score -= Math.min(40, (1 - ratio) * 40);
    }

    // Weight volume ratio
    if (volumeRatio > 1) {
      score += Math.min(10, (volumeRatio - 1) * 2);
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  public static normalizeTrade(raw: any, pool: `0x${string}`): Trade {
    return {
      id: raw.id || `trade-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenAddress: raw.tokenAddress as `0x${string}`,
      txHash: raw.txHash || '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      blockNumber: raw.blockNumber || 18420150,
      timestamp: raw.timestamp || Date.now(),
      trader: raw.trader as `0x${string}`,
      side: raw.side || 'BUY',
      amountToken: raw.amountToken || 1_000_000,
      amountUsd: raw.amountUsd || 50,
      amountEth: (raw.amountUsd || 50) / 3000,
      priceUsd: raw.priceUsd || 0.00005,
      pool,
      walletLabel: raw.walletLabel,
    };
  }
}
