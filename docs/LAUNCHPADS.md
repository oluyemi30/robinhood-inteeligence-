# Robinhood Chain Launchpad Registry & Adapters

This document details verified and supported meme coin launchpads on Robinhood Chain (Chain ID: 4663), their bonding curve mechanics, graduation destinations, and adapter architectures.

---

## Architecture Principle

No launchpad logic is hardcoded directly into the core token discovery pipeline. All launchpads implement the `LaunchpadAdapter` interface and are registered in `LaunchpadRegistry`.

```typescript
export interface LaunchpadAdapter {
  name: string;
  chain: string;
  type: 'bonding_curve' | 'fair_launch' | 'liquidity_pool' | 'ai_agent';
  version: string;
  contracts: {
    factory?: `0x${string}`;
    router?: `0x${string}`;
    bondingCurve?: `0x${string}`;
  };
  eventSignatures: {
    tokenCreated?: string;
    tokenGraduated?: string;
    trade?: string;
  };
  detectLaunch(log: unknown): Promise<DiscoveredTokenMetadata | null>;
  calculateProgress(data: LaunchpadProgressInput): number;
  detectGraduation(log: unknown): boolean;
  getExplorerUrl(address: string): string;
}
```

---

## Verified Launchpads on Robinhood Chain

### 1. hood.fun (Primary)
- **Status:** VERIFIED & ACTIVE
- **Type:** Fair launch bonding curve
- **Graduation DEX:** Uniswap v3 on Robinhood Chain
- **Mechanism:**
  - Users deposit ETH into the bonding curve to mint tokens.
  - As market cap reaches graduation threshold (~$65k–$80k equivalent), 100% of collected liquidity is migrated to Uniswap v3 pool and LP is permanently burned/locked.
- **Progress Calculation:**
  - Progress % = `(currentEthCollected / targetGraduationEth) * 100`
  - Milestones: 25%, 50%, 75%, 90%, 100% (Graduated).
- **Event Signature:** `TokenCreated(address indexed token, address indexed creator, string name, string symbol, uint256 initialLiquidity)`

---

### 2. LaunchHood
- **Status:** VERIFIED & ACTIVE
- **Type:** Fair launchpad with dynamic slippage curve
- **Graduation DEX:** Uniswap v3
- **Mechanism:** Progressively shifts tokens into standard AMM pairs upon cap threshold.

---

### 3. Bags.fm
- **Status:** VERIFIED & ACTIVE
- **Type:** Social bonding curve platform
- **Graduation DEX:** Uniswap v3 / Automated pool creation
- **Key Feature:** Embedded creator fee splits and social tracking (Twitter handles attached in token metadata).

---

### 4. Flap.sh
- **Status:** VERIFIED & ACTIVE
- **Type:** Micro-cap meme token launchpad
- **Graduation DEX:** Uniswap v3

---

### 5. Virtuals / Clanker / Bankr Bot / Ape.store / Klik Finance
- **Status:** INTEGRATED VIA ADAPTER REGISTRY
- **Classification:**
  - Virtuals: AI Agent tokens deployed on Robinhood Chain.
  - Clanker / Bankr: Autonomous agent/social contract deployers.
  - Ape.store / Klik / Pons / Pools.trade / Trench.today: Supported through standard ERC-20 factory and event normalization adapters.

---

## Fallback Factory & Generic ERC-20 Adapter

To ensure zero missing tokens even for newly deployed stealth launchpads, the `GenericEVMAdapter` monitors:
- Standard Uniswap v3 / v4 `PoolCreated` events.
- ERC-20 initial `Transfer(address(0), creator, totalSupply)` mint events.
- Bytecode creation transactions originating with standard meme coin token bytecodes.
