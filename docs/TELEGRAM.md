# Telegram Bot & Alert Dispatcher Specification

## Bot Commands
- `/start` - Welcome message, network summary (Robinhood Chain 4663), and quick start.
- `/help` - Command index and explanation of metrics.
- `/new` - Show latest 5 newly launched meme coins on Robinhood Chain.
- `/trending` - Top tokens sorted by 24h/1h momentum score.
- `/movers` - Fast movers exhibiting strong price/volume acceleration.
- `/whales` - Recent large transactions (>$5k or >1% of liquidity).
- `/graduating` - Tokens nearing or completing launchpad graduation (e.g. hood.fun -> Uniswap v3).
- `/token <address>` - Detailed token scorecard, liquidity, and holder breakdown.
- `/risk <address>` - Contract security audit and honeypot diagnostics.
- `/analyze <address>` - Run on-demand Gemini AI analysis for a token.
- `/watch <address>` - Add token to personal watch list for instant price/whale alerts.
- `/unwatch <address>` - Remove token from watch list.
- `/watchlist` - View your active monitored tokens.
- `/alerts` - View recent priority alerts (P0, P1, P2).
- `/settings` - Configure alert sensitivity thresholds.

## Inline Action Buttons
Every alert payload includes:
`[📊 Chart] [🔍 Explorer] [🪙 Token Details] [🧠 AI Analyze] [⭐ Watch]`
