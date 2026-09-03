import { LaunchpadAdapter, LaunchpadProgressInput } from '../types';
import { LaunchpadName, TokenMetadata } from '../../types';
import { LAUNCHPADS_CONFIG } from '../../config/launchpads';

export class HoodFunAdapter implements LaunchpadAdapter {
  public readonly name: LaunchpadName = 'hood.fun';
  public readonly chain = 'robinhood';
  public readonly type = 'bonding_curve' as const;
  public readonly version = 'v2-arbitrum-orbit';

  getContracts() {
    return {
      factory: LAUNCHPADS_CONFIG['hood.fun'].factoryAddress,
      router: '0x1707000000000000000000000000000000000010' as `0x${string}`,
      bondingCurve: '0x1707000000000000000000000000000000000020' as `0x${string}`,
    };
  }

  async detectTokenLaunch(payload: any): Promise<TokenMetadata | null> {
    if (!payload || !payload.address) return null;

    return {
      id: payload.address.toLowerCase(),
      chainId: 4663,
      address: payload.address as `0x${string}`,
      name: payload.name || 'Robinhood Meme',
      symbol: payload.symbol || 'HOOD',
      decimals: payload.decimals || 18,
      totalSupply: payload.totalSupply || '1000000000000000000000000000',
      creator: (payload.creator || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      launchpad: this.name,
      launchTimestamp: payload.launchTimestamp || Date.now(),
      creationBlock: payload.creationBlock || 18420000,
      creationTxHash: payload.creationTxHash || '0x' + '0'.repeat(64),
      website: payload.website,
      twitter: payload.twitter,
      telegram: payload.telegram,
      image: payload.image,
      description: payload.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  calculateProgress(input: LaunchpadProgressInput): number {
    const target = LAUNCHPADS_CONFIG['hood.fun'].targetGraduationMarketCapUsd;
    if (input.tokensSoldPercent !== undefined) {
      return Math.min(100, Math.max(0, input.tokensSoldPercent));
    }
    const rawProgress = (input.currentMarketCapUsd / target) * 100;
    return Math.min(100, Math.max(0, Math.round(rawProgress * 10) / 10));
  }

  detectGraduation(input: LaunchpadProgressInput) {
    const progress = this.calculateProgress(input);
    const isGraduated = progress >= 100 || input.currentMarketCapUsd >= LAUNCHPADS_CONFIG['hood.fun'].targetGraduationMarketCapUsd;
    return {
      isGraduated,
      progress,
      dex: LAUNCHPADS_CONFIG['hood.fun'].graduationDex,
    };
  }

  getExplorerUrl(address: `0x${string}`): string {
    return `https://explorer.robinhood.com/token/${address}`;
  }
}
