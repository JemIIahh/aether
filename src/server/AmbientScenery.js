/**
 * AmbientScenery — populates the outer ring around an arena with large,
 * non-playable decorative structures so the world reads as a place the
 * Aetherist has built, not a small island floating in the void.
 *
 * Runs at game start, after the template has been applied. Spawns 8-16
 * structures in a ring 30-55 units from origin, biome-aware (monolith pillars
 * for stone arenas, glowing crystals for neon, frozen spires for ice, dead
 * trees for forest, etc.). Every structure is a 'decoration' entity, so it
 * doesn't interact with player physics or scoring.
 */

const TAU = Math.PI * 2;

// Biome → ring of structure-type weights. Each entry picks from a pool of
// generator functions defined below.
const BIOME_RING_POOLS = {
  default:    ['monolith', 'crystal_spire', 'broken_arch'],
  stone:      ['monolith', 'broken_arch', 'monolith', 'beacon'],
  lava_rock:  ['monolith', 'lava_vent', 'broken_arch', 'beacon'],
  ice_crystal:['ice_spire', 'crystal_spire', 'ice_spire', 'beacon'],
  neon:       ['neon_pillar', 'crystal_spire', 'neon_pillar', 'beacon'],
  wood:       ['dead_tree', 'monolith', 'dead_tree', 'beacon'],
  candy:      ['neon_pillar', 'crystal_spire', 'crystal_spire', 'beacon'],
};

// Hex-color tint per biome — used as a fallback when a generator doesn't
// override.
const BIOME_TINTS = {
  default:    { primary: '#5a6a7a', glow: '#9fb3c8' },
  stone:      { primary: '#5a6a7a', glow: '#9fb3c8' },
  lava_rock:  { primary: '#7a2c1a', glow: '#ff6a2a' },
  ice_crystal:{ primary: '#4a7a9c', glow: '#9fe7ff' },
  neon:       { primary: '#2a1a5a', glow: '#ff2d92' },
  wood:       { primary: '#3a2a1a', glow: '#a07a4a' },
  candy:      { primary: '#d4347a', glow: '#ffb4dc' },
};

function pick(arr, rng = Math.random) {
  return arr[Math.floor(rng() * arr.length)];
}

/** A tall stone pillar. 1-3 stacked blocks, gentle rotation. */
function buildMonolith(cx, cz, tint) {
  const height = 6 + Math.random() * 12;       // 6 → 18 units tall
  const width = 1.4 + Math.random() * 1.4;     // 1.4 → 2.8 thick
  return [{
    type: 'decoration',
    position: [cx, height / 2, cz],
    size: [width, height, width],
    properties: { shape: 'column', color: tint.primary },
  }];
}

/** A glowing crystal spire — narrow, tall, emissive. */
function buildCrystalSpire(cx, cz, tint) {
  const height = 8 + Math.random() * 10;
  const w = 0.6 + Math.random() * 0.8;
  return [{
    type: 'decoration',
    position: [cx, height / 2, cz],
    size: [w, height, w],
    properties: { shape: 'star', color: tint.glow, emissive: true, rotating: true, speed: 0.2 + Math.random() * 0.3 },
  }];
}

/** A broken stone archway — two pillars + a horizontal lintel. */
function buildBrokenArch(cx, cz, tint) {
  const ah = 4 + Math.random() * 4;
  const aw = 3 + Math.random() * 2;
  const out = [];
  out.push({
    type: 'decoration',
    position: [cx - aw / 2, ah / 2, cz],
    size: [0.8, ah, 0.8],
    properties: { shape: 'column', color: tint.primary },
  });
  out.push({
    type: 'decoration',
    position: [cx + aw / 2, ah / 2, cz],
    size: [0.8, ah, 0.8],
    properties: { shape: 'column', color: tint.primary },
  });
  if (Math.random() > 0.3) {
    out.push({
      type: 'decoration',
      position: [cx, ah, cz],
      size: [aw + 0.8, 0.6, 1],
      properties: { shape: 'box', color: tint.primary },
    });
  }
  return out;
}

/** A beacon — short pedestal with a glowing crystal on top. */
function buildBeacon(cx, cz, tint) {
  return [
    {
      type: 'decoration',
      position: [cx, 1, cz],
      size: [1.4, 2, 1.4],
      properties: { shape: 'box', color: tint.primary },
    },
    {
      type: 'decoration',
      position: [cx, 2.8, cz],
      size: [0.8, 1.2, 0.8],
      properties: { shape: 'dodecahedron', color: tint.glow, emissive: true, rotating: true, speed: 0.4 },
    },
  ];
}

