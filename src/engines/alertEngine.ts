import { TelegramAlert, AlertType, AlertPriority, TokenWithMetrics, AIAnalysisResult, WhaleTransaction } from '../types';

export class AlertEngine {
  private static instance: AlertEngine;
  private sentEventIds: Set<string> = new Set();
  private alertsHistory: TelegramAlert[] = [];
  private lastAlertStateByToken: Map<
    string,
    {
      priceUsd: number;
      volume5m: number;
      liquidityUsd: number;
      riskScore: number;
      momentumScore: number;
      timestamp: number;
    }
  > = new Map();

  private constructor() {}

  public static getInstance(): AlertEngine {
    if (!AlertEngine.instance) {
      AlertEngine.instance = new AlertEngine();
    }
    return AlertEngine.instance;
  }

  public isDuplicate(eventId: string): boolean {
    return this.sentEventIds.has(eventId);
  }

  public recordSent(alert: TelegramAlert): void {
    this.sentEventIds.add(alert.eventId);
    this.alertsHistory.unshift(alert);
    if (this.alertsHistory.length > 200) this.alertsHistory.pop();

    this.lastAlertStateByToken.set(alert.tokenAddress.toLowerCase(), {
      priceUsd: alert.metricsSnapshot.priceUsd,
      volume5m: alert.metricsSnapshot.volume5mUsd,
      liquidityUsd: alert.metricsSnapshot.liquidityUsd,
      riskScore: alert.metricsSnapshot.riskScore,
      momentumScore: alert.metricsSnapshot.momentumScore,
      timestamp: alert.timestamp,
    });
  }

  public getRecentAlerts(limit = 50): TelegramAlert[] {
    return this.alertsHistory.slice(0, limit);
  }

  public checkMaterialChange(token: TokenWithMetrics): boolean {
    const prev = this.lastAlertStateByToken.get(token.metadata.address.toLowerCase());
    if (!prev) return true; // No prior alert, can alert

    const m = token.metrics;
    const priceDiff = Math.abs((m.priceUsd - prev.priceUsd) / prev.priceUsd) * 100;
    const volDiff = Math.abs((m.volume5m - prev.volume5m) / Math.max(prev.volume5m, 100)) * 100;
    const liqDiff = Math.abs((m.liquidityUsd - prev.liquidityUsd) / Math.max(prev.liquidityUsd, 100)) * 100;
    const riskDiff = Math.abs(m.riskScore - prev.riskScore);
    const momDiff = Math.abs(m.momentumScore - prev.momentumScore);

    return (
      priceDiff >= 10.0 ||
      volDiff >= 25.0 ||
      liqDiff >= 15.0 ||
      riskDiff >= 10 ||
      momDiff >= 10
    );
  }

