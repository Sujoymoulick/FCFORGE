import * as THREE from 'three';

export interface ChampionshipTrophySceneOptions {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  onReady?: () => void;
}

export class ChampionshipTrophyScene {
  private canvas: HTMLCanvasElement;
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animId: number | null = null;
  private clock: THREE.Clock;

  // 3D Objects
  private trophyGroup: THREE.Group;
  private pedestalGroup: THREE.Group;
  private starMesh!: THREE.Mesh;
  private innerGlowMesh!: THREE.Mesh;
  private particlesMesh!: THREE.Points;
  private haloRingMesh!: THREE.Mesh;

  // Lights
  private keySpotLight!: THREE.SpotLight;
  private rimLight1!: THREE.PointLight;
  private rimLight2!: THREE.PointLight;

  // Interactive Drag & Inertia
  private isDragging = false;
  private prevPointerX = 0;
  private prevPointerY = 0;
  private targetRotationY = 0;
  private targetRotationX = 0.08;
  private currentRotationY = 0;
  private currentRotationX = 0.08;
  private rotationVelocityY = 0.008; // Gentle auto-rotation
  private flareIntensity = 0;

  constructor(options: ChampionshipTrophySceneOptions) {
    this.canvas = options.canvas;
    this.container = options.container;
    this.clock = new THREE.Clock();

    const width = this.container.clientWidth || 400;
    const height = this.container.clientHeight || 340;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera: Focused directly on the Championship Trophy
    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    this.camera.position.set(0, 0.95, 3.2);
    this.camera.lookAt(0, 0.72, 0);

    // 3. Renderer with transparency and filmic tone mapping
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    // 4. Studio Lighting
    this.setupLighting();

    // 5. Build Pedestal & 3D Trophy
    this.pedestalGroup = this.createPedestal();
    this.scene.add(this.pedestalGroup);

    this.trophyGroup = this.createTrophy();
    this.scene.add(this.trophyGroup);

    // 6. Floating Golden Sparkle Particles
    this.particlesMesh = this.createParticles();
    this.scene.add(this.particlesMesh);

    // 7. Interactive Event Listeners
    this.bindEvents();

    // 8. Start Render Loop
    this.animate();

    if (options.onReady) {
      options.onReady();
    }
  }

  // --- Cinematic Studio Lighting ---
  private setupLighting() {
    // Ambient warm tone
    const ambient = new THREE.AmbientLight(0x201A15, 1.2);
    this.scene.add(ambient);

    // Overhead Golden Key Spotlight
    this.keySpotLight = new THREE.SpotLight(0xFFF6D6, 18, 12, Math.PI * 0.28, 0.45, 1.2);
    this.keySpotLight.position.set(0.5, 4.2, 2.2);
    this.keySpotLight.target = this.scene;
    this.scene.add(this.keySpotLight);

    // Warm Amber Rim Light (Right-Back)
    this.rimLight1 = new THREE.PointLight(0xFF9431, 8, 8);
    this.rimLight1.position.set(2.2, 1.8, -1.5);
    this.scene.add(this.rimLight1);

    // Rich Gold Rim Light (Left-Back)
    this.rimLight2 = new THREE.PointLight(0xE5B869, 7, 8);
    this.rimLight2.position.set(-2.2, 1.5, -1.2);
    this.scene.add(this.rimLight2);

    // Front Soft Fill Light
    const fillLight = new THREE.DirectionalLight(0xFDF2D0, 2.5);
    fillLight.position.set(0, 1.2, 3.5);
    this.scene.add(fillLight);

    // Upward Pedestal Glow
    const upLight = new THREE.PointLight(0xE5B869, 4, 3);
    upLight.position.set(0, 0.05, 0);
    this.scene.add(upLight);
  }

