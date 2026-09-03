export const ROBINHOOD_CHAIN_CONFIG = {
  id: 4663,
  name: 'Robinhood Chain Mainnet',
  network: 'robinhood',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.RH_RPC_URL || 'https://rpc.robinhood.com'],
      webSocket: [process.env.RH_WS_URL || 'wss://rpc.robinhood.com'],
    },
    public: {
      http: [
        'https://rpc.robinhood.com',
        'https://robinhood-mainnet.rpc.grove.city/v1/public',
        'https://robinhood.drpc.org',
      ],
      webSocket: [
        'wss://rpc.robinhood.com',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Chain Explorer',
      url: 'https://explorer.robinhood.com',
    },
  },
  dexRouters: {
    uniswapV3Router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45' as `0x${string}`,
    uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984' as `0x${string}`,
  },
};
