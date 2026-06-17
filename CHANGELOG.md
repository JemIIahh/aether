# Changelog

All notable changes to Aether are documented here. Each entry includes: what changed, why, and which files moved.

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