  // --- Obsidian Marble & Gold Trim Pedestal ---
  private createPedestal(): THREE.Group {
    const group = new THREE.Group();

    // 1. Lower Obsidian Base Plinth
    const plinthGeo = new THREE.CylinderGeometry(1.05, 1.15, 0.12, 48);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x14110E,
      roughness: 0.22,
      metalness: 0.85
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = 0.06;
    group.add(plinth);

    // 2. Brushed Gold Pedestal Ring
    const goldRingGeo = new THREE.CylinderGeometry(0.98, 1.05, 0.04, 48);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xE5B869,
      metalness: 0.95,
      roughness: 0.16,
      emissive: 0x442600,
      emissiveIntensity: 0.2
    });
    const goldRing = new THREE.Mesh(goldRingGeo, goldMat);
    goldRing.position.y = 0.14;
    group.add(goldRing);

    // 3. Top Polished Turret Deck
    const deckGeo = new THREE.CylinderGeometry(0.92, 0.98, 0.04, 48);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x1A1512,
      roughness: 0.15,
      metalness: 0.9
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.18;
    group.add(deck);

    // 4. Holographic Floor Projection Ring
    const haloGeo = new THREE.RingGeometry(0.72, 0.76, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xE5B869,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    this.haloRingMesh = new THREE.Mesh(haloGeo, haloMat);
    this.haloRingMesh.rotation.x = -Math.PI / 2;
    this.haloRingMesh.position.y = 0.201;
    group.add(this.haloRingMesh);

    // 5. Contact Shadow Radial Texture
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const ctx = shadowCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0,0,0,0.85)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.9
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.005;
    group.add(shadow);

    return group;
  }

  // --- Authentic 3D Championship Trophy ---
  private createTrophy(): THREE.Group {
    const trophy = new THREE.Group();
    // Position on top of the pedestal deck (y = 0.20)
    trophy.position.y = 0.20;

    // Materials
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xE5B869,
      metalness: 0.96,
      roughness: 0.14,
      emissive: 0x4A2C00,
      emissiveIntensity: 0.18
    });

    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x12100E,
      roughness: 0.18,
      metalness: 0.88
    });

    // 1. Trophy Marble Step 1
    const base1Geo = new THREE.CylinderGeometry(0.38, 0.44, 0.12, 32);
    const base1 = new THREE.Mesh(base1Geo, obsidianMat);
    base1.position.y = 0.06;
    trophy.add(base1);

    // 2. Gold Step Ring
    const stepGoldGeo = new THREE.CylinderGeometry(0.34, 0.38, 0.06, 32);
    const stepGold = new THREE.Mesh(stepGoldGeo, goldMat);
    stepGold.position.y = 0.15;
    trophy.add(stepGold);

    // 3. Trophy Marble Step 2
    const base2Geo = new THREE.CylinderGeometry(0.30, 0.34, 0.10, 32);
    const base2 = new THREE.Mesh(base2Geo, obsidianMat);
    base2.position.y = 0.23;
    trophy.add(base2);

    // 4. Front Golden Engraved Plaque ("SEASON 4 CHAMPION")
    const plaqueGeo = new THREE.BoxGeometry(0.24, 0.07, 0.02);
    const plaqueMat = new THREE.MeshStandardMaterial({
      color: 0xFFF5D0,
      metalness: 0.92,
      roughness: 0.12,
      emissive: 0xE5B869,
      emissiveIntensity: 0.3
    });
    const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaque.position.set(0, 0.23, 0.31);
    trophy.add(plaque);

    // 5. Fluted Stem Pillar
    const stemGeo = new THREE.CylinderGeometry(0.09, 0.18, 0.32, 24);
    const stem = new THREE.Mesh(stemGeo, goldMat);
    stem.position.y = 0.44;
    trophy.add(stem);

    // Decorative Stem Torus Ring
    const stemRingGeo = new THREE.TorusGeometry(0.14, 0.03, 16, 32);
    const stemRing = new THREE.Mesh(stemRingGeo, goldMat);
    stemRing.position.y = 0.54;
    stemRing.rotation.x = Math.PI / 2;
    trophy.add(stemRing);

    // 6. Sculpted Flared Golden Cup Bowl (Lathe Geometry)
    const lathePoints: THREE.Vector2[] = [];
    lathePoints.push(new THREE.Vector2(0.06, 0.0));
    lathePoints.push(new THREE.Vector2(0.15, 0.10));
    lathePoints.push(new THREE.Vector2(0.26, 0.26));
    lathePoints.push(new THREE.Vector2(0.38, 0.48));
    lathePoints.push(new THREE.Vector2(0.42, 0.58));
    lathePoints.push(new THREE.Vector2(0.40, 0.60));
    lathePoints.push(new THREE.Vector2(0.36, 0.54));
    lathePoints.push(new THREE.Vector2(0.24, 0.28));
    lathePoints.push(new THREE.Vector2(0.13, 0.12));
    lathePoints.push(new THREE.Vector2(0.04, 0.0));

    const cupGeo = new THREE.LatheGeometry(lathePoints, 36);
    const cup = new THREE.Mesh(cupGeo, goldMat);
    cup.position.y = 0.58;
    trophy.add(cup);

    // 7. Glowing Inner Core Reservoir
    const innerGeo = new THREE.CylinderGeometry(0.36, 0.08, 0.50, 32);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xFFAA00,
      emissiveIntensity: 0.45
    });
    this.innerGlowMesh = new THREE.Mesh(innerGeo, innerMat);
    this.innerGlowMesh.position.y = 0.84;
    trophy.add(this.innerGlowMesh);

    // 8. Dual Sculpted Torus Handles
    const handleGeo = new THREE.TorusGeometry(0.26, 0.032, 16, 36, Math.PI * 1.15);
    
    const leftHandle = new THREE.Mesh(handleGeo, goldMat);
    leftHandle.position.set(-0.38, 0.86, 0);
    leftHandle.rotation.z = Math.PI * 0.22;
    trophy.add(leftHandle);

    const rightHandle = new THREE.Mesh(handleGeo, goldMat);
    rightHandle.position.set(0.38, 0.86, 0);
    rightHandle.rotation.z = -Math.PI * 0.22;
    rightHandle.rotation.y = Math.PI;
    trophy.add(rightHandle);

    // 9. Floating 5-Point Crown Star
    const starShape = new THREE.Shape();
    const numPoints = 5;
    const outerRadius = 0.13;
    const innerRadius = 0.055;
    for (let i = 0; i < numPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / numPoints - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();

    const starGeo = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.012,
      bevelThickness: 0.012
    });

    const starMat = new THREE.MeshStandardMaterial({
      color: 0xFFF2A6,
      metalness: 0.92,
      roughness: 0.1,
      emissive: 0xE5B869,
      emissiveIntensity: 0.65
    });
    this.starMesh = new THREE.Mesh(starGeo, starMat);
    this.starMesh.position.set(0, 1.28, 0);
    trophy.add(this.starMesh);

    return trophy;
  }

  // --- Floating Golden Embers Particle System ---
  private createParticles(): THREE.Points {
    const count = 60;
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Cylinder distribution around trophy
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.2 + Math.random() * 0.7;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.2 + Math.random() * 1.5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      scales[i] = Math.random() * 0.5 + 0.5;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle Canvas Texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const ctx = pCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 235, 170, 1)');
    grad.addColorStop(0.3, 'rgba(229, 184, 105, 0.8)');
    grad.addColorStop(1, 'rgba(229, 184, 105, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const pTex = new THREE.CanvasTexture(pCanvas);
    const pMat = new THREE.PointsMaterial({
      map: pTex,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    return new THREE.Points(pGeo, pMat);
  }

  // --- Interactive Drag & Spin Boost Events ---
  private bindEvents() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerup', this.onPointerUp, { passive: true });
    window.addEventListener('pointercancel', this.onPointerUp, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  private onPointerDown = (e: PointerEvent) => {
    this.isDragging = true;
    this.prevPointerX = e.clientX;
    this.prevPointerY = e.clientY;
    this.canvas.style.cursor = 'grabbing';
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.prevPointerX;
    const dy = e.clientY - this.prevPointerY;
    this.prevPointerX = e.clientX;
    this.prevPointerY = e.clientY;

    // Apply rotation
    this.targetRotationY += dx * 0.012;
    this.targetRotationX = THREE.MathUtils.clamp(this.targetRotationX + dy * 0.008, -0.2, 0.45);
    this.rotationVelocityY = dx * 0.006;
  };

  private onPointerUp = () => {
    if (this.isDragging) {
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';
    }
  };

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  };

  // --- Public Interactive Commands ---
  public spinBoost() {
    this.rotationVelocityY = 0.12;
    this.flareIntensity = 1.0;
  }

  public triggerCelebrationFlare() {
    this.flareIntensity = 1.5;
    this.rotationVelocityY = 0.08;
    // Animate glowing elements
    if (this.innerGlowMesh) {
      (this.innerGlowMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.8;
    }
    if (this.starMesh) {
      (this.starMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0;
    }
  }

  // --- Main Animation Loop ---
  private animate = () => {
    this.animId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // 1. Friction & Auto-Rotation Dynamics
    if (!this.isDragging) {
      // Natural inertia friction
      this.rotationVelocityY *= 0.95;
      if (Math.abs(this.rotationVelocityY) < 0.006) {
        // Return to gentle constant ambient spin
        this.rotationVelocityY = THREE.MathUtils.lerp(this.rotationVelocityY, 0.007, 0.05);
      }
      this.targetRotationY += this.rotationVelocityY;
    }

    // Smooth lerp to target
    this.currentRotationY = THREE.MathUtils.lerp(this.currentRotationY, this.targetRotationY, 0.12);
    this.currentRotationX = THREE.MathUtils.lerp(this.currentRotationX, this.targetRotationX, 0.12);

    this.trophyGroup.rotation.y = this.currentRotationY;
    this.trophyGroup.rotation.x = this.currentRotationX;

    // 2. Star Crown Animation (Gentle floating + independent spin)
    if (this.starMesh) {
      this.starMesh.position.y = 1.28 + Math.sin(elapsed * 2.5) * 0.025;
      this.starMesh.rotation.y = elapsed * 1.2;
    }

    // 3. Holographic Pedestal Ring Pulse
    if (this.haloRingMesh) {
      this.haloRingMesh.rotation.z = elapsed * 0.4;
      (this.haloRingMesh.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(elapsed * 3) * 0.25;
    }

    // 4. Flare Decay
    if (this.flareIntensity > 0) {
      this.flareIntensity = Math.max(0, this.flareIntensity - delta * 2.0);
      this.keySpotLight.intensity = 18 + this.flareIntensity * 25;
      if (this.innerGlowMesh) {
        (this.innerGlowMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.45 + this.flareIntensity * 1.0;
      }
      if (this.starMesh) {
        (this.starMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.65 + this.flareIntensity * 1.5;
      }
    }

    // 5. Upward Drifting Embers Particles
    const pos = this.particlesMesh.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3 + 1] += delta * 0.25;
      if (pos[i * 3 + 1] > 1.8) {
        pos[i * 3 + 1] = 0.2;
      }
    }
    this.particlesMesh.geometry.attributes.position.needsUpdate = true;
    this.particlesMesh.rotation.y = elapsed * 0.15;

    // 6. Render
    this.renderer.render(this.scene, this.camera);
  };

  // --- Cleanup & Memory Disposal ---
  public dispose() {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
    }
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('resize', this.onResize);

    this.scene.clear();
    this.renderer.dispose();
  }
}
