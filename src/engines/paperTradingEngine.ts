import { PaperPosition, PaperTradeOrder } from '../types';
import { TokenStateEngine } from './tokenStateEngine';

export interface ExecutionProvider {
  quote(tokenAddress: `0x${string}`, side: 'BUY' | 'SELL', amountUsd: number): {
    estimatedTokens: number;
    estimatedPriceUsd: number;
    slippagePercent: number;
    gasFeeUsd: number;
  };
  buy(order: PaperTradeOrder): Promise<PaperPosition>;
  sell(order: PaperTradeOrder): Promise<{ closedPosition: PaperPosition; realizedPnlUsd: number }>;
}

export class PaperTradingEngine implements ExecutionProvider {
  private static instance: PaperTradingEngine;
  private positions: Map<string, PaperPosition> = new Map();
  private initialBalanceUsd = 10000;
  private availableCashUsd = 10000;
  private realizedPnlUsd = 0;

  private constructor() {}

  public static getInstance(): PaperTradingEngine {
    if (!PaperTradingEngine.instance) {
      PaperTradingEngine.instance = new PaperTradingEngine();
    }
    return PaperTradingEngine.instance;
  }

  public getPortfolio() {
    this.updateCurrentPrices();
    const positions = Array.from(this.positions.values());
    const positionsValue = positions.reduce((acc, p) => acc + p.currentValueUsd, 0);
    const totalValue = this.availableCashUsd + positionsValue;
    const totalPnlUsd = totalValue - this.initialBalanceUsd;
    const totalPnlPercent = Math.round((totalPnlUsd / this.initialBalanceUsd) * 1000) / 10;

    return {
      initialBalanceUsd: this.initialBalanceUsd,
      availableCashUsd: Math.round(this.availableCashUsd * 100) / 100,
      positionsValueUsd: Math.round(positionsValue * 100) / 100,
      totalPortfolioValueUsd: Math.round(totalValue * 100) / 100,
      realizedPnlUsd: Math.round(this.realizedPnlUsd * 100) / 100,
      unrealizedPnlUsd: Math.round((positionsValue - positions.reduce((a, b) => a + b.investedUsd, 0)) * 100) / 100,
      totalPnlPercent,
      openPositions: positions,
    };
  }

  public quote(tokenAddress: `0x${string}`, side: 'BUY' | 'SELL', amountUsd: number) {
    const token = TokenStateEngine.getInstance().getToken(tokenAddress);
    const priceUsd = token?.metrics.priceUsd || 0.00005;
    const liquidity = token?.metrics.liquidityUsd || 10000;

    // Estimate realistic constant product AMM slippage: (tradeSize / liquidity) * 100
    const slippagePercent = Math.min(25, Math.max(0.2, (amountUsd / Math.max(liquidity, 1000)) * 100));
    const effectivePrice = side === 'BUY' ? priceUsd * (1 + slippagePercent / 100) : priceUsd * (1 - slippagePercent / 100);
    const estimatedTokens = amountUsd / effectivePrice;
    const gasFeeUsd = 0.04; // Robinhood Chain L2 gas is ultra-cheap sub-cent

    return {
      estimatedTokens: Math.round(estimatedTokens),
      estimatedPriceUsd: effectivePrice,
      slippagePercent: Math.round(slippagePercent * 100) / 100,
      gasFeeUsd,
    };
  }

  public async buy(order: PaperTradeOrder): Promise<PaperPosition> {
    if (order.amountUsd > this.availableCashUsd) {
      throw new Error(`Insufficient paper cash. Available: $${Math.round(this.availableCashUsd)}`);
    }

    const token = TokenStateEngine.getInstance().getToken(order.tokenAddress);
    if (!token) throw new Error(`Token ${order.tokenAddress} not found.`);

    const quote = this.quote(order.tokenAddress, 'BUY', order.amountUsd);
    if (order.slippageTolerancePercent && quote.slippagePercent > order.slippageTolerancePercent) {
      throw new Error(`Slippage exceeds tolerance: ${quote.slippagePercent}% > ${order.slippageTolerancePercent}%`);
    }

    this.availableCashUsd -= order.amountUsd + quote.gasFeeUsd;
    const key = order.tokenAddress.toLowerCase();
    const existing = this.positions.get(key);

    let position: PaperPosition;
    if (existing) {
      const newAmount = existing.amountTokens + quote.estimatedTokens;
      const newInvested = existing.investedUsd + order.amountUsd;
      const avgPrice = newInvested / newAmount;
      position = {
        ...existing,
        amountTokens: newAmount,
        investedUsd: newInvested,
        entryPriceUsd: avgPrice,
        currentPriceUsd: quote.estimatedPriceUsd,
        currentValueUsd: newAmount * quote.estimatedPriceUsd,
        unrealizedPnlUsd: newAmount * quote.estimatedPriceUsd - newInvested,
        unrealizedPnlPercent: Math.round(((newAmount * quote.estimatedPriceUsd - newInvested) / newInvested) * 1000) / 10,
        updatedAt: Date.now(),
      };
    } else {
      position = {
        id: `pos-${Date.now()}`,
        tokenAddress: order.tokenAddress,
        tokenSymbol: token.metadata.symbol,
        amountTokens: quote.estimatedTokens,
        entryPriceUsd: quote.estimatedPriceUsd,
        currentPriceUsd: quote.estimatedPriceUsd,
        investedUsd: order.amountUsd,
        currentValueUsd: order.amountUsd,
        unrealizedPnlUsd: 0,
        unrealizedPnlPercent: 0,
        openedAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    this.positions.set(key, position);
    return position;
  }

  public async sell(order: PaperTradeOrder): Promise<{ closedPosition: PaperPosition; realizedPnlUsd: number }> {
    const key = order.tokenAddress.toLowerCase();
    const position = this.positions.get(key);
    if (!position) throw new Error(`No open position found for token ${order.tokenAddress}`);

    const quote = this.quote(order.tokenAddress, 'SELL', position.currentValueUsd);
    const saleProceedsUsd = position.amountTokens * quote.estimatedPriceUsd;
    const realizedPnl = saleProceedsUsd - position.investedUsd - quote.gasFeeUsd;

    this.availableCashUsd += saleProceedsUsd - quote.gasFeeUsd;
    this.realizedPnlUsd += realizedPnl;
    this.positions.delete(key);

    return {
      closedPosition: {
        ...position,
        currentPriceUsd: quote.estimatedPriceUsd,
        currentValueUsd: 0,
        unrealizedPnlUsd: 0,
        updatedAt: Date.now(),
      },
      realizedPnlUsd: Math.round(realizedPnl * 100) / 100,
    };
  }

  private updateCurrentPrices() {
    const state = TokenStateEngine.getInstance();
    for (const [key, pos] of this.positions.entries()) {
      const token = state.getToken(pos.tokenAddress);
      if (token) {
        pos.currentPriceUsd = token.metrics.priceUsd;
        pos.currentValueUsd = pos.amountTokens * pos.currentPriceUsd;
        pos.unrealizedPnlUsd = pos.currentValueUsd - pos.investedUsd;
        pos.unrealizedPnlPercent = Math.round((pos.unrealizedPnlUsd / pos.investedUsd) * 1000) / 10;
        this.positions.set(key, pos);
      }
    }
  }
}
