# System Architecture - Robinhood Chain Meme Coin Intelligence

```
Robinhood Chain (Chain ID: 4663)
    │
    ├─► RPC / WebSocket (Alchemy / QuickNode / Node) ──┐
    │                                                  ▼
    └─► Bitquery GraphQL / V2 Subscriptions ──► Event Ingestion Engine
                                                       │
                                            Normalized Event Queue
                                                       │
                                                       ▼
                                            Token Discovery Engine
                                                       │
    ┌──────────────────────────────────────────────────┴──────────────────────────────────────┐
    ▼                                                  ▼                                      ▼
Token State Engine                              Trade & Flow Engine                    Whale & Wallet Tracker
(Hot memory / Redis)                            (15s, 1m, 5m, 15m)                     (Smart wallets, labeling)
    │                                                  │                                      │
    ▼                                                  ▼                                      ▼
Momentum Engine                                 Liquidity Engine                       Contract Risk Engine
(Price/Vol Acceleration)                        (Depth, withdrawal, drops)             (Bytecode, mint, tax, pause)
    │                                                  │                                      │
    └──────────────────────────────────────────────────┬──────────────────────────────────────┘
                                                       │
                                                       ▼
                                        Deterministic Scoring Engine (0-100)
                                        [Momentum 25%, Liquidity 15%, Volume 15%,
                                         BuyPressure 10%, Holders 10%, Whales 10%,
                                         ContractSafety 10%, Social 5%]
                                                       │
                                  ┌────────────────────┴───────────────────┐
                                  ▼                                        ▼
                        Stage 1 Fast Alert (0-2s)                  AI Analyst Engine
                        (Immediate Telegram ping)                  (Gemini 3.8 Flash structured)
                                  │                                        │
                                  └────────────────────┬───────────────────┘
                                                       │
                                                       ▼
                                            Telegram Bot & Alert Router
                                            (P0 Critical, P1 High, P2 Normal)
                                                       │
                                           ┌───────────┴───────────┐
                                           ▼                       ▼
                                   Telegram Bot Users      React Live Dashboard
                                   (Commands & Watchlists) (SSE / WebSocket Feed)
                                           │                       │
                                           ▼                       ▼
                                   Paper Trading Engine   Backtesting Laboratory
```

## Key Invariants
1. **Zero Fake Data / Zero Halting:** If Bitquery or Alchemy is offline, direct RPC or cached fallbacks maintain system liveness.
2. **Deterministic Pre-Score:** The AI never invents or arbitrarily modifies the 0-100 quantitative score; it provides qualitative diagnosis and explanations based on verified metrics.
3. **Two-Stage Alerts:** Stage 1 fast alert fires within 0-2 seconds. Stage 2 enriches the alert with AI reasoning once ready.
4. **Idempotency:** Unique `eventId = sha256(token + txHash + eventType)` guarantees zero duplicate alerts.
