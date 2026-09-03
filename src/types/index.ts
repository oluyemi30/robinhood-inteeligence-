export type LaunchpadName =
  | 'hood.fun'
  | 'LaunchHood'
  | 'Bags.fm'
  | 'Flap.sh'
  | 'Virtuals'
  | 'Clanker'
  | 'Ape.store'
  | 'Bankr Bot'
  | 'Klik Finance'
  | 'Pons'
  | 'pools.trade'
  | 'trench.today'
  | 'Generic';

export type MomentumTier =
  | 'DEAD'
  | 'WEAK'
  | 'BUILDING'
  | 'STRONG'
  | 'VERY STRONG'
  | 'EXTREME';

export type RiskTier = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'EXTREME';

export type RecommendedAction =
  | 'IGNORE'
  | 'WATCH'
  | 'EARLY_WATCH'
  | 'HIGH_MOMENTUM'
  | 'HIGH_RISK'
  | 'EXTREME_RISK';

export type WalletLabel =
  | 'WHALE'
  | 'EARLY_BUYER'
  | 'PROFITABLE_TRADER'
  | 'CREATOR'
  | 'LP_PROVIDER'
  | 'BOT'
  | 'HIGH_FREQUENCY'
  | 'REGULAR';

export interface TokenMetadata {
  id: string;
  chainId: number;
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  creator: `0x${string}`;
  launchpad: LaunchpadName;
  launchTimestamp: number;
  creationBlock: number;
  creationTxHash: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  image?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TokenMetrics {
  priceUsd: number;
  priceEth: number;
  marketCapUsd: number;
  liquidityUsd: number;
  initialLiquidityUsd: number;
  volume15s: number;
  volume1m: number;
  volume5m: number;
  volume15m: number;
  volume1h: number;
  volume24h: number;
  buys1m: number;
  sells1m: number;
  buys5m: number;
  sells5m: number;
  uniqueBuyers1m: number;
  uniqueSellers1m: number;
  uniqueBuyers5m: number;
  uniqueSellers5m: number;
  buySellRatio: number;
  buyPressureScore: number; // 0 - 100
  netFlowUsd1m: number;
  netFlowUsd5m: number;
  priceChange15s: number;
  priceChange1m: number;
  priceChange5m: number;
  priceChange15m: number;
  priceChange1h: number;
  priceChange24h: number;
  volumeAcceleration: number; // multiplier e.g. 3.5x
  priceAcceleration: number;
  buyerAcceleration: number;
  transactionAcceleration: number;
  holderCount: number;
  holderGrowth5m: number;
  top10Concentration: number; // 0 - 100%
  top20Concentration: number;
  creatorHoldingsPercent: number;
  creatorHasSold: boolean;
  bondingCurveProgress: number; // 0 - 100%
  isGraduated: boolean;
  graduatedDex?: string;
  graduatedPool?: string;
  liquidityChange1mPercent: number;
  liquidityChange5mPercent: number;
  momentumScore: number; // 0 - 100
  momentumTier: MomentumTier;
  riskScore: number; // 0 - 100
  riskTier: RiskTier;
  overallScore: number; // 0 - 100
  lastUpdated: number;
}

export interface TokenWithMetrics {
  metadata: TokenMetadata;
  metrics: TokenMetrics;
}

export interface Trade {
  id: string;
  tokenAddress: `0x${string}`;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  trader: `0x${string}`;
  side: 'BUY' | 'SELL';
  amountToken: number;
  amountUsd: number;
  amountEth: number;
  priceUsd: number;
  pool: `0x${string}`;
  router?: `0x${string}`;
  gasUsedGwei?: number;
  slippagePercent?: number;
  walletLabel?: WalletLabel;
}

export interface HolderInfo {
  address: `0x${string}`;
  balance: number;
  percentage: number;
  usdValue: number;
  isCreator: boolean;
  isLp: boolean;
  isContract: boolean;
  isBurn: boolean;
  label?: WalletLabel;
}

export interface ContractSecurityAnalysis {
  address: `0x${string}`;
  isVerified: boolean;
  isProxy: boolean;
  ownerAddress?: `0x${string}`;
  renouncedOwnership: boolean;
  mintable: boolean;
  pausable: boolean;
  blacklistable: boolean;
  taxAdjustable: boolean;
  buyTaxPercent: number;
  sellTaxPercent: number;
  maxWalletRestriction: boolean;
  maxTransactionRestriction: boolean;
  honeypotRisk: boolean;
  hasDangerousFunctions: boolean;
  detectedFunctions: string[];
  securityScore: number; // 0 - 100 (100 = safest)
  riskLevel: RiskTier;
  notes: string[];
}

export interface WalletStats {
  address: `0x${string}`;
  totalTrades: number;
  profitableTrades: number;
  winRatePercent: number;
  avgReturnPercent: number;
  avgHoldingTimeMinutes: number;
  totalVolumeUsd: number;
  currentHoldingsUsd: number;
  labels: WalletLabel[];
}

export interface WhaleTransaction {
  id: string;
  txHash: string;
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  wallet: `0x${string}`;
  side: 'BUY' | 'SELL';
  amountUsd: number;
  currentPositionUsd: number;
  poolLiquidityUsd: number;
  timestamp: number;
  walletStats: {
    totalTrades: number;
    profitableTrades: number;
    winRatePercent: number;
    avgReturnPercent: number;
    avgHoldingTimeMinutes: number;
    totalVolumeUsd: number;
  };
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AIAnalysisResult {
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  summary: string;
  bullishSignals: string[];
  bearishSignals: string[];
  riskFactors: string[];
  momentumScore: number;
  riskScore: number;
  confidenceScore: number;
  action: RecommendedAction;
  generatedAt: number;
  isFallback?: boolean;
}

export type AlertType =
  | 'NEW_TOKEN'
  | 'FAST_MOVER'
  | 'WHALE_ACTIVITY'
  | 'LIQUIDITY_WARNING'
  | 'GRADUATION_MILESTONE'
  | 'TOKEN_GRADUATED'
  | 'CREATOR_SELL'
  | 'RISK_ALERT';

export type AlertPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface TelegramAlert {
  id: string;
  eventId: string;
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  type: AlertType;
  priority: AlertPriority;
  stage: 1 | 2; // 1 = Fast deterministic, 2 = AI enriched
  title: string;
  textMarkdown: string;
  textHtml: string;
  metricsSnapshot: {
    marketCapUsd: number;
    liquidityUsd: number;
    priceUsd: number;
    volume5mUsd: number;
    momentumScore: number;
    riskScore: number;
    overallScore: number;
  };
  aiAnalysis?: AIAnalysisResult;
  timestamp: number;
  delivered: boolean;
  deliveredAt?: number;
}

export interface PaperPosition {
  id: string;
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  amountTokens: number;
  entryPriceUsd: number;
  currentPriceUsd: number;
  investedUsd: number;
  currentValueUsd: number;
  unrealizedPnlUsd: number;
  unrealizedPnlPercent: number;
  openedAt: number;
  updatedAt: number;
}

export interface PaperTradeOrder {
  tokenAddress: `0x${string}`;
  side: 'BUY' | 'SELL';
  amountUsd: number;
  slippageTolerancePercent?: number;
}

export interface ProviderHealth {
  name: 'Bitquery' | 'Robinhood RPC' | 'GMGN API' | 'Telegram' | 'Gemini AI' | 'Database/Cache';
  status: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'NOT_CONFIGURED';
  latencyMs: number;
  lastSuccessTimestamp: number;
  errorCount: number;
  details?: string;
}

export interface SystemStatus {
  chainId: number;
  network: string;
  activeTokensCount: number;
  activeWhalesCount: number;
  processedTradesCount: number;
  alertsSentCount: number;
  latestBlock: number;
  detectionLatencyMs: number;
  providers: ProviderHealth[];
}
