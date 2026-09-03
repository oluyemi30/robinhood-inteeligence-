import { LaunchpadAdapter, LaunchpadProgressInput } from '../types';
import { LaunchpadName, TokenMetadata } from '../../types';
import { LAUNCHPADS_CONFIG } from '../../config/launchpads';

export class LaunchHoodAdapter implements LaunchpadAdapter {
  public readonly name: LaunchpadName = 'LaunchHood';
  public readonly chain = 'robinhood';
  public readonly type = 'bonding_curve' as const;
  public readonly version = 'v1';

  getContracts() {
    return {
      factory: LAUNCHPADS_CONFIG['LaunchHood'].factoryAddress,
    };
  }

  async detectTokenLaunch(payload: any): Promise<TokenMetadata | null> {
    if (!payload?.address) return null;
    return {
      id: payload.address.toLowerCase(),
      chainId: 4663,
      address: payload.address as `0x${string}`,
      name: payload.name || 'LaunchHood Token',
      symbol: payload.symbol || 'LHOOD',
      decimals: payload.decimals || 18,
      totalSupply: payload.totalSupply || '1000000000000000000000000000',
      creator: (payload.creator || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      launchpad: this.name,
      launchTimestamp: payload.launchTimestamp || Date.now(),
      creationBlock: payload.creationBlock || 18420000,
      creationTxHash: payload.creationTxHash || '0x' + '0'.repeat(64),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  calculateProgress(input: LaunchpadProgressInput): number {
    const target = LAUNCHPADS_CONFIG['LaunchHood'].targetGraduationMarketCapUsd;
    const progress = (input.currentMarketCapUsd / target) * 100;
    return Math.min(100, Math.max(0, Math.round(progress * 10) / 10));
  }

  detectGraduation(input: LaunchpadProgressInput) {
    const progress = this.calculateProgress(input);
    return {
      isGraduated: progress >= 100,
      progress,
      dex: 'Uniswap v3',
    };
  }

  getExplorerUrl(address: `0x${string}`): string {
    return `https://explorer.robinhood.com/token/${address}`;
  }
}

export class BagsFmAdapter implements LaunchpadAdapter {
  public readonly name: LaunchpadName = 'Bags.fm';
  public readonly chain = 'robinhood';
  public readonly type = 'bonding_curve' as const;
  public readonly version = 'v1-social';

  getContracts() {
    return {
      factory: LAUNCHPADS_CONFIG['Bags.fm'].factoryAddress,
    };
  }

  async detectTokenLaunch(payload: any): Promise<TokenMetadata | null> {
    if (!payload?.address) return null;
    return {
      id: payload.address.toLowerCase(),
      chainId: 4663,
      address: payload.address as `0x${string}`,
      name: payload.name || 'Bags Token',
      symbol: payload.symbol || 'BAGS',
      decimals: payload.decimals || 18,
      totalSupply: payload.totalSupply || '1000000000000000000000000000',
      creator: (payload.creator || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      launchpad: this.name,
      launchTimestamp: payload.launchTimestamp || Date.now(),
      creationBlock: payload.creationBlock || 18420000,
      creationTxHash: payload.creationTxHash || '0x' + '0'.repeat(64),
      twitter: payload.twitter || 'https://x.com/bagsfm',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  calculateProgress(input: LaunchpadProgressInput): number {
    const target = LAUNCHPADS_CONFIG['Bags.fm'].targetGraduationMarketCapUsd;
    const progress = (input.currentMarketCapUsd / target) * 100;
    return Math.min(100, Math.max(0, Math.round(progress * 10) / 10));
  }

  detectGraduation(input: LaunchpadProgressInput) {
    const progress = this.calculateProgress(input);
    return {
      isGraduated: progress >= 100,
      progress,
      dex: 'Uniswap v3',
    };
  }

  getExplorerUrl(address: `0x${string}`): string {
    return `https://explorer.robinhood.com/token/${address}`;
  }
}

export class GenericEVMAdapter implements LaunchpadAdapter {
  public readonly name: LaunchpadName = 'Generic';
  public readonly chain = 'robinhood';
  public readonly type = 'liquidity_pool' as const;
  public readonly version = 'v1-evm';

  getContracts() {
    return {};
  }

  async detectTokenLaunch(payload: any): Promise<TokenMetadata | null> {
    if (!payload?.address) return null;
    return {
      id: payload.address.toLowerCase(),
      chainId: 4663,
      address: payload.address as `0x${string}`,
      name: payload.name || 'EVM Token',
      symbol: payload.symbol || 'TOKEN',
      decimals: payload.decimals || 18,
      totalSupply: payload.totalSupply || '1000000000000000000000000000',
      creator: (payload.creator || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      launchpad: this.name,
      launchTimestamp: payload.launchTimestamp || Date.now(),
      creationBlock: payload.creationBlock || 18420000,
      creationTxHash: payload.creationTxHash || '0x' + '0'.repeat(64),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  calculateProgress(input: LaunchpadProgressInput): number {
    return 100; // Directly created pool
  }

  detectGraduation(input: LaunchpadProgressInput) {
    return {
      isGraduated: true,
      progress: 100,
      dex: 'Uniswap v3',
    };
  }

  getExplorerUrl(address: `0x${string}`): string {
    return `https://explorer.robinhood.com/token/${address}`;
  }
}
