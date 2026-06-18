/**
 * og-bribe-e2e.js — Round-trip bribe verification on 0G testnet.
 *
 * Proves the R2 bribe path end-to-end:
 *   1. Send a real native 0G transfer from the deployer wallet to
 *      the treasury address (configured in .env)
 *   2. Wait for the on-chain receipt
 *   3. Instantiate ZeroGChainInterface (same class the server uses)
 *   4. Call verifyBribeTransaction() — confirms sender/recipient/
 *      amount/staleness/replay all pass
 *   5. Print PASS / FAIL with timing breakdown
 *
 * Usage:
 *   npm run bribe:e2e            # 0.001 0G test (smallest bribe option)
 *   npm run bribe:e2e -- 0.005   # explicit amount
 */

import { ethers } from 'ethers';
import { ZeroGChainInterface } from '../src/server/blockchain/ZeroGChainInterface.js';

const ZG_RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const TREASURY = (process.env.TREASURY_ADDRESS || '').toLowerCase();
const AMOUNT_0G = process.argv[2] || '0.001';

function fmt(ms) { return `${ms.toFixed(0)}ms`; }
function header(s) { console.log(`\n=== ${s} ===`); }

async function main() {
  if (!DEPLOYER_PRIVATE_KEY) { console.error('Set DEPLOYER_PRIVATE_KEY'); process.exit(1); }
  if (!TREASURY || !/^0x[0-9a-f]{40}$/.test(TREASURY)) {
    console.error('Set TREASURY_ADDRESS to a valid 0x address'); process.exit(1);
  }

  const rpc = new ethers.JsonRpcProvider(ZG_RPC_URL);
  const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, rpc);
  const value = ethers.parseEther(AMOUNT_0G);
  const expectedWei = value.toString();

  header('Setup');
  console.log(`Player wallet:   ${wallet.address}`);
  console.log(`Treasury:        ${TREASURY}`);
  console.log(`Amount:          ${AMOUNT_0G} 0G  (${expectedWei} wei)`);
  console.log(`Chain RPC:       ${ZG_RPC_URL}`);

  // Pre-flight balance
  const bal = await rpc.getBalance(wallet.address);
  console.log(`Wallet balance:  ${ethers.formatEther(bal)} 0G`);
  if (bal < value) { console.error('Insufficient balance'); process.exit(1); }

  // 1. Send tx
  header('Step 1 — send bribe tx');
  const t0 = performance.now();
  const tx = await wallet.sendTransaction({ to: TREASURY, value });
  const t1 = performance.now();
  console.log(`tx hash:         ${tx.hash}`);
  console.log(`submit latency:  ${fmt(t1 - t0)}`);

  // 2. Wait for receipt
  header('Step 2 — wait for receipt');
  const t2 = performance.now();
  const receipt = await tx.wait();
  const t3 = performance.now();
  console.log(`block:           ${receipt.blockNumber}`);
  console.log(`status:          ${receipt.status === 1 ? 'success' : 'reverted'}`);
  console.log(`confirm latency: ${fmt(t3 - t2)}`);

  // 3. Server-side verification path
  header('Step 3 — ZeroGChainInterface.verifyBribeTransaction()');
  const chain = new ZeroGChainInterface({ rpcUrl: ZG_RPC_URL, treasuryAddress: TREASURY });
  const t4 = performance.now();
  const result = await chain.verifyBribeTransaction(tx.hash, expectedWei, wallet.address);
  const t5 = performance.now();
  console.log(`result:          ${JSON.stringify(result)}`);
  console.log(`verify latency:  ${fmt(t5 - t4)}`);

  // 4. Replay protection sanity check — same txHash should fail
  header('Step 4 — replay protection');
  const replay = await chain.verifyBribeTransaction(tx.hash, expectedWei, wallet.address);
  console.log(`second attempt:  ${JSON.stringify(replay)}`);
  const replayPass = replay.valid === false && /already used/i.test(replay.error || '');

  // 5. Summary
  header('Summary');
  const submitOk = receipt.status === 1;
  const verifyOk = result.valid === true;
  const totalLatency = t5 - t0;
  console.log(`tx submitted:    ${submitOk ? 'PASS' : 'FAIL'}`);
  console.log(`tx verified:     ${verifyOk ? 'PASS' : 'FAIL'}`);
  console.log(`replay blocked:  ${replayPass ? 'PASS' : 'FAIL'}`);
  console.log(`total latency:   ${fmt(totalLatency)}`);
  console.log(`explorer:        https://chainscan-galileo.0g.ai/tx/${tx.hash}`);

  const allPass = submitOk && verifyOk && replayPass;
  console.log(`\n${allPass ? '✓ R2 bribe E2E: PASS' : '✗ R2 bribe E2E: FAIL'}`);
  process.exit(allPass ? 0 : 1);
}

main().catch(e => { console.error('CAUGHT:', e.message); process.exit(1); });
