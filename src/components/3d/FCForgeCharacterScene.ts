import * as THREE from 'three';

export interface CharacterSceneOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  modelPath?: string;
  onLoadComplete?: () => void;
  onError?: (err: any) => void;
}

export class FCForgeCharacterScene {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Scene Root Groups
  private playerGroup: THREE.Group;
  private stadiumGroup: THREE.Group;
  private proceduralMeshGroup?: THREE.Group;
  private loadedModel?: THREE.Object3D;
  private mixer?: THREE.AnimationMixer;

  // Environment Sub-objects
  private stadiumRing: THREE.Mesh;
  private pitchGrid: THREE.GridHelper;
  private floodLightBeams: THREE.Group;
  private trophyGroup: THREE.Group;
  private particleSystem: THREE.Points;
  private celebrationParticles: THREE.Points;
  private holographicBracket3D: THREE.Group;

  // Lighting
  private ambientLight: THREE.AmbientLight;
  private keySpotLight: THREE.SpotLight;
  private rimSpotLight: THREE.SpotLight;
  private trophySpotLight: THREE.SpotLight;

  // Camera Control Target state
  private targetCameraPos = new THREE.Vector3(0, 1.6, 6.0);
  private currentCameraPos = new THREE.Vector3(0, 1.6, 6.0);
  private targetLookAt = new THREE.Vector3(0, 0.2, 0);
  private currentLookAt = new THREE.Vector3(0, 0.2, 0);
  private targetFov = 45;

  // Mouse & Touch Parallax
  private mouseX = 0;
  private mouseY = 0;
  private targetMouseX = 0;
  private targetMouseY = 0;

  // Animation & Scroll State
  private scrollProgress: number = 0;
  private currentProgress: number = 0;
  private currentChapter: number = 0;
  private clock: THREE.Clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private isReducedMotion: boolean = false;
  private isMobile: boolean = false;

  constructor(options: CharacterSceneOptions) {
    this.container = options.container;
    this.canvas = options.canvas;

    this.isMobile = window.innerWidth < 768;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene & Fog Setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x05070A, 0.035);

