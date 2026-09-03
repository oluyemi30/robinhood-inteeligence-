import { TokenMetadata, TokenMetrics, Trade, HolderInfo, ContractSecurityAnalysis, ProviderHealth } from '../types';

export interface BlockchainProvider {
  name: string;
  getBlockNumber(): Promise<bigint>;
  getBlock(blockNumber?: bigint): Promise<{ number: bigint; timestamp: bigint; hash: string } | null>;
  getLogs(filter: {
    address?: `0x${string}` | `0x${string}`[];
    fromBlock?: bigint;
    toBlock?: bigint;
    topics?: (`0x${string}` | `0x${string}`[] | null)[];
  }): Promise<unknown[]>;
  getBytecode(address: `0x${string}`): Promise<`0x${string}` | null>;
  readContract(params: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
  }): Promise<unknown>;
  getHealth(): Promise<ProviderHealth>;
}

export interface MarketDataProvider {
  name: string;
  getToken(address: `0x${string}`): Promise<TokenMetadata | null>;
  getRecentTrades(address: `0x${string}`, limit?: number): Promise<Trade[]>;
  getHolders(address: `0x${string}`, limit?: number): Promise<HolderInfo[]>;
  getMetrics(address: `0x${string}`): Promise<Partial<TokenMetrics> | null>;
  getHealth(): Promise<ProviderHealth>;
}

export interface LaunchpadProvider {
  detectLaunches(): Promise<TokenMetadata[]>;
  detectGraduations(): Promise<{ tokenAddress: `0x${string}`; progress: number; isGraduated: boolean }[]>;
}
