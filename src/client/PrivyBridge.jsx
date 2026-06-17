/**
 * React Island for Privy SDK — mounts a hidden PrivyProvider and exposes
 * hook values to vanilla JS through a bridge object.
 *
 * The bridge uses getter properties backed by refs so that vanilla JS
 * always reads the latest React state without re-mounting.
 */
import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider, usePrivy, useWallets, useLoginWithOAuth, useExportWallet } from '@privy-io/react-auth';

const OG_CHAIN_ID = Number(import.meta.env.VITE_OG_CHAIN_ID || 16602);
const OG_RPC_URL = import.meta.env.VITE_OG_RPC_URL
  || (OG_CHAIN_ID === 16661 ? 'https://evmrpc.0g.ai' : 'https://evmrpc-testnet.0g.ai');
const OG_IS_MAINNET = OG_CHAIN_ID === 16661;

const OG_CHAIN = {
  id: OG_CHAIN_ID,
  name: OG_IS_MAINNET ? '0G Mainnet' : '0G Testnet',
  network: OG_IS_MAINNET ? '0g-mainnet' : '0g-testnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: { http: [OG_RPC_URL] },
    public: { http: [OG_RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: '0G Scan',
      url: OG_IS_MAINNET ? 'https://chainscan.0g.ai' : 'https://chainscan-galileo.0g.ai',
    },
  },
};

function BridgeInner({ onBridgeReady }) {
  const { ready, authenticated, user, getAccessToken, logout } = usePrivy();
  const { wallets } = useWallets();
  const { initOAuth } = useLoginWithOAuth();
  const { exportWallet } = useExportWallet();

  // Refs keep the latest hook values accessible from the stable bridge object
  const userRef = useRef(null);
  const walletsRef = useRef([]);
  const authenticatedRef = useRef(false);

  userRef.current = user;
  walletsRef.current = wallets;
  authenticatedRef.current = authenticated;

  const bridgeRef = useRef(null);
  if (!bridgeRef.current) {
    bridgeRef.current = {
      get user() { return userRef.current; },
      get wallets() { return walletsRef.current; },
      get authenticated() { return authenticatedRef.current; },
      getAccessToken,
      logout,
      initOAuth,
      exportWallet,
      getEmbeddedWallet() {
        return walletsRef.current.find(
          w => w.walletClientType === 'privy' && w.type === 'ethereum'
        ) ?? null;
      },
      async getEmbeddedWalletProvider() {
        const wallet = this.getEmbeddedWallet();
        if (!wallet) return null;
        const provider = await wallet.getEthereumProvider();
        return { provider, address: wallet.address };
      },
      getEmbeddedWalletAddress() {
        return this.getEmbeddedWallet()?.address ?? null;
      },
    };
  }

  // Hook identity changes each render; keep bridge methods current
  bridgeRef.current.getAccessToken = getAccessToken;
  bridgeRef.current.logout = logout;
  bridgeRef.current.initOAuth = initOAuth;
  bridgeRef.current.exportWallet = exportWallet;

  useEffect(() => {
    if (ready) onBridgeReady(bridgeRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once when ready
  }, [ready]);

  return null;
}

/**
 * Mount the Privy React island and return a promise that resolves
 * with the bridge object once the SDK is ready.
 */
export function mountPrivyBridge(appId, clientId) {
  return new Promise((resolve) => {
    const container = document.getElementById('privy-root');
    if (!container) {
      console.error('[PrivyBridge] #privy-root element not found');
      resolve(null);
      return;
    }

    const root = createRoot(container);
    root.render(
      <PrivyProvider
        appId={appId}
        clientId={clientId}
        config={{
          defaultChain: OG_CHAIN,
          supportedChains: [OG_CHAIN],
          embeddedWallets: {
            ethereum: { createOnLogin: 'all-users' },
          },
          appearance: {
            showWalletLoginFirst: false,
          },
        }}
      >
        <BridgeInner onBridgeReady={resolve} />
      </PrivyProvider>
    );
  });
}
