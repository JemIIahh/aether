/**
 * ArenaTemplates - Pre-designed arena layouts
 *
 * Loaded via start_game({ template }) for atomic arena setup.
 * Each template defines entities, a goal position, game type, and respawn point.
 *
 * Visual properties per template:
 *   materialTheme: stone | lava_rock | ice_crystal | neon | wood | candy
 *   skyPreset: starfield | sunset | storm | void | aurora
 *   fogDensity: 0.008 (tight) → 0.025 (atmospheric)
 */

// Generate 3-layer hex-staggered breakable grid for Hex-A-Gone
function generateHexAGoneEntities() {
  const entities = [];
  const layers = [
    { y: 1, color: '#e67e22', breakDelay: 400 },    // bottom — orange
    { y: 5, color: '#2ecc71', breakDelay: 350 },    // middle — green
    { y: 9, color: '#3498db', breakDelay: 300 },    // top — blue
  ];
  const spacing = 2.5;
  const maxRadius = 8.75;

  for (const layer of layers) {
    for (let row = -4; row <= 4; row++) {
      const zOffset = row % 2 !== 0 ? spacing / 2 : 0;
      for (let col = -4; col <= 4; col++) {
        const x = col * spacing + zOffset;
        const z = row * spacing;
        if (Math.sqrt(x * x + z * z) > maxRadius) continue;

        entities.push({
          type: 'platform',
          position: [x, layer.y, z],
          size: [2, 0.3, 2],
          properties: {
            color: layer.color,
            breakable: true,
            breakDelay: layer.breakDelay,
          },
        });
      }
    }
  }

  return entities;
}

