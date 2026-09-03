import { LaunchpadAdapter } from './types';
import { LaunchpadName } from '../types';
import { HoodFunAdapter } from './adapters/hoodFunAdapter';
import { LaunchHoodAdapter, BagsFmAdapter, GenericEVMAdapter } from './adapters/launchHoodAdapter';

export class LaunchpadRegistry {
  private static instance: LaunchpadRegistry;
  private adapters: Map<LaunchpadName, LaunchpadAdapter> = new Map();
  private addressToAdapter: Map<string, LaunchpadAdapter> = new Map();

  private constructor() {
    this.registerAdapter(new HoodFunAdapter());
    this.registerAdapter(new LaunchHoodAdapter());
    this.registerAdapter(new BagsFmAdapter());
    this.registerAdapter(new GenericEVMAdapter());
  }

  public static getInstance(): LaunchpadRegistry {
    if (!LaunchpadRegistry.instance) {
      LaunchpadRegistry.instance = new LaunchpadRegistry();
    }
    return LaunchpadRegistry.instance;
  }

  public registerAdapter(adapter: LaunchpadAdapter): void {
    this.adapters.set(adapter.name, adapter);
    const contracts = adapter.getContracts();
    if (contracts.factory) {
      this.addressToAdapter.set(contracts.factory.toLowerCase(), adapter);
    }
    if (contracts.bondingCurve) {
      this.addressToAdapter.set(contracts.bondingCurve.toLowerCase(), adapter);
    }
  }

  public getAdapter(name: LaunchpadName): LaunchpadAdapter {
    return this.adapters.get(name) || this.adapters.get('hood.fun')!;
  }

  public getAdapterByAddress(address: string): LaunchpadAdapter {
    return this.addressToAdapter.get(address.toLowerCase()) || this.getAdapter('hood.fun');
  }

  public getAllAdapters(): LaunchpadAdapter[] {
    return Array.from(this.adapters.values());
  }
}
