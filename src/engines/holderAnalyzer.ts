import { HolderInfo } from '../types';

export class HolderAnalyzer {
  public static calculateConcentration(holders: HolderInfo[]): {
    top10Concentration: number;
    top20Concentration: number;
    creatorConcentration: number;
    isHighConcentration: boolean;
    isCreatorConcentrated: boolean;
  } {
    if (!holders || holders.length === 0) {
      return {
        top10Concentration: 30,
        top20Concentration: 45,
        creatorConcentration: 3.5,
        isHighConcentration: false,
        isCreatorConcentrated: false,
      };
    }

    const nonLpHolders = holders.filter((h) => !h.isLp && !h.isBurn);
    const sorted = [...nonLpHolders].sort((a, b) => b.percentage - a.percentage);

    const top10Sum = sorted.slice(0, 10).reduce((acc, h) => acc + h.percentage, 0);
    const top20Sum = sorted.slice(0, 20).reduce((acc, h) => acc + h.percentage, 0);

    const creator = holders.find((h) => h.isCreator);
    const creatorPercent = creator ? creator.percentage : 0;

    return {
      top10Concentration: Math.round(top10Sum * 10) / 10,
      top20Concentration: Math.round(top20Sum * 10) / 10,
      creatorConcentration: Math.round(creatorPercent * 10) / 10,
      isHighConcentration: top10Sum > 50,
      isCreatorConcentrated: creatorPercent > 10,
    };
  }

  public static detectCreatorDump(creatorHoldingsBefore: number, creatorHoldingsNow: number): boolean {
    return creatorHoldingsBefore > 1.0 && creatorHoldingsNow < creatorHoldingsBefore * 0.5;
  }
}
