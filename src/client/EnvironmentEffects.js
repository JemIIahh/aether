/**
 * EnvironmentEffects — Sky dome, stars, ambient particles
 *
 * Sky presets: starfield, sunset, storm, void, aurora
 * Particle types: dust, embers, snow, fireflies, ash, magic
 */

import * as THREE from 'three';

let particleSystem = null;
let particleVelocities = null;
let particleType = 'dust';
let skyDome = null;
let starField = null;

const PARTICLE_COUNT = 600;
const PARTICLE_SPREAD = 80;

// ─── Sky Dome ───────────────────────────────────────────────

const skyVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = /* glsl */ `
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  uniform vec3 midColor;
  uniform float offset;
  uniform float exponent;
  uniform float cloudBand;
  varying vec3 vWorldPosition;

  // Simple hash for cloud band noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1, 0));
    float c = hash(i + vec2(0, 1));
    float d = hash(i + vec2(1, 1));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    float h = normalize(vWorldPosition + offset).y;
    float t = max(pow(max(h, 0.0), exponent), 0.0);

    // Three-color gradient: bottom → mid → top
    vec3 color;
    if (t < 0.4) {
      color = mix(bottomColor, midColor, t / 0.4);
    } else {
      color = mix(midColor, topColor, (t - 0.4) / 0.6);
    }

    // Cloud band at horizon
    if (cloudBand > 0.0) {
      float band = smoothstep(0.0, 0.15, h) * smoothstep(0.3, 0.15, h);
      float n = noise(vWorldPosition.xz * 0.015) * 0.7 + noise(vWorldPosition.xz * 0.03) * 0.3;
      color = mix(color, vec3(1.0), band * n * cloudBand * 0.25);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Sky presets define gradient colors and atmosphere
const SKY_PRESETS = {
  starfield: {
    topColor: [0.02, 0.02, 0.08],
    midColor: [0.05, 0.05, 0.15],
    bottomColor: [0.08, 0.08, 0.2],
    cloudBand: 0,
    starsVisible: true,
    starBrightness: 1.0,
  },
  sunset: {
    topColor: [0.1, 0.08, 0.2],
    midColor: [0.6, 0.2, 0.1],
    bottomColor: [0.9, 0.4, 0.15],
    cloudBand: 0.6,
    starsVisible: false,
    starBrightness: 0,
  },
  storm: {
    topColor: [0.05, 0.05, 0.08],
    midColor: [0.15, 0.12, 0.15],
    bottomColor: [0.2, 0.15, 0.12],
    cloudBand: 1.0,
    starsVisible: false,
    starBrightness: 0,
  },
  void: {
    topColor: [0.0, 0.0, 0.02],
    midColor: [0.02, 0.0, 0.06],
    bottomColor: [0.05, 0.02, 0.1],
    cloudBand: 0,
    starsVisible: true,
    starBrightness: 0.6,
  },
  aurora: {
    topColor: [0.02, 0.08, 0.15],
    midColor: [0.05, 0.2, 0.15],
    bottomColor: [0.1, 0.05, 0.2],
    cloudBand: 0.3,
    starsVisible: true,
    starBrightness: 0.8,
  },
};

export function createSkyDome(scene) {
  const skyGeo = new THREE.SphereGeometry(400, 24, 24);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x1a3050) },
      bottomColor: { value: new THREE.Color(0x2a3a5e) },
      midColor: { value: new THREE.Color(0x1e2d48) },
      offset: { value: 20 },
      exponent: { value: 0.6 },
      cloudBand: { value: 0.0 },
    },
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
  });

  skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);

  // Star layer
  createStarField(scene);

  return skyDome;
}

function createStarField(scene) {
  const count = 900;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Distribute on upper hemisphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.8 + 0.2); // upper half bias
    const r = 390;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    sizes[i] = 0.5 + Math.random() * 1.5;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: false,
  });

  starField = new THREE.Points(geometry, material);
  starField.frustumCulled = false;
  scene.add(starField);
}

export function updateSkyColors(skyColor, fogColor, skyPreset) {
  if (!skyDome) return;

  const preset = skyPreset && SKY_PRESETS[skyPreset];
  if (preset) {
    skyDome.material.uniforms.topColor.value.setRGB(...preset.topColor);
    skyDome.material.uniforms.midColor.value.setRGB(...preset.midColor);
    skyDome.material.uniforms.bottomColor.value.setRGB(...preset.bottomColor);
    skyDome.material.uniforms.cloudBand.value = preset.cloudBand;

    if (starField) {
      starField.material.opacity = preset.starsVisible ? preset.starBrightness : 0;
      starField.visible = preset.starsVisible;
    }
  } else {
    const top = new THREE.Color(skyColor);
    const bottom = fogColor ? new THREE.Color(fogColor) : top.clone().multiplyScalar(0.6);
    const mid = top.clone().lerp(bottom, 0.5);
    skyDome.material.uniforms.topColor.value.copy(top);
    skyDome.material.uniforms.midColor.value.copy(mid);
    skyDome.material.uniforms.bottomColor.value.copy(bottom);
    skyDome.material.uniforms.cloudBand.value = 0;

    // Auto-enable stars for dark skies
    if (starField) {
      const brightness = top.r * 0.299 + top.g * 0.587 + top.b * 0.114;
      starField.material.opacity = brightness < 0.15 ? 0.7 : 0;
      starField.visible = brightness < 0.15;
    }
  }
}

// ─── Particles ──────────────────────────────────────────────

function getParticleConfig(type) {
  switch (type) {
    case 'embers':
      return { color: 0xff6622, size: 0.25, velocityY: [0.5, 1.5], velocityXZ: 0.3, opacity: 0.7, blending: 'additive' };
    case 'snow':
      return { color: 0xffffff, size: 0.2, velocityY: [-0.8, -0.3], velocityXZ: 0.5, opacity: 0.6, blending: 'normal' };
    case 'fireflies':
      return { color: 0x88ff44, size: 0.3, velocityY: [-0.2, 0.2], velocityXZ: 0.4, opacity: 0.8, blending: 'additive' };
    case 'ash':
      return { color: 0x888888, size: 0.15, velocityY: [-0.5, -0.1], velocityXZ: 0.3, opacity: 0.4, blending: 'normal' };
    case 'magic':
      return { color: 0xaa66ff, size: 0.2, velocityY: [0.1, 0.5], velocityXZ: 0.6, opacity: 0.7, blending: 'additive' };
    case 'dust':
    default:
      return { color: 0xffffff, size: 0.12, velocityY: [-0.1, 0.1], velocityXZ: 0.2, opacity: 0.35, blending: 'normal' };
  }
}

export function initParticles(scene, type = 'dust') {
  disposeParticles(scene);

  particleType = type;
  const config = getParticleConfig(type);

  const positions = new Float32Array(PARTICLE_COUNT * 3);
  particleVelocities = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * PARTICLE_SPREAD;
    positions[i3 + 1] = Math.random() * 30 + 2;
    positions[i3 + 2] = (Math.random() - 0.5) * PARTICLE_SPREAD;

    particleVelocities[i3] = (Math.random() - 0.5) * config.velocityXZ;
    particleVelocities[i3 + 1] = config.velocityY[0] + Math.random() * (config.velocityY[1] - config.velocityY[0]);
    particleVelocities[i3 + 2] = (Math.random() - 0.5) * config.velocityXZ;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: config.color,
    size: config.size,
    transparent: true,
    opacity: config.opacity,
    depthWrite: false,
    blending: config.blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
  });

  particleSystem = new THREE.Points(geometry, material);
  particleSystem.frustumCulled = false;
  scene.add(particleSystem);
}

export function updateEnvironmentEffects(delta, cameraPosition) {
  if (!particleSystem || !particleVelocities) return;

  const positions = particleSystem.geometry.attributes.position.array;
  const now = Date.now() * 0.001;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] += particleVelocities[i3] * delta;
    positions[i3 + 1] += particleVelocities[i3 + 1] * delta;
    positions[i3 + 2] += particleVelocities[i3 + 2] * delta;

    // Fireflies: sine-wave wander
    if (particleType === 'fireflies') {
      positions[i3] += Math.sin(now * 1.5 + i * 0.7) * 0.02;
      positions[i3 + 2] += Math.cos(now * 1.3 + i * 0.9) * 0.02;
    }

    // Keep particles centered around camera
    if (cameraPosition) {
      const dx = positions[i3] - cameraPosition.x;
      const dz = positions[i3 + 2] - cameraPosition.z;
      const halfSpread = PARTICLE_SPREAD / 2;
      if (dx > halfSpread) positions[i3] -= PARTICLE_SPREAD;
      if (dx < -halfSpread) positions[i3] += PARTICLE_SPREAD;
      if (dz > halfSpread) positions[i3 + 2] -= PARTICLE_SPREAD;
      if (dz < -halfSpread) positions[i3 + 2] += PARTICLE_SPREAD;
    }

    // Vertical wrap
    if ((particleType === 'embers' || particleType === 'magic') && positions[i3 + 1] > 35) {
      positions[i3 + 1] = 0;
    } else if ((particleType === 'snow' || particleType === 'ash') && positions[i3 + 1] < -1) {
      positions[i3 + 1] = 30;
    } else if (positions[i3 + 1] > 35 || positions[i3 + 1] < -1) {
      positions[i3 + 1] = Math.random() * 30;
    }
  }

  particleSystem.geometry.attributes.position.needsUpdate = true;

  // Animate star twinkle
  if (starField?.visible) {
    starField.rotation.y += delta * 0.002;
  }
}

// ─── Distant scenery ring ──────────────────────────────────
// Far-off monoliths placed in a wide ring beyond gameplay so the world
// reads as "inside a place" instead of an empty void backdrop. Cheap:
// instanced boxes, no shadows, fog-faded.

let sceneryGroup = null;

export function createDistantScenery(scene) {
  disposeDistantScenery(scene);

  const group = new THREE.Group();
  const monolithCount = 28;
  const innerRadius = 80;
  const outerRadius = 180;

  for (let i = 0; i < monolithCount; i++) {
    const angle = (i / monolithCount) * Math.PI * 2 + Math.random() * 0.15;
    const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
    const height = 14 + Math.random() * 38;
    const width = 5 + Math.random() * 9;
    const depth = 5 + Math.random() * 9;

    const geom = new THREE.BoxGeometry(width, height, depth);
    const hue = 0.55 + Math.random() * 0.25; // cool teal → violet band
    // Mid-lightness — earlier 0.18 read as pitch-black silhouettes against the
    // sky and made the horizon feel sinister rather than atmospheric.
    const color = new THREE.Color().setHSL(hue, 0.45, 0.32 + Math.random() * 0.14);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0.1,
      emissive: color.clone().multiplyScalar(0.35),
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(
      Math.cos(angle) * radius,
      height / 2 - 4,
      Math.sin(angle) * radius,
    );
    mesh.rotation.y = Math.random() * Math.PI;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
  }

  // Floating accent crystals — slow drift gives the scene life
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 60 + Math.random() * 90;
    const y = 18 + Math.random() * 50;
    const size = 1.5 + Math.random() * 2.5;
    const color = new THREE.Color().setHSL(0.5 + Math.random() * 0.35, 0.9, 0.6);
    const geom = new THREE.OctahedronGeometry(size, 0);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.4,
      roughness: 0.25,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    mesh.userData.bobPhase = Math.random() * Math.PI * 2;
    mesh.userData.bobAmp = 0.6 + Math.random() * 1.2;
    mesh.userData.baseY = y;
    mesh.userData.spinSpeed = (Math.random() - 0.5) * 0.4;
    group.add(mesh);
  }

  sceneryGroup = group;
  scene.add(group);
  return group;
}

export function disposeDistantScenery(scene) {
  if (!sceneryGroup) return;
  scene.remove(sceneryGroup);
  sceneryGroup.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  });
  sceneryGroup = null;
}

// Recolor scenery to harmonize with each arena's palette
export function updateSceneryPalette(skyPreset) {
  if (!sceneryGroup) return;
  const palettes = {
    starfield: { mono: [0.6, 0.4, 0.18], glow: [0.6, 0.85, 0.6] },
    sunset:    { mono: [0.06, 0.55, 0.25], glow: [0.08, 0.9, 0.6] },
    storm:     { mono: [0.7, 0.2, 0.16], glow: [0.7, 0.5, 0.5] },
    void:      { mono: [0.78, 0.55, 0.18], glow: [0.78, 0.9, 0.6] },
    aurora:    { mono: [0.42, 0.6, 0.2], glow: [0.45, 0.9, 0.6] },
  };
  const p = palettes[skyPreset] || palettes.starfield;
  let i = 0;
  sceneryGroup.children.forEach((mesh) => {
    const isCrystal = mesh.geometry?.type === 'OctahedronGeometry';
    const cfg = isCrystal ? p.glow : p.mono;
    const hue = (cfg[0] + (Math.random() - 0.5) * 0.08 + 1) % 1;
    const color = new THREE.Color().setHSL(hue, cfg[1], cfg[2]);
    mesh.material.color.copy(color);
    if (mesh.material.emissive) {
      mesh.material.emissive.copy(color).multiplyScalar(isCrystal ? 1.0 : 0.18);
    }
    i++;
  });
}

export function updateDistantScenery(delta) {
  if (!sceneryGroup) return;
  sceneryGroup.children.forEach((mesh) => {
    if (mesh.geometry?.type === 'OctahedronGeometry') {
      mesh.userData.bobPhase += delta * 0.6;
      mesh.position.y = mesh.userData.baseY + Math.sin(mesh.userData.bobPhase) * mesh.userData.bobAmp;
      mesh.rotation.y += delta * mesh.userData.spinSpeed;
      mesh.rotation.x += delta * mesh.userData.spinSpeed * 0.5;
    }
  });
}

export function disposeParticles(scene) {
  if (particleSystem) {
    scene.remove(particleSystem);
    particleSystem.geometry.dispose();
    particleSystem.material.dispose();
    particleSystem = null;
    particleVelocities = null;
  }
}

export function selectParticleType(floorType, environment) {
  if (floorType === 'lava') return 'embers';

  if (environment?.skyColor) {
    const sky = new THREE.Color(environment.skyColor);
    if (sky.b > 0.4 && sky.r < 0.3 && sky.g < 0.3) return 'snow';
    if (sky.r > 0.3 && sky.b < 0.15) return 'embers';
  }

  if (environment?.skyPreset) {
    const PRESET_PARTICLES = {
      aurora: 'magic',
      void: 'magic',
      storm: 'ash',
      sunset: 'fireflies',
    };
    return PRESET_PARTICLES[environment.skyPreset] ?? 'dust';
  }

  return 'dust';
}
