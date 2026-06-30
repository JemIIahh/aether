/**
 * Auth Module - Privy verification + JWT signing
 *
 * If PRIVY_APP_ID and PRIVY_APP_SECRET are set, enables Twitter OAuth.
 * Otherwise, only guest mode is available.
 */

import { PrivyClient } from '@privy-io/server-auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars!!';
const JWT_EXPIRY = '7d';

let privyClient = null;

export function initAuth() {
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (appId && appSecret) {
    privyClient = new PrivyClient(appId, appSecret);
    console.log('[Auth] Privy client initialized');
  } else {
    console.log('[Auth] No Privy credentials — guest-only mode');
  }
}

export async function verifyPrivyToken(accessToken) {
  if (!privyClient || !accessToken) return null;
  try {
    // Cryptographic verification — JWT signature checked against Privy's
    // public keys. Anything tampered throws here.
    const claims = await privyClient.verifyAuthToken(accessToken);
    let user = await privyClient.getUser(claims.userId);

    // Extract each login method we accept. Privy's getUser() only returns
    // linkedAccounts the user actually authenticated with — appearing in the
    // array is itself proof of verification. (Earlier code also required a
    // verifiedAt stamp, but that field is inconsistently named across SDK
    // versions and account types and was rejecting valid logins.)
    const twitter = user.linkedAccounts.find(a => a.type === 'twitter_oauth') || null;
    const email   = user.linkedAccounts.find(a => a.type === 'email') || null;
    const extWallet = user.linkedAccounts.find(
      a => a.type === 'wallet' && a.walletClientType !== 'privy' && a.chainType === 'ethereum'
    ) || null;

    // Embedded EVM wallet (Privy-managed, used for bribes). Not a "login
    // method" itself — created on every login so users always have one.
    let evmWallet = user.linkedAccounts.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy' && a.chainType === 'ethereum'
    );
    if (!evmWallet) {
      try {
        console.log(`[Auth] Creating EVM wallet for ${claims.userId}...`);
        user = await privyClient.createWallets({ userId: claims.userId, createEthereumWallet: true });
        evmWallet = user.linkedAccounts.find(
          a => a.type === 'wallet' && a.walletClientType === 'privy' && a.chainType === 'ethereum'
        );
        console.log(`[Auth] EVM wallet created: ${evmWallet?.address}`);
      } catch (walletErr) {
        console.warn('[Auth] Wallet creation failed:', walletErr.message);
      }
    }

    // Reject if no verified login method was present — refuses bare userIds
    // that somehow exist in Privy with zero confirmed linkages.
    if (!twitter && !email && !extWallet) {
      console.warn(`[Auth] Privy user ${claims.userId} has no verified login method`);
      return null;
    }

    // Pick the primary method for display + telemetry.
    const loginMethod = twitter ? 'twitter' : email ? 'email' : 'wallet';

    // Display name preference: twitter handle → email local-part → wallet short.
    let displayName = null;
    if (twitter) displayName = twitter.name || twitter.username;
    else if (email) displayName = email.address?.split('@')[0] || 'Player';
    else if (extWallet) displayName = `${extWallet.address.slice(0, 6)}…${extWallet.address.slice(-4)}`;

    return {
      privyUserId: claims.userId,
      loginMethod,
      twitterUsername: twitter?.username || null,
      twitterAvatar: twitter?.profilePictureUrl || null,
      emailAddress: email?.address || null,
      externalWalletAddress: extWallet?.address || null,
      displayName,
      walletAddress: evmWallet?.address || null,
    };
  } catch (err) {
    console.error('[Auth] Privy verification failed:', err.message);
    return null;
  }
}

export function signToken(userId, identity = {}) {
  // Embed display identity in our session JWT so /api/me can return the
  // user's real name even when the DB is offline AND the in-memory cache
  // is empty (e.g. after a server restart). Without this, refreshes after
  // a server reboot collapse the user back to "Player-{last 6 of DID}".
  return jwt.sign({ userId, ...identity }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function parseBearerToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return verifyToken(header.slice(7));
}

function userFromPayload(payload) {
  return {
    id: payload.userId,
    name: payload.name || null,
    type: payload.type || null,
    twitterUsername: payload.twitterUsername || null,
    twitterAvatar: payload.twitterAvatar || null,
    walletAddress: payload.walletAddress || null,
  };
}

export function requireAuth(req, res, next) {
  const payload = parseBearerToken(req);
  if (!payload) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  req.user = userFromPayload(payload);
  next();
}

export function optionalAuth(req, res, next) {
  const payload = parseBearerToken(req);
  if (payload) {
    req.user = userFromPayload(payload);
  }
  next();
}
