# Robinhood Chain Meme Coin Intelligence - Data Sources Specification

This document details the research, verification status, and integration strategy for all data sources across the Robinhood Chain (Chain ID: 4663) meme coin intelligence bot.

---

## Network Profile

- **Chain Name:** Robinhood Chain Mainnet
- **Chain ID:** `4663`
- **Native Gas Token:** `ETH`
- **Architecture:** Arbitrum Orbit Layer-2, settling to Ethereum Mainnet
- **Block Time:** Sub-second to ~1 second
- **DEX Infrastructure:** Uniswap v3 & Uniswap v4 on Robinhood Chain

---

## 1. Bitquery (Primary Indexed Blockchain Provider)

- **Provider:** Bitquery
- **Purpose:** Primary indexed provider for fast token discovery, DEX trades, transfers, holder counts, liquidity, and token supply.
- **API Type:** GraphQL (V2 Streaming & Archive APIs), WebSockets, REST.
- **Authentication:** `X-API-KEY` or Bearer header via `BITQUERY_API_KEY`.
- **Supported Data on Robinhood Chain (4663):**
  - Token creation events and metadata across Robinhood Chain EVM.
  - Uniswap v3/v4 swaps, pools, and liquidity add/remove events.
  - ERC-20 transfers, holder balances, and transfer volumes.
  - Launchpad contract event decoding (hood.fun, LaunchHood, Bags.fm, etc.).
- **Limitations:** Free tier rate limits; requires API key for high-frequency WebSocket streams.
- **Fallback Provider:** Direct Robinhood Chain RPC (`RpcProvider`).
- **Officially Documented:** YES. Bitquery explicitly documents Robinhood Chain indexing under EVM unified schema.

---

## 2. Robinhood Chain RPC (Direct EVM Execution & Real-Time Logs)

- **Provider:** Robinhood Chain Nodes (Alchemy, QuickNode, Public RPC).
- **Default Endpoints:**
  - HTTP: `https://rpc.robinhood.com` (or Alchemy/QuickNode custom URL)
  - WebSocket: `wss://rpc.robinhood.com`
- **Purpose:**
  - Direct block header subscriptions (`eth_subscribe("newHeads")`).
  - Contract log filters (`eth_getLogs`, `eth_subscribe("logs")`) for Launchpad and DEX pair factory events.
  - Smart contract calls (`eth_call` for `decimals()`, `totalSupply()`, `owner()`, `getReserves()`).
  - Bytecode inspection (`eth_getCode`) for contract security scoring.
- **Authentication:** Free public or API Key for Alchemy/QuickNode.
- **Limitations:** Public RPC rate limits, lack of historical aggregated analytics without local indexing.
- **Fallback Provider:** Bitquery GraphQL archive queries.
- **Officially Documented:** YES. Robinhood Chain official EVM RPC.

---

## 3. GMGN.ai (External Market Intelligence)

- **Provider:** GMGN.ai
- **Purpose:** Token discovery, smart wallet tags, and market metrics.
- **API Type:** Agent API / REST.
- **Authentication:** `GMGN_API_KEY` (when approved/provisioned).
- **Status & Policy:**
  - GMGN supports Robinhood Chain on their platform and has an Agent API for AI agents.
  - **Strict Anti-Scraping Policy:** Per system rules, the system NEVER scrapes unofficial GMGN endpoints or reverse engineers web APIs.
  - Implemented as an optional `MarketDataProvider` (`GMGNProvider`).
  - Marked as: `IMPLEMENTED — REQUIRES API CREDENTIALS` (or graceful mock-free fallback to on-chain & Bitquery data if key not configured).
- **Limitations:** API key required for official Agent access.
- **Officially Documented:** YES for Agent API; unofficial web scraping is strictly prohibited.

---

## 4. Launchpad Direct APIs & Subgraphs

- **hood.fun:** Leading Robinhood Chain bonding curve launchpad migrating to Uniswap v3.
- **LaunchHood / Flap.sh / Bags.fm / Clanker:** Supported via modular `LaunchpadAdapter` contracts and event definitions.
- **Fallbacks:** On-chain factory event decoding ensures zero dependency on external launchpad web uptime.

---

## 5. Gemini AI (AI Analyst Module)

- **Provider:** Google Gemini API via `@google/genai` SDK (`gemini-3.8-flash`).
- **Purpose:** Interprets quantitative deterministic metrics (momentum acceleration, holder concentration, liquidity depth, creator actions) into human-readable, actionable intelligence.
- **Key Security:** Key is strictly kept server-side via `process.env.GEMINI_API_KEY`.
- **Latency Safeguard:** Stage 1 fast alert is dispatched in 0–2 seconds without waiting for AI; Stage 2 enriches the alert with AI findings asynchronously.
