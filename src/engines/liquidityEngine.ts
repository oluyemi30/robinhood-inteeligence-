import { TokenMetrics } from '../types';

export class LiquidityEngine {
  public static evaluateLiquidityRisk(metrics: Partial<TokenMetrics>): {
    isCriticalDrop: boolean;
    dropPercent: number;
    severity: 'NONE' | 'LOW' | 'HIGH' | 'CRITICAL';
    message?: string;
  } {
    const change5m = metrics.liquidityChange5mPercent || 0;
    const change1m = metrics.liquidityChange1mPercent || 0;

    if (change1m <= -25 || change5m <= -35) {
      return {
        isCriticalDrop: true,
        dropPercent: Math.abs(Math.min(change1m, change5m)),
        severity: 'CRITICAL',
        message: `🚨 Critical liquidity withdrawal: ${Math.round(Math.min(change1m, change5m))}% in short window.`,
      };
    }

    if (change5m <= -15) {
      return {
        isCriticalDrop: false,
        dropPercent: Math.abs(change5m),
        severity: 'HIGH',
        message: `⚠️ Elevated liquidity outflow: ${Math.round(change5m)}% over 5 minutes.`,
      };
    }

    return {
      isCriticalDrop: false,
      dropPercent: 0,
      severity: 'NONE',
    };
  }
}

export class GraduationEngine {
  public static checkMilestones(currentProgress: number, previousProgress: number): {
    reachedMilestone: number | null;
    isGraduated: boolean;
  } {
    const milestones = [25, 50, 75, 90, 100];
    let reached: number | null = null;

    for (const m of milestones) {
      if (currentProgress >= m && previousProgress < m) {
        reached = m;
      }
    }

    return {
      reachedMilestone: reached,
      isGraduated: currentProgress >= 100,
    };
  }
}
