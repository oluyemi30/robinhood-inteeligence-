import { TokenMetrics, ContractSecurityAnalysis } from '../types';

export class DeterministicScoringEngine {
  public static calculateOverallScore(
    metrics: TokenMetrics,
    contractSecurity?: ContractSecurityAnalysis
  ): {
    overallScore: number;
    breakdown: {
      momentum: number;
      liquidity: number;
      volume: number;
      buyPressure: number;
      holderGrowth: number;
      whaleActivity: number;
      contractSafety: number;
      social: number;
    };
  } {
    // 1. Momentum (25%)
    const momentumScore = metrics.momentumScore || 50;

    // 2. Liquidity (15%)
    const liqUsd = metrics.liquidityUsd || 5000;
    const liquidityScore = Math.min(100, Math.max(10, Math.round((liqUsd / 50000) * 100)));

    // 3. Volume (15%)
    const vol5m = metrics.volume5m || 1000;
    const volumeScore = Math.min(100, Math.max(10, Math.round((vol5m / 30000) * 100)));

    // 4. Buy Pressure (10%)
    const buyPressureScore = metrics.buyPressureScore || 50;

    // 5. Holder Growth (10%)
    const growth = metrics.holderGrowth5m || 5;
    const holderGrowthScore = Math.min(100, Math.max(10, growth * 5));

    // 6. Whale Activity (10%)
    const whaleScore = metrics.volumeAcceleration > 2.5 ? 85 : 55;

    // 7. Contract Safety (10%)
    const contractSafetyScore = contractSecurity ? contractSecurity.securityScore : 80;

    // 8. Social (5%)
    const socialScore = 75;

    // Deterministic formula
    const overall =
      momentumScore * 0.25 +
      liquidityScore * 0.15 +
      volumeScore * 0.15 +
      buyPressureScore * 0.10 +
      holderGrowthScore * 0.10 +
      whaleScore * 0.10 +
      contractSafetyScore * 0.10 +
      socialScore * 0.05;

    const overallScore = Math.min(100, Math.max(5, Math.round(overall)));

    return {
      overallScore,
      breakdown: {
        momentum: momentumScore,
        liquidity: liquidityScore,
        volume: volumeScore,
        buyPressure: buyPressureScore,
        holderGrowth: holderGrowthScore,
        whaleActivity: whaleScore,
        contractSafety: contractSafetyScore,
        social: socialScore,
      },
    };
  }
}
