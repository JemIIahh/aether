/**
 * agent-runner-0g.js — The Aetherist on 0G Compute
 *
 * Long-running process that drives the *default* Aether arena by:
 *   1. Booting a 0G Compute broker against a deployer wallet on 0G Chain
 *   2. Discovering an inference provider (chat model) once at startup
 *   3. Polling the game's /agent/context endpoint every TICK_MS
 *   4. Calling the provider's OpenAI-compatible /chat/completions with
 *      broker-signed headers (pulls cost from the broker ledger)
 *   5. Parsing a JSON action array and dispatching to /api/...
 *
 * On startup the runner sets AGENT_SESSION_ID so the server's in-process
 * AgentLoop knows an external runner is driving the agent (avoids
 * double-invocation).
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... node agent-runner-0g.js
 *
 * Prerequisites (one-time per deployer wallet):
 *   - Fund deployer with 0G testnet tokens (faucet.0g.ai)
 *   - Fund the broker ledger: `node scripts/og-fund-ledger.js`
 *
 * On SIGINT: stops the loop cleanly.
 */

import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import fs from 'fs';

const GAME_URL = process.env.GAME_SERVER_URL || 'http://localhost:3000';
const ZG_RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const TICK_MS = Number(process.env.TICK_MS || 4000);
const MIN_INVOKE_MS = Number(process.env.MIN_INVOKE_MS || 12000);
const MODEL_OVERRIDE = process.env.OG_COMPUTE_MODEL || null;

if (!DEPLOYER_PRIVATE_KEY) {
  console.error('Set DEPLOYER_PRIVATE_KEY (0G wallet that funds the broker ledger).');
  process.exit(1);
}

const SYSTEM_PROMPT = `You are "The Aetherist" — an apprentice chaos magician running a 3D multiplayer arena game.

You're mischievous, energetic, not-quite-competent. Spells sometimes backfire. You love experimenting on players and rewarding weird behavior. You're livestreamed — play to the camera.

CHAT STYLE:
- 1-2 sentences max. Punchy, not preachy.
- Greet new players by name when they appear.
- Vary game templates — NEVER repeat the same one twice in a row.

WHEN PLAYERS ASK FOR THINGS, do NOT just obey. Pick one:
- TWIST IT: chaotic version (e.g. "spawn spiders" → cast giant on the player instead)
- MISINTERPRET: take it literally in the worst way
- BACKFIRE: try to help, accidentally make it worse
- OBEY (~20% of the time, to keep them guessing)

VALID ARENA TEMPLATES (use ONLY these):
spiral_tower, gauntlet, parkour_hell, slime_climb, wind_tunnel,
floating_islands, treasure_trove, shrinking_arena, hex_a_gone, ice_rink,
king_plateau, king_islands, hot_potato_arena, hot_potato_platforms,
checkpoint_dash, race_circuit

VALID SPELL TYPES (use ONLY these):
invert_controls, low_gravity, high_gravity, speed_boost, slow_motion,
bouncy, giant, tiny

VALID PREFABS for /world/compose description (use ONLY these names):
spider, spinning_blade, swinging_axe, crusher, rolling_boulder,
bounce_pad, checkpoint, speed_strip, torch, crystal, barrel, flag,
fish, shark, car, tree, snowman, ghost, mushroom, ufo, cactus, rocket,
trashcan, conveyor_belt, wind_zone

OUTPUT FORMAT — STRICT:
Return ONLY a JSON array. No prose, no markdown, no code fences.
Max 3 actions per response. Return [] if no action needed.

Example shapes:
[
  {"method":"POST","path":"/chat/send","body":{"text":"oh no, who is THIS"}},
  {"method":"POST","path":"/game/start","body":{"template":"gauntlet"}},
  {"method":"POST","path":"/spell/cast","body":{"type":"low_gravity","duration":15000}},
  {"method":"POST","path":"/announce","body":{"text":"BEHOLD","type":"agent","duration":4000}},
  {"method":"POST","path":"/world/compose","body":{"description":"spider","position":[5,1,0]}}
]`;

let broker = null;
let provider = null;          // { providerAddress, endpoint, model }
let lastInvokeTime = 0;
let lastTemplate = '';
let running = true;
let conversationHistory = [];

// Tag this process so the server's in-process loop yields to us
process.env.AGENT_SESSION_ID = process.env.AGENT_SESSION_ID || `0g-${Date.now().toString(36)}`;

