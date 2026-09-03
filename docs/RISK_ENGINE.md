# Risk Engine & Contract Security Architecture

The Risk Engine scores tokens on a 0–100 scale where **higher = more dangerous**.

## Risk Classifications
- `0–20`: **LOW**
- `21–40`: **MODERATE**
- `41–60`: **ELEVATED**
- `61–80`: **HIGH**
- `81–100`: **EXTREME** (Critical warning / Avoid)

## Evaluated Factors
1. **Contract Bytecode Analysis:**
   - Mintable function check (`mint(address,uint256)`).
   - Pausable transfers (`pause()`, `setTradingEnabled()`).
   - Blacklist capability (`blacklist(address)`, `isBlacklisted`).
   - Hidden or variable taxes (`setTax()`, `setFees() > 10%`).
   - Max wallet / transaction restrictions (`setMaxWallet()`).
   - Ownership renounced or multi-sig controlled.
2. **Holder Concentration:**
   - Top 10 holders > 50% supply -> +25 risk points.
   - Creator holding > 10% supply -> +20 risk points.
   - Creator selling immediately post-launch -> +35 risk points.
3. **Liquidity Dynamics:**
   - Liquidity < $5,000 -> +20 risk points.
   - Liquidity drop > 25% in 90 seconds -> +40 risk points (Liquidity Warning Alert).
   - Unlocked or unverified LP token pair.
4. **Honeypot / Sellability:**
   - Sell simulation check: ensure sell transactions succeed with expected slippage.
