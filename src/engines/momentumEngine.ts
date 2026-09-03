import { TokenMetrics, MomentumTier } from '../types';

export class MomentumEngine {
  public static calculateMomentumScore(metrics: Partial<TokenMetrics>): {
    score: number;
    tier: MomentumTier;
    volumeAcceleration: number;
    priceAcceleration: number;
    buyerAcceleration: number;
    transactionAcceleration: number;
  } {
    // 1. Volume Acceleration (short window vs longer base)
    const vol5m = metrics.volume5m || 0;
    const vol15m = metrics.volume15m || vol5m;
    const volBaseEstimated = Math.max((vol15m - vol5m) / 2, 100);
    const volumeAcceleration = Math.min(15, Math.max(0.1, Math.round((vol5m / volBaseEstimated) * 10) / 10));

    // 2. Price Acceleration
    const p1m = metrics.priceChange1m || 0;
    const p5m = metrics.priceChange5m || 0;
    const priceAcceleration = Math.min(10, Math.max(0, Math.round((Math.max(0, p1m * 5) / Math.max(Math.abs(p5m), 1)) * 10) / 10));

    // 3. Buyer Acceleration
    const buyers1m = metrics.uniqueBuyers1m || 1;
    const buyers5m = metrics.uniqueBuyers5m || 5;
    const buyerAcceleration = Math.min(10, Math.max(0.1, Math.round((buyers1m / Math.max(buyers5m / 5, 0.5)) * 10) / 10));

    // 4. Transaction Acceleration
    const tx1m = (metrics.buys1m || 0) + (metrics.sells1m || 0);
    const tx5m = (metrics.buys5m || 0) + (metrics.sells5m || 0);
    const transactionAcceleration = Math.min(10, Math.max(0.1, Math.round((tx1m / Math.max(tx5m / 5, 0.5)) * 10) / 10));

    // 5. Buy Pressure component (0-100)
    const buyPressure = metrics.buyPressureScore || 50;

    // Composite Deterministic Momentum Score
    let rawScore = 0;
    rawScore += Math.min(35, volumeAcceleration * 7); // up to 35 pts
    rawScore += Math.min(25, (buyPressure / 100) * 25); // up to 25 pts
    rawScore += Math.min(20, buyerAcceleration * 4); // up to 20 pts
    rawScore += Math.min(20, Math.max(0, (metrics.priceChange5m || 0) * 0.5)); // up to 20 pts

    // Deductions for extreme selling
    if ((metrics.priceChange5m || 0) < -15) {
      rawScore -= Math.abs(metrics.priceChange5m || 0);
    }
    if ((metrics.liquidityChange5mPercent || 0) < -20) {
      rawScore -= 30;
    }

    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));
    const tier = MomentumEngine.classifyTier(finalScore);

    return {
      score: finalScore,
      tier,
      volumeAcceleration,
      priceAcceleration,
      buyerAcceleration,
      transactionAcceleration,
    };
  }

  public static classifyTier(score: number): MomentumTier {
    if (score <= 20) return 'DEAD';
    if (score <= 40) return 'WEAK';
    if (score <= 60) return 'BUILDING';
    if (score <= 75) return 'STRONG';
    if (score <= 90) return 'VERY STRONG';
    return 'EXTREME';
  }

  public static isFastMover(metrics: TokenMetrics): boolean {
    return (
      metrics.volumeAcceleration >= 3.0 ||
      metrics.priceChange5m >= 35.0 ||
      metrics.buyerAcceleration >= 2.5 ||
      metrics.momentumScore >= 80
    );
  }
}