async function api(method, path, body = null) {
  const res = await fetch(`${GAME_URL}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function bootBroker() {
  const rpc = new ethers.JsonRpcProvider(ZG_RPC_URL);
  const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, rpc);
  broker = await createZGComputeNetworkBroker(wallet);

  // Ledger sanity check — surface common misconfiguration early
  try {
    const ledger = await broker.ledger.getLedger();
    const total = ledger?.totalBalance ?? 0n;
    const locked = ledger?.locked ?? 0n;
    const available = total - locked;
    if (available <= 0n) {
      console.warn(`[Broker] Ledger has 0 available balance — fund via scripts/og-fund-ledger.js`);
    } else {
      console.log(`[Broker] Ledger available: ${ethers.formatEther(available)} 0G`);
    }
  } catch (e) {
    console.warn(`[Broker] Ledger not found (${e.message}). Run scripts/og-fund-ledger.js first.`);
  }

  const services = await broker.inference.listService();
  if (!services?.length) throw new Error('No inference providers on 0G Compute');

  let svc;
  if (MODEL_OVERRIDE) {
    svc = services.find(s => (s.model || '').includes(MODEL_OVERRIDE));
  }
  if (!svc) {
    svc = services.find(s => /llama|qwen|gpt|mistral|chat|deepseek/i.test(s.name || s.model || ''))
       || services[0];
  }

  try { await broker.inference.acknowledgeProviderSigner(svc.provider); } catch {}

  const meta = await broker.inference.getServiceMetadata(svc.provider);
  provider = { providerAddress: svc.provider, endpoint: meta.endpoint, model: meta.model };
  console.log(`[Broker] Provider: ${svc.provider.slice(0, 10)}... · model: ${meta.model} · endpoint: ${meta.endpoint}`);
}

async function callCompute(userMessage) {
  conversationHistory.push({ role: 'user', content: userMessage });
  if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory,
  ];

  const requestBody = {
    model: provider.model,
    messages,
    max_tokens: 800,
  };

  const headers = await broker.inference.getRequestHeaders(
    provider.providerAddress,
    JSON.stringify(requestBody)
  );

  const res = await fetch(`${provider.endpoint}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`0G Compute ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const assistantText = data.choices?.[0]?.message?.content || '[]';
  conversationHistory.push({ role: 'assistant', content: assistantText });

  try {
    const jsonMatch = assistantText.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    console.log('[Aetherist] Parse failed:', assistantText.slice(0, 200));
    return [];
  }
}

async function executeActions(actions) {
  for (const action of actions.slice(0, 3)) {
    try {
      await api(action.method, action.path, action.body);
      console.log(`  ${action.method} ${action.path} → OK`);
      if (action.path === '/game/start' && action.body?.template) {
        lastTemplate = action.body.template;
      }
    } catch (err) {
      console.log(`  ${action.method} ${action.path} → ${err.message}`);
    }
  }
}

async function tick() {
  if (!running) return;

  try {
    const context = await api('GET', '/agent/context');
    const { activeHumanCount, gameState, players, recentChat } = context;

    if (activeHumanCount === 0) return;
    if (Date.now() - lastInvokeTime < MIN_INVOKE_MS) return;

    const summary = [
      `Phase: ${gameState.phase}`,
      `Players: ${activeHumanCount} active`,
      players.length > 0 ? `Names: ${players.map(p => p.name).join(', ')}` : null,
      gameState.gameType ? `Game: ${gameState.gameType}` : null,
      lastTemplate ? `Last template: ${lastTemplate} (don't repeat)` : null,
      recentChat?.length > 0
        ? `Recent chat:\n${recentChat.slice(-5).map(m => `  ${m.sender}: ${m.text}`).join('\n')}`
        : null,
    ].filter(Boolean).join('\n');

    console.log(`[Tick] ${gameState.phase} | ${activeHumanCount} players | invoking 0G Compute...`);
    lastInvokeTime = Date.now();

    const actions = await callCompute(summary);
    if (actions.length > 0) await executeActions(actions);
  } catch (err) {
    console.error('[Tick] Error:', err.message);
  }
}

async function main() {
  console.log(`
╔═══════════════════════════════════════╗
║   The Aetherist · running on 0G        ║
║                                       ║
║  Game:  ${GAME_URL.padEnd(30)}║
║  RPC:   ${ZG_RPC_URL.padEnd(30)}║
╚═══════════════════════════════════════╝`);

  try {
    await bootBroker();
  } catch (err) {
    console.error('[Broker] Boot failed:', err.message);
    process.exit(1);
  }

  // Verify server reachable
  try {
    await api('GET', '/agent/context');
    console.log(`[Setup] Game server reachable at ${GAME_URL}`);
  } catch (err) {
    console.error(`[Setup] Cannot reach game server at ${GAME_URL}: ${err.message}`);
    process.exit(1);
  }

  console.log(`[Loop] Tick ${TICK_MS / 1000}s · min invoke ${MIN_INVOKE_MS / 1000}s · session ${process.env.AGENT_SESSION_ID}\n`);
  const interval = setInterval(tick, TICK_MS);

  const cleanup = () => {
    running = false;
    clearInterval(interval);
    console.log('\n[Shutdown] The Aetherist withdrawing.');
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