  public buildNewTokenAlert(token: TokenWithMetrics, aiAnalysis?: AIAnalysisResult): TelegramAlert {
    const meta = token.metadata;
    const m = token.metrics;
    const ageSec = Math.max(1, Math.round((Date.now() - meta.launchTimestamp) / 1000));
    const eventId = `NEW-${meta.address.toLowerCase()}-${meta.creationTxHash.slice(0, 10)}`;

    const textMarkdown = `🚨 *NEW ROBINHOOD MEME COIN*

*$${meta.symbol}* — ${meta.name}
Launchpad: *${meta.launchpad}*
Age: *${ageSec}s*
Contract: \`${meta.address}\`

💰 *Initial Liquidity:* $${Math.round(m.liquidityUsd).toLocaleString()}
📊 *Market Cap:* $${Math.round(m.marketCapUsd).toLocaleString()}
📈 *Volume 5m:* $${Math.round(m.volume5m).toLocaleString()}
👥 *Buys / Sells:* ${m.buys5m} / ${m.sells5m}
⚡ *Buy Pressure:* ${m.buyPressureScore}/100
🛡️ *Risk Score:* ${m.riskScore}/100 (${m.riskTier})
🔥 *Momentum:* ${m.momentumScore}/100 (${m.momentumTier})
🎯 *Overall:* ${m.overallScore}/100

${aiAnalysis ? `🧠 *AI Verdict:*\n_"${aiAnalysis.summary}"_` : '⏳ _Analyzing contract and initial order flow..._'}`;

    return {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventId,
      tokenAddress: meta.address,
      tokenSymbol: meta.symbol,
      type: 'NEW_TOKEN',
      priority: 'P2',
      stage: aiAnalysis ? 2 : 1,
      title: `🚨 NEW TOKEN: $${meta.symbol} on ${meta.launchpad}`,
      textMarkdown,
      textHtml: textMarkdown.replace(/\*/g, '<b>').replace(/\`/g, '<code>'),
      metricsSnapshot: {
        marketCapUsd: m.marketCapUsd,
        liquidityUsd: m.liquidityUsd,
        priceUsd: m.priceUsd,
        volume5mUsd: m.volume5m,
        momentumScore: m.momentumScore,
        riskScore: m.riskScore,
        overallScore: m.overallScore,
      },
      aiAnalysis,
      timestamp: Date.now(),
      delivered: false,
    };
  }

  public buildFastMoverAlert(token: TokenWithMetrics, aiAnalysis?: AIAnalysisResult): TelegramAlert {
    const meta = token.metadata;
    const m = token.metrics;
    const eventId = `MOVER-${meta.address.toLowerCase()}-${Math.floor(Date.now() / 60000)}`;

    const textMarkdown = `⚡ *FAST MOVER ALERT*

*$${meta.symbol}* on Robinhood Chain
🚀 *+${Math.round(m.priceChange5m)}%* in 5m
📈 *Volume 5m:* $${Math.round(m.volume5m).toLocaleString()} (Acceleration: ${m.volumeAcceleration}x)
💧 *Liquidity:* $${Math.round(m.liquidityUsd).toLocaleString()}
⚡ *Buy Pressure:* ${m.buyPressureScore}%
👥 *New Holders 5m:* +${m.holderGrowth5m}
🔥 *Momentum Score:* ${m.momentumScore}/100 (${m.momentumTier})
🛡️ *Risk Score:* ${m.riskScore}/100 (${m.riskTier})
🎯 *Graduation:* ${m.bondingCurveProgress}%

${aiAnalysis ? `🧠 *AI Telemetry:*\n_"${aiAnalysis.summary}"_` : ''}`;

    return {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventId,
      tokenAddress: meta.address,
      tokenSymbol: meta.symbol,
      type: 'FAST_MOVER',
      priority: 'P1',
      stage: aiAnalysis ? 2 : 1,
      title: `⚡ FAST MOVER: $${meta.symbol} (+${Math.round(m.priceChange5m)}% 5m)`,
      textMarkdown,
      textHtml: textMarkdown.replace(/\*/g, '<b>').replace(/\`/g, '<code>'),
      metricsSnapshot: {
        marketCapUsd: m.marketCapUsd,
        liquidityUsd: m.liquidityUsd,
        priceUsd: m.priceUsd,
        volume5mUsd: m.volume5m,
        momentumScore: m.momentumScore,
        riskScore: m.riskScore,
        overallScore: m.overallScore,
      },
      aiAnalysis,
      timestamp: Date.now(),
      delivered: false,
    };
  }

  public buildWhaleAlert(whale: WhaleTransaction): TelegramAlert {
    const eventId = `WHALE-${whale.txHash}`;
    const textMarkdown = `🐋 *WHALE TRANSACTION DETECTED*

*$${whale.tokenSymbol}* on Robinhood Chain
Action: *${whale.side}*
Amount: *$${Math.round(whale.amountUsd).toLocaleString()}*
Wallet: \`${whale.wallet}\`
Current Position: *$${Math.round(whale.currentPositionUsd).toLocaleString()}*
Pool Liquidity: *$${Math.round(whale.poolLiquidityUsd).toLocaleString()}*

📊 *Wallet Profile:*
Trades: ${whale.walletStats.totalTrades} | Win Rate: ${whale.walletStats.winRatePercent}% | Confidence: *${whale.confidence}*`;

    return {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventId,
      tokenAddress: whale.tokenAddress,
      tokenSymbol: whale.tokenSymbol,
      type: 'WHALE_ACTIVITY',
      priority: 'P1',
      stage: 1,
      title: `🐋 WHALE ${whale.side}: $${whale.tokenSymbol} ($${Math.round(whale.amountUsd).toLocaleString()})`,
      textMarkdown,
      textHtml: textMarkdown.replace(/\*/g, '<b>').replace(/\`/g, '<code>'),
      metricsSnapshot: {
        marketCapUsd: 0,
        liquidityUsd: whale.poolLiquidityUsd,
        priceUsd: 0,
        volume5mUsd: whale.amountUsd,
        momentumScore: 80,
        riskScore: 30,
        overallScore: 80,
      },
      timestamp: Date.now(),
      delivered: false,
    };
  }

  public buildLiquidityWarningAlert(token: TokenWithMetrics): TelegramAlert {
    const meta = token.metadata;
    const m = token.metrics;
    const eventId = `LIQWARN-${meta.address.toLowerCase()}-${Math.floor(Date.now() / 60000)}`;

    const textMarkdown = `🚨 *LIQUIDITY WARNING*

*$${meta.symbol}* on ${meta.launchpad}
Liquidity dropped: *${Math.round(m.liquidityChange5mPercent)}%* over 5m
Current Liquidity: *$${Math.round(m.liquidityUsd).toLocaleString()}*
Price Impact: *${Math.round(m.priceChange5m)}%*
Risk Tier: *CRITICAL / EXTREME (${m.riskScore}/100)*
⚠️ _High risk of developer rug or liquidity withdrawal._`;

    return {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventId,
      tokenAddress: meta.address,
      tokenSymbol: meta.symbol,
      type: 'LIQUIDITY_WARNING',
      priority: 'P0',
      stage: 1,
      title: `🚨 LIQUIDITY COLLAPSE WARNING: $${meta.symbol}`,
      textMarkdown,
      textHtml: textMarkdown.replace(/\*/g, '<b>').replace(/\`/g, '<code>'),
      metricsSnapshot: {
        marketCapUsd: m.marketCapUsd,
        liquidityUsd: m.liquidityUsd,
        priceUsd: m.priceUsd,
        volume5mUsd: m.volume5m,
        momentumScore: m.momentumScore,
        riskScore: m.riskScore,
        overallScore: m.overallScore,
      },
      timestamp: Date.now(),
      delivered: false,
    };
  }

  public buildGraduationAlert(token: TokenWithMetrics): TelegramAlert {
    const meta = token.metadata;
    const m = token.metrics;
    const eventId = `GRAD-${meta.address.toLowerCase()}`;

    const textMarkdown = `🎓 *TOKEN GRADUATED TO UNISWAP V3*

*$${meta.symbol}* graduated from ${meta.launchpad}!
DEX Pool: *Uniswap v3 on Robinhood Chain*
Liquidity Migrated: *$${Math.round(m.liquidityUsd).toLocaleString()}*
Volume 5m: *$${Math.round(m.volume5m).toLocaleString()}*
Momentum: *${m.momentumScore}/100 (🔥🔥🔥)*
Overall Quality Score: *${m.overallScore}/100*`;

    return {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventId,
      tokenAddress: meta.address,
      tokenSymbol: meta.symbol,
      type: 'TOKEN_GRADUATED',
      priority: 'P1',
      stage: 1,
      title: `🎓 GRADUATED: $${meta.symbol} -> Uniswap v3`,
      textMarkdown,
      textHtml: textMarkdown.replace(/\*/g, '<b>').replace(/\`/g, '<code>'),
      metricsSnapshot: {
        marketCapUsd: m.marketCapUsd,
        liquidityUsd: m.liquidityUsd,
        priceUsd: m.priceUsd,
        volume5mUsd: m.volume5m,
        momentumScore: m.momentumScore,
        riskScore: m.riskScore,
        overallScore: m.overallScore,
      },
      timestamp: Date.now(),
      delivered: false,
    };
  }
}
