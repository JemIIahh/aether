# Deploying Aether

Aether ships as a single container: the Express + Colyseus server (port `3000`) serves the API, the WebSocket, and the built Three.js client out of `dist/`. One URL — judges hit it and play.

The default target is **Railway** (Docker build, persistent process, public WSS). The chain stays on **0G testnet** (`16602` / Galileo). Promote to 0G mainnet only after the prize-pool contract is audited.

---

## Prerequisites

- Railway account + CLI (`npm i -g @railway/cli`, then `railway login`)
- A 0G testnet wallet funded via [faucet.0g.ai](https://faucet.0g.ai) (for the treasury address)
- A Privy app (App ID + Client ID + Secret) — [dashboard.privy.io](https://dashboard.privy.io)
- *(Optional, R2)* `DEPLOYER_PRIVATE_KEY` for The Aetherist on 0G Compute. Run `npm run aetherist:fund` once locally to top up the broker ledger before deploying the agent loop.

---

## One-shot deploy (Railway)

```bash
# 1. Link this repo to a Railway project
railway init

# 2. Push env vars (see "Environment" below)
railway variables set NODE_ENV=production
railway variables set OG_CHAIN_ID=16602
railway variables set OG_RPC_URL=https://evmrpc-testnet.0g.ai
railway variables set VITE_OG_CHAIN_ID=16602
railway variables set VITE_OG_RPC_URL=https://evmrpc-testnet.0g.ai
railway variables set TREASURY_ADDRESS=0x...
railway variables set VITE_TREASURY_ADDRESS=0x...
railway variables set VITE_PRIVY_APP_ID=...
railway variables set VITE_PRIVY_CLIENT_ID=...
railway variables set PRIVY_APP_ID=...
railway variables set PRIVY_APP_SECRET=...
railway variables set JWT_SECRET=$(openssl rand -hex 32)

# 3. Deploy
railway up

# 4. Open the live URL
railway domain      # generates a *.up.railway.app subdomain
railway open
```

Railway builds the Dockerfile, exposes port `3000`, and gives you a public HTTPS URL with WSS support out of the box. The `railway.json` in the repo wires up the build + health check + restart policy.

### Optional: Postgres

The server falls back to in-memory storage if no `DATABASE_URL` is set — fine for a hackathon demo. For persistence, add the Railway Postgres plugin:

```bash
railway add --plugin postgresql
# Railway injects DATABASE_URL automatically; redeploy to pick it up.
railway up
```

### Optional: The Aetherist agent loop

The agent runs in a **separate** process (not in the web container, to avoid blocking the request loop). Run it as a second Railway service that shares the same project:

```bash
# In a new shell, from the repo root
railway service create aetherist
railway variables set --service aetherist DEPLOYER_PRIVATE_KEY=0x...
railway variables set --service aetherist AGENT_SESSION_ID=...   # arena to drive
railway variables set --service aetherist GAME_SERVER_URL=https://<your-web-url>
railway run --service aetherist npm run aetherist
```

(Alternatively, keep the agent loop local during the hackathon and only deploy the web service — judges can still play the game; The Aetherist talks to the same server over HTTPS.)

---

## Environment

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | yes | `production` so the server serves `dist/` |
| `PORT` | auto | Railway sets this; the server reads it |
| `JWT_SECRET` | yes | `openssl rand -hex 32` |
| `OG_CHAIN_ID` | yes | `16602` testnet / `16661` mainnet |
| `OG_RPC_URL` | yes | `https://evmrpc-testnet.0g.ai` for testnet |
| `VITE_OG_CHAIN_ID` | yes | Same as `OG_CHAIN_ID`, baked into client at build |
| `VITE_OG_RPC_URL` | yes | Same as `OG_RPC_URL`, baked into client at build |
| `TREASURY_ADDRESS` | yes | 0G wallet that receives bribes |
| `VITE_TREASURY_ADDRESS` | yes | Same address, client-side |
| `VITE_PRIVY_APP_ID` | yes | From Privy dashboard |
| `VITE_PRIVY_CLIENT_ID` | yes | From Privy dashboard |
| `PRIVY_APP_ID` | yes | Server-side Privy verification |
| `PRIVY_APP_SECRET` | yes | Server-side Privy verification |
| `DATABASE_URL` | no | In-memory fallback if unset |
| `DEPLOYER_PRIVATE_KEY` | no | Required only for the agent loop + 0G Storage uploads |
| `AI_PLAYERS` | no | `true` to spawn bot players in empty lobbies |

⚠️ `VITE_*` vars are inlined into the client bundle **at build time**. Changing one requires a redeploy, not just a restart.

---

## Verifying the deploy

After `railway up` completes, test the surface judges will hit:

```bash
URL=$(railway domain --json | jq -r '.url')

# Static client served
curl -sI "$URL" | head -1                       # → HTTP/2 200

# API up
curl -s "$URL/api/storage/recent" | jq '.enabled, .count'

# Multi-arena API discoverable
curl -s "$URL/skill.md" | head -3

# WebSocket reachable (will exit on handshake completion)
npx -y wscat -c "${URL/https/wss}/?token=guest" --no-color
```

Then open the URL in a browser → "Play as Guest" → confirm:
- 3D scene renders, controls respond
- "Bribe" panel shows your `TREASURY_ADDRESS`
- (If agent loop is running) The Aetherist responds in chat within ~10s

---

## Promoting to 0G mainnet

Don't do this until:
1. The prize-pool contract (R6) is audited
2. The full bribe → game → claim flow has been hammered on testnet
3. You have a real `TREASURY_ADDRESS` cold wallet (not the same key as `DEPLOYER_PRIVATE_KEY`)

Swap these vars together — partial swaps will produce broken bribe verification:

```bash
railway variables set OG_CHAIN_ID=16661
railway variables set OG_RPC_URL=https://evmrpc.0g.ai
railway variables set VITE_OG_CHAIN_ID=16661
railway variables set VITE_OG_RPC_URL=https://evmrpc.0g.ai
railway variables set TREASURY_ADDRESS=0x...mainnet-cold-wallet
railway variables set VITE_TREASURY_ADDRESS=0x...mainnet-cold-wallet
railway up
```

---

## Alternative paths (not the hackathon target)

- **Split client + server (Vercel + Railway)** — requires a small client refactor: replace the `window.location.host` lookups in `src/client/main.js` and `src/client/auth.js` with a `VITE_BACKEND_URL` read, then ship the static `dist/` on Vercel and keep the server on Railway. Tracked under R5; not needed for R4 judging.
- **Self-hosted (docker-compose)** — `cp .env.example .env`, fill in values, `docker-compose up --build`. Brings up Postgres + nginx + Certbot for a full HTTPS deploy on any VPS. See `docker-compose.yml`.

---

## Rollback

```bash
railway deployments               # list recent deploys
railway redeploy <deployment-id>  # roll back to a prior known-good build
```