/** A lava vent — flat dark base with a pulsing emissive orb hovering. */
function buildLavaVent(cx, cz, tint) {
  return [
    {
      type: 'decoration',
      position: [cx, 0.4, cz],
      size: [2.5, 0.8, 2.5],
      properties: { shape: 'box', color: '#1a0a0a' },
    },
    {
      type: 'decoration',
      position: [cx, 2, cz],
      size: [0.9, 0.9, 0.9],
      properties: { shape: 'sphere', color: '#ff4a1a', emissive: true, bobSpeed: 1.2, bobHeight: 0.4 },
    },
  ];
}

/** A frozen spire — thin tapered ice column with a chunky base. */
function buildIceSpire(cx, cz, tint) {
  const h = 5 + Math.random() * 8;
  return [
    {
      type: 'decoration',
      position: [cx, 0.5, cz],
      size: [2, 1, 2],
      properties: { shape: 'box', color: '#1a4a6a' },
    },
    {
      type: 'decoration',
      position: [cx, h / 2 + 1, cz],
      size: [1, h, 1],
      properties: { shape: 'cone', color: tint.glow, emissive: true },
    },
  ];
}

/** A neon pillar — emissive tall column. */
function buildNeonPillar(cx, cz, tint) {
  const h = 6 + Math.random() * 8;
  return [{
    type: 'decoration',
    position: [cx, h / 2, cz],
    size: [0.5, h, 0.5],
    properties: { shape: 'cylinder', color: tint.glow, emissive: true },
  }];
}

/** A dead tree silhouette — trunk + a few branch crystals. */
function buildDeadTree(cx, cz, tint) {
  const h = 6 + Math.random() * 4;
  return [
    {
      type: 'decoration',
      position: [cx, h / 2, cz],
      size: [0.6, h, 0.6],
      properties: { shape: 'cylinder', color: '#2a1a0f' },
    },
    {
      type: 'decoration',
      position: [cx + 0.5, h - 0.5, cz + 0.3],
      size: [0.3, 0.3, 0.3],
      properties: { shape: 'star', color: tint.glow, emissive: true },
    },
  ];
}

const GENERATORS = {
  monolith:      buildMonolith,
  crystal_spire: buildCrystalSpire,
  broken_arch:   buildBrokenArch,
  beacon:        buildBeacon,
  lava_vent:     buildLavaVent,
  ice_spire:     buildIceSpire,
  neon_pillar:   buildNeonPillar,
  dead_tree:     buildDeadTree,
};

/**
 * Spawn ambient scenery around the arena. Called from applyTemplate after
 * the play-area entities are spawned.
 *
 * @param {Object} worldState — server WorldState
 * @param {Function} broadcast — broadcast('entity_spawned', entity) helper
 * @param {Object} env — template environment object (materialTheme used for biome)
 */
export function composeAmbientScenery(worldState, broadcast, env = {}) {
  const biome = env.materialTheme || 'default';
  const tint = BIOME_TINTS[biome] || BIOME_TINTS.default;
  const pool = BIOME_RING_POOLS[biome] || BIOME_RING_POOLS.default;

  // 12-16 structures arranged in a ring with jitter — feels populated but not
  // a wall. Inner radius 32, outer radius 55. The arena itself sits inside.
  const count = 12 + Math.floor(Math.random() * 5);
  const spawnedIds = [];

  for (let i = 0; i < count; i++) {
    const baseAngle = (i / count) * TAU;
    const angle = baseAngle + (Math.random() - 0.5) * (TAU / count) * 0.6;
    const radius = 32 + Math.random() * 23;
    const cx = Math.cos(angle) * radius;
    const cz = Math.sin(angle) * radius;

    const generatorKey = pick(pool);
    const generator = GENERATORS[generatorKey];
    if (!generator) continue;

    let pieces;
    try {
      pieces = generator(cx, cz, tint);
    } catch (e) {
      console.warn('[AmbientScenery] generator failed:', generatorKey, e?.message);
      continue;
    }

    for (const piece of pieces) {
      try {
        const entity = worldState.spawnEntity(
          piece.type,
          piece.position,
          piece.size,
          piece.properties || {}
        );
        broadcast('entity_spawned', entity);
        spawnedIds.push(entity.id);
      } catch (e) {
        console.warn('[AmbientScenery] spawn failed:', e?.message);
      }
    }
  }

  if (spawnedIds.length > 0) {
    console.log(`[AmbientScenery] biome=${biome} spawned ${spawnedIds.length} structures`);
  }
  return spawnedIds;
}
