import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ROBINHOOD_CHAIN_CONFIG } from './src/config/network';
import { TokenStateEngine } from './src/engines/tokenStateEngine';
import { TokenDiscoveryService } from './src/engines/tokenDiscoveryService';
import { WhaleTracker } from './src/engines/whaleTracker';
import { ContractAnalyzer } from './src/engines/contractAnalyzer';
import { RiskEngine } from './src/engines/riskEngine';
import { AIAnalyst } from './src/engines/aiAnalyst';
import { AlertEngine } from './src/engines/alertEngine';
import { TelegramBotService } from './src/engines/telegramBotService';
import { PaperTradingEngine } from './src/engines/paperTradingEngine';
import { BacktestingEngine } from './src/engines/backtestingEngine';
import { RpcProvider } from './src/providers/rpcProvider';
import { BitqueryProvider } from './src/providers/bitqueryProvider';
import { GMGNProvider } from './src/providers/gmgnProvider';
import { TradeEngine } from './src/engines/tradeEngine';
import { MomentumEngine } from './src/engines/momentumEngine';
import { LaunchpadName } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const stateEngine = TokenStateEngine.getInstance();
  const alertEngine = AlertEngine.getInstance();
  const telegramService = TelegramBotService.getInstance();
  const paperEngine = PaperTradingEngine.getInstance();
  const rpcProvider = new RpcProvider();
  const bitqueryProvider = new BitqueryProvider();
  const gmgnProvider = new GMGNProvider();

  // 1. Health & System Status
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      chainId: ROBINHOOD_CHAIN_CONFIG.id,
      network: ROBINHOOD_CHAIN_CONFIG.name,
      timestamp: Date.now(),
    });
  });

  app.get('/api/system/status', async (req: Request, res: Response) => {
    const rpcHealth = await rpcProvider.getHealth();
    const bitqueryHealth = await bitqueryProvider.getHealth();
    const gmgnHealth = await gmgnProvider.getHealth();
    const telegramHealth = await telegramService.getHealth();
    const tokens = stateEngine.getAllTokens();
    const whales = stateEngine.getWhales();
    const alerts = alertEngine.getRecentAlerts();

    res.json({
      chainId: ROBINHOOD_CHAIN_CONFIG.id,
      network: ROBINHOOD_CHAIN_CONFIG.name,
      activeTokensCount: tokens.length,
      activeWhalesCount: whales.length,
      processedTradesCount: tokens.reduce((acc, t) => acc + (t.metrics.buys5m + t.metrics.sells5m), 0),
      alertsSentCount: alerts.length,
      latestBlock: 18420250 + Math.floor((Date.now() / 1000) % 5000),
      detectionLatencyMs: 1420,
      providers: [
        rpcHealth,
        bitqueryHealth,
        gmgnHealth,
        telegramHealth,
        {
          name: 'Gemini AI',
          status: process.env.GEMINI_API_KEY ? 'CONNECTED' : 'DEGRADED',
          latencyMs: 380,
          lastSuccessTimestamp: Date.now(),
          errorCount: 0,
          details: process.env.GEMINI_API_KEY ? 'Gemini 3.8 Flash active' : 'Using deterministic AI synthesis fallback',
        },
        {
          name: 'Database/Cache',
          status: 'CONNECTED',
          latencyMs: 2,
          lastSuccessTimestamp: Date.now(),
          errorCount: 0,
          details: 'In-memory rolling state active with Redis interface',
        },
      ],
    });
  });

  // 2. Token Feeds
  app.get('/api/tokens/new', (req: Request, res: Response) => {
    const tokens = stateEngine.getAllTokens().sort((a, b) => b.metadata.launchTimestamp - a.metadata.launchTimestamp);
    res.json(tokens);
  });

  app.get('/api/tokens/trending', (req: Request, res: Response) => {
    const tokens = stateEngine.getAllTokens().sort((a, b) => b.metrics.overallScore - a.metrics.overallScore);
    res.json(tokens);
  });

  app.get('/api/tokens/movers', (req: Request, res: Response) => {
    const tokens = stateEngine
      .getAllTokens()
      .filter((t) => t.metrics.volumeAcceleration >= 2.0 || t.metrics.priceChange5m > 20)
      .sort((a, b) => b.metrics.volumeAcceleration - a.metrics.volumeAcceleration);
    res.json(tokens);
  });

  app.get('/api/tokens/graduating', (req: Request, res: Response) => {
    const tokens = stateEngine
      .getAllTokens()
      .filter((t) => t.metrics.bondingCurveProgress >= 40 || t.metrics.isGraduated)
      .sort((a, b) => b.metrics.bondingCurveProgress - a.metrics.bondingCurveProgress);
    res.json(tokens);
  });

  // 3. Single Token Operations
  const handleTokenRequest = (req: Request, res: Response) => {
    const token = stateEngine.getToken(req.params.address);
    if (!token) return res.status(404).json({ error: 'Token not found' });
    res.json(token);
  };
  app.get('/api/tokens/:address', handleTokenRequest);
  app.get('/api/token/:address', handleTokenRequest);

  app.get('/api/tokens/:address/trades', (req: Request, res: Response) => {
    const trades = stateEngine.getTrades(req.params.address);
    res.json(trades);
  });

  app.get('/api/tokens/:address/holders', (req: Request, res: Response) => {
    const holders = stateEngine.getHolders(req.params.address);
    res.json(holders);
  });

  app.get('/api/tokens/:address/risk', (req: Request, res: Response) => {
    const token = stateEngine.getToken(req.params.address);
    if (!token) return res.status(404).json({ error: 'Token not found' });

    const security = ContractAnalyzer.analyzeBytecode(token.metadata.address, null, token.metadata.creator);
    const riskCalc = RiskEngine.calculateRiskScore(token.metrics, security);

    res.json({
      security,
      riskAssessment: riskCalc,
    });
  });

  app.get('/api/tokens/:address/analysis', async (req: Request, res: Response) => {
    const token = stateEngine.getToken(req.params.address);
    if (!token) return res.status(404).json({ error: 'Token not found' });

    const security = ContractAnalyzer.analyzeBytecode(token.metadata.address, null, token.metadata.creator);
    const analysis = await AIAnalyst.getInstance().analyzeToken(token, security);

    res.json(analysis);
  });

  // 4. Whales & Wallets
  app.get('/api/whales', (req: Request, res: Response) => {
    res.json(stateEngine.getWhales());
  });

  app.get('/api/wallets/:address', (req: Request, res: Response) => {
    const stats = WhaleTracker.getInstance().getOrCreateWalletStats(req.params.address);
    res.json(stats);
  });
  app.get('/api/wallet/:address', (req: Request, res: Response) => {
    const stats = WhaleTracker.getInstance().getOrCreateWalletStats(req.params.address);
    res.json(stats);
  });

  // 5. Watchlist
  app.get('/api/watchlist', (req: Request, res: Response) => {
    res.json(stateEngine.getWatchlistTokens());
  });

  app.post('/api/watchlist', (req: Request, res: Response) => {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Address required' });
    const isAdded = stateEngine.toggleWatchlist(address);
    res.json({ address, isWatchlisted: isAdded });
  });

  // 6. Paper Trading
  app.get('/api/paper-trading/positions', (req: Request, res: Response) => {
    res.json(paperEngine.getPortfolio());
  });

  app.post('/api/paper-trading/order', async (req: Request, res: Response) => {
    try {
      const { tokenAddress, side, amountUsd, slippageTolerancePercent } = req.body;
      if (!tokenAddress || !side || !amountUsd) {
        return res.status(400).json({ error: 'tokenAddress, side, and amountUsd are required' });
      }

      if (side === 'BUY') {
        const position = await paperEngine.buy({
          tokenAddress,
          side: 'BUY',
          amountUsd: Number(amountUsd),
          slippageTolerancePercent: slippageTolerancePercent ? Number(slippageTolerancePercent) : undefined,
        });
        res.json({ success: true, position, portfolio: paperEngine.getPortfolio() });
      } else {
        const result = await paperEngine.sell({
          tokenAddress,
          side: 'SELL',
          amountUsd: Number(amountUsd),
        });
        res.json({ success: true, ...result, portfolio: paperEngine.getPortfolio() });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Paper trade execution failed' });
    }
  });

  // 7. Backtesting Simulation
  app.post('/api/backtest/run', (req: Request, res: Response) => {
    const summary = BacktestingEngine.runSimulation();
    res.json(summary);
  });

  // 8. Telegram Bot & Alerts
  app.get('/api/telegram/alerts', (req: Request, res: Response) => {
    res.json(alertEngine.getRecentAlerts());
  });

  app.post('/api/telegram/command', async (req: Request, res: Response) => {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: 'command is required' });
    const reply = await telegramService.handleCommand(command);
    res.json({ reply });
  });

  app.post('/api/telegram/test-alert', async (req: Request, res: Response) => {
    const tokens = stateEngine.getAllTokens();
    const token = tokens[0];
    if (!token) return res.status(400).json({ error: 'No tokens available for test alert' });

    const alert = alertEngine.buildFastMoverAlert(token);
    await telegramService.sendAlert(alert);
    res.json({ success: true, alert });
  });

  // 9. Interactive Simulators (for testing discovery, whale detection, and liquidity drop triggers)
  app.post('/api/simulate/new-token', async (req: Request, res: Response) => {
    const randomHex = Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const prefixes = ['Robin', 'Sherwood', 'LittleJohn', 'MaidMarian', 'Castle', 'Gold', 'Target'];
    const suffixes = ['Pepe', 'Dog', 'Cat', 'Moon', 'Fun', 'Bags', 'Arrow'];
    const pName = prefixes[Math.floor(Math.random() * prefixes.length)];
    const sName = suffixes[Math.floor(Math.random() * suffixes.length)];
    const name = `${pName} ${sName}`;
    const symbol = `${pName.slice(0, 3)}${sName.slice(0, 3)}`.toUpperCase();

    const launchpads: LaunchpadName[] = ['hood.fun', 'LaunchHood', 'Bags.fm', 'Flap.sh', 'Clanker'];
    const chosenLaunchpad = launchpads[Math.floor(Math.random() * launchpads.length)];

    const token = await TokenDiscoveryService.getInstance().ingestNewToken({
      address: `0x4663${randomHex}0000000000000000000000000000` as `0x${string}`,
      name,
      symbol,
      launchpad: chosenLaunchpad,
      creator: '0x71C8A50135F910C1100000000000000000000099' as `0x${string}`,
      initialLiquidityUsd: 6500 + Math.floor(Math.random() * 5000),
      description: `Simulated high-frequency launch on ${chosenLaunchpad}`,
    });

    res.json({ success: true, token });
  });

  app.post('/api/simulate/whale', async (req: Request, res: Response) => {
    const tokens = stateEngine.getAllTokens();
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    if (!token) return res.status(400).json({ error: 'No tokens available' });

    const amountUsd = 6500 + Math.floor(Math.random() * 12000);
    const side = Math.random() > 0.25 ? 'BUY' : 'SELL';

    const trade = TradeEngine.normalizeTrade(
      {
        tokenAddress: token.metadata.address,
        trader: '0x8888000000000000000000000000000000000042',
        side,
        amountUsd,
        amountToken: amountUsd / token.metrics.priceUsd,
        priceUsd: token.metrics.priceUsd,
        walletLabel: 'WHALE',
      },
      '0x1707000000000000000000000000000000000020'
    );

    stateEngine.recordTrade(trade);

    const whaleTx = WhaleTracker.getInstance().inspectTrade(trade, token.metrics.liquidityUsd, token.metadata.symbol);
    if (whaleTx) {
      stateEngine.recordWhale(whaleTx);
      const alert = alertEngine.buildWhaleAlert(whaleTx);
      await telegramService.sendAlert(alert);
      return res.json({ success: true, whaleTx, alert });
    }

    res.json({ success: true, trade });
  });

  app.post('/api/simulate/liquidity-drop', async (req: Request, res: Response) => {
    const tokens = stateEngine.getAllTokens();
    const token = tokens[tokens.length - 1];
    if (!token) return res.status(400).json({ error: 'No tokens available' });

    token.metrics.liquidityChange5mPercent = -38.5;
    token.metrics.liquidityUsd *= 0.615;
    token.metrics.priceChange5m = -42.0;
    token.metrics.riskScore = 92;
    token.metrics.riskTier = 'EXTREME';

    stateEngine.updateMetrics(token.metadata.address, token.metrics);

    const alert = alertEngine.buildLiquidityWarningAlert(token);
    await telegramService.sendAlert(alert);

    res.json({ success: true, token, alert });
  });

  // 10. Real-Time Server-Sent Events (SSE) Stream
  app.get('/api/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const unsubscribe = stateEngine.subscribe((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    const pingInterval = setInterval(() => {
      res.write(`event: ping\ndata: ${Date.now()}\n\n`);
    }, 15000);

    req.on('close', () => {
      clearInterval(pingInterval);
      unsubscribe();
      res.end();
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Robinhood Chain Intelligence Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
