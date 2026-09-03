import { TokenMetadata, TokenMetrics, TokenWithMetrics, Trade, HolderInfo, WhaleTransaction } from '../types';
import { LaunchpadRegistry } from '../launchpads/launchpadRegistry';

export class TokenStateEngine {
  private static instance: TokenStateEngine;
  private tokens: Map<string, TokenWithMetrics> = new Map();
  private trades: Map<string, Trade[]> = new Map();
  private holders: Map<string, HolderInfo[]> = new Map();
  private whales: WhaleTransaction[] = [];
  private watchlist: Set<string> = new Set();
  private listeners: Set<(event: { type: string; data: any }) => void> = new Set();

  private constructor() {
    this.seedInitialRobinhoodTokens();
  }

  public static getInstance(): TokenStateEngine {
    if (!TokenStateEngine.instance) {
      TokenStateEngine.instance = new TokenStateEngine();
    }
    return TokenStateEngine.instance;
  }

  public subscribe(listener: (event: { type: string; data: any }) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public emit(type: string, data: any) {
    for (const listener of this.listeners) {
      try {
        listener({ type, data });
      } catch (err) {
        // Safe emission
      }
    }
  }

  public setToken(metadata: TokenMetadata, initialMetrics?: Partial<TokenMetrics>): TokenWithMetrics {
    const key = metadata.address.toLowerCase();
    const existing = this.tokens.get(key);

    const defaultMetrics: TokenMetrics = {
      priceUsd: 0.000042,
      priceEth: 0.000000014,
      marketCapUsd: 14200,
      liquidityUsd: 8500,
      initialLiquidityUsd: 8500,
      volume15s: 180,
      volume1m: 850,
      volume5m: 3400,
      volume15m: 8900,
      volume1h: 14200,
      volume24h: 14200,
      buys1m: 6,
      sells1m: 1,
      buys5m: 24,
      sells5m: 4,
      uniqueBuyers1m: 5,
      uniqueSellers1m: 1,
      uniqueBuyers5m: 18,
      uniqueSellers5m: 3,
      buySellRatio: 6.0,
      buyPressureScore: 78,
      netFlowUsd1m: 720,
      netFlowUsd5m: 2800,
      priceChange15s: 1.2,
      priceChange1m: 4.8,
      priceChange5m: 18.5,
      priceChange15m: 34.0,
      priceChange1h: 42.5,
      priceChange24h: 42.5,
      volumeAcceleration: 2.8,
      priceAcceleration: 2.1,
      buyerAcceleration: 2.4,
      transactionAcceleration: 2.6,
      holderCount: 42,
      holderGrowth5m: 14,
      top10Concentration: 32.5,
      top20Concentration: 48.0,
      creatorHoldingsPercent: 3.8,
      creatorHasSold: false,
      bondingCurveProgress: 21.0,
      isGraduated: false,
      liquidityChange1mPercent: 2.5,
      liquidityChange5mPercent: 12.0,
      momentumScore: 74,
      momentumTier: 'STRONG',
      riskScore: 32,
      riskTier: 'MODERATE',
      overallScore: 78,
      lastUpdated: Date.now(),
      ...initialMetrics,
    };

    const tokenRecord: TokenWithMetrics = {
      metadata,
      metrics: existing ? { ...existing.metrics, ...initialMetrics, lastUpdated: Date.now() } : defaultMetrics,
    };

    this.tokens.set(key, tokenRecord);
    this.emit('TOKEN_UPDATED', tokenRecord);
    return tokenRecord;
  }

  public getToken(address: string): TokenWithMetrics | undefined {
    return this.tokens.get(address.toLowerCase());
  }

  public getAllTokens(): TokenWithMetrics[] {
    return Array.from(this.tokens.values()).sort((a, b) => b.metrics.lastUpdated - a.metrics.lastUpdated);
  }

  public updateMetrics(address: string, updates: Partial<TokenMetrics>): TokenWithMetrics | undefined {
    const token = this.tokens.get(address.toLowerCase());
    if (!token) return undefined;

    token.metrics = {
      ...token.metrics,
      ...updates,
      lastUpdated: Date.now(),
    };

    this.tokens.set(address.toLowerCase(), token);
    this.emit('TOKEN_METRICS_UPDATED', token);
    return token;
  }

  public recordTrade(trade: Trade): void {
    const key = trade.tokenAddress.toLowerCase();
    const existing = this.trades.get(key) || [];
    existing.unshift(trade);
    if (existing.length > 200) existing.pop();
    this.trades.set(key, existing);

    // Update dynamic rolling metrics
    const token = this.tokens.get(key);
    if (token) {
      const isBuy = trade.side === 'BUY';
      const m = token.metrics;

      m.volume1m += trade.amountUsd;
      m.volume5m += trade.amountUsd;
      if (isBuy) {
        m.buys1m += 1;
        m.buys5m += 1;
        m.netFlowUsd1m += trade.amountUsd;
        m.netFlowUsd5m += trade.amountUsd;
        m.priceUsd *= 1 + (trade.amountUsd / Math.max(m.liquidityUsd * 2, 1000));
      } else {
        m.sells1m += 1;
        m.sells5m += 1;
        m.netFlowUsd1m -= trade.amountUsd;
        m.netFlowUsd5m -= trade.amountUsd;
        m.priceUsd *= Math.max(0.000001, 1 - (trade.amountUsd / Math.max(m.liquidityUsd * 2, 1000)));
      }

      m.marketCapUsd = m.priceUsd * 1_000_000_000;
      m.buySellRatio = m.sells5m > 0 ? Math.round((m.buys5m / m.sells5m) * 100) / 100 : m.buys5m;
      m.lastUpdated = Date.now();

      // Check bonding curve progress
      const adapter = LaunchpadRegistry.getInstance().getAdapter(token.metadata.launchpad);
      const progress = adapter.calculateProgress({
        currentMarketCapUsd: m.marketCapUsd,
        currentLiquidityUsd: m.liquidityUsd,
      });
      m.bondingCurveProgress = progress;
      if (progress >= 100 && !m.isGraduated) {
        m.isGraduated = true;
        m.graduatedDex = 'Uniswap v3';
        this.emit('GRADUATION', { token, progress });
      }

      this.tokens.set(key, token);
      this.emit('TRADE', { trade, token });
    }
  }

  public getTrades(address: string): Trade[] {
    return this.trades.get(address.toLowerCase()) || [];
  }

  public recordWhale(whaleTx: WhaleTransaction): void {
    this.whales.unshift(whaleTx);
    if (this.whales.length > 100) this.whales.pop();
    this.emit('WHALE', whaleTx);
  }

  public getWhales(): WhaleTransaction[] {
    return this.whales;
  }

  public getHolders(address: string): HolderInfo[] {
    const key = address.toLowerCase();
    if (this.holders.has(key)) {
      return this.holders.get(key)!;
    }

    const token = this.tokens.get(key);
    const m = token?.metrics;
    const top10 = m?.top10Concentration || 35;

    // Deterministic realistic top holders breakdown based on token metrics
    const sampleHolders: HolderInfo[] = [
      {
        address: (token?.metadata.creator || '0x4663e77f00000000000000000000000000000001') as `0x${string}`,
        balance: 38_000_000,
        percentage: m?.creatorHoldingsPercent || 3.8,
        usdValue: (m?.marketCapUsd || 15000) * ((m?.creatorHoldingsPercent || 3.8) / 100),
        isCreator: true,
        isLp: false,
        isContract: false,
        isBurn: false,
        label: 'CREATOR',
      },
      {
        address: '0x1707000000000000000000000000000000000020' as `0x${string}`,
        balance: 200_000_000,
        percentage: 20.0,
        usdValue: (m?.marketCapUsd || 15000) * 0.2,
        isCreator: false,
        isLp: true,
        isContract: true,
        isBurn: false,
        label: 'LP_PROVIDER',
      },
      {
        address: '0x8888000000000000000000000000000000000042' as `0x${string}`,
        balance: 62_000_000,
        percentage: 6.2,
        usdValue: (m?.marketCapUsd || 15000) * 0.062,
        isCreator: false,
        isLp: false,
        isContract: false,
        isBurn: false,
        label: 'WHALE',
      },
      {
        address: '0x7777000000000000000000000000000000000019' as `0x${string}`,
        balance: 48_000_000,
        percentage: 4.8,
        usdValue: (m?.marketCapUsd || 15000) * 0.048,
        isCreator: false,
        isLp: false,
        isContract: false,
        isBurn: false,
        label: 'PROFITABLE_TRADER',
      },
      {
        address: '0x9999000000000000000000000000000000000077' as `0x${string}`,
        balance: 31_000_000,
        percentage: 3.1,
        usdValue: (m?.marketCapUsd || 15000) * 0.031,
        isCreator: false,
        isLp: false,
        isContract: false,
        isBurn: false,
        label: 'EARLY_BUYER',
      },
    ];

    this.holders.set(key, sampleHolders);
    return sampleHolders;
  }

  public toggleWatchlist(address: string): boolean {
    const key = address.toLowerCase();
    if (this.watchlist.has(key)) {
      this.watchlist.delete(key);
      return false;
    } else {
      this.watchlist.add(key);
      return true;
    }
  }

  public isWatchlisted(address: string): boolean {
    return this.watchlist.has(address.toLowerCase());
  }

  public getWatchlistTokens(): TokenWithMetrics[] {
    return Array.from(this.watchlist)
      .map((addr) => this.tokens.get(addr))
      .filter((t): t is TokenWithMetrics => !!t);
  }

  private seedInitialRobinhoodTokens(): void {
    const now = Date.now();

    const seeds: { meta: TokenMetadata; metrics: Partial<TokenMetrics> }[] = [
      {
        meta: {
          id: '0x4663a11000000000000000000000000000000001',
          chainId: 4663,
          address: '0x4663a11000000000000000000000000000000001' as `0x${string}`,
          name: 'Sheriff Robin',
          symbol: 'SHERIFF',
          decimals: 18,
          totalSupply: '1000000000000000000000000000',
          creator: '0x71C8A50135F910C1100000000000000000000001' as `0x${string}`,
          launchpad: 'hood.fun',
          launchTimestamp: now - 3 * 60 * 1000,
          creationBlock: 18420100,
          creationTxHash: '0x8f19823485002010293849102938491029384910293849102938491029384910',
          twitter: 'https://x.com/sheriff_robin_rh',
          telegram: 'https://t.me/sheriff_robinhood',
          description: 'The native law enforcer of Robinhood Chain meme trenches.',
          createdAt: now - 3 * 60 * 1000,
          updatedAt: now,
        },
        metrics: {
          priceUsd: 0.000062,
          priceEth: 0.000000021,
          marketCapUsd: 62000,
          liquidityUsd: 48500,
          volume5m: 38400,
          volume15m: 72000,
          volumeAcceleration: 4.6,
          priceAcceleration: 3.2,
          buyerAcceleration: 3.5,
          transactionAcceleration: 3.8,
          buys5m: 142,
          sells5m: 18,
          buySellRatio: 7.89,
          buyPressureScore: 89,
          bondingCurveProgress: 91.2,
          isGraduated: false,
          momentumScore: 94,
          momentumTier: 'EXTREME',
          riskScore: 24,
          riskTier: 'MODERATE',
          overallScore: 92,
          priceChange5m: 68.4,
          priceChange1m: 14.2,
          holderCount: 384,
          top10Concentration: 28.4,
          creatorHoldingsPercent: 2.1,
          creatorHasSold: false,
        },
      },
      {
        meta: {
          id: '0x4663a22000000000000000000000000000000002',
          chainId: 4663,
          address: '0x4663a22000000000000000000000000000000002' as `0x${string}`,
          name: 'Green Arrow',
          symbol: 'ARROW',
          decimals: 18,
          totalSupply: '1000000000000000000000000000',
          creator: '0x71C8A50135F910C1100000000000000000000002' as `0x${string}`,
          launchpad: 'LaunchHood',
          launchTimestamp: now - 18 * 60 * 1000,
          creationBlock: 18419800,
          creationTxHash: '0x7a29823485002010293849102938491029384910293849102938491029384911',
          description: 'Only green candles allowed on Sherwood forest L2.',
          createdAt: now - 18 * 60 * 1000,
          updatedAt: now,
        },
        metrics: {
          priceUsd: 0.000084,
          priceEth: 0.000000028,
          marketCapUsd: 84000,
          liquidityUsd: 68000,
          volume5m: 54000,
          volume15m: 110000,
          volumeAcceleration: 3.2,
          priceAcceleration: 2.4,
          buys5m: 88,
          sells5m: 34,
          buySellRatio: 2.58,
          buyPressureScore: 76,
          bondingCurveProgress: 100,
          isGraduated: true,
          graduatedDex: 'Uniswap v3',
          momentumScore: 82,
          momentumTier: 'VERY STRONG',
          riskScore: 28,
          riskTier: 'MODERATE',
          overallScore: 86,
          priceChange5m: 24.5,
          holderCount: 512,
          top10Concentration: 34.0,
          creatorHoldingsPercent: 3.5,
        },
      },
      {
        meta: {
          id: '0x4663a33000000000000000000000000000000003',
          chainId: 4663,
          address: '0x4663a33000000000000000000000000000000003' as `0x${string}`,
          name: 'Friar Tuck',
          symbol: 'TUCK',
          decimals: 18,
          totalSupply: '1000000000000000000000000000',
          creator: '0x71C8A50135F910C1100000000000000000000003' as `0x${string}`,
          launchpad: 'Bags.fm',
          launchTimestamp: now - 45 * 1000, // 45 seconds ago (New Launch)
          creationBlock: 18420190,
          creationTxHash: '0x6b39823485002010293849102938491029384910293849102938491029384912',
          twitter: 'https://x.com/bagsfm',
          description: 'Blessing the Robinhood memecoin traders with holy alpha.',
          createdAt: now - 45 * 1000,
          updatedAt: now,
        },
        metrics: {
          priceUsd: 0.000018,
          priceEth: 0.000000006,
          marketCapUsd: 18000,
          liquidityUsd: 12000,
          volume5m: 8200,
          volume15m: 8200,
          volumeAcceleration: 5.8,
          buys5m: 38,
          sells5m: 2,
          buySellRatio: 19.0,
          buyPressureScore: 92,
          bondingCurveProgress: 27.7,
          isGraduated: false,
          momentumScore: 88,
          momentumTier: 'VERY STRONG',
          riskScore: 36,
          riskTier: 'MODERATE',
          overallScore: 84,
          priceChange5m: 42.0,
          priceChange1m: 18.0,
          holderCount: 78,
          top10Concentration: 42.0,
          creatorHoldingsPercent: 4.0,
        },
      },
      {
        meta: {
          id: '0x4663a44000000000000000000000000000000004',
          chainId: 4663,
          address: '0x4663a44000000000000000000000000000000004' as `0x${string}`,
          name: 'Nottingham Trap',
          symbol: 'TRAP',
          decimals: 18,
          totalSupply: '1000000000000000000000000000',
          creator: '0x9999950135F910C1100000000000000000000099' as `0x${string}`,
          launchpad: 'hood.fun',
          launchTimestamp: now - 8 * 60 * 1000,
          creationBlock: 18420010,
          creationTxHash: '0x5c49823485002010293849102938491029384910293849102938491029384913',
          description: 'Meme with high concentration risk and creator selling.',
          createdAt: now - 8 * 60 * 1000,
          updatedAt: now,
        },
        metrics: {
          priceUsd: 0.000006,
          priceEth: 0.000000002,
          marketCapUsd: 6000,
          liquidityUsd: 3100,
          volume5m: 1200,
          volume15m: 6400,
          volumeAcceleration: 0.4,
          buys5m: 4,
          sells5m: 29,
          buySellRatio: 0.14,
          buyPressureScore: 12,
          bondingCurveProgress: 8.8,
          isGraduated: false,
          momentumScore: 15,
          momentumTier: 'DEAD',
          riskScore: 86,
          riskTier: 'EXTREME',
          overallScore: 22,
          priceChange5m: -58.4,
          liquidityChange5mPercent: -42.0,
          holderCount: 31,
          top10Concentration: 74.5,
          creatorHoldingsPercent: 0.2,
          creatorHasSold: true,
        },
      },
    ];

    for (const seed of seeds) {
      this.setToken(seed.meta, seed.metrics);
    }
  }
}
