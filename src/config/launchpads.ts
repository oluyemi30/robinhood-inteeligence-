import { LaunchpadName } from '../types';

export interface LaunchpadConfigEntry {
  name: LaunchpadName;
  status: 'ACTIVE_VERIFIED' | 'ADAPTER_READY' | 'GENERIC_EVM';
  chain: string;
  type: 'bonding_curve' | 'fair_launch' | 'liquidity_pool' | 'ai_agent';
  targetGraduationMarketCapUsd: number;
  graduationDex: string;
  website: string;
  description: string;
  factoryAddress?: `0x${string}`;
}

export const LAUNCHPADS_CONFIG: Record<LaunchpadName, LaunchpadConfigEntry> = {
  'hood.fun': {
    name: 'hood.fun',
    status: 'ACTIVE_VERIFIED',
    chain: 'robinhood',
    type: 'bonding_curve',
    targetGraduationMarketCapUsd: 68000,
    graduationDex: 'Uniswap v3',
    website: 'https://hood.fun',
    description: 'Primary fair-launch bonding curve protocol natively deployed on Robinhood Chain',
    factoryAddress: '0x1707000000000000000000000000000000000001' as `0x${string}`,
  },
  'LaunchHood': {
    name: 'LaunchHood',
    status: 'ACTIVE_VERIFIED',
    chain: 'robinhood',
    type: 'bonding_curve',
    targetGraduationMarketCapUsd: 75000,
    graduationDex: 'Uniswap v3',
    website: 'https://launchhood.io',
    description: 'Fair launch platform with dynamic fee routing on Robinhood Chain',
    factoryAddress: '0x1707000000000000000000000000000000000002' as `0x${string}`,
  },
  'Bags.fm': {
    name: 'Bags.fm',
    status: 'ACTIVE_VERIFIED',
    chain: 'robinhood',
    type: 'bonding_curve',
    targetGraduationMarketCapUsd: 65000,
    graduationDex: 'Uniswap v3',
    website: 'https://bags.fm',
    description: 'Social meme coin bonding curve with fee shares for Twitter influencers',
    factoryAddress: '0x1707000000000000000000000000000000000003' as `0x${string}`,
  },
  'Flap.sh': {
    name: 'Flap.sh',
    status: 'ACTIVE_VERIFIED',
    chain: 'robinhood',
    type: 'bonding_curve',
    targetGraduationMarketCapUsd: 60000,
    graduationDex: 'Uniswap v3',
    website: 'https://flap.sh',
    description: 'Ultra-fast low-slippage bonding curve deployer',
  },
  'Virtuals': {
    name: 'Virtuals',
    status: 'ADAPTER_READY',
    chain: 'robinhood',
    type: 'ai_agent',
    targetGraduationMarketCapUsd: 100000,
    graduationDex: 'Uniswap v3',
    website: 'https://virtuals.io',
    description: 'Autonomous AI agent tokenization protocol',
  },
  'Clanker': {
    name: 'Clanker',
    status: 'ADAPTER_READY',
    chain: 'robinhood',
    type: 'fair_launch',
    targetGraduationMarketCapUsd: 70000,
    graduationDex: 'Uniswap v3',
    website: 'https://clanker.world',
    description: 'Autonomous social media bot token deployer',
  },
  'Ape.store': {
    name: 'Ape.store',
    status: 'ADAPTER_READY',
    chain: 'robinhood',
    type: 'bonding_curve',
    targetGraduationMarketCapUsd: 65000,
    graduationDex: 'Uniswap v3',
    website: 'https://ape.store',
    description: 'Decentralized meme launchpad',
  },
  'Bankr Bot': {
    name: 'Bankr Bot',
    status: 'ADAPTER_READY',
    chain: 'robinhood',
    type: 'fair_launch',
    targetGraduationMarketCapUsd: 72000,
    graduationDex: 'Uniswap v3',
    website: 'https://bankr.bot',
    description: 'Telegram & Discord native token launch terminal',
  },
  'Klik Finance': {
    name: 'Klik Finance',
    status: 'ADAPTER_READY',
    chain: 'robinhood',
    type: 'bonding_curve',
    targetGraduationMarketCapUsd: 64000,
    graduationDex: 'Uniswap v3',
    website: 'https://klik.finance',
    description: 'Community-curated bonding curve launch platform',
  },
  'Pons': {
    name: 'Pons',
    status: 'ADAPTER_READY',
    chain: 'robinhood',
    type: 'fair_launch',
    targetGraduationMarketCapUsd: 80000,
    graduationDex: 'Uniswap v3',
    website: 'https://pons.trade',
    description: 'Cross-chain meme coin launch bridge',
  },
  'pools.trade': {
    name: 'pools.trade',
    status: 'ADAPTER_READY',
    chain: 'robinhood',
    type: 'liquidity_pool',
    targetGraduationMarketCapUsd: 50000,
    graduationDex: 'Uniswap v3',
    website: 'https://pools.trade',
    description: 'Direct AMM pool creation and liquidity locker',
  },
  'trench.today': {
    name: 'trench.today',
    status: 'ADAPTER_READY',
    chain: 'robinhood',
    type: 'bonding_curve',
    targetGraduationMarketCapUsd: 60000,
    graduationDex: 'Uniswap v3',
    website: 'https://trench.today',
    description: 'Real-time meme trench battleground and launchpad',
  },
  'Generic': {
    name: 'Generic',
    status: 'GENERIC_EVM',
    chain: 'robinhood',
    type: 'liquidity_pool',
    targetGraduationMarketCapUsd: 50000,
    graduationDex: 'Uniswap v3',
    website: 'https://explorer.robinhood.com',
    description: 'Generic EVM standard token or stealth Uniswap pair deployment',
  },
};
