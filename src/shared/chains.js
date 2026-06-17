import { defineChain } from 'viem';

export const OG_CHAIN_ID = Number(process.env.OG_CHAIN_ID || process.env.VITE_OG_CHAIN_ID || 16602);
export const OG_RPC_URL = process.env.OG_RPC_URL || process.env.VITE_OG_RPC_URL
  || (OG_CHAIN_ID === 16661 ? 'https://evmrpc.0g.ai' : 'https://evmrpc-testnet.0g.ai');

const isMainnet = OG_CHAIN_ID === 16661;

export const ogChain = defineChain({
  id: OG_CHAIN_ID,
  name: isMainnet ? '0G Mainnet' : '0G Testnet',
  network: isMainnet ? '0g-mainnet' : '0g-testnet',
  nativeCurrency: { decimals: 18, name: '0G', symbol: '0G' },
  rpcUrls: {
    default: { http: [OG_RPC_URL] },
    public: { http: [OG_RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: '0G Scan',
      url: isMainnet ? 'https://chainscan.0g.ai' : 'https://chainscan-galileo.0g.ai',
    },
  },
});

export const OG_EXPLORER_URL = ogChain.blockExplorers.default.url;