    // 2. Camera Setup
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentLookAt);

    // 3. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isMobile,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.25 : 2));
    this.renderer.shadowMap.enabled = !this.isMobile;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    // 4. Lighting Setup
    this.ambientLight = new THREE.AmbientLight(0x101824, 1.8);
    this.scene.add(this.ambientLight);

    // Cyan Key Spotlight (Left Stadium Tower)
    this.keySpotLight = new THREE.SpotLight(0x00E5FF, 7);
    this.keySpotLight.position.set(-5, 8, 5);
    this.keySpotLight.angle = Math.PI / 3.5;
    this.keySpotLight.penumbra = 0.7;
    this.keySpotLight.castShadow = !this.isMobile;
    if (this.keySpotLight.shadow) {
      this.keySpotLight.shadow.mapSize.width = 1024;
      this.keySpotLight.shadow.mapSize.height = 1024;
      this.keySpotLight.shadow.bias = -0.0005;
    }
    this.scene.add(this.keySpotLight);

    // Green Rim Spotlight (Right Stadium Tower)
    this.rimSpotLight = new THREE.SpotLight(0x8CFF3D, 6);
    this.rimSpotLight.position.set(5, 7, -3);
    this.rimSpotLight.angle = Math.PI / 4;
    this.rimSpotLight.penumbra = 0.8;
    this.scene.add(this.rimSpotLight);

    // Gold Championship Spotlight (Overhead Center)
    this.trophySpotLight = new THREE.SpotLight(0xFFD700, 0);
    this.trophySpotLight.position.set(0, 9, 2);
    this.trophySpotLight.angle = Math.PI / 4;
    this.trophySpotLight.penumbra = 0.6;
    this.scene.add(this.trophySpotLight);

    // 5. Build Arena Environment & Stadium Components
    this.stadiumGroup = new THREE.Group();
    this.scene.add(this.stadiumGroup);

    this.pitchGrid = this.createPitchFloor();
    this.stadiumGroup.add(this.pitchGrid);

    this.stadiumRing = this.createStadiumHalo();
    this.stadiumGroup.add(this.stadiumRing);

    this.floodLightBeams = this.createFloodlightTowers();
    this.stadiumGroup.add(this.floodLightBeams);

    // 6. Player Root Group
    this.playerGroup = new THREE.Group();
    this.scene.add(this.playerGroup);

    // 7. Create Procedural Football Player Placeholder
    this.proceduralMeshGroup = this.createProceduralPlayer();
    this.playerGroup.add(this.proceduralMeshGroup);

    // 8. 3D Holographic Objects
    this.holographicBracket3D = this.create3DHolographicBracket();
    this.holographicBracket3D.position.set(0, 1.2, -2);
    this.holographicBracket3D.visible = false;
    this.scene.add(this.holographicBracket3D);

    // 9. Championship Trophy
    this.trophyGroup = this.createChampionshipTrophy();
    this.trophyGroup.position.set(0, 0.4, 0.8);
    this.trophyGroup.scale.set(0, 0, 0);
    this.scene.add(this.trophyGroup);

    // 10. Particle Systems
    this.particleSystem = this.createParticles(this.isMobile ? 140 : 350, 0x00E5FF, 0.04);
    this.scene.add(this.particleSystem);

    this.celebrationParticles = this.createParticles(this.isMobile ? 80 : 250, 0xFFD700, 0.06);
    this.celebrationParticles.visible = false;
    this.scene.add(this.celebrationParticles);

    // 11. Load External GLTF Model if specified
    if (options.modelPath) {
      this.loadExternalModel(options.modelPath, options.onLoadComplete, options.onError);
    } else if (options.onLoadComplete) {
      options.onLoadComplete();
    }

    // 12. Setup Event Listeners
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });

    // Start Main Render Loop
    this.animate();
  }

  // --- External GLTF Model Support ---
  public async loadExternalModel(path: string, onLoad?: () => void, onError?: (err: any) => void) {
    try {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const loader = new GLTFLoader();

      loader.load(
        path,
        (gltf) => {
          if (this.proceduralMeshGroup) {
            this.playerGroup.remove(this.proceduralMeshGroup);
          }
          this.loadedModel = gltf.scene;
          this.loadedModel.scale.set(1.1, 1.1, 1.1);
          this.loadedModel.position.set(0, -0.9, 0);

          // Enable shadow casting on character meshes
          this.loadedModel.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = !this.isMobile;
              child.receiveShadow = !this.isMobile;
            }
          });

          this.playerGroup.add(this.loadedModel);

          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.loadedModel);
            const action = this.mixer.clipAction(gltf.animations[0]);
            action.play();
          }

          if (onLoad) onLoad();
        },
        undefined,
        (err) => {
          console.warn('FCForge 3D: GLTF asset not found at path:', path, '. Using high-detail procedural player placeholder.', err);
          if (onError) onError(err);
        }
      );
    } catch (e) {
      console.warn('GLTFLoader module import fallback:', e);
    }
  }

  // --- Procedural High-Tech Football Esports Player ---
  private createProceduralPlayer(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, -0.7, 0);

    // Athletic Armor Torso with metallic gradient & glowing emissive trim
    const torsoGeo = new THREE.CylinderGeometry(0.44, 0.32, 1.15, 16);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x0B1016,
      roughness: 0.25,
      metalness: 0.8,
      emissive: 0x00E5FF,
      emissiveIntensity: 0.2
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);

    // Illuminated #10 FCForge Crest Plate
    const crestGeo = new THREE.PlaneGeometry(0.28, 0.28);
    const crestMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      side: THREE.DoubleSide
    });
    const crest = new THREE.Mesh(crestGeo, crestMat);
    crest.position.set(0, 1.2, 0.45);
    group.add(crest);

    // Futuristic Helmet Head & Cyber Visor
    const headGeo = new THREE.SphereGeometry(0.24, 24, 24);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x141E28,
      roughness: 0.2,
      metalness: 0.85
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.82;
    head.castShadow = true;
    group.add(head);

    // Glowing Cyan Cyber Visor
    const visorGeo = new THREE.BoxGeometry(0.34, 0.09, 0.26);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x8CFF3D });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.83, 0.12);
    group.add(visor);

    // Shoulders & Arms
    const armMat = new THREE.MeshStandardMaterial({ color: 0x0D141C, roughness: 0.4 });
    const shoulderGeo = new THREE.SphereGeometry(0.18, 12, 12);

    const leftShoulder = new THREE.Mesh(shoulderGeo, armMat);
    leftShoulder.position.set(-0.5, 1.45, 0);
    group.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, armMat);
    rightShoulder.position.set(0.5, 1.45, 0);
    group.add(rightShoulder);

    const armGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.78, 12);
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.55, 1.05, 0);
    leftArm.rotation.z = Math.PI / 14;
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.55, 1.05, 0);
    rightArm.rotation.z = -Math.PI / 14;
    rightArm.castShadow = true;
    group.add(rightArm);

    // Shorts, Legs & Football Cleats
    const shortsGeo = new THREE.CylinderGeometry(0.35, 0.38, 0.4, 16);
    const shortsMat = new THREE.MeshStandardMaterial({ color: 0x05070A, roughness: 0.6 });
    const shorts = new THREE.Mesh(shortsGeo, shortsMat);
    shorts.position.y = 0.48;
    group.add(shorts);

    const legGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.75, 12);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.5 });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.2, 0.15, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.2, 0.15, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // Cleats
    const cleatGeo = new THREE.BoxGeometry(0.14, 0.1, 0.28);
    const cleatMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
    const leftCleat = new THREE.Mesh(cleatGeo, cleatMat);
    leftCleat.position.set(-0.2, -0.25, 0.06);
    group.add(leftCleat);

    const rightCleat = new THREE.Mesh(cleatGeo, cleatMat);
    rightCleat.position.set(0.2, -0.25, 0.06);
    group.add(rightCleat);

    // Futuristic Holographic Soccer Ball (Hovering & Orbiting)
    const ballGeo = new THREE.IcosahedronGeometry(0.3, 2);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0x00E5FF,
      wireframe: true,
      emissive: 0x00E5FF,
      emissiveIntensity: 0.7
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(0.48, 0.15, 0.65);
    ball.name = 'soccerBall';
    group.add(ball);

    return group;
  }

  // --- Arena Floor Pitch & Penalty Grid Lines ---
  private createPitchFloor(): THREE.GridHelper {
    const grid = new THREE.GridHelper(24, 24, 0x00E5FF, 0x1D2933);
    grid.position.y = -0.7;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    return grid;
  }

  // --- Stadium Holographic Arena Halo ---
  private createStadiumHalo(): THREE.Mesh {
    const geo = new THREE.TorusGeometry(3.2, 0.04, 16, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.68;
    return ring;
  }

  // --- Floodlight Beams ---
  private createFloodlightTowers(): THREE.Group {
    const group = new THREE.Group();
    const cornerPositions = [
      [-6, -0.7, -6],
      [6, -0.7, -6],
      [-6, -0.7, 6],
      [6, -0.7, 6]
    ];

    const towerGeo = new THREE.CylinderGeometry(0.06, 0.1, 7, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x18222E, metalness: 0.9, roughness: 0.2 });

    cornerPositions.forEach(([x, y, z]) => {
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(x, y + 3.5, z);
      group.add(tower);

      // Top Floodlight Panel
      const panelGeo = new THREE.BoxGeometry(0.8, 0.4, 0.3);
      const panelMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(x, y + 7.1, z);
      group.add(panel);
    });

    return group;
  }

  // --- 3D Holographic Bracket Engine Nodes ---
  private create3DHolographicBracket(): THREE.Group {
    const group = new THREE.Group();

    // 4 Nodes connected by wireframe lines
    const nodePositions = [
      [-1.8, 0.8, 0],
      [-1.8, -0.4, 0],
      [0, 0.2, 0],
      [1.8, 0.2, 0]
    ];

    const nodeGeo = new THREE.BoxGeometry(0.8, 0.35, 0.1);
    const nodeMat = new THREE.MeshBasicMaterial({
      color: 0xFF6B35,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });

    nodePositions.forEach(([x, y, z]) => {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(x, y, z);
      group.add(node);
    });

    return group;
  }

  // --- Floating Championship Trophy ---
  private createChampionshipTrophy(): THREE.Group {
    const trophy = new THREE.Group();

    // Metallic Base Podium
    const baseGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.35, 16);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.95,
      roughness: 0.12,
      emissive: 0xFF6B35,
      emissiveIntensity: 0.25
    });
    const base = new THREE.Mesh(baseGeo, goldMat);
    trophy.add(base);

    // Cup Body
    const cupGeo = new THREE.ConeGeometry(0.55, 0.85, 16, 1, true);
    const cup = new THREE.Mesh(cupGeo, goldMat);
    cup.position.y = 0.6;
    cup.rotation.x = Math.PI;
    trophy.add(cup);

    // Crown Halo Ring
    const crownGeo = new THREE.TorusGeometry(0.5, 0.04, 12, 32);
    const crownMat = new THREE.MeshBasicMaterial({ color: 0xFF6B35 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 1.05;
    crown.rotation.x = Math.PI / 2;
    trophy.add(crown);

    return trophy;
  }

  // --- Atmospheric & Celebration Particle System ---
  private createParticles(count: number, colorHex: number, size: number): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 14;
      positions[i + 1] = Math.random() * 9 - 1;
      positions[i + 2] = (Math.random() - 0.5) * 14;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: size,
      color: colorHex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    return new THREE.Points(geometry, material);
  }

  // --- Scroll State Interpolation (Normalized progress: 0 -> 1) ---
  public setScrollProgress(progress: number) {
    this.scrollProgress = Math.max(0, Math.min(1, progress));
  }

  // --- Mouse & Touch Input handlers for subtle spatial Parallax ---
  private onMouseMove = (e: MouseEvent) => {
    this.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    this.targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  };

  private onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.targetMouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
      this.targetMouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
    }
  };

  // --- Main Cinematic Animation Loop ---
  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    if (this.mixer) {
      this.mixer.update(delta);
    }

    // Lerp progress smoothly
    this.currentProgress += (this.scrollProgress - this.currentProgress) * 0.07;
    const p = this.currentProgress;

    // Smooth Mouse Parallax Lerp
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    // Rotate ambient particles & stadium halo
    if (!this.isReducedMotion) {
      this.stadiumRing.rotation.z = elapsed * 0.15;
      this.particleSystem.rotation.y = elapsed * 0.04;

      const ball = this.playerGroup.getObjectByName('soccerBall');
      if (ball) {
        ball.rotation.y = elapsed * 1.6;
        ball.position.y = 0.15 + Math.sin(elapsed * 2.5) * 0.06;
      }
    }

    // Determine current chapter & map camera trajectory & environment poses
    this.updateChapterStoryboard(p, elapsed);

    // Apply Camera position lerp & Parallax offset
    if (!this.isReducedMotion) {
      const offsetX = this.mouseX * 0.35;
      const offsetY = -this.mouseY * 0.2;

      this.currentCameraPos.lerp(
        new THREE.Vector3(
          this.targetCameraPos.x + offsetX,
          this.targetCameraPos.y + offsetY,
          this.targetCameraPos.z
        ),
        0.07
      );

      this.currentLookAt.lerp(
        new THREE.Vector3(
          this.targetLookAt.x + offsetX * 0.5,
          this.targetLookAt.y,
          this.targetLookAt.z
        ),
        0.07
      );

      this.camera.position.copy(this.currentCameraPos);
      this.camera.lookAt(this.currentLookAt);

      if (Math.abs(this.camera.fov - this.targetFov) > 0.1) {
        this.camera.fov += (this.targetFov - this.camera.fov) * 0.05;
        this.camera.updateProjectionMatrix();
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  // --- Storyboard Chapter Trajectory Mapping ---
  private updateChapterStoryboard(p: number, elapsed: number) {
    if (p <= 0.14) {
      // CHAPTER 01 — ARRIVAL (The Arena Entrance)
      this.currentChapter = 1;
      this.targetCameraPos.set(0, 1.6, 6.0);
      this.targetLookAt.set(0, 0.2, 0);
      this.targetFov = 45;

      this.playerGroup.position.set(0, -0.6, 0);
      this.playerGroup.rotation.y = Math.sin(elapsed * 0.8) * 0.04;

      this.keySpotLight.color.setHex(0x00E5FF);
      this.keySpotLight.intensity = 7;
      this.rimSpotLight.color.setHex(0x8CFF3D);
      this.rimSpotLight.intensity = 6;
      this.trophySpotLight.intensity = 0;

      this.holographicBracket3D.visible = false;
      this.trophyGroup.scale.set(0, 0, 0);
      this.celebrationParticles.visible = false;

    } else if (p <= 0.28) {
      // CHAPTER 02 — CHARACTER REVEAL (Meet the Player)
      this.currentChapter = 2;
      const t = (p - 0.14) / 0.14;

      this.targetCameraPos.set(
        THREE.MathUtils.lerp(0, 0.4, t),
        THREE.MathUtils.lerp(1.6, 0.85, t),
        THREE.MathUtils.lerp(6.0, 3.1, t)
      );
      this.targetLookAt.set(0, 0.75, 0);
      this.targetFov = 42;

      this.playerGroup.position.set(0, -0.6, 0);
      this.playerGroup.rotation.y = THREE.MathUtils.lerp(0, 0.22, t);

      this.keySpotLight.intensity = 9;
      this.rimSpotLight.intensity = 8;
      this.rimSpotLight.color.setHex(0x00E5FF);

    } else if (p <= 0.44) {
      // CHAPTER 03 — GAME SELECTION (Choose Your Battlefield)
      this.currentChapter = 3;
      const t = (p - 0.28) / 0.16;

      this.targetCameraPos.set(
        THREE.MathUtils.lerp(0.4, 1.6, t),
        THREE.MathUtils.lerp(0.85, 1.2, t),
        THREE.MathUtils.lerp(3.1, 4.4, t)
      );
      this.targetLookAt.set(-0.5, 0.4, 0);
      this.targetFov = 46;

      this.playerGroup.position.x = THREE.MathUtils.lerp(0, -0.75, t);
      this.playerGroup.rotation.y = THREE.MathUtils.lerp(0.22, -0.55, t);

      this.keySpotLight.color.setHex(0x00E5FF);
      this.rimSpotLight.color.setHex(0x8CFF3D);

    } else if (p <= 0.60) {
      // CHAPTER 04 — TOURNAMENT PORTAL (Enter the Tournament)
      this.currentChapter = 4;
      const t = (p - 0.44) / 0.16;

      this.targetCameraPos.set(
        THREE.MathUtils.lerp(1.6, -1.8, t),
        THREE.MathUtils.lerp(1.2, 1.8, t),
        THREE.MathUtils.lerp(4.4, 4.6, t)
      );
      this.targetLookAt.set(0.4, 0.4, 0);
      this.targetFov = 45;

      this.playerGroup.position.x = THREE.MathUtils.lerp(-0.75, 0.75, t);
      this.playerGroup.rotation.y = THREE.MathUtils.lerp(-0.55, 0.6, t);

      this.keySpotLight.color.setHex(0x8CFF3D);
      this.rimSpotLight.color.setHex(0x00E5FF);

    } else if (p <= 0.76) {
      // CHAPTER 05 — COMPETITION (Holographic Match Engine)
      this.currentChapter = 5;
      const t = (p - 0.60) / 0.16;

      this.targetCameraPos.set(
        THREE.MathUtils.lerp(-1.8, 0, t),
        THREE.MathUtils.lerp(1.8, 2.2, t),
        THREE.MathUtils.lerp(4.6, 5.2, t)
      );
      this.targetLookAt.set(0, 0.3, 0);
      this.targetFov = 48;

      this.playerGroup.position.set(0, -0.5, 0);
      this.playerGroup.rotation.y = THREE.MathUtils.lerp(0.6, 0, t);

      this.holographicBracket3D.visible = true;
      this.holographicBracket3D.rotation.y = elapsed * 0.3;

      this.keySpotLight.color.setHex(0xFF6B35);
      this.rimSpotLight.color.setHex(0x00E5FF);

    } else if (p <= 0.88) {
      // CHAPTER 06 — GLOBAL RANKING (Climb the Leaderboards)
      this.currentChapter = 6;
      const t = (p - 0.76) / 0.12;

      this.targetCameraPos.set(
        THREE.MathUtils.lerp(0, -1.2, t),
        THREE.MathUtils.lerp(2.2, 1.5, t),
        THREE.MathUtils.lerp(5.2, 4.8, t)
      );
      this.targetLookAt.set(0.2, 0.5, 0);

      this.playerGroup.rotation.y = elapsed * 0.3;
      this.holographicBracket3D.visible = false;

      this.keySpotLight.color.setHex(0x00E5FF);
      this.rimSpotLight.color.setHex(0xFF6B35);

    } else {
      // CHAPTER 07 — CHAMPIONSHIP (Become the Champion)
      this.currentChapter = 7;
      const t = (p - 0.88) / 0.12;

      this.targetCameraPos.set(0, 1.1, 3.6);
      this.targetLookAt.set(0, 0.9, 0);
      this.targetFov = 42;

      this.playerGroup.position.set(0, -0.6, 0);
      this.playerGroup.rotation.y = 0;

      // Scale & Float Championship Trophy
      const trophyScale = THREE.MathUtils.lerp(0, 1.3, t);
      this.trophyGroup.scale.set(trophyScale, trophyScale, trophyScale);
      this.trophyGroup.rotation.y = elapsed * 0.45;

      this.trophySpotLight.intensity = 10;
      this.keySpotLight.color.setHex(0xFFD700);
      this.rimSpotLight.color.setHex(0xFF6B35);

      this.celebrationParticles.visible = true;
      this.celebrationParticles.rotation.y = elapsed * 0.1;
    }
  }

  // --- Window Resize & Responsive DPR Adjustment ---
  private onWindowResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.isMobile = width < 768;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.25 : 2));
  };

  // --- Public Chapter Status Getter ---
  public getCurrentChapter(): number {
    return this.currentChapter;
  }

  // --- Memory Disposal ---
  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchmove', this.onTouchMove);

    this.scene.clear();
    this.renderer.dispose();
  }
}
