# Deterministic Scoring & Momentum System

The scoring engine calculates an objective 0–100 score from verified on-chain metrics before any AI evaluation.

## Component Weights

| Component | Weight | Key Inputs |
|-----------|--------|------------|
| **Momentum** | 25% | Price acceleration, 1m/5m volume velocity, buyer acceleration |
| **Liquidity Depth** | 15% | Absolute USD liquidity, liquidity-to-MCap ratio, LP stability |
| **Volume Velocity** | 15% | 5m volume vs 1h base, trade frequency |
| **Buy Pressure** | 10% | Buy/sell volume ratio, unique buyers vs sellers, net flow |
| **Holder Distribution** | 10% | Top 10 wallet concentration (<50%), unique holder growth |
| **Whale Activity** | 10% | Net whale accumulation, smart money wallet presence |
| **Contract Safety** | 10% | Verified bytecode, renounced ownership, no mint/pause/blacklist |
| **Social / Metadata** | 5% | Clean metadata, verified Telegram/Twitter links, website |

## Overall Formula

```
overallScore = (momentumScore * 0.25)
             + (liquidityScore * 0.15)
             + (volumeScore * 0.15)
             + (buyPressureScore * 0.10)
             + (holderGrowthScore * 0.10)
             + (whaleScore * 0.10)
             + (contractSafetyScore * 0.10)
             + (socialScore * 0.05)
```

## Momentum Classification
- `0–20`: **DEAD** (Inactive or abandoned)
- `21–40`: **WEAK** (Low volume, drifting downward)
- `41–60`: **BUILDING** (Positive net inflow, rising trade count)
- `61–75`: **STRONG** (Rapid buyer acceleration, volume doubling)
- `76–90`: **VERY STRONG** (Whale inflow, bonding curve rapidly filling)
- `91–100`: **EXTREME** (Exponential parabolic surge, fast-mover trigger)
