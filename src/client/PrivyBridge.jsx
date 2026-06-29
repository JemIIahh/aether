/**
 * React Island for Privy SDK — mounts a hidden PrivyProvider and exposes
 * hook values to vanilla JS through a bridge object.
 *
 * The bridge uses getter properties backed by refs so that vanilla JS
 * always reads the latest React state without re-mounting.
 */
import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider, usePrivy, useWallets, useLoginWithOAuth, useExportWallet, useModalStatus } from '@privy-io/react-auth';

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
  const { ready, authenticated, user, getAccessToken, logout, login } = usePrivy();
  const { wallets } = useWallets();
  const { initOAuth } = useLoginWithOAuth();
  const { exportWallet } = useExportWallet();
  const { isOpen: modalIsOpen } = useModalStatus();

  // Refs keep the latest hook values accessible from the stable bridge object.
  // loginRef holds the LATEST `login` function — calling a stale reference
  // from an initial-render closure was a real bug that left auth hanging.
  const userRef = useRef(null);
  const walletsRef = useRef([]);
  const authenticatedRef = useRef(false);
  const loginRef = useRef(login);
  const pendingLoginRef = useRef(null);
  const modalSeenOpenRef = useRef(false);

  userRef.current = user;
  walletsRef.current = wallets;
  authenticatedRef.current = authenticated;
  loginRef.current = login;

  // Drive pending login promises from React state transitions:
  //   authenticated → true                      ⇒ resolve(true)
  //   modal opened then closed without auth      ⇒ resolve(false)  (user cancelled)
  useEffect(() => {
    const p = pendingLoginRef.current;
    if (!p) return;
    if (authenticated) {
      pendingLoginRef.current = null;
      modalSeenOpenRef.current = false;
      clearTimeout(p.timeoutId);
      p.resolve(true);
      return;
    }
    if (modalIsOpen) {
      modalSeenOpenRef.current = true;
    } else if (modalSeenOpenRef.current) {
      pendingLoginRef.current = null;
      modalSeenOpenRef.current = false;
      clearTimeout(p.timeoutId);
      p.resolve(false);
    }
  }, [authenticated, modalIsOpen]);

  const bridgeRef = useRef(null);
  if (!bridgeRef.current) {
    bridgeRef.current = {
      get user() { return userRef.current; },
      get wallets() { return walletsRef.current; },
      get authenticated() { return authenticatedRef.current; },
      getAccessToken,
      logout,
      login,
      initOAuth,
      exportWallet,
      // Awaitable login: opens the Privy modal and returns a promise that
      // resolves true on auth success or false on user cancel/timeout.
      // Driven by the useEffect above which watches React state
      // (authenticated + modalIsOpen) — never relies on stale closures or
      // Privy's own promise resolution timing.
      loginAwait() {
        if (authenticatedRef.current) return Promise.resolve(true);
        if (pendingLoginRef.current) return pendingLoginRef.current.promise;
        let resolve;
        const promise = new Promise((res) => { resolve = res; });
        const timeoutId = setTimeout(() => {
          if (pendingLoginRef.current) {
            console.warn('[Bridge] loginAwait timed out after 5min');
            pendingLoginRef.current = null;
            modalSeenOpenRef.current = false;
            resolve(false);
          }
        }, 300000);
        pendingLoginRef.current = { promise, resolve, timeoutId };
        try {
          if (typeof loginRef.current !== 'function') {
            throw new Error('Privy login function is not available');
          }
          loginRef.current();
        } catch (e) {
          console.error('[Bridge] login() threw:', e);
          clearTimeout(timeoutId);
          pendingLoginRef.current = null;
          return Promise.reject(e);
        }
        return promise;
      },
      // Active wallet — prefers embedded (Privy) wallet, falls back to the
      // first connected external EVM wallet (MetaMask, Coinbase, WalletConnect…)
      // so users who logged in via wallet still have a signer for bribes.
      getEmbeddedWallet() {
        const ws = walletsRef.current;
        const embedded = ws.find(
          w => w.walletClientType === 'privy' && (w.type === 'ethereum' || !w.type)
        );
        if (embedded) return embedded;
        return ws.find(
          w => w.type === 'ethereum' || w.chainType === 'ethereum' || !w.type
        ) ?? ws[0] ?? null;
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
  bridgeRef.current.login = login;
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
          // Login methods to surface in the Privy modal — order in the Privy
          // dashboard determines visual order; this is the allow-list.
          loginMethods: ['wallet', 'email', 'twitter', 'google', 'discord', 'apple', 'farcaster'],
          embeddedWallets: {
            // Only spin up an embedded wallet for users who don't bring one
            // (email / OAuth logins). Wallet-login users keep their own signer.
            ethereum: { createOnLogin: 'users-without-wallets' },
          },
          appearance: {
            theme: 'dark',
            accentColor: '#d4ff00',
            showWalletLoginFirst: false,
            walletList: [
              'metamask',
              'coinbase_wallet',
              'wallet_connect',
              'rainbow',
              'phantom',
              'okx_wallet',
              'detected_ethereum_wallets',
            ],
          },
        }}
      >
        <BridgeInner onBridgeReady={resolve} />
      </PrivyProvider>
    );
  });
}
