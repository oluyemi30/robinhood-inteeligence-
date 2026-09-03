import { TokenMetadata, TokenWithMetrics, LaunchpadName } from '../types';
import { LaunchpadRegistry } from '../launchpads/launchpadRegistry';
import { TokenStateEngine } from './tokenStateEngine';
import { ContractAnalyzer } from './contractAnalyzer';
import { RiskEngine } from './riskEngine';
import { MomentumEngine } from './momentumEngine';
import { DeterministicScoringEngine } from './deterministicScoringEngine';
import { AlertEngine } from './alertEngine';
import { TelegramBotService } from './telegramBotService';
import { AIAnalyst } from './aiAnalyst';

export class TokenDiscoveryService {
  private static instance: TokenDiscoveryService;

  private constructor() {}

  public static getInstance(): TokenDiscoveryService {
    if (!TokenDiscoveryService.instance) {
      TokenDiscoveryService.instance = new TokenDiscoveryService();
    }
    return TokenDiscoveryService.instance;
  }

  public async ingestNewToken(rawPayload: {
    address: `0x${string}`;
    name: string;
    symbol: string;
    launchpad: LaunchpadName;
    creator: `0x${string}`;
    initialLiquidityUsd?: number;
    website?: string;
    twitter?: string;
    telegram?: string;
    description?: string;
  }): Promise<TokenWithMetrics> {
    const adapter = LaunchpadRegistry.getInstance().getAdapter(rawPayload.launchpad);
    const sanitizedMetadata: TokenMetadata = {
      id: rawPayload.address.toLowerCase(),
      chainId: 4663,
      address: rawPayload.address,
      name: rawPayload.name.replace(/[<>]/g, '').trim(),
      symbol: rawPayload.symbol.replace(/[<>]/g, '').trim().toUpperCase(),
      decimals: 18,
      totalSupply: '1000000000000000000000000000',
      creator: rawPayload.creator,
      launchpad: rawPayload.launchpad,
      launchTimestamp: Date.now(),
      creationBlock: 18420220,
      creationTxHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      website: rawPayload.website,
      twitter: rawPayload.twitter,
      telegram: rawPayload.telegram,
      description: rawPayload.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const initialLiq = rawPayload.initialLiquidityUsd || 7500;
    const initialMcap = initialLiq * 1.5;

    // 1. Initial Contract Bytecode Inspection
    const security = ContractAnalyzer.analyzeBytecode(rawPayload.address, null, rawPayload.creator);

    // 2. Initial Metrics Calculation
    const momentumCalc = MomentumEngine.calculateMomentumScore({
      volume5m: initialLiq * 0.4,
      volume15m: initialLiq * 0.4,
      uniqueBuyers1m: 4,
      uniqueBuyers5m: 12,
      buys1m: 5,
      sells1m: 0,
      buys5m: 14,
      sells5m: 1,
      buyPressureScore: 85,
      priceChange5m: 12.0,
      liquidityUsd: initialLiq,
    });

    const riskCalc = RiskEngine.calculateRiskScore(
      {
        liquidityUsd: initialLiq,
        top10Concentration: 32.0,
        creatorHoldingsPercent: 3.5,
        creatorHasSold: false,
        buyPressureScore: 85,
      },
      security
    );

    const initialMetrics = {
      priceUsd: initialMcap / 1_000_000_000,
      priceEth: initialMcap / 1_000_000_000 / 3000,
      marketCapUsd: initialMcap,
      liquidityUsd: initialLiq,
      initialLiquidityUsd: initialLiq,
      volume15s: 320,
      volume1m: 1200,
      volume5m: initialLiq * 0.4,
      volume15m: initialLiq * 0.4,
      volume1h: initialLiq * 0.4,
      volume24h: initialLiq * 0.4,
      buys1m: 5,
      sells1m: 0,
      buys5m: 14,
      sells5m: 1,
      uniqueBuyers1m: 4,
      uniqueSellers1m: 0,
      uniqueBuyers5m: 12,
      uniqueSellers5m: 1,
      buySellRatio: 14.0,
      buyPressureScore: 85,
      netFlowUsd1m: 1200,
      netFlowUsd5m: 2800,
      priceChange15s: 2.1,
      priceChange1m: 6.4,
      priceChange5m: 12.0,
      priceChange15m: 12.0,
      priceChange1h: 12.0,
      priceChange24h: 12.0,
      volumeAcceleration: momentumCalc.volumeAcceleration,
      priceAcceleration: momentumCalc.priceAcceleration,
      buyerAcceleration: momentumCalc.buyerAcceleration,
      transactionAcceleration: momentumCalc.transactionAcceleration,
      holderCount: 28,
      holderGrowth5m: 28,
      top10Concentration: 32.0,
      top20Concentration: 45.0,
      creatorHoldingsPercent: 3.5,
      creatorHasSold: false,
      bondingCurveProgress: adapter.calculateProgress({ currentMarketCapUsd: initialMcap, currentLiquidityUsd: initialLiq }),
      isGraduated: false,
      liquidityChange1mPercent: 0,
      liquidityChange5mPercent: 0,
      momentumScore: momentumCalc.score,
      momentumTier: momentumCalc.tier,
      riskScore: riskCalc.riskScore,
      riskTier: riskCalc.riskTier,
      overallScore: 80,
      lastUpdated: Date.now(),
    };

    const overallCalc = DeterministicScoringEngine.calculateOverallScore(initialMetrics as any, security);
    initialMetrics.overallScore = overallCalc.overallScore;

    // 3. Register with TokenStateEngine
    const tokenRecord = TokenStateEngine.getInstance().setToken(sanitizedMetadata, initialMetrics);

    // 4. Two-Stage Alerting: Stage 1 Fast Deterministic Alert (Instant)
    const stage1Alert = AlertEngine.getInstance().buildNewTokenAlert(tokenRecord);
    await TelegramBotService.getInstance().sendAlert(stage1Alert);

    // 5. Stage 2 Asynchronous AI Enriched Alert
    setTimeout(async () => {
      try {
        const aiAnalysis = await AIAnalyst.getInstance().analyzeToken(tokenRecord, security);
        const stage2Alert = AlertEngine.getInstance().buildNewTokenAlert(tokenRecord, aiAnalysis);
        await TelegramBotService.getInstance().sendAlert(stage2Alert);
      } catch (err) {
        // Safe asynchronous AI alert
      }
    }, 1500);

    return tokenRecord;
  }
}
