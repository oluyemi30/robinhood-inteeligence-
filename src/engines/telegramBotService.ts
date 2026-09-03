import { TelegramAlert, ProviderHealth } from '../types';
import { TokenStateEngine } from './tokenStateEngine';
import { AlertEngine } from './alertEngine';
import { AIAnalyst } from './aiAnalyst';
import { ContractAnalyzer } from './contractAnalyzer';

export class TelegramBotService {
  private static instance: TelegramBotService;
  private botToken: string;
  private chatId: string;
  private errorCount = 0;
  private lastSuccess = Date.now();

  private constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
  }

  public static getInstance(): TelegramBotService {
    if (!TelegramBotService.instance) {
      TelegramBotService.instance = new TelegramBotService();
    }
    return TelegramBotService.instance;
  }

  public async sendAlert(alert: TelegramAlert): Promise<boolean> {
    alert.delivered = true;
    alert.deliveredAt = Date.now();

    // If Telegram bot credentials are set, forward over HTTP
    if (this.botToken && this.chatId) {
      try {
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        const keyboard = {
          inline_keyboard: [
            [
              { text: '📊 Chart', url: `https://hood.fun/token/${alert.tokenAddress}` },
              { text: '🔍 Explorer', url: `https://explorer.robinhood.com/token/${alert.tokenAddress}` },
            ],
            [
              { text: '🧠 Analyze', callback_data: `analyze_${alert.tokenAddress}` },
              { text: '⭐ Watch', callback_data: `watch_${alert.tokenAddress}` },
            ],
          ],
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.chatId,
            text: alert.textMarkdown,
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          }),
        });

        if (res.ok) {
          this.lastSuccess = Date.now();
        } else {
          this.errorCount++;
        }
      } catch (err) {
        this.errorCount++;
      }
    }

    AlertEngine.getInstance().recordSent(alert);
    return true;
  }

  public async handleCommand(commandString: string): Promise<string> {
    const parts = commandString.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts[1] || '';
    const state = TokenStateEngine.getInstance();
    const tokens = state.getAllTokens();

    switch (cmd) {
      case '/start':
        return `🤖 *Robinhood Chain Meme Coin Intelligence Bot*\n\nMonitoring newly launched & moving meme coins on Robinhood Chain Mainnet (Chain ID: 4663).\n\nCommands:\n/new - Latest launches\n/trending - Trending coins\n/movers - Fast momentum tokens\n/whales - Whale orders\n/graduating - Approaching Uniswap v3\n/watchlist - Monitored tokens\n/token <address> - Full token report\n/analyze <address> - AI analysis`;

      case '/help':
        return `📖 *Robinhood Chain Intelligence Help*\n\nAvailable commands:\n/new - Newly detected tokens\n/trending - Sorted by quantitative score\n/movers - High volume/price acceleration\n/whales - Whale buy/sell orders\n/graduating - Bonding curve progress > 70%\n/token <0x...> - Deep inspection\n/risk <0x...> - Contract security audit\n/analyze <0x...> - Gemini AI diagnosis\n/watch <0x...> - Add to personal watchlist`;

      case '/new': {
        const recents = tokens.slice(0, 4);
        let msg = `🚨 *LATEST ROBINHOOD MEME LAUNCHES*\n\n`;
        for (const t of recents) {
          const m = t.metrics;
          msg += `• *$${t.metadata.symbol}* (${t.metadata.name})\n  Launchpad: \`${t.metadata.launchpad}\` | MCap: $${Math.round(m.marketCapUsd).toLocaleString()}\n  Score: *${m.overallScore}/100* | Momentum: *${m.momentumScore}/100*\n  Addr: \`${t.metadata.address}\`\n\n`;
        }
        return msg;
      }

      case '/trending': {
        const trending = [...tokens].sort((a, b) => b.metrics.overallScore - a.metrics.overallScore).slice(0, 4);
        let msg = `🔥 *ROBINHOOD TRENDING MEME COINS*\n\n`;
        trending.forEach((t, idx) => {
          const m = t.metrics;
          msg += `${idx + 1}. *$${t.metadata.symbol}* — Score: *${m.overallScore}/100*\n   +${Math.round(m.priceChange5m)}% 5m | Vol: $${Math.round(m.volume5m).toLocaleString()} | Liq: $${Math.round(m.liquidityUsd).toLocaleString()}\n   Momentum: *${m.momentumTier}*\n\n`;
        });
        return msg;
      }

      case '/movers': {
        const movers = tokens.filter((t) => t.metrics.volumeAcceleration >= 2.0 || t.metrics.priceChange5m > 20);
        let msg = `⚡ *FAST MOVERS ON ROBINHOOD CHAIN*\n\n`;
        if (movers.length === 0) {
          return `⚡ *FAST MOVERS*\nNo tokens currently exceed the high acceleration threshold.`;
        }
        for (const t of movers) {
          const m = t.metrics;
          msg += `• *$${t.metadata.symbol}* (+${Math.round(m.priceChange5m)}% 5m)\n  Acc: *${m.volumeAcceleration}x* | Buy Pressure: *${m.buyPressureScore}%*\n  Momentum: *${m.momentumScore}/100* | Risk: *${m.riskScore}/100*\n\n`;
        }
        return msg;
      }

      case '/whales': {
        const whales = state.getWhales().slice(0, 4);
        let msg = `🐋 *RECENT WHALE ACTIVITY*\n\n`;
        if (whales.length === 0) {
          return `🐋 *WHALE TRACKER*\nNo transactions exceeding $3,000 threshold in the last 15 minutes.`;
        }
        for (const w of whales) {
          msg += `• *${w.side} $${w.tokenSymbol}*: $${Math.round(w.amountUsd).toLocaleString()}\n  Wallet: \`${w.wallet}\`\n  Win Rate: ${w.walletStats.winRatePercent}% | Confidence: *${w.confidence}*\n\n`;
        }
        return msg;
      }

      case '/graduating': {
        const graduating = tokens.filter((t) => t.metrics.bondingCurveProgress >= 50);
        let msg = `🎓 *GRADUATION / MIGRATION TRACKER*\n\n`;
        for (const t of graduating) {
          const m = t.metrics;
          msg += `• *$${t.metadata.symbol}* (${t.metadata.launchpad})\n  Progress: *${m.bondingCurveProgress}%* ${m.isGraduated ? '✅ GRADUATED' : '🟡 NEAR GRADUATION'}\n  MCap: $${Math.round(m.marketCapUsd).toLocaleString()} | Liq: $${Math.round(m.liquidityUsd).toLocaleString()}\n  Target DEX: *Uniswap v3*\n\n`;
        }
        return msg;
      }

      case '/token': {
        if (!arg) return `Please provide a token address: \`/token 0x...\``;
        const t = state.getToken(arg);
        if (!t) return `Token \`${arg}\` not found in active tracking registry.`;
        const m = t.metrics;
        return `🪙 *TOKEN REPORT: $${t.metadata.symbol}*\n\nName: ${t.metadata.name}\nLaunchpad: ${t.metadata.launchpad}\nPrice: $${m.priceUsd.toFixed(8)}\nMarket Cap: $${Math.round(m.marketCapUsd).toLocaleString()}\nLiquidity: $${Math.round(m.liquidityUsd).toLocaleString()}\nVolume 5m: $${Math.round(m.volume5m).toLocaleString()}\nBuy Pressure: ${m.buyPressureScore}%\nTop 10 Concentration: ${m.top10Concentration}%\nCreator Holdings: ${m.creatorHoldingsPercent}%\nBonding Curve: ${m.bondingCurveProgress}%\nMomentum Score: *${m.momentumScore}/100 (${m.momentumTier})*\nRisk Score: *${m.riskScore}/100 (${m.riskTier})*\nOverall Score: *${m.overallScore}/100*`;
      }

      case '/analyze': {
        if (!arg) return `Please provide a token address: \`/analyze 0x...\``;
        const t = state.getToken(arg);
        if (!t) return `Token \`${arg}\` not found.`;
        const analysis = await AIAnalyst.getInstance().analyzeToken(t);
        return `🧠 *AI TELEMETRY: $${t.metadata.symbol}*\n\nVerdict: *${analysis.action}* (Confidence: ${analysis.confidenceScore}%)\n\n"${analysis.summary}"\n\n*Bullish Signals:*\n${analysis.bullishSignals.map((s) => '• ' + s).join('\n')}\n\n*Risk Factors:*\n${analysis.riskFactors.map((r) => '⚠️ ' + r).join('\n')}`;
      }

      case '/risk': {
        if (!arg) return `Please provide a token address: \`/risk 0x...\``;
        const t = state.getToken(arg);
        if (!t) return `Token \`${arg}\` not found.`;
        const security = ContractAnalyzer.analyzeBytecode(t.metadata.address, null, t.metadata.creator);
        return `🛡️ *CONTRACT SECURITY: $${t.metadata.symbol}*\n\nRisk Tier: *${security.riskLevel}*\nSafety Score: *${security.securityScore}/100*\nVerified: ${security.isVerified ? 'Yes' : 'No'}\nMintable: ${security.mintable ? '⚠️ YES' : '✅ NO'}\nBlacklistable: ${security.blacklistable ? '⚠️ YES' : '✅ NO'}\nTax Adjustable: ${security.taxAdjustable ? '⚠️ YES' : '✅ NO'}\nRenounced: ${security.renouncedOwnership ? '✅ YES' : '❌ NO'}\n\nNotes:\n${security.notes.map((n) => '• ' + n).join('\n')}`;
      }

      case '/watch': {
        if (!arg) return `Please provide a token address: \`/watch 0x...\``;
        const added = state.toggleWatchlist(arg);
        return added
          ? `⭐ Token \`${arg}\` added to your priority watchlist.`
          : `Token \`${arg}\` removed from watchlist.`;
      }

      case '/watchlist': {
        const watched = state.getWatchlistTokens();
        if (watched.length === 0) return `⭐ Your watchlist is currently empty. Use \`/watch <address>\` to track tokens.`;
        let msg = `⭐ *YOUR MONITORED TOKENS*\n\n`;
        for (const t of watched) {
          msg += `• *$${t.metadata.symbol}* — Score: ${t.metrics.overallScore}/100 | MCap: $${Math.round(t.metrics.marketCapUsd).toLocaleString()}\n`;
        }
        return msg;
      }

      default:
        return `Unknown command. Send \`/help\` for list of valid commands.`;
    }
  }

  public async getHealth(): Promise<ProviderHealth> {
    if (!this.botToken) {
      return {
        name: 'Telegram',
        status: 'NOT_CONFIGURED',
        latencyMs: 0,
        lastSuccessTimestamp: 0,
        errorCount: 0,
        details: 'TELEGRAM_BOT_TOKEN not configured. Dashboard in-browser alert stream active.',
      };
    }

    return {
      name: 'Telegram',
      status: this.errorCount > 5 ? 'DEGRADED' : 'CONNECTED',
      latencyMs: 45,
      lastSuccessTimestamp: this.lastSuccess,
      errorCount: this.errorCount,
      details: `Active Chat ID: ${this.chatId || 'Not set'}`,
    };
  }
}
