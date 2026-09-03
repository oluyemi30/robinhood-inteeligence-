import { LaunchpadName, TokenMetadata } from '../types';

export interface LaunchpadProgressInput {
  currentMarketCapUsd: number;
  currentLiquidityUsd: number;
  tokensSoldPercent?: number;
}

export interface LaunchpadAdapter {
  name: LaunchpadName;
  chain: string;
  type: 'bonding_curve' | 'fair_launch' | 'liquidity_pool' | 'ai_agent';
  version: string;
  getContracts(): {
    factory?: `0x${string}`;
    router?: `0x${string}`;
    bondingCurve?: `0x${string}`;
  };
  detectTokenLaunch(payload: unknown): Promise<TokenMetadata | null>;
  calculateProgress(input: LaunchpadProgressInput): number;
  detectGraduation(input: LaunchpadProgressInput): {
    isGraduated: boolean;
    progress: number;
    dex: string;
  };
  getExplorerUrl(address: `0x${string}`): string;
}
