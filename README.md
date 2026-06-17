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

- Client at `localhost:5173`, server at `localhost:3000`
- Click **"Play as Guest"** — no database, no Privy credentials, no 0G tokens needed
- Postgres is optional; without it the server uses in-memory storage

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
| `src/server/blockchain/ZeroGChainInterface.js` | 0G Chain bribe verification |
| `src/shared/chains.js` | Env-driven 0G chain config (testnet / mainnet) |
| `src/client/main.js` | Three.js renderer, physics, controls, wallet UI |
| `src/client/PrivyBridge.jsx` | Privy embedded wallet on 0G |
| `agent-runner-host.js` | Reference agent (external Anthropic — pre-0G-Compute) |
| `docs/ARENA-HOST-SKILL.md` | External agent API docs (served at `/skill.md`) |
| `config/aetherist/SOUL.md` | Agent personality + style guide |

---

## Roadmap

Aligned to Zero Cup cutoffs:

- ✅ **R1 · Group Stage (Jun 23)** — playable build on 0G, wallet flow live
- ⏳ **R2 · Round of 32 (Jun 28)** — The Aetherist's reasoning on 0G Compute
- ⏳ **R3 · Round of 16 (Jul 4)** — Agent memory + arena replays on 0G Storage
- ⏳ **R4 · Quarter Finals (Jul 8)** — Polish, demo video, public landing
- 🏆 **R5–6 · Semi Finals + Finals (Jul 12–19)** — Community vote

---

## License

MIT
