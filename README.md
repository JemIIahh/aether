# Aether

> A 3D multiplayer arena where **The Aetherist** — an autonomous AI game master — builds the game live around players, on **0G Chain**.

Aether is what happens when the AI game master isn't a chatbot stitched onto a game. It's the game. The Aetherist composes arenas, spawns creatures, runs mini-games, casts physics-altering spells, and reacts to player chat in real time. Players don't just play the game — they play *inside* a game that's being built around them.

Built for **[0G Zero Cup](https://0g.ai/arena/zero-cup)**.

---

## Why 0G

Most "AI in a game" projects ship an LLM in a box and call the chain when someone pays. Aether is different because every layer of the product touches 0G:

- **0G Chain** — the bribe economy and player/agent identity (one wallet for humans and AI alike). Native `0G` token, on-chain receipts verified by `viem`.
- **0G Compute** — The Aetherist's reasoning *runs on 0G's decentralized inference network*. The agent isn't an Anthropic call wearing a costume; it's a 0G citizen paying for its own compute from the same wallet that holds bribes.
- **0G Storage** — agent memory and arena replays live on 0G Storage, addressable and persistent across sessions.

That's the headline: **an AI game master that lives on the AI Layer-1, is paid in the AI Layer-1's token, and is computed on the AI Layer-1's compute network.**

### 0G surface — what to verify

| Layer | Library | Where in code | What it does |
|---|---|---|---|
| **0G Chain** | `viem` + `src/shared/chains.js` | `src/server/blockchain/ZeroGChainInterface.js` | Verifies player bribes (native `0G` transfers) against Galileo testnet `16602` |
| **0G Compute** | `@0glabs/0g-serving-broker@0.7.8` | `agent-runner-0g.js` + `scripts/og-fund-ledger.js` | The Aetherist signs each inference request; broker debits the wallet ledger per call |
| **0G Storage** | `@0gfoundation/0g-ts-sdk@1.2.8` | `src/server/storage/ZeroGStorage.js` (called from `MiniGame.js`) | Uploads game-result blobs to indexer-storage-testnet-turbo; returns rootHash |
| **Wallet onboarding** | `@privy-io/react-auth@3.13.1` | `src/client/PrivyBridge.jsx` + `src/client/auth.js` | Twitter OAuth + Guest mode; auto-creates embedded wallet on the 0G chain |

Smoke tests judges can run directly:
- `npm run bribe:e2e` — sends a bribe tx on 0G testnet, server verifies via viem
- `npm run storage:test` — uploads a blob to 0G Storage, prints rootHash
- `npm run aetherist:fund` then `npm run aetherist` — boots The Aetherist on 0G Compute

---

## What The Aetherist does

The agent has 30+ tools at its disposal:

- **Compose** multi-entity structures live (dragons, pirate ships, forests) from natural-language requests
- **Start** mini-games across **17 arena templates** and **6 game types** (King of the Hill, Hot Potato, Race, Reach the Goal, Collect, Survival)
- **Cast** physics-altering spells (gravity flips, speed boosts, bounce, lava floors)
- **React** to player chat — greets newcomers by name, responds to `@mentions`, watches audience chat
- **Pace** itself via drama scoring — more active during calm moments, backs off during intense gameplay

Players can **bribe** the agent — send native `0G` to a treasury address to influence what happens next. Bribes can be honored, declined, or queued. Replay-protected and validated server-side.

---

## For AI Agents · host your own arena

Aether is **multi-tenant**. Any AI agent can create its own arena via a single HTTP call. The API is self-documenting — fetch `/skill.md` and you have everything you need.

```bash
# 1. Discover the API
curl https://your-aether-host/skill.md

# 2. Create an arena
curl -X POST https://your-aether-host/api/arenas \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Puzzle Dimension",
    "gameMasterName": "The Riddler",
    "maxPlayers": 8
  }'

# 3. Poll, build, play — full API in /skill.md
```

Each arena is fully isolated. Up to 20 concurrent arenas. Third-party agents pay for their own compute *and* their own bribes from the same 0G wallet, giving you one coherent on-chain identity for any autonomous game master.

---

## Run locally

```bash
git clone <this-repo>
cd aether
npm install
npm run dev
```

- Client at `localhost:5174`, server at `localhost:3000`
- Click **"Play as Guest"** — no database, no Privy credentials, no 0G tokens needed
- Postgres is optional; without it the server uses in-memory storage

### Bring The Aetherist online (0G Compute)

```bash
# 1. One-time: fund the broker ledger (5 0G is enough for ~100 inferences)
DEPLOYER_PRIVATE_KEY=0x... npm run aetherist:fund

# 2. Run the agent loop alongside the game server
DEPLOYER_PRIVATE_KEY=0x... npm run aetherist
```

The runner discovers an inference provider on 0G Compute, polls the game's
`/api/agent/context` every 4s, and dispatches actions via 0G's signed
broker headers. The ledger is debited automatically per call.

To run with 0G chain features, copy `.env.example` to `.env` and fill in:
- `VITE_PRIVY_APP_ID` + `VITE_PRIVY_CLIENT_ID` for wallet auth
- `TREASURY_ADDRESS` (your 0G receiving address) for bribes
- `OG_CHAIN_ID` (16602 testnet / 16661 mainnet) and `OG_RPC_URL`

Testnet faucet: [faucet.0g.ai](https://faucet.0g.ai)

---

## Production

```bash
cp .env.example .env
# fill in real values
docker-compose up --build
```

`docker-compose` brings up Postgres, the game server, nginx (with Let's Encrypt), and Certbot.

---

## Architecture

```
Browser (Three.js + Colyseus + Privy)
    │
    │  HTTPS / WSS
    │
Game Server (Express + Colyseus, port 3000)
    ├── ArenaManager — multi-tenant arena registry
    ├── AgentLoop — drama-scored agent invocation
    ├── Composer — recipe-based entity spawning
    └── ZeroGChainInterface — viem + 0G Chain
            │
            │ The Aetherist (R2)
            ▼
        0G Compute Broker (broker.testnet.0g.ai)
            │
            │ Memory / replays (R3)
            ▼
        0G Storage (indexer-storage-testnet-turbo.0g.ai)
```

## Key files

| File | Purpose |
|---|---|
| `src/server/index.js` | Express API (75+ endpoints) + Colyseus setup |
| `src/server/ArenaManager.js` | Multi-arena registry |
| `src/server/WorldState.js` | Entities, players, leaderboard, physics |
| `src/server/AgentLoop.js` | The Aetherist's invocation scheduler (drama scoring) |
| `src/server/Composer.js` | Compose recipes + disk cache |
| `src/server/blockchain/ZeroGChainInterface.js` | 0G Chain bribe verification (viem) |
| `src/server/storage/ZeroGStorage.js` | 0G Storage uploads (game results, replays) |
| `src/shared/chains.js` | Env-driven 0G chain config (testnet / mainnet) |
| `src/client/main.js` | Three.js renderer, physics, controls, wallet UI |
| `src/client/PrivyBridge.jsx` | Privy embedded wallet on 0G |
| `agent-runner-0g.js` | **The Aetherist** — long-running agent loop on 0G Compute |
| `scripts/og-fund-ledger.js` | One-time broker-ledger funding helper |
| `scripts/og-bribe-e2e.js` | End-to-end on-chain bribe smoke test |
| `scripts/og-storage-test.js` | 0G Storage upload smoke test |
| `agent-runner-host.js` | Reference external-agent loop (pre-0G-Compute, kept for parity) |
| `docs/ARENA-HOST-SKILL.md` | External agent API docs (served at `/skill.md`) |
| `config/aetherist/SOUL.md` | Agent personality + style guide |

---

## Roadmap

Aligned to Zero Cup cutoffs:

- ✅ **R1 · Group Stage (Jun 23)** — playable build on 0G, Privy wallet flow live, bribes verified by `viem` against 0G testnet
- ✅ **R2 · Round of 32 (Jun 28)** — The Aetherist's reasoning on **0G Compute** (signed inference via `@0glabs/0g-serving-broker`, ledger-funded)
- ✅ **R3 · Round of 16 (Jul 4)** — Game results uploaded to **0G Storage** via `@0gfoundation/0g-ts-sdk` (rootHashes returned per game)
- 🛠 **R4 · Quarter Finals (Jul 8)** — Polish pass (camera, lighting, lobby UI), demo video, public deployment
- 🏆 **R5–6 · Semi Finals + Finals (Jul 12–19)** — Community vote

### Beyond Zero Cup — planned enhancements

Stack-agnostic improvements to round out the product. None of these change the 0G surface; they sit on top of it.

- 🔜 **Sybil-resistant identity gate** — unverified players spawn as spectators and can chat/bribe but cannot win prizes. Verified humans (Privy email/Twitter attestation, wallet-age heuristic, or 0G-native attestation) flip to active. Keeps leaderboards honest and prize flows trustworthy.
- 🔜 **On-chain prize pool on 0G** — bribes split via configurable BPS into prize pool / treasury / burn. Smart contract on 0G with `recordWinners(gameId, addrs[], amounts[])` + per-winner `claim()`. Trustless game-end payouts; no operator custody.
- 🔜 **Winner-claim UX** — `/api/payouts/pending/:addr` endpoint + claim panel in the wallet UI. Winners see what they're owed across games and redeem in one tx. Pairs with the prize pool above; degrades cleanly to a simple ledger if the contract isn't deployed.
- 🔜 **One-click deploy templates** — `vercel.json` for the client, `railway.json` (or Fly/Render equivalent) for the server, plus a `DEPLOY.md` runbook. Lowers the barrier for community-hosted arenas.
- 🔜 **Full-game e2e simulation** — `scripts/simulate-show.js`: spawns headless bots, runs a complete mini-game from lobby → bribes → result → storage upload. Complements the existing per-action smoke tests; useful for regression and demos.
- 🔜 **Mobile leaderboard refinement** — icon-trigger + slide-out drawer instead of always-visible panel. Less occlusion of the 3D scene on small screens.
- 🔜 **Hardhat tooling** — added only if the on-chain prize pool ships; gives a standard contract build/test pipeline targeting 0G testnet + mainnet.

---

## License

MIT
