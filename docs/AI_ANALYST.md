# AI Analyst Engine Specification

The AI Analyst leverages Google's Gemini models (`gemini-3.8-flash` via `@google/genai` SDK) to interpret structured quantitative metrics without fabricating or hallucinating blockchain data.

## Server-Side Invariant
- **Model:** `gemini-3.8-flash`
- **SDK:** `@google/genai` (named import, initialized server-side with `process.env.GEMINI_API_KEY`)
- **Telemetry:** `httpOptions.headers['User-Agent'] = 'aistudio-build'`
- **Output Format:** Strict JSON Schema validation.

## JSON Schema Output
```json
{
  "summary": "Brief 2-3 sentence qualitative synthesis explaining why the token is moving or dangerous.",
  "bullishSignals": ["Strong volume surge (4.2x in 5m)", "65 unique buyers entering bonding curve"],
  "bearishSignals": ["Creator sold 2.5% of allocation", "Liquidity depth thin relative to market cap"],
  "riskFactors": ["Top 10 holders control 48%", "Contract has adjustable transfer fees"],
  "momentumScore": 88,
  "riskScore": 42,
  "confidenceScore": 85,
  "action": "HIGH_MOMENTUM"
}
```

## Permitted Actions
- `IGNORE`: Insufficient volume or dead activity.
- `WATCH`: Mild steady interest.
- `EARLY_WATCH`: Young token (<5m) showing promising initial buyer count.
- `HIGH_MOMENTUM`: Strong volume and price acceleration with positive buy pressure.
- `HIGH_RISK`: Dangerous concentration, high taxes, or creator dumping.
- `EXTREME_RISK`: Honeypot indicators or rapid liquidity collapse.

*Note: The AI never issues "BUY NOW" commands.*
