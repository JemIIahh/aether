# Changelog

All notable changes to Aether are documented here. Each entry includes: what changed, why, and which files moved.

## [0.2.0] — 2026-06-17 · R2 · The Aetherist on 0G Compute

### Added

- **`agent-runner-0g.js`** — long-running agent loop that drives the default Aether arena via the **0G Compute Network**. Boots a broker against a deployer wallet on 0G Chain, discovers an inference provider (chat model), polls `/api/agent/context` every 4s (min-invoke 12s), and dispatches a JSON action array to game endpoints. Replaces the OpenClaw gateway path.
- **`scripts/og-fund-ledger.js`** — one-time helper to create or top up the broker ledger.
- **`package.json` scripts**: `npm run aetherist` (runner) and `npm run aetherist:fund` (ledger setup).
- **Dependencies**: `@0glabs/0g-serving-broker@^0.7.5` (pulled in at `^0.7.8`) and `ethers@^6.13.0` (pulled in at `^6.16.0`) for broker init, ledger management, and request-header signing.
- **`config/aetherist/SOUL.md` persona** baked into the runner's system prompt — twist/misinterpret/backfire/obey loop is preserved verbatim from the chaos-arena spec.
- **`.env.example`** — `DEPLOYER_PRIVATE_KEY` (required) + `OG_COMPUTE_MODEL` (optional provider filter); removed OpenClaw-era placeholders.
- **README**: "Bring The Aetherist online (0G Compute)" section.

### Fixed

- "The The Aetherist" typo across `config/aetherist/SOUL.md`, `docs/CONCEPT.md`, `docs/AGENT-STACK.md`, `docs/DEMO-SCRIPT.md`, `docs/MANIFESTO.md` (collateral of the R1 mass rebrand pass).
- Corrupted `src/client/main.js` and `src/server/arenaMiddleware.js` after a perl substitution used `|` as the delimiter while the search pattern contained `||`. Restored from source, all edits re-applied via Python string replace.

### Architecture notes

- The runner does **not** create its own arena — it drives the *default* `aether` arena (the engine routes `/api/...` without an arena prefix to it). External agents wanting their own arena still use `POST /api/arenas` (the `agent-runner-host.js` pattern).
- Each tick that meets the throttle calls 0G Compute *directly* (not through the `0gent` x402-paywalled gateway). The wallet's broker ledger pays providers under the hood.
- System prompt asks for a JSON action array; non-streaming response; max 3 actions per tick.
- `AGENT_SESSION_ID` is set automatically so the server's in-process `AgentLoop` knows an external runner is present and yields.

## [0.1.0] — 2026-06-17 · R1 · Initial bootstrap

## [0.1.0] — 2026-06-17 · Initial bootstrap

### Bootstrap from chaos-arena-public

Aether is a rebuild of `chaos-arena-public` retargeted to 0G Chain. Created in this commit:

- New repo at `/Users/ram/Desktop/aether`, bootstrapped via `rsync` from `chaos-arena-public/` with the following **exclusions**:
  - `deploy.sh` (chaos.waweapps-specific VPS deploy — write fresh per host)
  - `agent-runner.js` (OpenClaw GM loop — replaced by `agent-runner-0g.js` in R2)
  - `chat-bridge.js` (Twitch/Discord/Telegram bridge — optional, deferred)
  - Original `README.md`, `CHANGELOG.md`, `.git/`, `node_modules/`, `package-lock.json`

### Rebrand

| From | To |
|---|---|
| `Chaos Arena` | `Aether` |
| `Chaos Magician` / `The Magician` | `The Aetherist` |
| `chaos-arena-public` package name | `aether` |
| `config/openclaw/` | `config/aetherist/` |
| `chaos.waweapps.win` host | `aether.example` placeholder |

Applied via `perl -i -pe` across `*.js`, `*.jsx`, `*.md`, `*.html`, `*.yml`, `*.conf`.

### Chain swap — Monad → 0G

- New `src/shared/chains.js` — env-driven `defineChain` config (lifted pattern from BlindBounty). Defaults: testnet `16602` / mainnet `16661`. RPC: `https://evmrpc-testnet.0g.ai` / `https://evmrpc.0g.ai`. Explorer: `chainscan-galileo.0g.ai` / `chainscan.0g.ai`. Native token `0G`.
- Renamed `MonadChainInterface.js` → `ZeroGChainInterface.js`; rewrote to use `ogChain` from shared config.
- `src/server/index.js` — imports `ZeroGChainInterface` + `OG_RPC_URL`; renamed bribe options `costMON` → `cost0G` (6 entries).
- `src/client/PrivyBridge.jsx` — `MONAD_CHAIN` → `OG_CHAIN`, env-driven via `VITE_OG_CHAIN_ID` / `VITE_OG_RPC_URL`.
- `src/client/main.js` — added `OG_CHAIN_ID_HEX`/`OG_EXPLORER_URL` module constants; replaced hardcoded `0x8f` Monad check with `OG_CHAIN_ID_HEX`; updated wallet UI labels, `wallet_addEthereumChain` payload, explorer links, balance display.
- `index.html` — wallet panel labels `MON` → `0G`, `Monad` → `0G`.
- `docker-compose.yml` — `MONAD_RPC_URL` → `OG_RPC_URL` + `OG_CHAIN_ID` + `OG_COMPUTE_BROKER_URL`; Postgres DB renamed to `aether`.
- `Dockerfile` — added `VITE_OG_CHAIN_ID` / `VITE_OG_RPC_URL` build args.
- `.env.example` — rewrote with `OG_*` vars + 0G Compute placeholder section for R2.

### Removed

- All hardcoded Monad chain ID (143 / `0x8f`)
- All `Monadscan` explorer URLs
- All `MON` balance/cost labels
- `MonadChainInterface.js` (renamed to ZeroGChainInterface)
- `MONAD_RPC_URL` env var
