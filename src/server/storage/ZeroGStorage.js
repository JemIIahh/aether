/**
 * ZeroGStorage — server-side wrapper around @0glabs/0g-ts-sdk for
 * persisting game artifacts to the 0G Storage network.
 *
 * Uploaded as: agent memory snapshots, arena game results / replays,
 * Composer recipe cache. Returned rootHash is what other clients use
 * to fetch the blob back from the indexer.
 *
 * Singleton — initialized once at boot from env config. Disabled
 * (uploads/downloads no-op) if DEPLOYER_PRIVATE_KEY isn't set, so
 * guest / dev sessions don't need an on-chain wallet.
 */

import { Indexer, ZgFile } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';
import { writeFileSync, readFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const DEFAULT_INDEXER = 'https://indexer-storage-testnet-turbo.0g.ai';

export class ZeroGStorage {
  constructor({ rpcUrl, indexerUrl, privateKey, tempDir } = {}) {
    this.rpcUrl = rpcUrl || process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    this.indexerUrl = indexerUrl || process.env.OG_STORAGE_INDEXER_URL || DEFAULT_INDEXER;
    this.privateKey = privateKey || process.env.DEPLOYER_PRIVATE_KEY || null;
    this.tempDir = tempDir || join(process.cwd(), 'data', 'storage-tmp');
    this.enabled = !!this.privateKey;

    if (this.enabled && !existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }

    this._indexer = null;
    this._signer = null;

    if (this.enabled) {
      console.log(`[Storage] ZeroGStorage initialized — indexer: ${this.indexerUrl}`);
    } else {
      console.log('[Storage] ZeroGStorage disabled (no DEPLOYER_PRIVATE_KEY) — uploads will no-op');
    }
  }

  _getIndexer() {
    if (!this._indexer) this._indexer = new Indexer(this.indexerUrl);
    return this._indexer;
  }

  _getSigner() {
    if (!this._signer) {
      const provider = new ethers.JsonRpcProvider(this.rpcUrl);
      this._signer = new ethers.Wallet(this.privateKey, provider);
    }
    return this._signer;
  }

  /**
   * Upload a JSON blob, returns the rootHash for later retrieval.
   * No-ops to null when disabled.
   */
  async uploadJson(key, data) {
    if (!this.enabled) return null;

    const content = JSON.stringify(data);
    const tempPath = join(this.tempDir, `${key}-${Date.now()}-${process.pid}.json`);

    try {
      writeFileSync(tempPath, content);
      const file = await ZgFile.fromFilePath(tempPath);
      const [tree, treeErr] = await file.merkleTree();
      if (treeErr || !tree) {
        await file.close();
        throw new Error(`Merkle tree error: ${treeErr}`);
      }
      const rootHash = tree.rootHash() ?? '';

      const indexer = this._getIndexer();
      const [, uploadErr] = await indexer.upload(file, this.rpcUrl, this._getSigner());
      await file.close();
      if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

      console.log(`[Storage] uploaded key="${key}" rootHash=${rootHash.slice(0, 14)}…`);
      return rootHash;
    } finally {
      try { unlinkSync(tempPath); } catch {}
    }
  }

  /**
   * Fetch a previously uploaded blob by rootHash, parse as JSON.
   */
  async downloadJson(rootHash) {
    if (!this.enabled) return null;

    const tempPath = join(this.tempDir, `dl-${Date.now()}-${process.pid}.bin`);
    try {
      const indexer = this._getIndexer();
      const err = await indexer.download(rootHash, tempPath, true);
      if (err) throw new Error(`Download error: ${err}`);
      const raw = readFileSync(tempPath, 'utf8');
      return JSON.parse(raw);
    } finally {
      try { unlinkSync(tempPath); } catch {}
    }
  }

  // -------- Convenience helpers (domain-specific keys) --------

  /** Persist a final arena game result + leaderboard snapshot. */
  async uploadGameResult(arenaId, gameRecord) {
    return this.uploadJson(`game-${arenaId}-${gameRecord.id || Date.now()}`, {
      arenaId,
      type: 'game-result',
      record: gameRecord,
      uploadedAt: new Date().toISOString(),
    });
  }

  /** Persist an agent memory snapshot keyed by session id. */
  async uploadAgentMemory(sessionId, snapshot) {
    return this.uploadJson(`agent-mem-${sessionId}`, {
      sessionId,
      type: 'agent-memory',
      snapshot,
      uploadedAt: new Date().toISOString(),
    });
  }

  /** Persist a Composer recipe so it can be replayed across arenas. */
  async uploadComposerRecipe(name, recipe) {
    return this.uploadJson(`recipe-${name}`, {
      name,
      type: 'composer-recipe',
      recipe,
      uploadedAt: new Date().toISOString(),
    });
  }
}

// ---- Module-level singleton + helpers ----

let _instance = null;

export function getStorage() {
  if (!_instance) _instance = new ZeroGStorage();
  return _instance;
}

/**
 * Fire-and-forget storage upload for a finished game.
 * Returns a promise that resolves to the rootHash (or null when disabled).
 * Failures are logged but never thrown — game flow must not depend on
 * 0G Storage being reachable.
 */
export async function persistGameResult(arenaId, record) {
  const storage = getStorage();
  if (!storage.enabled) return null;
  try {
    const rootHash = await storage.uploadGameResult(arenaId, record);
    return rootHash;
  } catch (err) {
    console.error(`[Storage] persistGameResult failed for ${arenaId}/${record.id}:`, err.message);
    return null;
  }
}
