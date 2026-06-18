/**
 * og-fund-ledger.js — One-time setup: fund the 0G Compute broker ledger
 *
 * The broker ledger is the prepaid balance that pays inference providers
 * on your behalf. Without it, every /chat/completions call fails.
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... node scripts/og-fund-ledger.js          # default: 5 0G
 *   DEPLOYER_PRIVATE_KEY=0x... node scripts/og-fund-ledger.js 10        # custom amount
 */

import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';

const ZG_RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
// Default 2 0G — minimum that allows the broker SDK to auto-fund a provider
// sub-account on first inference (which requires 2 0G transferred in). For a
// longer-running demo, pass a bigger number: `node scripts/og-fund-ledger.js 5`.
const AMOUNT_0G = Number(process.argv[2] || 2);

if (!DEPLOYER_PRIVATE_KEY) {
  console.error('Set DEPLOYER_PRIVATE_KEY env var (0G wallet with native tokens).');
  process.exit(1);
}

async function main() {
  const rpc = new ethers.JsonRpcProvider(ZG_RPC_URL);
  const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, rpc);
  console.log(`Wallet: ${wallet.address}`);

  const balance = await rpc.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} 0G`);

  if (balance === 0n) {
    console.error('Wallet has 0 balance. Get testnet tokens at https://faucet.0g.ai');
    process.exit(1);
  }

  const broker = await createZGComputeNetworkBroker(wallet);

  let existing = null;
  try { existing = await broker.ledger.getLedger(); } catch {}

  if (existing) {
    console.log(`Existing ledger — total: ${ethers.formatEther(existing.totalBalance || 0n)} 0G, locked: ${ethers.formatEther(existing.locked || 0n)} 0G`);
    console.log(`Depositing additional ${AMOUNT_0G} 0G...`);
    await broker.ledger.depositFund(AMOUNT_0G);
  } else {
    console.log(`Creating ledger with ${AMOUNT_0G} 0G runway...`);
    await broker.ledger.addLedger(AMOUNT_0G);
  }

  const after = await broker.ledger.getLedger();
  console.log(`Done. Ledger total: ${ethers.formatEther(after.totalBalance || 0n)} 0G`);
}

main().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
