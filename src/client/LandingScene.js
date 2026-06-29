/**
 * LandingScene — a small Three.js scene running behind the login screen.
 *
 * Reuses the in-game art direction (cyber-noir background, electric chartreuse
 * accent, lava-amber + cyan rim lights) so the landing reads as the game,
 * not a marketing site.
 *
 * Cheap on purpose: pixel ratio capped at 1, low geometry count, no shadows.
 * Stops itself when the parent canvas is detached or `stop()` is called.
 */
import * as THREE from 'three';

const COLORS = {
  void:    0x07080d,
  acid:    0xd4ff00,
  pink:    0xff2d92,
  cyan:    0x00f0ff,
  mint:    0x34d399,
  violet:  0x8b5cf6,
};

let _state = null;

export function startLandingScene(canvas) {
  if (_state || !canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(1); // cheap on purpose — this is decor, not the game
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COLORS.void, 18, 60);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 6, 14);
  camera.lookAt(0, 1, 0);

  // --- Lighting ---
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(8, 14, 6);
  scene.add(keyLight);
  const rimAcid = new THREE.PointLight(COLORS.acid, 1.6, 30);
  rimAcid.position.set(-7, 4, -3);
  scene.add(rimAcid);
  const rimPink = new THREE.PointLight(COLORS.pink, 1.2, 30);
  rimPink.position.set(7, 3, 5);
  scene.add(rimPink);

  // --- Floating platforms ---
  const platforms = new THREE.Group();
  scene.add(platforms);

  const platformDefs = [
    { size: [6, 0.5, 6], pos: [0, 0, 0], color: 0x141822 },
    { size: [3.5, 0.4, 3.5], pos: [-5.5, 2.2, -2.5], color: 0x1c2030 },
    { size: [3, 0.4, 3], pos: [5.2, 1.5, -1], color: 0x1c2030 },
    { size: [2.5, 0.4, 2.5], pos: [-3.5, 4.0, 3.5], color: 0x1c2030 },
    { size: [2, 0.4, 2], pos: [4.0, 4.5, 3.5], color: 0x1c2030 },
    { size: [1.5, 0.4, 1.5], pos: [0, 6.2, -4], color: 0x1c2030 },
  ];

  for (const def of platformDefs) {
    const geo = new THREE.BoxGeometry(...def.size);
    const mat = new THREE.MeshStandardMaterial({
      color: def.color,
      roughness: 0.75,
      metalness: 0.1,
      emissive: 0x0a0c12,
      emissiveIntensity: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...def.pos);
    mesh.userData.basePosY = def.pos[1];
    mesh.userData.bobPhase = Math.random() * Math.PI * 2;
    platforms.add(mesh);
  }

  // Edge highlight on the main platform
  const ringGeo = new THREE.TorusGeometry(4.2, 0.04, 8, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: COLORS.acid, transparent: true, opacity: 0.55 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.2;
  platforms.add(ring);

  // --- Player capsule (matches in-game character vibe) ---
  const playerGroup = new THREE.Group();
  const bodyGeo = new THREE.CapsuleGeometry(0.45, 0.7, 6, 12);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: COLORS.mint,
    emissive: COLORS.mint,
    emissiveIntensity: 0.45,
    roughness: 0.5,
    metalness: 0.2,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.95;
  playerGroup.add(body);

  // Glow ring under the player
  const glowGeo = new THREE.RingGeometry(0.5, 0.85, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: COLORS.mint,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.26;
  playerGroup.add(glow);

  playerGroup.position.set(0, 0, 0);
  scene.add(playerGroup);

  // --- Ambient drifting particles ---
  const PARTICLE_COUNT = 220;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 50;
    positions[i * 3 + 1] = Math.random() * 18;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: COLORS.cyan,
    size: 0.08,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // Distant skyline silhouettes
  const skylineGroup = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const w = 1.5 + Math.random() * 2.5;
    const h = 8 + Math.random() * 18;
    const monolith = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, w),
      new THREE.MeshStandardMaterial({ color: 0x0d0f17, emissive: 0x0a0c12, emissiveIntensity: 0.3, roughness: 1 })
    );
    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
    const radius = 28 + Math.random() * 6;
    monolith.position.set(Math.cos(angle) * radius, h / 2 - 2, Math.sin(angle) * radius);
    skylineGroup.add(monolith);
  }
  scene.add(skylineGroup);

  // --- Resize ---
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', onResize, { passive: true });

  // --- Animation loop ---
  const clock = new THREE.Clock();
  let raf = 0;
  let running = true;

  function animate() {
    if (!running) return;
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Slow auto-orbit camera
    const orbitRadius = 14;
    const orbitSpeed = 0.06;
    camera.position.x = Math.sin(t * orbitSpeed) * orbitRadius;
    camera.position.z = Math.cos(t * orbitSpeed) * orbitRadius;
    camera.position.y = 6 + Math.sin(t * 0.2) * 0.4;
    camera.lookAt(0, 1.5, 0);

    // Platform bob
    platforms.children.forEach(mesh => {
      if (mesh.userData.basePosY === undefined) return;
      mesh.position.y = mesh.userData.basePosY + Math.sin(t * 0.6 + mesh.userData.bobPhase) * 0.15;
    });

    // Player idle bob + slow turn
    body.position.y = 0.95 + Math.sin(t * 1.6) * 0.06;
    playerGroup.rotation.y = t * 0.25;
    glow.material.opacity = 0.35 + Math.sin(t * 2.0) * 0.15;

    // Particle drift
    const pos = particleGeo.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3 + 1] += 0.008;
      if (pos[i * 3 + 1] > 20) pos[i * 3 + 1] = 0;
    }
    particleGeo.attributes.position.needsUpdate = true;

    // Acid ring pulse
    ringMat.opacity = 0.4 + Math.sin(t * 1.2) * 0.2;

    renderer.render(scene, camera);
  }

  animate();

  _state = {
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      // Dispose geometries + materials
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      _state = null;
    },
  };
}

export function stopLandingScene() {
  _state?.stop();
}
