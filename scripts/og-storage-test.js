/**
 * og-storage-test.js — Round-trip 0G Storage upload + download.
 *
 * Proves the R3 storage path:
 *   1. Uploads a sample JSON blob via ZeroGStorage.uploadJson()
 *      (same code the server uses to persist game results / agent memory)
 *   2. Reads it back from the indexer via downloadJson()
 *   3. Confirms the round-tripped content matches the original
 *
 * Usage:  npm run storage:test
 */

import { ZeroGStorage } from '../src/server/storage/ZeroGStorage.js';

function fmt(ms) { return `${ms.toFixed(0)}ms`; }
function header(s) { console.log(`\n=== ${s} ===`); }

async function main() {
  const storage = new ZeroGStorage();
  if (!storage.enabled) {
    console.error('Storage disabled — set DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const sample = {
    type: 'aether-storage-smoke-test',
    arenaId: 'aether',
    nonce: Date.now(),
    payload: {
      players: ['Guest-test1', 'Guest-test2'],
      winners: ['Guest-test1'],
      duration: 31,
      note: 'Round-trip storage probe — safe to delete',
    },
  };

  header('Step 1 — upload sample JSON');
  console.log(`Indexer:    ${storage.indexerUrl}`);
  console.log(`Payload:    ${Object.keys(sample.payload).length} keys, nonce=${sample.nonce}`);
  const t0 = performance.now();
  const rootHash = await storage.uploadJson(`storage-test-${sample.nonce}`, sample);
  const t1 = performance.now();
  console.log(`rootHash:   ${rootHash}`);
  console.log(`latency:    ${fmt(t1 - t0)}`);

  header('Step 2 — download by rootHash');
  const t2 = performance.now();
  const round = await storage.downloadJson(rootHash);
  const t3 = performance.now();
  console.log(`latency:    ${fmt(t3 - t2)}`);
  console.log(`recovered:  nonce=${round?.nonce}, type=${round?.type}, players=${round?.payload?.players?.length}`);

  header('Step 3 — content match');
  const matches =
    round.nonce === sample.nonce &&
    round.type === sample.type &&
    JSON.stringify(round.payload) === JSON.stringify(sample.payload);
  console.log(`nonce match: ${round?.nonce === sample.nonce ? 'PASS' : 'FAIL'}`);
  console.log(`type match:  ${round?.type === sample.type ? 'PASS' : 'FAIL'}`);
  console.log(`payload identical: ${matches ? 'PASS' : 'FAIL'}`);

  header('Summary');
  console.log(`upload:      ${rootHash ? 'PASS' : 'FAIL'}`);
  console.log(`download:    ${round ? 'PASS' : 'FAIL'}`);
  console.log(`integrity:   ${matches ? 'PASS' : 'FAIL'}`);
  console.log(`total:       ${fmt(t3 - t0)}`);

  const allPass = !!rootHash && !!round && matches;
  console.log(`\n${allPass ? '✓ R3 storage round-trip: PASS' : '✗ R3 storage round-trip: FAIL'}`);
  process.exit(allPass ? 0 : 1);
}

main().catch(e => { console.error('CAUGHT:', e.message); process.exit(1); });
