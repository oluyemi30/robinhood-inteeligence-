import { TokenMetrics, ContractSecurityAnalysis, RiskTier } from '../types';

export class RiskEngine {
  public static calculateRiskScore(
    metrics: Partial<TokenMetrics>,
    contractSecurity?: ContractSecurityAnalysis
  ): {
    riskScore: number;
    riskTier: RiskTier;
    factors: string[];
  } {
    let score = 20; // baseline moderate
    const factors: string[] = [];

    // 1. Contract Risk (100 is safe in contract analyzer, so invert to risk)
    if (contractSecurity) {
      const contractRisk = 100 - contractSecurity.securityScore;
      score += (contractRisk / 100) * 35; // up to 35 pts
      if (contractSecurity.mintable) factors.push('Mint function present in bytecode');
      if (contractSecurity.blacklistable) factors.push('Blacklisting enabled');
      if (contractSecurity.taxAdjustable) factors.push('Owner adjustable transfer fees');
    }

    // 2. Holder Concentration
    const top10 = metrics.top10Concentration || 30;
    if (top10 > 65) {
      score += 25;
      factors.push(`Severe top 10 holder concentration (${top10}%)`);
    } else if (top10 > 45) {
      score += 12;
      factors.push(`Elevated top 10 concentration (${top10}%)`);
    }

    // 3. Creator Actions
    if (metrics.creatorHasSold) {
      score += 30;
      factors.push('Creator dumped initial tokens');
    } else if ((metrics.creatorHoldingsPercent || 0) > 12) {
      score += 15;
      factors.push(`Creator controls ${metrics.creatorHoldingsPercent}% of supply`);
    }

    // 4. Liquidity Depth & Stability
    const liq = metrics.liquidityUsd || 5000;
    if (liq < 2500) {
      score += 25;
      factors.push(`Extremely thin liquidity ($${Math.round(liq)})`);
    } else if (liq < 8000) {
      score += 10;
      factors.push(`Shallow liquidity depth ($${Math.round(liq)})`);
    }

    if ((metrics.liquidityChange5mPercent || 0) <= -25) {
      score += 35;
      factors.push(`Rapid liquidity outflow (${Math.round(metrics.liquidityChange5mPercent || 0)}% in 5m)`);
    }

    // 5. Sell Pressure
    if ((metrics.buyPressureScore || 50) < 25) {
      score += 15;
      factors.push('Heavy unilateral selling pressure');
    }

    const finalScore = Math.min(100, Math.max(5, Math.round(score)));
    const riskTier = RiskEngine.classifyRisk(finalScore);

    return {
      riskScore: finalScore,
      riskTier,
      factors,
    };
  }

  public static classifyRisk(score: number): RiskTier {
    if (score <= 20) return 'LOW';
    if (score <= 40) return 'MODERATE';
    if (score <= 60) return 'ELEVATED';
    if (score <= 80) return 'HIGH';
    return 'EXTREME';
  }
}
