/**
 * Client Auth Module — Privy OAuth + Guest login.
 *
 * Uses @privy-io/react-auth via a hidden React island (PrivyBridge.jsx).
 * Exposes a flat async API consumed by main.js.
 */

let _mountPrivyBridge = null;

async function loadPrivyBridge() {
  if (!_mountPrivyBridge) {
    const { Buffer } = await import('buffer');
    globalThis.Buffer = Buffer;
    const mod = await import('./PrivyBridge.jsx');
    _mountPrivyBridge = mod.mountPrivyBridge;
  }
  return _mountPrivyBridge;
}

// See main.js — VITE_BACKEND_URL points the static client at a remote
// game server when client and server are deployed separately.
const _backend = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const API_URL = _backend
  ? _backend
  : (window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : `${window.location.protocol}//${window.location.host}`);

let bridge = null;

// Privy readiness tracking — wallet functions await this before checking bridge
let _privyReadyResolve = null;
const privyReady = new Promise(r => { _privyReadyResolve = r; });

export async function initPrivy(appId, clientId) {
  if (!appId) {
    console.warn('[Auth] No Privy appId — Twitter login disabled');
    _privyReadyResolve();
    return;
  }
  try {
    const mount = await loadPrivyBridge();
    bridge = await withTimeout(mount(appId, clientId), 10000);
    if (!bridge) {
      console.warn('[Auth] Privy bridge timed out');
    }
  } catch (e) {
    console.error('[Auth] Privy initialization failed:', e);
  }
  _privyReadyResolve();
}

export async function getPrivyUser() {
  return bridge?.user ?? null;
}

export async function loginWithTwitter() {
  if (!bridge) throw new Error('Privy not initialized — check VITE_PRIVY_APP_ID and VITE_PRIVY_CLIENT_ID');

  // Clear stale Privy session before starting fresh OAuth flow
  if (bridge.authenticated) {
    await silentLogout();
  }

  try {
    // Must be awaited — Privy v3's initOAuth returns a Promise that resolves
    // when the redirect kicks off (or rejects with the real reason: bad
    // appId, Twitter not enabled in dashboard, callback URL not allow-listed).
    // Without the await, errors are swallowed and the splash hangs on
    // "Redirecting to Twitter...".
    await bridge.initOAuth({ provider: 'twitter' });
  } catch (e) {
    console.error('[Auth] Twitter OAuth failed:', e);
    const msg = e?.message || e?.error_description || 'Unknown OAuth error';
    throw new Error(`Twitter login failed: ${msg}. Check Privy dashboard → Login methods → X(Twitter).`, { cause: e });
  }
}

// Opens Privy's prebuilt login modal and resolves with a boolean —
// true on successful auth, false if the user closed the modal without signing
// in. Driven by React state transitions in PrivyBridge, not Privy's promise
// (which returns void in v3 and can't tell us when login actually completed).
export async function openLoginModal() {
  if (!bridge) throw new Error('Privy not initialized — check VITE_PRIVY_APP_ID and VITE_PRIVY_CLIENT_ID');
  if (bridge.authenticated) {
    await silentLogout();
  }
  if (typeof bridge.loginAwait !== 'function') {
    throw new Error('Privy bridge missing loginAwait — rebuild client');
  }
  return await bridge.loginAwait();
}

export async function handleOAuthCallback() {
  if (!bridge) return null;

  const params = new URLSearchParams(window.location.search);
  const isOAuthCallback = params.has('privy_oauth_code') || params.has('privy_oauth_state');
  if (!isOAuthCallback) return null;

  // SDK may have already processed the callback before we check
  const user = (bridge.authenticated && bridge.user)
    ? bridge.user
    : await pollFor(() => bridge.authenticated ? bridge.user : null, 5000, 200);

  cleanOAuthParams();
  return user;
}

// No-op: React SDK auto-creates embedded wallets via createOnLogin: 'all-users'
export async function ensureEmbeddedWallet() {}

export async function exchangeForBackendToken() {
  if (!bridge) return null;

  const privyToken = await withTimeout(bridge.getAccessToken(), 8000);
  if (!privyToken) {
    await silentLogout();
    return null;
  }

  const res = await fetch(`${API_URL}/api/auth/privy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken: privyToken }),
  });
  if (!res.ok) {
    console.error('[Auth] Backend token exchange failed:', res.status);
    return null;
  }

  return storeToken(await res.json());
}

export async function loginAsGuest() {
  const name = `Guest-${Date.now().toString(36)}`;
  const res = await fetch(`${API_URL}/api/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) return null;

  return storeToken(await res.json());
}

export function getToken() {
  return localStorage.getItem('game:token');
}

export function getTwitterProfile(user) {
  // React SDK format
  if (user?.twitter) {
    return {
      username: user.twitter.username,
      name: user.twitter.name,
      avatar: user.twitter.profilePictureUrl,
    };
  }
  // Server format (linked_accounts array)
  const tw = user?.linked_accounts?.find(a => a.type === 'twitter_oauth');
  if (!tw) return null;
  return { username: tw.username, name: tw.name, avatar: tw.profile_picture_url };
}

export async function logout() {
  localStorage.removeItem('game:token');
  if (bridge) await bridge.logout();
}

export async function getEmbeddedWalletProvider() {
  if (!bridge) await withTimeout(privyReady, 12000);
  if (!bridge) {
    console.warn('[Auth] getProvider: bridge not initialized');
    return null;
  }

  // Wallet may not be immediately available after login
  const wallet = await pollFor(() => bridge.getEmbeddedWallet(), 5000, 200);
  if (!wallet) {
    console.warn('[Auth] No embedded wallet available after timeout');
    return null;
  }

  try {
    const provider = await wallet.getEthereumProvider();
    return { provider, address: wallet.address };
  } catch (e) {
    console.error('[Auth] getEthereumProvider failed:', e);
    return null;
  }
}

export async function getEmbeddedWalletAddress() {
  if (!bridge) await withTimeout(privyReady, 12000);
  if (!bridge) return null;
  return await pollFor(() => bridge.getEmbeddedWalletAddress(), 2000, 200);
}

export async function exportWallet() {
  if (!bridge) {
    console.warn('[Auth] exportWallet: bridge not initialized');
    return;
  }
  return bridge.exportWallet();
}

export async function debugAuth() {
  const privyAccessToken = bridge
    ? !!(await bridge.getAccessToken().catch(() => null))
    : false;

  const info = {
    bridgeReady: !!bridge,
    authenticated: bridge?.authenticated ?? false,
    gameToken: !!localStorage.getItem('game:token'),
    privyAccessToken,
    privyUser: bridge?.user ?? null,
    embeddedWallet: bridge?.getEmbeddedWalletAddress() ?? null,
    urlParams: Object.fromEntries(new URLSearchParams(window.location.search)),
  };
  console.table(info);
  return info;
}

// --- Helpers ---

function cleanOAuthParams() {
  window.history.replaceState({}, '', window.location.pathname);
}

function storeToken(data) {
  localStorage.setItem('game:token', data.token);
  return data;
}

function silentLogout() {
  return bridge?.logout().catch(() => {});
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(null), ms)),
  ]);
}

function pollFor(fn, timeoutMs, intervalMs) {
  return new Promise((resolve) => {
    const start = Date.now();
    function check() {
      const result = fn();
      if (result) return resolve(result);
      if (Date.now() - start >= timeoutMs) return resolve(null);
      setTimeout(check, intervalMs);
    }
    check();
  });
}