export const TEMPLATES = {
  spiral_tower: {
    name: 'Spiral of Madness',
    gameType: 'reach',
    floorType: 'solid',
    environment: {
      skyColor: '#0d1b2a', fogColor: '#0d1b2a', fogDensity: 0.012,
      ambientIntensity: 0.4,
      materialTheme: 'stone', skyPreset: 'starfield',
    },
    respawnPoint: [0, 2, 0],
    goalPosition: [0, 28, 0],
    entities: [
      // Base platform
      { type: 'platform', position: [0, 0, 0], size: [12, 1, 12], properties: { color: '#2c3e50' } },
      // Spiral platforms going up
      { type: 'platform', position: [6, 4, 0], size: [5, 1, 3], properties: { color: '#3498db' } },
      { type: 'platform', position: [4, 7, 5], size: [4, 1, 3], properties: { color: '#2980b9' } },
      { type: 'platform', position: [-2, 10, 6], size: [4, 1, 3], properties: { color: '#3498db' } },
      { type: 'platform', position: [-6, 13, 2], size: [4, 1, 3], properties: { color: '#2980b9' } },
      { type: 'platform', position: [-5, 16, -4], size: [4, 1, 3], properties: { color: '#3498db' } },
      { type: 'platform', position: [-1, 19, -6], size: [4, 1, 3], properties: { color: '#2980b9' } },
      { type: 'platform', position: [4, 22, -4], size: [4, 1, 3], properties: { color: '#3498db' } },
      { type: 'platform', position: [5, 25, 1], size: [4, 1, 3], properties: { color: '#2980b9' } },
      // Goal platform at top
      { type: 'platform', position: [0, 27, 0], size: [4, 1, 4], properties: { color: '#f1c40f' } },
      // Goal trigger
      { type: 'trigger', position: [0, 29, 0], size: [3, 3, 3], properties: { color: '#f1c40f', rotating: true, speed: 2, isGoal: true } },
      // Obstacles on some platforms
      { type: 'obstacle', position: [-5, 17, -4], size: [1, 2, 1], properties: { color: '#e74c3c', rotating: true, speed: 3 } },
      { type: 'obstacle', position: [4, 23, -4], size: [1, 2, 1], properties: { color: '#e74c3c', rotating: true, speed: 2 } },
      // Torches on platforms
      { type: 'decoration', position: [5, 5, 2], size: [0.3, 0.5, 0.3], properties: { shape: 'cone', color: '#ff6600', emissive: true } },
      { type: 'decoration', position: [-6, 14, 3], size: [0.3, 0.5, 0.3], properties: { shape: 'cone', color: '#ff6600', emissive: true } },
      { type: 'decoration', position: [1, 28, 1], size: [0.8, 1.2, 0.8], properties: { shape: 'dodecahedron', color: '#9b59b6', emissive: true } },
      // Stone columns framing the base
      { type: 'decoration', position: [7, 3, 7], size: [0.6, 5, 0.6], properties: { shape: 'column', color: '#5a6a7a' } },
      { type: 'decoration', position: [-7, 3, -7], size: [0.6, 5, 0.6], properties: { shape: 'column', color: '#5a6a7a' } },
      { type: 'decoration', position: [7, 3, -7], size: [0.6, 5, 0.6], properties: { shape: 'column', color: '#5a6a7a' } },
      { type: 'decoration', position: [-7, 3, 7], size: [0.6, 5, 0.6], properties: { shape: 'column', color: '#5a6a7a' } },
      // Floating crystals
      { type: 'decoration', position: [3, 12, 4], size: [0.5, 0.8, 0.5], properties: { shape: 'star', color: '#3498db', emissive: true, rotating: true, speed: 0.6 } },
      { type: 'decoration', position: [-4, 20, -2], size: [0.6, 1, 0.6], properties: { shape: 'vase', color: '#2980b9', emissive: true, rotating: true, speed: 0.8 } },
    ]
  },

  floating_islands: {
    name: 'Sky Islands',
    gameType: 'collect',
    floorType: 'none',
    environment: {
      skyColor: '#1a3a5c', fogColor: '#1a3a5c', fogDensity: 0.008,
      ambientIntensity: 0.6, sunIntensity: 1.2,
      materialTheme: 'neon', skyPreset: 'void',
    },
    respawnPoint: [0, 6, 0],
    goalPosition: null,
    entities: [
      // Central island
      { type: 'platform', position: [0, 4, 0], size: [8, 2, 8], properties: { color: '#27ae60' } },
      // North island
      { type: 'platform', position: [0, 6, -18], size: [6, 1, 6], properties: { color: '#2ecc71' } },
      // East island
      { type: 'platform', position: [18, 8, 0], size: [6, 1, 6], properties: { color: '#27ae60' } },
      // South island
      { type: 'platform', position: [0, 5, 18], size: [6, 1, 6], properties: { color: '#2ecc71' } },
      // West island
      { type: 'platform', position: [-18, 7, 0], size: [6, 1, 6], properties: { color: '#27ae60' } },
      // Bridges (narrow platforms)
      { type: 'platform', position: [0, 5, -9], size: [2, 0.5, 8], properties: { color: '#8e44ad' } },
      { type: 'platform', position: [9, 6, 0], size: [8, 0.5, 2], properties: { color: '#8e44ad' } },
      { type: 'platform', position: [0, 4.5, 9], size: [2, 0.5, 8], properties: { color: '#8e44ad' } },
      { type: 'platform', position: [-9, 5.5, 0], size: [8, 0.5, 2], properties: { color: '#8e44ad' } },
      // Collectibles scattered on islands
      { type: 'collectible', position: [0, 8, -18], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      { type: 'collectible', position: [2, 8, -17], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      { type: 'collectible', position: [18, 10, 0], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      { type: 'collectible', position: [17, 10, 2], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      { type: 'collectible', position: [0, 7, 18], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      { type: 'collectible', position: [-2, 7, 17], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      { type: 'collectible', position: [-18, 9, 0], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      { type: 'collectible', position: [-17, 9, -2], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      // Center bonus collectible (risky)
      { type: 'collectible', position: [0, 12, 0], size: [1, 1, 1], properties: { color: '#e67e22' } },
      // Moving platform to reach center bonus
      { type: 'platform', position: [0, 8, 0], size: [2, 0.5, 2], properties: { color: '#9b59b6', kinematic: true, path: [[0, 8, 0], [0, 11, 0]], speed: 0.5 } },
      // Trees and mushrooms on islands
      { type: 'decoration', position: [2, 6.5, -17], size: [0.3, 2, 0.3], properties: { shape: 'column', color: '#5d4037' } },
      { type: 'decoration', position: [2, 8, -17], size: [1.5, 1.5, 1.5], properties: { shape: 'dome', color: '#27ae60' } },
      { type: 'decoration', position: [-17, 8.5, -1], size: [0.3, 0.8, 0.3], properties: { shape: 'cylinder', color: '#f5f5dc' } },
      { type: 'decoration', position: [-17, 9.2, -1], size: [0.8, 0.4, 0.8], properties: { shape: 'mushroom_cap', color: '#e74c3c' } },
      { type: 'decoration', position: [16, 9.5, 2], size: [0.6, 0.9, 0.6], properties: { shape: 'teardrop', color: '#9b59b6', emissive: true } },
      // Tentacles under bridges
      { type: 'decoration', position: [0, 3, -9], size: [0.4, 1.5, 0.4], properties: { shape: 'tentacle', color: '#8e44ad', emissive: true } },
      { type: 'decoration', position: [9, 4, 0], size: [0.4, 1.5, 0.4], properties: { shape: 'tentacle', color: '#8e44ad', emissive: true } },
      { type: 'decoration', position: [-9, 3.5, 0], size: [0.4, 1.5, 0.4], properties: { shape: 'tentacle', color: '#8e44ad', emissive: true } },
    ]
  },

  gauntlet: {
    name: 'The Gauntlet',
    gameType: 'reach',
    floorType: 'lava',
    environment: {
      skyColor: '#1a0a0a', fogColor: '#2a0a0a', fogDensity: 0.015,
      ambientColor: '#553333', ambientIntensity: 0.3,
      sunColor: '#ff6633', sunIntensity: 0.8,
      materialTheme: 'lava_rock', skyPreset: 'storm',
    },
    respawnPoint: [0, 2, 20],
    goalPosition: [0, 5, -40],
    entities: [
      // Start platform
      { type: 'platform', position: [0, 0, 20], size: [8, 1, 6], properties: { color: '#2c3e50' } },
      // Section 1: Simple jumps
      { type: 'platform', position: [0, 0, 14], size: [4, 1, 3], properties: { color: '#3498db' } },
      { type: 'platform', position: [0, 0, 8], size: [4, 1, 3], properties: { color: '#2980b9' } },
      { type: 'platform', position: [0, 0, 2], size: [4, 1, 3], properties: { color: '#3498db' } },
      // Section 2: Moving platforms
      { type: 'platform', position: [0, 0, -4], size: [3, 1, 3], properties: { color: '#e67e22', kinematic: true, path: [[-4, 0, -4], [4, 0, -4]], speed: 0.8 } },
      { type: 'platform', position: [0, 0, -10], size: [3, 1, 3], properties: { color: '#e67e22', kinematic: true, path: [[4, 0, -10], [-4, 0, -10]], speed: 0.8 } },
      // Section 3: Obstacle alley
      { type: 'platform', position: [0, 0, -18], size: [6, 1, 10], properties: { color: '#2c3e50' } },
      { type: 'obstacle', position: [-2, 1.5, -16], size: [1, 2, 1], properties: { color: '#e74c3c', rotating: true, speed: 4 } },
      { type: 'obstacle', position: [2, 1.5, -19], size: [1, 2, 1], properties: { color: '#e74c3c', rotating: true, speed: 3 } },
      { type: 'obstacle', position: [0, 1.5, -21], size: [1, 2, 1], properties: { color: '#e74c3c', rotating: true, speed: 5 } },
      // Section 4: Ascending platforms
      { type: 'platform', position: [0, 2, -26], size: [3, 1, 3], properties: { color: '#9b59b6' } },
      { type: 'platform', position: [3, 4, -30], size: [3, 1, 3], properties: { color: '#8e44ad' } },
      { type: 'platform', position: [-2, 6, -34], size: [3, 1, 3], properties: { color: '#9b59b6' } },
      // Goal platform
      { type: 'platform', position: [0, 4, -40], size: [5, 1, 5], properties: { color: '#f1c40f' } },
      // Goal trigger
      { type: 'trigger', position: [0, 6, -40], size: [3, 3, 3], properties: { color: '#f1c40f', rotating: true, speed: 2, isGoal: true } },
      // Fire braziers along the gauntlet
      { type: 'decoration', position: [4, 1.5, 20], size: [0.3, 0.5, 0.3], properties: { shape: 'cone', color: '#ff6600', emissive: true } },
      { type: 'decoration', position: [-4, 1.5, 20], size: [0.3, 0.5, 0.3], properties: { shape: 'cone', color: '#ff6600', emissive: true } },
      { type: 'decoration', position: [3, 1.5, -18], size: [0.3, 0.5, 0.3], properties: { shape: 'cone', color: '#ff4400', emissive: true } },
      { type: 'decoration', position: [-3, 1.5, -18], size: [0.3, 0.5, 0.3], properties: { shape: 'cone', color: '#ff4400', emissive: true } },
      // Arch gateway at goal
      { type: 'decoration', position: [0, 5, -37], size: [5, 4, 1], properties: { shape: 'arch', color: '#bdc3c7' } },
      // Warning flag at goal
      { type: 'decoration', position: [3, 6.5, -40], size: [0.1, 2, 0.1], properties: { shape: 'column', color: '#bdc3c7' } },
      { type: 'decoration', position: [3.4, 7.2, -40], size: [0.6, 0.4, 0.05], properties: { color: '#e74c3c' } },
      // Lava horn spikes
      { type: 'decoration', position: [5, 3, 10], size: [0.8, 5, 0.8], properties: { shape: 'horn', color: '#4a2020' } },
      { type: 'decoration', position: [-5, 3, 10], size: [0.8, 5, 0.8], properties: { shape: 'horn', color: '#4a2020' } },
      { type: 'decoration', position: [5, 3, -30], size: [0.8, 5, 0.8], properties: { shape: 'horn', color: '#4a2020' } },
      { type: 'decoration', position: [-5, 3, -30], size: [0.8, 5, 0.8], properties: { shape: 'horn', color: '#4a2020' } },
      // Ember orbs
      { type: 'decoration', position: [5, 6, 10], size: [0.5, 0.5, 0.5], properties: { shape: 'bell', color: '#ff4400', emissive: true, rotating: true, speed: 0.5 } },
      { type: 'decoration', position: [-5, 6, -30], size: [0.5, 0.5, 0.5], properties: { shape: 'bell', color: '#ff4400', emissive: true, rotating: true, speed: 0.7 } },
    ]
  },

  shrinking_arena: {
    name: 'Closing Walls',
    gameType: 'survival',
    floorType: 'solid',
    environment: {
      skyColor: '#1a1a2e', fogColor: '#1a1a2e', fogDensity: 0.010,
      ambientIntensity: 0.5,
      materialTheme: 'stone', skyPreset: 'storm',
    },
    respawnPoint: [0, 2, 0],
    goalPosition: null,
    entities: [
      // Main arena platform
      { type: 'platform', position: [0, 0, 0], size: [30, 1, 30], properties: { color: '#2c3e50' } },
      // Corner pillars
      { type: 'platform', position: [12, 3, 12], size: [2, 5, 2], properties: { color: '#7f8c8d' } },
      { type: 'platform', position: [-12, 3, 12], size: [2, 5, 2], properties: { color: '#7f8c8d' } },
      { type: 'platform', position: [12, 3, -12], size: [2, 5, 2], properties: { color: '#7f8c8d' } },
      { type: 'platform', position: [-12, 3, -12], size: [2, 5, 2], properties: { color: '#7f8c8d' } },
      // Central elevated platform (safe spot, small)
      { type: 'platform', position: [0, 3, 0], size: [4, 0.5, 4], properties: { color: '#e67e22' } },
      // Obstacles that sweep the arena
      { type: 'obstacle', position: [0, 1.5, 8], size: [20, 2, 1], properties: { color: '#e74c3c', kinematic: true, path: [[0, 1.5, 8], [0, 1.5, -8]], speed: 0.3 } },
      { type: 'obstacle', position: [8, 1.5, 0], size: [1, 2, 20], properties: { color: '#e74c3c', kinematic: true, path: [[8, 1.5, 0], [-8, 1.5, 0]], speed: 0.25 } },
      // Pillar top decorations
      { type: 'decoration', position: [12, 6, 12], size: [0.6, 0.9, 0.6], properties: { shape: 'star', color: '#e74c3c', emissive: true, rotating: true, speed: 0.5 } },
      { type: 'decoration', position: [-12, 6, -12], size: [0.6, 0.9, 0.6], properties: { shape: 'horn', color: '#e74c3c', emissive: true, rotating: true, speed: 0.5 } },
      // Center cross marker
      { type: 'decoration', position: [0, 6, 0], size: [1, 1, 1], properties: { shape: 'cross', color: '#e67e22', emissive: true, rotating: true, speed: 0.3 } },
    ]
  },

  parkour_hell: {
    name: 'Parkour Hell',
    gameType: 'reach',
    floorType: 'none',
    environment: {
      skyColor: '#0a0a1a', fogColor: '#0a0a1a', fogDensity: 0.014,
      ambientIntensity: 0.35,
      materialTheme: 'neon', skyPreset: 'void',
    },
    respawnPoint: [0, 2, 25],
    goalPosition: [0, 40, -25],
    entities: [
      // Start
      { type: 'platform', position: [0, 0, 25], size: [6, 1, 4], properties: { color: '#2c3e50' } },
      // Tiny platforms ascending
      { type: 'platform', position: [3, 3, 20], size: [2, 0.5, 2], properties: { color: '#e74c3c' } },
      { type: 'platform', position: [-2, 6, 16], size: [2, 0.5, 2], properties: { color: '#e67e22' } },
      { type: 'platform', position: [4, 9, 12], size: [2, 0.5, 2], properties: { color: '#f1c40f' } },
      { type: 'platform', position: [-3, 12, 8], size: [2, 0.5, 2], properties: { color: '#2ecc71' } },
      // Moving section
      { type: 'platform', position: [0, 15, 4], size: [2, 0.5, 2], properties: { color: '#3498db', kinematic: true, path: [[-4, 15, 4], [4, 15, 4]], speed: 0.6 } },
      { type: 'platform', position: [0, 18, 0], size: [2, 0.5, 2], properties: { color: '#9b59b6', kinematic: true, path: [[4, 18, 0], [-4, 18, 0]], speed: 0.7 } },
      // Obstacle wall
      { type: 'platform', position: [0, 20, -4], size: [8, 1, 4], properties: { color: '#2c3e50' } },
      { type: 'obstacle', position: [0, 22, -4], size: [6, 1, 1], properties: { color: '#e74c3c', kinematic: true, path: [[-3, 22, -4], [3, 22, -4]], speed: 1.5 } },
      // Final ascent
      { type: 'platform', position: [3, 24, -8], size: [2, 0.5, 2], properties: { color: '#e74c3c' } },
      { type: 'platform', position: [-2, 27, -12], size: [2, 0.5, 2], properties: { color: '#e67e22' } },
      { type: 'platform', position: [1, 30, -16], size: [2, 0.5, 2], properties: { color: '#f1c40f' } },
      { type: 'platform', position: [-3, 33, -20], size: [2, 0.5, 2], properties: { color: '#2ecc71' } },
      { type: 'platform', position: [2, 36, -22], size: [2, 0.5, 2], properties: { color: '#3498db' } },
      // Goal
      { type: 'platform', position: [0, 38, -25], size: [4, 1, 4], properties: { color: '#f1c40f' } },
      { type: 'trigger', position: [0, 40, -25], size: [3, 3, 3], properties: { color: '#f1c40f', rotating: true, speed: 2, isGoal: true } },
      // Floating neon shapes along the path
      { type: 'decoration', position: [5, 5, 22], size: [0.4, 0.6, 0.4], properties: { shape: 'teardrop', color: '#e74c3c', emissive: true } },
      { type: 'decoration', position: [-4, 8, 14], size: [0.4, 0.6, 0.4], properties: { shape: 'flask', color: '#e67e22', emissive: true } },
      { type: 'decoration', position: [6, 11, 10], size: [0.4, 0.6, 0.4], properties: { shape: 'star', color: '#f1c40f', emissive: true } },
      { type: 'decoration', position: [-5, 14, 6], size: [0.4, 0.4, 0.4], properties: { shape: 'sphere', color: '#2ecc71', emissive: true } },
      { type: 'decoration', position: [4, 25, -10], size: [0.4, 0.6, 0.4], properties: { shape: 'heart', color: '#3498db', emissive: true } },
      { type: 'decoration', position: [-4, 35, -22], size: [0.4, 0.6, 0.4], properties: { shape: 'star', color: '#9b59b6', emissive: true } },
    ]
  },

  hex_a_gone: {
    name: 'Hex-A-Gone',
    gameType: 'survival',
    floorType: 'none',
    environment: {
      skyColor: '#120326', fogColor: '#120326', fogDensity: 0.018,
      ambientColor: '#553388', ambientIntensity: 0.5,
      sunColor: '#aa77ff', sunIntensity: 0.7,
      materialTheme: 'ice_crystal', skyPreset: 'aurora',
    },
    respawnPoint: [0, 12, 0],
    goalPosition: null,
    entities: [
      ...generateHexAGoneEntities(),
      // Floating crystals above arena
      { type: 'decoration', position: [0, 15, 0], size: [1.2, 1.8, 1.2], properties: { shape: 'teardrop', color: '#9b59b6', emissive: true, rotating: true, speed: 0.5 } },
      { type: 'decoration', position: [6, 14, 4], size: [0.8, 2, 0.8], properties: { shape: 'tentacle', color: '#8e44ad', emissive: true, rotating: true, speed: 0.8 } },
      { type: 'decoration', position: [-5, 13, -5], size: [0.8, 2, 0.8], properties: { shape: 'tentacle', color: '#a569bd', emissive: true, rotating: true, speed: 0.7 } },
      // Additional floating shapes at edges
      { type: 'decoration', position: [8, 12, 0], size: [0.5, 0.8, 0.5], properties: { shape: 'flask', color: '#bb88dd', emissive: true, rotating: true, speed: 0.6 } },
      { type: 'decoration', position: [-8, 12, 0], size: [0.5, 0.8, 0.5], properties: { shape: 'star', color: '#bb88dd', emissive: true, rotating: true, speed: 0.9 } },
      { type: 'decoration', position: [0, 11, 8], size: [0.5, 1.2, 0.5], properties: { shape: 'tentacle', color: '#cc99ee', emissive: true, rotating: true, speed: 0.4 } },
    ],
  },

  slime_climb: {
    name: 'Slime Climb',
    gameType: 'reach',
    floorType: 'none',
    environment: {
      skyColor: '#1a0a0a', fogColor: '#2a0a0a', fogDensity: 0.012,
      ambientColor: '#553333', ambientIntensity: 0.3,
      sunColor: '#ff6633', sunIntensity: 0.8,
      materialTheme: 'lava_rock', skyPreset: 'storm',
    },
    respawnPoint: [0, 2, 15],
    goalPosition: [0, 42, -30],
    hazardPlane: { active: true, type: 'lava', startHeight: -5, riseSpeed: 0.4, maxHeight: 35 },
    entities: [
      // Start platform
      { type: 'platform', position: [0, 0, 15], size: [8, 1, 6], properties: { color: '#2c3e50' } },
      // Ascending ramps
      { type: 'platform', position: [0, 3, 8], size: [5, 1, 4], properties: { color: '#3498db' } },
      { type: 'platform', position: [0, 6, 2], size: [5, 1, 4], properties: { color: '#2980b9' } },
      // Conveyor gauntlet
      { type: 'platform', position: [0, 9, -4], size: [6, 0.3, 3], properties: { color: '#e67e22', isConveyor: true, conveyorDir: [-1, 0, 0], conveyorSpeed: 5 } },
      { type: 'platform', position: [0, 12, -9], size: [6, 0.3, 3], properties: { color: '#e67e22', isConveyor: true, conveyorDir: [1, 0, 0], conveyorSpeed: 6 } },
      // Ice bridge
      { type: 'platform', position: [0, 15, -15], size: [3, 0.3, 8], properties: { color: '#b3e5fc', isIce: true } },
      // Mid platform with obstacle
      { type: 'platform', position: [0, 18, -22], size: [6, 1, 5], properties: { color: '#2c3e50' } },
      { type: 'obstacle', position: [0, 20, -22], size: [4, 1, 1], properties: { color: '#e74c3c', kinematic: true, path: [[-3, 20, -22], [3, 20, -22]], speed: 1.5 } },
      // Ascending narrow platforms
      { type: 'platform', position: [3, 21, -26], size: [3, 0.5, 2], properties: { color: '#9b59b6' } },
      { type: 'platform', position: [-2, 24, -28], size: [3, 0.5, 2], properties: { color: '#8e44ad' } },
      // Conveyor + ice combo
      { type: 'platform', position: [0, 27, -32], size: [5, 0.3, 3], properties: { color: '#e67e22', isConveyor: true, conveyorDir: [0, 0, 1], conveyorSpeed: 4, isIce: true } },
      // Final climb
      { type: 'platform', position: [2, 30, -28], size: [2, 0.5, 2], properties: { color: '#e74c3c' } },
      { type: 'platform', position: [-2, 33, -30], size: [2, 0.5, 2], properties: { color: '#f1c40f' } },
      { type: 'platform', position: [0, 36, -32], size: [3, 0.5, 3], properties: { color: '#2ecc71' } },
      // Goal platform
      { type: 'platform', position: [0, 39, -30], size: [4, 1, 4], properties: { color: '#f1c40f' } },
      { type: 'trigger', position: [0, 41, -30], size: [3, 3, 3], properties: { color: '#f1c40f', rotating: true, speed: 2, isGoal: true } },
      // Warning flags + braziers
      { type: 'decoration', position: [4, 1.5, 15], size: [0.1, 2, 0.1], properties: { shape: 'cylinder', color: '#bdc3c7' } },
      { type: 'decoration', position: [4.4, 2.2, 15], size: [0.6, 0.4, 0.05], properties: { color: '#ff6600' } },
      { type: 'decoration', position: [-3, 19.5, -22], size: [0.1, 2, 0.1], properties: { shape: 'cylinder', color: '#bdc3c7' } },
      { type: 'decoration', position: [-2.6, 20.2, -22], size: [0.6, 0.4, 0.05], properties: { color: '#ff6600' } },
      // Lava horn spikes along climb
      { type: 'decoration', position: [5, 5, 8], size: [0.6, 4, 0.6], properties: { shape: 'horn', color: '#3a1010' } },
      { type: 'decoration', position: [-5, 12, -9], size: [0.8, 1.2, 0.8], properties: { shape: 'mushroom_cap', color: '#3a1010' } },
    ]
  },

  wind_tunnel: {
    name: 'Wind Tunnel',
    gameType: 'reach',
    floorType: 'none',
    environment: {
      skyColor: '#1a2a3a', fogColor: '#1a2a3a', fogDensity: 0.010,
      ambientIntensity: 0.5, sunIntensity: 1.0,
      materialTheme: 'ice_crystal', skyPreset: 'starfield',
    },
    respawnPoint: [0, 4, 30],
    goalPosition: [0, 9, -40],
    entities: [
      // Start platform
      { type: 'platform', position: [0, 2, 30], size: [8, 1, 6], properties: { color: '#2c3e50' } },
      // Narrow bridge + lateral wind
      { type: 'platform', position: [0, 2, 20], size: [2, 0.5, 12], properties: { color: '#3498db' } },
      { type: 'trigger', position: [3, 4, 20], size: [4, 6, 12], properties: { color: '#87ceeb', isWind: true, windForce: [8, 0, 0], opacity: 0.1 } },
      // Platform + alternating wind
      { type: 'platform', position: [0, 3, 8], size: [6, 1, 6], properties: { color: '#2980b9' } },
      { type: 'trigger', position: [-4, 5, 8], size: [4, 6, 6], properties: { color: '#87ceeb', isWind: true, windForce: [-6, 0, 0], opacity: 0.1 } },
      { type: 'trigger', position: [4, 5, 8], size: [4, 6, 6], properties: { color: '#87ceeb', isWind: true, windForce: [6, 0, 0], opacity: 0.1 } },
      // Ice + updraft section
      { type: 'platform', position: [0, 3, -2], size: [4, 0.3, 6], properties: { color: '#b3e5fc', isIce: true } },
      { type: 'trigger', position: [0, 5, -2], size: [4, 6, 6], properties: { color: '#87ceeb', isWind: true, windForce: [0, 5, 0], opacity: 0.08 } },
      // Platform hop with crosswind
      { type: 'platform', position: [-3, 4, -10], size: [3, 0.5, 3], properties: { color: '#e67e22' } },
      { type: 'platform', position: [3, 5, -14], size: [3, 0.5, 3], properties: { color: '#e67e22' } },
      { type: 'platform', position: [-2, 6, -18], size: [3, 0.5, 3], properties: { color: '#e67e22' } },
      { type: 'trigger', position: [0, 6, -14], size: [10, 8, 12], properties: { color: '#87ceeb', isWind: true, windForce: [5, 0, -3], opacity: 0.08 } },
      // Conveyor + wind combo
      { type: 'platform', position: [0, 6, -26], size: [4, 0.3, 8], properties: { color: '#e67e22', isConveyor: true, conveyorDir: [0, 0, 1], conveyorSpeed: 4 } },
      { type: 'trigger', position: [0, 8, -26], size: [6, 6, 8], properties: { color: '#87ceeb', isWind: true, windForce: [0, 0, -6], opacity: 0.1 } },
      // Final narrow bridge + headwind
      { type: 'platform', position: [0, 7, -34], size: [2, 0.5, 6], properties: { color: '#9b59b6' } },
      { type: 'trigger', position: [0, 9, -34], size: [4, 6, 6], properties: { color: '#87ceeb', isWind: true, windForce: [0, 0, 4], opacity: 0.12 } },
      // Goal platform
      { type: 'platform', position: [0, 7, -40], size: [5, 1, 5], properties: { color: '#f1c40f' } },
      { type: 'trigger', position: [0, 9, -40], size: [3, 3, 3], properties: { color: '#f1c40f', rotating: true, speed: 2, isGoal: true } },
      // Banners and wind streamers
      { type: 'decoration', position: [4, 4.5, 30], size: [0.1, 2, 0.1], properties: { shape: 'column', color: '#bdc3c7' } },
      { type: 'decoration', position: [4.4, 5.2, 30], size: [0.6, 0.4, 0.05], properties: { color: '#3498db' } },
      { type: 'decoration', position: [-2, 5, 8], size: [0.1, 1.5, 0.1], properties: { shape: 'column', color: '#bdc3c7' } },
      { type: 'decoration', position: [-1.6, 5.7, 8], size: [0.5, 0.3, 0.05], properties: { color: '#87ceeb' } },
      // Ice stars
      { type: 'decoration', position: [4, 5, -2], size: [0.5, 0.8, 0.5], properties: { shape: 'star', color: '#b3e5fc', emissive: true, rotating: true, speed: 0.4 } },
      { type: 'decoration', position: [-3, 8, -26], size: [0.5, 0.8, 0.5], properties: { shape: 'star', color: '#b3e5fc', emissive: true, rotating: true, speed: 0.6 } },
    ]
  },

  // ========== COLLECT ==========
  treasure_trove: {
    name: 'Treasure Trove',
    gameType: 'collect',
    floorType: 'solid',
    environment: {
      skyColor: '#1a0f0a', fogColor: '#1a0f0a', fogDensity: 0.018,
      ambientColor: '#443322', ambientIntensity: 0.3,
      sunColor: '#ffaa44', sunIntensity: 0.6,
      materialTheme: 'wood', skyPreset: 'sunset',
    },
    respawnPoint: [0, 2, 0],
    goalPosition: null,
    entities: [
      // Main floor
      { type: 'platform', position: [0, 0, 0], size: [30, 1, 30], properties: { color: '#3e2723' } },
      // Multi-level ledges
      { type: 'platform', position: [-10, 3, -10], size: [6, 0.5, 6], properties: { color: '#5d4037' } },
      { type: 'platform', position: [10, 5, -10], size: [5, 0.5, 5], properties: { color: '#5d4037' } },
      { type: 'platform', position: [-10, 7, 10], size: [5, 0.5, 5], properties: { color: '#5d4037' } },
      { type: 'platform', position: [10, 4, 10], size: [6, 0.5, 6], properties: { color: '#5d4037' } },
      // Center elevated platform
      { type: 'platform', position: [0, 6, 0], size: [4, 0.5, 4], properties: { color: '#4e342e' } },
      // Ice bridge between ledges
      { type: 'platform', position: [0, 4, -10], size: [12, 0.3, 2], properties: { color: '#b3e5fc', isIce: true } },
      // Conveyor ramp
      { type: 'platform', position: [0, 3, 10], size: [8, 0.3, 3], properties: { color: '#e67e22', isConveyor: true, conveyorDir: [1, 0, 0], conveyorSpeed: 4 } },
      // Pillars as obstacles
      { type: 'platform', position: [5, 3, 0], size: [2, 5, 2], properties: { color: '#4e342e' } },
      { type: 'platform', position: [-5, 3, 0], size: [2, 5, 2], properties: { color: '#4e342e' } },
      // Collectibles on ledges and hidden spots
      { type: 'collectible', position: [-10, 5, -10], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      { type: 'collectible', position: [10, 7, -10], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      { type: 'collectible', position: [-10, 9, 10], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      { type: 'collectible', position: [10, 6, 10], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      { type: 'collectible', position: [0, 8, 0], size: [1, 1, 1], properties: { color: '#e67e22' } },
      { type: 'collectible', position: [12, 2, 12], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      { type: 'collectible', position: [-12, 2, -12], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      { type: 'collectible', position: [0, 2, -12], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      { type: 'collectible', position: [0, 2, 12], size: [1, 1, 1], properties: { color: '#f1c40f' } },
      // Moving obstacle
      { type: 'obstacle', position: [0, 1.5, 5], size: [10, 2, 1], properties: { color: '#e74c3c', kinematic: true, path: [[0, 1.5, 5], [0, 1.5, -5]], speed: 0.4 } },
      // Torches
      { type: 'decoration', position: [14, 2, 14], size: [0.3, 0.5, 0.3], properties: { shape: 'cone', color: '#ff6600', emissive: true } },
      { type: 'decoration', position: [-14, 2, -14], size: [0.3, 0.5, 0.3], properties: { shape: 'cone', color: '#ff6600', emissive: true } },
      { type: 'decoration', position: [14, 2, -14], size: [0.3, 0.5, 0.3], properties: { shape: 'cone', color: '#ff6600', emissive: true } },
      { type: 'decoration', position: [-14, 2, 14], size: [0.3, 0.5, 0.3], properties: { shape: 'cone', color: '#ff6600', emissive: true } },
      // Wooden props
      { type: 'decoration', position: [14, 2, 0], size: [0.5, 3, 0.5], properties: { shape: 'column', color: '#5d4037' } },
      { type: 'decoration', position: [-14, 2, 0], size: [0.5, 3, 0.5], properties: { shape: 'vase', color: '#5d4037' } },
      // Treasure dome
      { type: 'decoration', position: [0, 6.5, 0], size: [3, 1.5, 3], properties: { shape: 'dome', color: '#ffaa44', emissive: true } },
    ]
  },

  // ========== SURVIVAL ==========
  ice_rink: {
    name: 'Ice Rink',
    gameType: 'survival',
    floorType: 'solid',
    environment: {
      skyColor: '#1a2a3a', fogColor: '#1a2a3a', fogDensity: 0.010,
      ambientIntensity: 0.5, sunColor: '#aaddff', sunIntensity: 0.9,
      materialTheme: 'ice_crystal', skyPreset: 'starfield',
    },
    respawnPoint: [0, 2, 0],
    goalPosition: null,
    entities: [
      // Large ice floor
      { type: 'platform', position: [0, 0, 0], size: [30, 1, 30], properties: { color: '#b3e5fc', isIce: true } },
      // Corner safe zones (small, non-ice)
      { type: 'platform', position: [12, 0.5, 12], size: [4, 0.5, 4], properties: { color: '#2ecc71' } },
      { type: 'platform', position: [-12, 0.5, 12], size: [4, 0.5, 4], properties: { color: '#2ecc71' } },
      { type: 'platform', position: [12, 0.5, -12], size: [4, 0.5, 4], properties: { color: '#2ecc71' } },
      { type: 'platform', position: [-12, 0.5, -12], size: [4, 0.5, 4], properties: { color: '#2ecc71' } },
      // Sweeping obstacles
      { type: 'obstacle', position: [0, 1.5, 0], size: [20, 1.5, 1], properties: { color: '#e74c3c', rotating: true, speed: 1.5 } },
      { type: 'obstacle', position: [0, 1.5, 0], size: [1, 1.5, 20], properties: { color: '#e74c3c', rotating: true, speed: 2 } },
      // Wind zones near edges pushing players off
      { type: 'trigger', position: [14, 3, 0], size: [4, 6, 30], properties: { color: '#87ceeb', isWind: true, windForce: [6, 0, 0], opacity: 0.08 } },
      { type: 'trigger', position: [-14, 3, 0], size: [4, 6, 30], properties: { color: '#87ceeb', isWind: true, windForce: [-6, 0, 0], opacity: 0.08 } },
      { type: 'trigger', position: [0, 3, 14], size: [30, 6, 4], properties: { color: '#87ceeb', isWind: true, windForce: [0, 0, 6], opacity: 0.08 } },
      { type: 'trigger', position: [0, 3, -14], size: [30, 6, 4], properties: { color: '#87ceeb', isWind: true, windForce: [0, 0, -6], opacity: 0.08 } },
      // Center star crystal
      { type: 'decoration', position: [0, 8, 0], size: [1.5, 1.5, 1.5], properties: { shape: 'star', color: '#aaddff', emissive: true, rotating: true, speed: 0.3 } },
      // Ice columns at corners
      { type: 'decoration', position: [14, 3, 14], size: [0.5, 5, 0.5], properties: { shape: 'column', color: '#b3e5fc' } },
      { type: 'decoration', position: [-14, 3, -14], size: [0.5, 5, 0.5], properties: { shape: 'column', color: '#b3e5fc' } },
      { type: 'decoration', position: [14, 3, -14], size: [0.5, 5, 0.5], properties: { shape: 'column', color: '#b3e5fc' } },
      { type: 'decoration', position: [-14, 3, 14], size: [0.5, 5, 0.5], properties: { shape: 'column', color: '#b3e5fc' } },
      // Small teardrop crystals on ice
      { type: 'decoration', position: [6, 1.5, 6], size: [0.4, 0.6, 0.4], properties: { shape: 'teardrop', color: '#e0f7fa', emissive: true } },
      { type: 'decoration', position: [-6, 1.5, -6], size: [0.4, 0.6, 0.4], properties: { shape: 'teardrop', color: '#e0f7fa', emissive: true } },
    ]
  },

  // ========== KING OF THE HILL ==========
  king_plateau: {
    name: 'King\'s Plateau',
    gameType: 'king',
    floorType: 'solid',
    environment: {
      skyColor: '#1a1a2e', fogColor: '#1a1a2e', fogDensity: 0.010,
      ambientIntensity: 0.4, sunColor: '#ffdd44', sunIntensity: 1.0,
      materialTheme: 'stone', skyPreset: 'sunset',
    },
    respawnPoint: [0, 2, 15],
    goalPosition: null,
    entities: [
      // Base floor
      { type: 'platform', position: [0, 0, 0], size: [35, 1, 35], properties: { color: '#2c3e50' } },
      // Central elevated hill
      { type: 'platform', position: [0, 3, 0], size: [8, 2, 8], properties: { color: '#f1c40f' } },
      // Hill zone trigger
      { type: 'trigger', position: [0, 5, 0], size: [7, 4, 7], properties: { color: '#f1c40f', isHill: true, opacity: 0.3 } },
      // 4 ramps leading up
      { type: 'ramp', position: [0, 1.5, 7], size: [4, 1, 6], properties: { color: '#7f8c8d' } },
      { type: 'ramp', position: [0, 1.5, -7], size: [4, 1, 6], properties: { color: '#7f8c8d' } },
      { type: 'ramp', position: [7, 1.5, 0], size: [6, 1, 4], properties: { color: '#7f8c8d' } },
      { type: 'ramp', position: [-7, 1.5, 0], size: [6, 1, 4], properties: { color: '#7f8c8d' } },
      // Corner mini-hills
      { type: 'platform', position: [12, 1.5, 12], size: [5, 1, 5], properties: { color: '#e67e22' } },
      { type: 'trigger', position: [12, 3, 12], size: [4, 3, 4], properties: { color: '#e67e22', isHill: true, opacity: 0.3 } },
      { type: 'platform', position: [-12, 1.5, -12], size: [5, 1, 5], properties: { color: '#e67e22' } },
      { type: 'trigger', position: [-12, 3, -12], size: [4, 3, 4], properties: { color: '#e67e22', isHill: true, opacity: 0.3 } },
      // Patrolling obstacles on ramps
      { type: 'obstacle', position: [0, 2.5, 7], size: [2, 1.5, 1], properties: { color: '#e74c3c', kinematic: true, path: [[-3, 2.5, 7], [3, 2.5, 7]], speed: 1.2 } },
      { type: 'obstacle', position: [7, 2.5, 0], size: [1, 1.5, 2], properties: { color: '#e74c3c', kinematic: true, path: [[7, 2.5, -3], [7, 2.5, 3]], speed: 1 } },
      // Crown star decoration
      { type: 'decoration', position: [0, 8, 0], size: [1, 1.5, 1], properties: { shape: 'star', color: '#f1c40f', emissive: true, rotating: true, speed: 0.5 } },
      // Stone pillars at hill base
      { type: 'decoration', position: [5, 3, 5], size: [0.5, 5, 0.5], properties: { shape: 'column', color: '#5a6a7a' } },
      { type: 'decoration', position: [-5, 3, 5], size: [0.5, 5, 0.5], properties: { shape: 'column', color: '#5a6a7a' } },
      { type: 'decoration', position: [5, 3, -5], size: [0.5, 5, 0.5], properties: { shape: 'column', color: '#5a6a7a' } },
      { type: 'decoration', position: [-5, 3, -5], size: [0.5, 5, 0.5], properties: { shape: 'cross', color: '#5a6a7a' } },
      // Flags at mini-hills
      { type: 'decoration', position: [14, 3.5, 12], size: [0.1, 3, 0.1], properties: { shape: 'cylinder', color: '#bdc3c7' } },
      { type: 'decoration', position: [14.4, 4.5, 12], size: [0.6, 0.4, 0.05], properties: { color: '#e67e22' } },
      { type: 'decoration', position: [-14, 3.5, -12], size: [0.1, 3, 0.1], properties: { shape: 'cylinder', color: '#bdc3c7' } },
      { type: 'decoration', position: [-14.4, 4.5, -12], size: [0.6, 0.4, 0.05], properties: { color: '#e67e22' } },
    ]
  },

  king_islands: {
    name: 'Island Kingdoms',
    gameType: 'king',
    floorType: 'none',
    environment: {
      skyColor: '#0d1b2a', fogColor: '#0d1b2a', fogDensity: 0.010,
      ambientIntensity: 0.4, sunColor: '#ffaa00', sunIntensity: 0.9,
      materialTheme: 'stone', skyPreset: 'sunset',
    },
    // Respawn ON the center island so a player who falls comes back in the
    // fight, not at the edge of nothing. y=6 puts them clearly above the
    // y=5 platform top — short safe drop, can run immediately.
    respawnPoint: [0, 6, 0],
    goalPosition: null,
    entities: [
      // Center island + hill — bigger so two players can fight on it
      // without nudging each other off.
      { type: 'platform', position: [0, 4, 0], size: [11, 2, 11], properties: { color: '#2c3e50' } },
      { type: 'trigger', position: [0, 6.5, 0], size: [8, 3, 8], properties: { color: '#f1c40f', isHill: true, opacity: 0.3 } },
      // North island + hill — also bigger
      { type: 'platform', position: [0, 4, -20], size: [9, 2, 9], properties: { color: '#27ae60' } },
      { type: 'trigger', position: [0, 6.5, -20], size: [6, 3, 6], properties: { color: '#e67e22', isHill: true, opacity: 0.3 } },
      // South island + hill
      { type: 'platform', position: [0, 4, 20], size: [9, 2, 9], properties: { color: '#27ae60' } },
      { type: 'trigger', position: [0, 6.5, 20], size: [6, 3, 6], properties: { color: '#e67e22', isHill: true, opacity: 0.3 } },
      // Bridges — wider so they're traversable. Previous 2-wide bridges
      // were impossible to cross with a 1.25× spread + crosswind. 4.5-wide
      // gives margin to walk straight through.
      { type: 'platform', position: [0, 4, -10], size: [4.5, 0.5, 8], properties: { color: '#8e44ad' } },
      { type: 'platform', position: [0, 4, 10], size: [4.5, 0.5, 8], properties: { color: '#8e44ad' } },
      // Wind on bridges — kept as flavor, but force halved (5 → 2.2) and
      // the triggers pulled tighter so they only nudge, not deport players.
      { type: 'trigger', position: [3, 6, -10], size: [3, 4, 7], properties: { color: '#87ceeb', isWind: true, windForce: [2.2, 0, 0], opacity: 0.08 } },
      { type: 'trigger', position: [-3, 6, 10], size: [3, 4, 7], properties: { color: '#87ceeb', isWind: true, windForce: [-2.2, 0, 0], opacity: 0.08 } },
      // Crown star above center
      { type: 'decoration', position: [0, 10, 0], size: [1.2, 1.8, 1.2], properties: { shape: 'star', color: '#f1c40f', emissive: true, rotating: true, speed: 0.4 } },
      // Domes sheltering bridges
      { type: 'decoration', position: [0, 5.5, -10], size: [2, 1, 2], properties: { shape: 'dome', color: '#8e44ad', emissive: true } },
      { type: 'decoration', position: [0, 5.5, 10], size: [2, 1, 2], properties: { shape: 'dome', color: '#8e44ad', emissive: true } },
      // Columns on islands
      { type: 'decoration', position: [3, 7, -20], size: [0.4, 4, 0.4], properties: { shape: 'column', color: '#5a6a7a' } },
      { type: 'decoration', position: [-3, 7, 20], size: [0.4, 4, 0.4], properties: { shape: 'column', color: '#5a6a7a' } },
    ]
  },

  // ========== HOT POTATO ==========
  hot_potato_arena: {
    name: 'Curse Arena',
    gameType: 'hot_potato',
    floorType: 'solid',
    environment: {
      skyColor: '#1a0a0a', fogColor: '#2a0a0a', fogDensity: 0.015,
      ambientColor: '#553333', ambientIntensity: 0.4,
      sunColor: '#ff4444', sunIntensity: 0.7,
      materialTheme: 'lava_rock', skyPreset: 'storm',
    },
    respawnPoint: [0, 2, 0],
    goalPosition: null,
    entities: [
      // Circular arena floor
      { type: 'platform', position: [0, 0, 0], size: [25, 1, 25], properties: { color: '#2c3e50' } },
      // Pillars for cover
      { type: 'platform', position: [6, 3, 6], size: [2, 5, 2], properties: { color: '#7f8c8d' } },
      { type: 'platform', position: [-6, 3, 6], size: [2, 5, 2], properties: { color: '#7f8c8d' } },
      { type: 'platform', position: [6, 3, -6], size: [2, 5, 2], properties: { color: '#7f8c8d' } },
      { type: 'platform', position: [-6, 3, -6], size: [2, 5, 2], properties: { color: '#7f8c8d' } },
      { type: 'platform', position: [0, 3, 9], size: [2, 5, 2], properties: { color: '#7f8c8d' } },
      { type: 'platform', position: [0, 3, -9], size: [2, 5, 2], properties: { color: '#7f8c8d' } },
      // Speed boost pads
      { type: 'trigger', position: [10, 1, 0], size: [3, 1, 3], properties: { color: '#2ecc71', isSpeedBoost: true } },
      { type: 'trigger', position: [-10, 1, 0], size: [3, 1, 3], properties: { color: '#2ecc71', isSpeedBoost: true } },
      // Moving obstacles that converge
      { type: 'obstacle', position: [0, 1.5, 0], size: [16, 1.5, 1], properties: { color: '#e74c3c', rotating: true, speed: 1.5 } },
      // Curse heart above
      { type: 'decoration', position: [0, 8, 0], size: [1.5, 1.5, 1.5], properties: { shape: 'heart', color: '#e74c3c', emissive: true, rotating: true, speed: 1 } },
      // Pillar top warning bells
      { type: 'decoration', position: [6, 6, 6], size: [0.4, 0.6, 0.4], properties: { shape: 'bell', color: '#ff4400', emissive: true } },
      { type: 'decoration', position: [-6, 6, -6], size: [0.4, 0.6, 0.4], properties: { shape: 'bell', color: '#ff4400', emissive: true } },
      { type: 'decoration', position: [6, 6, -6], size: [0.4, 0.6, 0.4], properties: { shape: 'bell', color: '#ff4400', emissive: true } },
      { type: 'decoration', position: [-6, 6, 6], size: [0.4, 0.6, 0.4], properties: { shape: 'bell', color: '#ff4400', emissive: true } },
    ]
  },

  hot_potato_platforms: {
    name: 'Curse Platforms',
    gameType: 'hot_potato',
    floorType: 'none',
    environment: {
      skyColor: '#0a0a1a', fogColor: '#0a0a1a', fogDensity: 0.018,
      ambientColor: '#332233', ambientIntensity: 0.35,
      sunColor: '#ff6666', sunIntensity: 0.7,
      materialTheme: 'neon', skyPreset: 'void',
    },
    respawnPoint: [0, 6, 0],
    goalPosition: null,
    entities: [
      // Central platform
      { type: 'platform', position: [0, 2, 0], size: [8, 1, 8], properties: { color: '#2c3e50' } },
      // Surrounding platforms at various heights
      { type: 'platform', position: [10, 3, 0], size: [5, 0.5, 5], properties: { color: '#3498db' } },
      { type: 'platform', position: [-10, 4, 0], size: [5, 0.5, 5], properties: { color: '#2980b9' } },
      { type: 'platform', position: [0, 3, 10], size: [5, 0.5, 5], properties: { color: '#3498db' } },
      { type: 'platform', position: [0, 5, -10], size: [5, 0.5, 5], properties: { color: '#2980b9' } },
      { type: 'platform', position: [8, 6, 8], size: [4, 0.5, 4], properties: { color: '#9b59b6' } },
      { type: 'platform', position: [-8, 5, -8], size: [4, 0.5, 4], properties: { color: '#8e44ad' } },
      // Connecting bridges
      { type: 'platform', position: [5, 2.5, 0], size: [4, 0.3, 2], properties: { color: '#7f8c8d' } },
      { type: 'platform', position: [-5, 3, 0], size: [4, 0.3, 2], properties: { color: '#7f8c8d' } },
      { type: 'platform', position: [0, 2.5, 5], size: [2, 0.3, 4], properties: { color: '#7f8c8d' } },
      { type: 'platform', position: [0, 3.5, -5], size: [2, 0.3, 4], properties: { color: '#7f8c8d' } },
      // Ice on some platforms
      { type: 'platform', position: [8, 6.3, 8], size: [3.5, 0.2, 3.5], properties: { color: '#b3e5fc', isIce: true } },
      // Obstacle
      { type: 'obstacle', position: [0, 3.5, 0], size: [6, 1, 1], properties: { color: '#e74c3c', rotating: true, speed: 2 } },
      // Floating shapes between platforms
      { type: 'decoration', position: [5, 4, 5], size: [0.4, 0.4, 0.3], properties: { shape: 'heart', color: '#ff6666', emissive: true } },
      { type: 'decoration', position: [-5, 5, -5], size: [0.4, 0.6, 0.4], properties: { shape: 'bell', color: '#ff6666', emissive: true } },
      { type: 'decoration', position: [0, 7, 0], size: [0.8, 0.8, 0.8], properties: { shape: 'heart', color: '#e74c3c', emissive: true, rotating: true, speed: 0.8 } },
    ]
  },

  // ========== RACE ==========
  checkpoint_dash: {
    name: 'Checkpoint Dash',
    gameType: 'race',
    floorType: 'none',
    environment: {
      skyColor: '#0d1b2a', fogColor: '#0d1b2a', fogDensity: 0.010,
      ambientIntensity: 0.4, sunIntensity: 1.0,
      materialTheme: 'stone', skyPreset: 'starfield',
    },
    respawnPoint: [0, 2, 30],
    goalPosition: null,
    entities: [
      // Start platform
      { type: 'platform', position: [0, 0, 30], size: [8, 1, 6], properties: { color: '#2c3e50' } },
      // CP0 — simple jump
      { type: 'platform', position: [0, 0, 20], size: [5, 1, 4], properties: { color: '#3498db' } },
      { type: 'trigger', position: [0, 2, 20], size: [3, 3, 3], properties: { color: '#2ecc71', isCheckpoint: true, checkpointIndex: 0, rotating: true, speed: 1 } },
      // CP1 — moving platforms
      { type: 'platform', position: [0, 1, 12], size: [3, 0.5, 3], properties: { color: '#e67e22', kinematic: true, path: [[-4, 1, 12], [4, 1, 12]], speed: 0.8 } },
      { type: 'trigger', position: [0, 3, 12], size: [3, 3, 3], properties: { color: '#95a5a6', isCheckpoint: true, checkpointIndex: 1, rotating: true, speed: 1 } },
      // CP2 — conveyor section
      { type: 'platform', position: [0, 1, 4], size: [6, 0.3, 4], properties: { color: '#e67e22', isConveyor: true, conveyorDir: [-1, 0, 0], conveyorSpeed: 5 } },
      { type: 'trigger', position: [0, 3, 4], size: [3, 3, 3], properties: { color: '#95a5a6', isCheckpoint: true, checkpointIndex: 2, rotating: true, speed: 1 } },
      // CP3 — ice + wind
      { type: 'platform', position: [0, 2, -4], size: [4, 0.3, 4], properties: { color: '#b3e5fc', isIce: true } },
      { type: 'trigger', position: [3, 4, -4], size: [4, 5, 4], properties: { color: '#87ceeb', isWind: true, windForce: [6, 0, 0], opacity: 0.08 } },
      { type: 'trigger', position: [0, 4, -4], size: [3, 3, 3], properties: { color: '#95a5a6', isCheckpoint: true, checkpointIndex: 3, rotating: true, speed: 1 } },
      // CP4 — obstacle gauntlet
      { type: 'platform', position: [0, 2, -14], size: [6, 1, 8], properties: { color: '#2c3e50' } },
      { type: 'obstacle', position: [0, 4, -12], size: [4, 1, 1], properties: { color: '#e74c3c', kinematic: true, path: [[-3, 4, -12], [3, 4, -12]], speed: 1.5 } },
      { type: 'obstacle', position: [0, 4, -16], size: [4, 1, 1], properties: { color: '#e74c3c', kinematic: true, path: [[3, 4, -16], [-3, 4, -16]], speed: 1.8 } },
      { type: 'trigger', position: [0, 4, -14], size: [3, 3, 3], properties: { color: '#95a5a6', isCheckpoint: true, checkpointIndex: 4, rotating: true, speed: 1 } },
      // CP5 — final sprint
      { type: 'platform', position: [3, 4, -22], size: [2, 0.5, 2], properties: { color: '#9b59b6' } },
      { type: 'platform', position: [-2, 6, -26], size: [2, 0.5, 2], properties: { color: '#8e44ad' } },
      { type: 'platform', position: [0, 8, -30], size: [4, 1, 4], properties: { color: '#f1c40f' } },
      { type: 'trigger', position: [0, 10, -30], size: [3, 3, 3], properties: { color: '#95a5a6', isCheckpoint: true, checkpointIndex: 5, rotating: true, speed: 1 } },
      // Start flag
      { type: 'decoration', position: [4, 1.5, 30], size: [0.1, 2, 0.1], properties: { shape: 'column', color: '#bdc3c7' } },
      { type: 'decoration', position: [4.4, 2.2, 30], size: [0.6, 0.4, 0.05], properties: { color: '#2ecc71' } },
      // Directional arrows along the path
      { type: 'decoration', position: [3, 2, 16], size: [0.4, 0.6, 0.3], properties: { shape: 'arrow', color: '#2ecc71', emissive: true } },
      { type: 'decoration', position: [-1, 3, 8], size: [0.4, 0.6, 0.3], properties: { shape: 'arrow', color: '#95a5a6', emissive: true } },
      { type: 'decoration', position: [1, 5, -8], size: [0.4, 0.6, 0.3], properties: { shape: 'arrow', color: '#95a5a6', emissive: true } },
      { type: 'decoration', position: [-1, 7, -24], size: [0.5, 0.8, 0.3], properties: { shape: 'star', color: '#9b59b6', emissive: true } },
    ]
  },

  race_circuit: {
    name: 'Race Circuit',
    gameType: 'race',
    floorType: 'solid',
    environment: {
      skyColor: '#1a1a2e', fogColor: '#1a1a2e', fogDensity: 0.008,
      ambientIntensity: 0.5, sunIntensity: 1.1,
      materialTheme: 'stone', skyPreset: 'sunset',
    },
    respawnPoint: [0, 2, 18],
    goalPosition: null,
    entities: [
      // Circular track floor
      { type: 'platform', position: [0, 0, 0], size: [45, 1, 45], properties: { color: '#2c3e50' } },
      // Start zone
      { type: 'platform', position: [0, 0.5, 18], size: [6, 0.3, 4], properties: { color: '#2ecc71' } },
      // Checkpoints around the circuit (clockwise)
      { type: 'trigger', position: [15, 2, 15], size: [3, 3, 3], properties: { color: '#2ecc71', isCheckpoint: true, checkpointIndex: 0, rotating: true, speed: 1 } },
      { type: 'trigger', position: [18, 2, 0], size: [3, 3, 3], properties: { color: '#95a5a6', isCheckpoint: true, checkpointIndex: 1, rotating: true, speed: 1 } },
      { type: 'trigger', position: [15, 2, -15], size: [3, 3, 3], properties: { color: '#95a5a6', isCheckpoint: true, checkpointIndex: 2, rotating: true, speed: 1 } },
      { type: 'trigger', position: [0, 2, -18], size: [3, 3, 3], properties: { color: '#95a5a6', isCheckpoint: true, checkpointIndex: 3, rotating: true, speed: 1 } },
      { type: 'trigger', position: [-15, 2, -15], size: [3, 3, 3], properties: { color: '#95a5a6', isCheckpoint: true, checkpointIndex: 4, rotating: true, speed: 1 } },
      { type: 'trigger', position: [-18, 2, 0], size: [3, 3, 3], properties: { color: '#95a5a6', isCheckpoint: true, checkpointIndex: 5, rotating: true, speed: 1 } },
      { type: 'trigger', position: [-15, 2, 15], size: [3, 3, 3], properties: { color: '#95a5a6', isCheckpoint: true, checkpointIndex: 6, rotating: true, speed: 1 } },
      { type: 'trigger', position: [0, 2, 18], size: [3, 3, 3], properties: { color: '#95a5a6', isCheckpoint: true, checkpointIndex: 7, rotating: true, speed: 1 } },
      // Ice section (east side)
      { type: 'platform', position: [18, 0.5, 0], size: [6, 0.3, 10], properties: { color: '#b3e5fc', isIce: true } },
      // Conveyor section (west side)
      { type: 'platform', position: [-18, 0.5, 0], size: [6, 0.3, 10], properties: { color: '#e67e22', isConveyor: true, conveyorDir: [0, 0, -1], conveyorSpeed: 4 } },
      // Wind zone (north)
      { type: 'trigger', position: [0, 3, -18], size: [10, 5, 4], properties: { color: '#87ceeb', isWind: true, windForce: [-4, 0, 0], opacity: 0.08 } },
      // Obstacles
      { type: 'obstacle', position: [15, 1.5, 0], size: [1, 2, 6], properties: { color: '#e74c3c', kinematic: true, path: [[15, 1.5, -3], [15, 1.5, 3]], speed: 1 } },
      { type: 'obstacle', position: [-15, 1.5, 0], size: [1, 2, 6], properties: { color: '#e74c3c', kinematic: true, path: [[-15, 1.5, 3], [-15, 1.5, -3]], speed: 1.2 } },
      // Center decoration
      { type: 'decoration', position: [0, 5, 0], size: [2, 3, 2], properties: { shape: 'star', color: '#9b59b6', emissive: true, rotating: true, speed: 0.3 } },
      // Start/finish arch
      { type: 'decoration', position: [0, 1, 15], size: [6, 4, 1], properties: { shape: 'arch', color: '#2ecc71' } },
      // Corner columns
      { type: 'decoration', position: [20, 3, 20], size: [0.5, 5, 0.5], properties: { shape: 'column', color: '#5a6a7a' } },
      { type: 'decoration', position: [-20, 3, 20], size: [0.5, 5, 0.5], properties: { shape: 'column', color: '#5a6a7a' } },
      { type: 'decoration', position: [20, 3, -20], size: [0.5, 5, 0.5], properties: { shape: 'column', color: '#5a6a7a' } },
      { type: 'decoration', position: [-20, 3, -20], size: [0.5, 5, 0.5], properties: { shape: 'column', color: '#5a6a7a' } },
      // Column-top arrows
      { type: 'decoration', position: [20, 6, 20], size: [0.5, 0.8, 0.4], properties: { shape: 'arrow', color: '#9b59b6', emissive: true } },
      { type: 'decoration', position: [-20, 6, -20], size: [0.5, 0.8, 0.4], properties: { shape: 'arrow', color: '#9b59b6', emissive: true } },
    ]
  },

  blank_canvas: {
    name: 'The Void',
    gameType: 'survival',
    floorType: 'none',
    environment: {
      skyColor: '#0a0a1a', fogColor: '#0a0a1a', fogDensity: 0.020,
      ambientIntensity: 0.3,
      materialTheme: 'neon', skyPreset: 'void',
    },
    respawnPoint: [0, 3, 0],
    goalPosition: null,
    entities: [
      // Single small starting platform — the agent builds the rest
      { type: 'platform', position: [0, 1, 0], size: [6, 1, 6], properties: { color: '#2c3e50' } },
    ]
  }
};

// Sky presets we cycle through for env variety — must match client SKY_PRESETS
const SKY_PRESET_POOL = ['starfield', 'sunset', 'storm', 'void', 'aurora'];

// HSL hue-rotate a hex color so each spawn paints platforms in a fresh palette
function rotateHueHex(hex, deltaDeg) {
  if (typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s; const l = (max + min) / 2;
  if (max === min) { h = 0; s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  h = (h + deltaDeg / 360 + 1) % 1;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const nr = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const ng = Math.round(hue2rgb(p, q, h) * 255);
  const nb = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return '#' + [nr, ng, nb].map(v => v.toString(16).padStart(2, '0')).join('');
}

// Difficulty curve, indexed by round count (0 = first round of a session).
// Scales position jitter, obstacle speed variance, and slows/disables the
// hazard plane on the first couple of rounds so newcomers can learn the
// jump arc before chaos arrives.
function getDifficulty(round) {
  // platformBuff: 1.0 = authored size; >1 = wider/longer landings; gapPull:
  // 0 = authored gaps; >0 = pull non-anchored platforms toward the origin
  // (shrinks horizontal distance between blocks) for easier traversal early.
  // Judge-friendly curve: the first 4 rounds stay forgiving so a one-time
  // tester can experience the loop without dying repeatedly. Hazard planes
  // (rising lava/water) stay off until round 4. Platform buffs stay generous.
  // Real difficulty only ramps from round 5 onward.
  if (round <= 0) return { posJitter: 0.0,  decoJitter: 1.0, speedMin: 0.50, speedRange: 0.15, hazardMul: 0.0,  hazardSpeedMul: 0.5,  platformBuff: 1.6,  gapPull: 0.40 };
  if (round === 1) return { posJitter: 0.0,  decoJitter: 1.1, speedMin: 0.55, speedRange: 0.20, hazardMul: 0.0,  hazardSpeedMul: 0.6,  platformBuff: 1.5,  gapPull: 0.30 };
  if (round === 2) return { posJitter: 0.20, decoJitter: 1.2, speedMin: 0.60, speedRange: 0.25, hazardMul: 0.0,  hazardSpeedMul: 0.7,  platformBuff: 1.4,  gapPull: 0.22 };
  if (round === 3) return { posJitter: 0.35, decoJitter: 1.3, speedMin: 0.65, speedRange: 0.30, hazardMul: 0.4,  hazardSpeedMul: 0.8,  platformBuff: 1.3,  gapPull: 0.15 };
  if (round <= 5) return { posJitter: 0.55, decoJitter: 1.35,speedMin: 0.70, speedRange: 0.40, hazardMul: 0.7,  hazardSpeedMul: 0.9,  platformBuff: 1.18, gapPull: 0.08 };
  if (round <= 7) return { posJitter: 0.75, decoJitter: 1.4, speedMin: 0.75, speedRange: 0.50, hazardMul: 0.9,  hazardSpeedMul: 1.0,  platformBuff: 1.10, gapPull: 0.0 };
  return            { posJitter: 1.0,  decoJitter: 1.5, speedMin: 0.80, speedRange: 0.60, hazardMul: 1.0,  hazardSpeedMul: 1.15, platformBuff: 1.0,  gapPull: 0.0 };
}

// Global arena-spread multiplier — pushes all positions outward and bumps
// platform X/Z size so each arena fills the cinematic world space instead of
// looking like a postage stamp floating in the void. Y (vertical) is left
// alone so jump arcs, obstacle heights, and hazard rise dynamics stay tuned.
//
// Calibration note: spread × position grows GAPS between platforms; buff
// only grows platform width. If spread runs ahead of buff, gaps explode and
// authored jumps become unreachable. Keep (spread - 1) < (buff - 1), and
// re-test spiral_tower + parkour_hell after touching these.
const ARENA_SPREAD = 1.25;         // horizontal position multiplier
const ARENA_PLATFORM_BUFF = 1.40;  // platform X/Z size multiplier (traversal)

// Deep-clone and randomize a template. Difficulty ramps with `opts.round`
// so the first round is gentle (no position jitter, slow obstacles, soft
// hazard) and later rounds reach full chaos-arena variance.
export function randomizeTemplate(template, opts = {}) {
  const tmpl = JSON.parse(JSON.stringify(template));
  const round = opts.round ?? 99;
  const d = getDifficulty(round);

  const hueShift = (Math.random() - 0.5) * 120; // ±60° hue rotation, shared

  for (const entity of tmpl.entities) {
    const props = entity.properties;

    // Bigger landing footprints on platforms during easy rounds — only X/Z
    // (width/depth), height stays as authored so vertical gaps don't change.
    if (d.platformBuff !== 1.0 && entity.type === 'platform' && Array.isArray(entity.size) && entity.size.length === 3) {
      entity.size[0] *= d.platformBuff;
      entity.size[2] *= d.platformBuff;
    }

    if (!props?.isCheckpoint && !props?.isHill && !props?.isGoal) {
      // Pull non-anchored platforms toward origin to shorten horizontal gaps
      // on easier rounds. Anchored entities (goal/checkpoints/hills) stay put
      // so route geometry / scoring still works.
      if (d.gapPull > 0) {
        entity.position[0] *= (1 - d.gapPull);
        entity.position[2] *= (1 - d.gapPull);
      }
      const jitter = entity.type === 'decoration' ? d.decoJitter : d.posJitter;
      entity.position[0] += (Math.random() - 0.5) * jitter;
      entity.position[2] += (Math.random() - 0.5) * jitter;
    }

    // Hue-shift every colored entity so each spawn reads as a new palette
    if (props?.color) {
      props.color = rotateHueHex(props.color, hueShift);
    }

    // Speed variance scales with difficulty — round 0 is much slower
    if (props?.speed) {
      props.speed *= d.speedMin + Math.random() * d.speedRange;
    }
    if (props?.conveyorSpeed) {
      props.conveyorSpeed *= d.speedMin + Math.random() * d.speedRange;
    }

    if (props?.breakDelay) {
      // Easier rounds give players more time before platforms break
      const ease = round <= 1 ? 200 : 0;
      const jitter = Math.floor((Math.random() - 0.5) * 200);
      props.breakDelay = Math.max(100, props.breakDelay + jitter + ease);
    }
  }

  // Re-tint environment so background reads as a new scene each round.
  if (tmpl.environment) {
    if (Math.random() < 0.7) {
      tmpl.environment.skyPreset = SKY_PRESET_POOL[Math.floor(Math.random() * SKY_PRESET_POOL.length)];
    }
    if (tmpl.environment.skyColor) {
      tmpl.environment.skyColor = rotateHueHex(tmpl.environment.skyColor, hueShift * 0.6);
    }
    if (tmpl.environment.fogColor) {
      tmpl.environment.fogColor = rotateHueHex(tmpl.environment.fogColor, hueShift * 0.6);
    }
    if (tmpl.environment.fogDensity) {
      tmpl.environment.fogDensity *= 0.75 + Math.random() * 0.5;
    }
  }

  // Hazard plane (rising lava/water): disabled round 0, soft early rounds
  if (tmpl.hazardPlane) {
    if (d.hazardMul === 0) {
      delete tmpl.hazardPlane;
    } else {
      if (tmpl.hazardPlane.riseSpeed) {
        tmpl.hazardPlane.riseSpeed *= d.hazardSpeedMul * (0.9 + Math.random() * 0.2);
      }
      if (typeof tmpl.hazardPlane.startHeight === 'number') {
        // Lower starting height on easier rounds = more reaction time
        tmpl.hazardPlane.startHeight -= (1 - d.hazardMul) * 4;
      }
    }
  }

  // === ARENA SPREAD pass ===
  // Expand the arena footprint so it fills the cinematic world instead of
  // sitting like a small island in a vast empty space. Pushes every X/Z
  // position outward by ARENA_SPREAD and bumps platform X/Z sizes so jumps
  // stay reachable. Y (vertical) untouched — jump arcs and hazard plane stay
  // tuned. Goal, respawn, and hazard radius scale with the world.
  for (const entity of tmpl.entities) {
    if (Array.isArray(entity.position) && entity.position.length === 3) {
      entity.position[0] *= ARENA_SPREAD;
      entity.position[2] *= ARENA_SPREAD;
    }
    if (entity.type === 'platform' && Array.isArray(entity.size) && entity.size.length === 3) {
      entity.size[0] *= ARENA_PLATFORM_BUFF;
      entity.size[2] *= ARENA_PLATFORM_BUFF;
    }
  }
  if (Array.isArray(tmpl.goalPosition) && tmpl.goalPosition.length === 3) {
    tmpl.goalPosition[0] *= ARENA_SPREAD;
    tmpl.goalPosition[2] *= ARENA_SPREAD;
  }
  if (Array.isArray(tmpl.respawnPoint) && tmpl.respawnPoint.length === 3) {
    tmpl.respawnPoint[0] *= ARENA_SPREAD;
    tmpl.respawnPoint[2] *= ARENA_SPREAD;
  }
  if (tmpl.hazardPlane && typeof tmpl.hazardPlane.radius === 'number') {
    tmpl.hazardPlane.radius *= ARENA_SPREAD;
  }

  return tmpl;
}

export function getTemplateNames() {
  return Object.keys(TEMPLATES);
}

export function getTemplateInfo() {
  return Object.entries(TEMPLATES).map(([key, t]) => ({
    id: key,
    name: t.name,
    gameType: t.gameType,
    entityCount: t.entities.length
  }));
}
