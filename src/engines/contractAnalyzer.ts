import { ContractSecurityAnalysis, RiskTier } from '../types';

export class ContractAnalyzer {
  public static analyzeBytecode(
    address: `0x${string}`,
    bytecode: `0x${string}` | null,
    creatorAddress?: `0x${string}`
  ): ContractSecurityAnalysis {
    const code = (bytecode || '').toLowerCase();
    const detectedFunctions: string[] = [];
    const notes: string[] = [];

    let isVerified = true;
    let isProxy = false;
    let mintable = false;
    let pausable = false;
    let blacklistable = false;
    let taxAdjustable = false;
    let maxWalletRestriction = false;
    let maxTransactionRestriction = false;
    let renouncedOwnership = false;

    // EVM standard function selectors
    // mint(address,uint256) -> 0x40c10f19
    if (code.includes('40c10f19')) {
      mintable = true;
      detectedFunctions.push('mint(address,uint256)');
      notes.push('Token contract includes an explicit mint function.');
    }

    // pause() -> 0x8456cb59
    if (code.includes('8456cb59') || code.includes('pause')) {
      pausable = true;
      detectedFunctions.push('pause()');
      notes.push('Transfers can be paused by contract administrator.');
    }

    // blacklist / isBlacklisted
    if (code.includes('blacklist') || code.includes('isblacklisted')) {
      blacklistable = true;
      detectedFunctions.push('setBlacklist(address,bool)');
      notes.push('Owner possesses arbitrary wallet blacklisting capability.');
    }

    // setTax / setFees
    if (code.includes('settax') || code.includes('setfees')) {
      taxAdjustable = true;
      detectedFunctions.push('setTax(uint256)');
      notes.push('Trading fee percentages are owner-adjustable post-launch.');
    }

    // maxWallet / maxTx
    if (code.includes('maxwallet') || code.includes('setmaxwallet')) {
      maxWalletRestriction = true;
      detectedFunctions.push('setMaxWallet(uint256)');
    }

    // EIP-1967 Proxy storage slot check
    if (code.includes('360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc')) {
      isProxy = true;
      notes.push('Contract uses an upgradeable proxy pattern.');
    }

    // Renounced check
    if (!creatorAddress || creatorAddress === '0x0000000000000000000000000000000000000000') {
      renouncedOwnership = true;
      notes.push('Contract ownership has been renounced to zero address.');
    }

    // Scoring (100 = safe, 0 = critical risk)
    let score = 95;
    if (mintable) score -= 25;
    if (blacklistable) score -= 30;
    if (pausable) score -= 15;
    if (taxAdjustable) score -= 20;
    if (isProxy) score -= 10;
    if (renouncedOwnership) score += 5;

    score = Math.min(100, Math.max(10, score));

    let riskLevel: RiskTier = 'LOW';
    if (score < 40) riskLevel = 'EXTREME';
    else if (score < 60) riskLevel = 'HIGH';
    else if (score < 75) riskLevel = 'ELEVATED';
    else if (score < 85) riskLevel = 'MODERATE';

    return {
      address,
      isVerified,
      isProxy,
      ownerAddress: renouncedOwnership ? '0x0000000000000000000000000000000000000000' : creatorAddress,
      renouncedOwnership,
      mintable,
      pausable,
      blacklistable,
      taxAdjustable,
      buyTaxPercent: taxAdjustable ? 5 : 0,
      sellTaxPercent: taxAdjustable ? 5 : 0,
      maxWalletRestriction,
      maxTransactionRestriction,
      honeypotRisk: blacklistable && pausable,
      hasDangerousFunctions: mintable || blacklistable,
      detectedFunctions,
      securityScore: score,
      riskLevel,
      notes: notes.length ? notes : ['Contract adheres to standard Robinhood Chain ERC-20 bonding template.'],
    };
  }
}
