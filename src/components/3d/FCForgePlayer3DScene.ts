import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface PlayerSceneOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  modelPath?: string;
  initialPosition?: [number, number, number];
  initialScale?: [number, number, number] | number;
  initialRotation?: [number, number, number];
  onLoadComplete?: () => void;
  onError?: (err: any) => void;
}

export class FCForgePlayer3DScene {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Root Groups
  private playerGroup: THREE.Group;
  private playerSubGroup: THREE.Group;
  private stadiumGroup: THREE.Group;
  private loadedModel?: THREE.Object3D;
  private proceduralPlayer?: THREE.Group;
  private mixer?: THREE.AnimationMixer;

  // Environment Elements
  private pitchDisc: THREE.Mesh;
  private pitchLinesGroup: THREE.Group;
  private contactShadowMesh: THREE.Mesh;
  private turfHaloRing: THREE.Mesh;
  private turfInnerGlow: THREE.Mesh;
  private ledRibbonMesh?: THREE.Mesh;
  private ledCanvasTexture?: THREE.CanvasTexture;
  private floodLightBeams: THREE.Group;
  private atmosphericParticles: THREE.Points;
  private celebrationParticles: THREE.Points;
  private holographicBracket3D: THREE.Group;
  private matchFootballMesh?: THREE.Group;
  private matchOrbitRing?: THREE.Mesh;
  private matchOrbitRingInner?: THREE.Mesh;
  private trophyGroup: THREE.Group;

  // Lights
  private ambientLight: THREE.AmbientLight;
  private keyLight: THREE.DirectionalLight;
  private cyanRimLight: THREE.SpotLight;
  private greenRimLight: THREE.SpotLight;
  private groundFootLight: THREE.PointLight;
  private overheadStadiumLight: THREE.DirectionalLight;
  private trophySpotLight: THREE.SpotLight;

  // Camera Target States (Desktop / Mobile responsive)
  private targetCameraPos = new THREE.Vector3(0.45, 1.4, 5.0);
  private currentCameraPos = new THREE.Vector3(0.45, 1.4, 5.0);
  private targetLookAt = new THREE.Vector3(0.45, 1.05, 0);
  private currentLookAt = new THREE.Vector3(0.45, 1.05, 0);
  private targetFov = 40;

  // Mouse & Touch Parallax
  private mouseX = 0;
  private mouseY = 0;
  private targetMouseX = 0;
  private targetMouseY = 0;

  // Scroll & Animation States
  private scrollProgress = 0;
  private currentProgress = 0;
  private targetChapterFloat = 1.0;
  private currentChapterFloat = 1.0;
  private currentChapter = 1;
  private clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private isMobile = false;
  private isReducedMotion = false;
  private isModelLoaded = false;
  private isDocumentVisible = true;

  // Scratch vectors for zero-allocation lerping in render loop
  private scratchCamTarget = new THREE.Vector3();
  private scratchLookTarget = new THREE.Vector3();

  // Model Placement Offsets
  private basePlayerX = 0.88;
  private basePlayerY = 0;
  private basePlayerZ = 0;

  // Interactive 3D Model Drag & 360° Rotation State
  private isPointerDown = false;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private userRotationY = 0;
  private targetUserRotationY = 0;
  private userRotationX = 0;
  private targetUserRotationX = 0;
  private dragVelocityX = 0;
  private dragVelocityY = 0;
  private lastInteractionTime = 0;

  constructor(options: PlayerSceneOptions) {
    this.container = options.container;
    this.canvas = options.canvas;

    this.isMobile = window.innerWidth < 768;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (this.isMobile) {
      this.basePlayerX = 0;
      this.targetCameraPos.set(0, 1.25, 5.6);
      this.currentCameraPos.set(0, 1.25, 5.6);
      this.targetLookAt.set(0, 0.95, 0);
      this.currentLookAt.set(0, 0.95, 0);
      this.targetFov = 44;
    }

    // 1. Scene & Fog Setup (Harmonized with DESIGN.md canvas #161311)
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x161311, 0.035);

    // 2. Camera Setup
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;

    this.camera = new THREE.PerspectiveCamera(this.targetFov, aspect, 0.1, 100);
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentLookAt);

    // 3. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isMobile,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.0 : 1.5));
    this.renderer.shadowMap.enabled = !this.isMobile;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 4. Cinematic Warm Esports Lighting Setup (DESIGN.md)
    this.ambientLight = new THREE.AmbientLight(0x231F1C, 1.4);
    this.scene.add(this.ambientLight);

    // Key Light from front-left (Warm off-white #F8F5EE)
    this.keyLight = new THREE.DirectionalLight(0xF8F5EE, 4.4);
    this.keyLight.position.set(-4, 7, 5.5);
    this.keyLight.castShadow = !this.isMobile;
    if (this.keyLight.shadow) {
      this.keyLight.shadow.mapSize.width = 512;
      this.keyLight.shadow.mapSize.height = 512;
      this.keyLight.shadow.camera.near = 1;
      this.keyLight.shadow.camera.far = 20;
      this.keyLight.shadow.camera.left = -4;
      this.keyLight.shadow.camera.right = 4;
      this.keyLight.shadow.camera.top = 4;
      this.keyLight.shadow.camera.bottom = -2;
      this.keyLight.shadow.bias = -0.0004;
    }
    this.scene.add(this.keyLight);

    // Golden Rim Light behind player right (#E5B869 - matches Messi athletic gold)
    this.cyanRimLight = new THREE.SpotLight(0xE5B869, 13);
    this.cyanRimLight.position.set(4.8, 5.0, -3.5);
    this.cyanRimLight.angle = Math.PI / 3.8;
    this.cyanRimLight.penumbra = 0.65;
    this.scene.add(this.cyanRimLight);

    // Clean Off-White Rim Light behind player left (#F7F5F0)
    this.greenRimLight = new THREE.SpotLight(0xF7F5F0, 10);
    this.greenRimLight.position.set(-4.5, 4.4, -3.0);
    this.greenRimLight.angle = Math.PI / 4;
    this.greenRimLight.penumbra = 0.75;
    this.scene.add(this.greenRimLight);

    // Upward Ground Foot Bounce Light (Warm Gold)
    this.groundFootLight = new THREE.PointLight(0xE5B869, 3.2, 5.0, 2.0);
    this.groundFootLight.position.set(this.basePlayerX, 0.2, 0.4);
    this.scene.add(this.groundFootLight);

    // Overhead Stadium Atmosphere Fill Light
    this.overheadStadiumLight = new THREE.DirectionalLight(0x28231F, 1.1);
    this.overheadStadiumLight.position.set(0, 10, -2);
    this.scene.add(this.overheadStadiumLight);

    // Trophy Spotlight (starts off, active in Chapter 7)
    this.trophySpotLight = new THREE.SpotLight(0xFFD700, 0);
    this.trophySpotLight.position.set(0, 9, 2);
    this.trophySpotLight.angle = Math.PI / 4;
    this.trophySpotLight.penumbra = 0.6;
    this.scene.add(this.trophySpotLight);

    // 5. Stadium & Environment Geometry
    this.stadiumGroup = new THREE.Group();
    this.scene.add(this.stadiumGroup);

    // 5A. Pitch Surface
    this.pitchDisc = this.createPitchDisc();
    this.stadiumGroup.add(this.pitchDisc);

    // 5B. Pitch Markings
    this.pitchLinesGroup = this.createPitchLines();
    this.stadiumGroup.add(this.pitchLinesGroup);

    // 5C. Soft Contact Shadow Mesh directly under player
    this.contactShadowMesh = this.createContactShadow();
    this.contactShadowMesh.position.set(this.basePlayerX, 0.002, 0);
    this.stadiumGroup.add(this.contactShadowMesh);

    // 5D. Dynamic Holographic Turf Halo Rings
    const haloObj = this.createTurfHalo();
    this.turfHaloRing = haloObj.outerRing;
    this.turfInnerGlow = haloObj.innerGlow;
    this.turfHaloRing.position.set(this.basePlayerX, 0.004, 0);
    this.turfInnerGlow.position.set(this.basePlayerX, 0.003, 0);
    this.stadiumGroup.add(this.turfHaloRing);
    this.stadiumGroup.add(this.turfInnerGlow);

    // 5E. Distant LED Perimeter Ribbon with Scrolling Branding
    this.createLedRibbon();

    // 5F. Stadium Floodlight Towers with Volumetric Light Shafts
    this.floodLightBeams = this.createFloodlightBeams();
    this.stadiumGroup.add(this.floodLightBeams);

    // 5G. Distant Grandstand Architecture Silhouette
    const grandstand = this.createGrandstandSilhouette();
    this.stadiumGroup.add(grandstand);

    // 6. Player Root Group Hierarchy
    this.playerGroup = new THREE.Group();
    this.playerGroup.position.set(this.basePlayerX, this.basePlayerY, this.basePlayerZ);
    this.scene.add(this.playerGroup);

    this.playerSubGroup = new THREE.Group();
    this.playerGroup.add(this.playerSubGroup);

    // Initial procedural player placeholder (removed once GLB finishes loading)
    this.proceduralPlayer = this.createProceduralPlayer();
    this.playerSubGroup.add(this.proceduralPlayer);

    // 7. Interactive 3D Match Football & Holographic HUD (Chapter 5)
    this.holographicBracket3D = this.create3DHolographicBracket();
    this.holographicBracket3D.position.set(this.basePlayerX + 0.42, 0.22, 0.32);
    this.holographicBracket3D.visible = true;
    this.scene.add(this.holographicBracket3D);

    // 8. Championship Trophy (Chapter 7)
    this.trophyGroup = this.createChampionshipTrophy();
    this.trophyGroup.position.set(0, 0.4, 0.8);
    this.trophyGroup.scale.set(0, 0, 0);
    this.scene.add(this.trophyGroup);

    // 9. Sparse Night Stadium Particles & Celebration Streamers
    this.atmosphericParticles = this.createAtmosphericParticles(this.isMobile ? 120 : 220);
    this.scene.add(this.atmosphericParticles);

    this.celebrationParticles = this.createCelebrationParticles(this.isMobile ? 80 : 250);
    this.celebrationParticles.visible = false;
    this.scene.add(this.celebrationParticles);

    // 10. Load GLB Model
    const modelToLoad = options.modelPath || '/messimodel.glb';
    this.loadGLBModel(modelToLoad, options.onLoadComplete, options.onError);

    // 11. Event Listeners
    window.addEventListener('resize', this.onWindowResize, { passive: true });
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibilityChange, { passive: true });

    // Direct Pointer Drag-to-Rotate Listeners
    window.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerup', this.onPointerUp, { passive: true });
    window.addEventListener('pointercancel', this.onPointerUp, { passive: true });

    // Custom events for preset angle buttons and drag bridge
    window.addEventListener('fcforge:set-player-angle', ((e: CustomEvent) => {
      if (typeof e.detail?.angle === 'number') {
        this.setPlayerAngle(e.detail.angle, e.detail.pitch || 0);
      }
    }) as EventListener);

    window.addEventListener('fcforge:rotate-player-delta', ((e: CustomEvent) => {
      if (typeof e.detail?.dx === 'number') {
        this.rotatePlayerBy(e.detail.dx, e.detail.dy || 0);
      }
    }) as EventListener);

    // Start Animation Loop
    this.animate();
  }

  // --- GLTF Loader & Auto-Normalization Engine ---
  public async loadGLBModel(path: string, onLoad?: () => void, onError?: (err: any) => void) {
    try {
      console.log('[GLTF] Starting load for path:', path);
      const loader = new GLTFLoader();

      loader.load(
        path,
        (gltf) => {
          console.log('[GLTF SUCCESS] Model parsed, starting scene integration...');
          // Remove temporary procedural placeholder
          if (this.proceduralPlayer) {
            this.playerSubGroup.remove(this.proceduralPlayer);
            this.proceduralPlayer = undefined;
          }

          const model = gltf.scene;

          // 1. Calculate Bounding Box & Dimensions
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          // 2. Normalize height so player has majestic presence (~2.2 world units)
          const targetHeight = 2.2;
          const scaleFactor = targetHeight / (size.y || 1);
          model.scale.setScalar(scaleFactor);

          // 3. Position model so feet stand on ground plane y = 0 exactly
          // and horizontal center is at (0, 0)
          model.position.x = -center.x * scaleFactor;
          model.position.y = -box.min.y * scaleFactor;
          model.position.z = -center.z * scaleFactor;

          // 4. Material & Texture Enhancements for High-End Esports Sheen
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = !this.isMobile;
              mesh.receiveShadow = !this.isMobile;

              if (mesh.material) {
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((mat) => {
                  if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                    // Ensure color space is correct
                    if (mat.map) {
                      mat.map.colorSpace = THREE.SRGBColorSpace;
                      mat.map.needsUpdate = true;
                    }
                    if (mat.normalMap) {
                      mat.normalScale.set(1.1, 1.1);
                    }
                    // Enhance specular highlights under spotlights
                    mat.roughness = Math.max(0.32, mat.roughness ?? 0.45);
                    mat.metalness = Math.min(0.7, Math.max(0.15, mat.metalness ?? 0.3));
                    mat.needsUpdate = true;
                  }
                });
              }
            }
          });

          this.loadedModel = model;
          this.playerSubGroup.add(this.loadedModel);

          // 5. Animation Clips Check
          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.loadedModel);
            const action = this.mixer.clipAction(gltf.animations[0]);
            action.play();
          }

          this.isModelLoaded = true;
          console.log('[GLTF READY] Model successfully added to playerSubGroup!');
          window.dispatchEvent(new CustomEvent('fcforge:model-loaded'));

          if (onLoad) onLoad();
        },
        (xhr) => {
          if (xhr.total > 0) {
            const pct = Math.min(100, Math.round((xhr.loaded / xhr.total) * 100));
            window.dispatchEvent(new CustomEvent('fcforge:model-progress', {
              detail: { percent: pct, loaded: xhr.loaded, total: xhr.total }
            }));
          }
        },
        (err) => {
          console.error('[GLTF ERROR] Load error for path:', path, err);
          if (onError) onError(err);
        }
      );
    } catch (err) {
      console.error('[GLTF FATAL] Loader exception:', err);
      if (onError) onError(err);
    }
  }

  // --- Pitch Floor Disc ---
  private createPitchDisc(): THREE.Mesh {
    const geo = new THREE.CircleGeometry(22, 64);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x05090D,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const pitch = new THREE.Mesh(geo, mat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = 0;
    pitch.receiveShadow = !this.isMobile;
    return pitch;
  }

  // --- Pitch Markings & Glowing Boundary Lines ---
  private createPitchLines(): THREE.Group {
    const group = new THREE.Group();

    // Center Circle Line
    const centerCircleGeo = new THREE.RingGeometry(2.8, 2.84, 64);
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    const centerCircle = new THREE.Mesh(centerCircleGeo, lineMat);
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.y = 0.001;
    group.add(centerCircle);

    // Halfway Line
    const lineGeo = new THREE.PlaneGeometry(16, 0.04);
    const halfwayLine = new THREE.Mesh(lineGeo, lineMat);
    halfwayLine.rotation.x = -Math.PI / 2;
    halfwayLine.position.set(0, 0.001, 0);
    group.add(halfwayLine);

    // Subtle Penalty Area Lines
    const penaltyArcGeo = new THREE.RingGeometry(4.8, 4.84, 32, 1, 0, Math.PI);
    const greenLineMat = new THREE.MeshBasicMaterial({
      color: 0x8CFF3D,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25
    });
    const penaltyArc = new THREE.Mesh(penaltyArcGeo, greenLineMat);
    penaltyArc.rotation.x = -Math.PI / 2;
    penaltyArc.rotation.z = Math.PI / 2;
    penaltyArc.position.set(0, 0.001, -3);
    group.add(penaltyArc);

    return group;
  }

  // --- Soft Contact Shadow Texture & Mesh ---
  private createContactShadow(): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0.7)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    const geo = new THREE.PlaneGeometry(2.4, 2.4);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  // --- Dynamic Holographic Turf Halo Rings ---
  private createTurfHalo(): { outerRing: THREE.Mesh; innerGlow: THREE.Mesh } {
    // Outer rotating glowing segment ring
    const ringGeo = new THREE.RingGeometry(1.4, 1.44, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const outerRing = new THREE.Mesh(ringGeo, ringMat);
    outerRing.rotation.x = -Math.PI / 2;

    // Inner subtle glow disc
    const innerCanvas = document.createElement('canvas');
    innerCanvas.width = 128;
    innerCanvas.height = 128;
    const ctx = innerCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 5, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0.45)');
    grad.addColorStop(0.5, 'rgba(0, 229, 255, 0.15)');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const innerTexture = new THREE.CanvasTexture(innerCanvas);
    const innerGeo = new THREE.PlaneGeometry(2.8, 2.8);
    const innerMat = new THREE.MeshBasicMaterial({
      map: innerTexture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });
    const innerGlow = new THREE.Mesh(innerGeo, innerMat);
    innerGlow.rotation.x = -Math.PI / 2;

    return { outerRing, innerGlow };
  }

  // --- Distant LED Perimeter Ribbon with Animated Esports Branding ---
  private createLedRibbon() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Dark carbon background
    ctx.fillStyle = '#060B12';
    ctx.fillRect(0, 0, 2048, 128);

    // Glowing borders
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 2048, 128);

    // Esports ticker text
    ctx.font = 'bold 36px "Chakra Petch", sans-serif';
    ctx.fillStyle = '#00E5FF';
    ctx.textBaseline = 'middle';

    const text = '★ FCFORGE ESPORTS ARENA ★ eFOOTBALL™ MOBILE ★ EA SPORTS FC™ MOBILE ★ GLOBAL CHAMPIONSHIP CUP $50,000 ★ LIVE ARENA ★ ';
    for (let x = 0; x < 2048; x += 1100) {
      ctx.fillText(text, x, 64);
    }

    this.ledCanvasTexture = new THREE.CanvasTexture(canvas);
    this.ledCanvasTexture.wrapS = THREE.RepeatWrapping;
    this.ledCanvasTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.ledCanvasTexture.repeat.set(2, 1);

    const ribbonGeo = new THREE.CylinderGeometry(18, 18, 1.2, 48, 1, true, 0, Math.PI);
    const ribbonMat = new THREE.MeshBasicMaterial({
      map: this.ledCanvasTexture,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.85
    });

    this.ledRibbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    this.ledRibbonMesh.position.set(0, 1.2, 0);
    this.stadiumGroup.add(this.ledRibbonMesh);
  }

  // --- Stadium Floodlight Towers with Volumetric Conical Light Shafts ---
  private createFloodlightBeams(): THREE.Group {
    const group = new THREE.Group();
    const cornerPositions = [
      [-9, 0, -8],
      [9, 0, -8],
      [-10, 0, 7],
      [10, 0, 7]
    ];

    const towerGeo = new THREE.CylinderGeometry(0.08, 0.16, 9, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x111922, metalness: 0.85, roughness: 0.25 });

    cornerPositions.forEach(([x, , z]) => {
      // Physical Tower Structure
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(x, 4.5, z);
      group.add(tower);

      // Top Floodlight Head Box
      const headGeo = new THREE.BoxGeometry(1.2, 0.6, 0.4);
      const headMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(x, 9.1, z);
      head.lookAt(0, 1, 0);
      group.add(head);

      // Volumetric Conical Light Shaft
      const coneGeo = new THREE.ConeGeometry(2.4, 12, 16, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0x00E5FF,
        transparent: true,
        opacity: this.isMobile ? 0.04 : 0.08,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const beam = new THREE.Mesh(coneGeo, coneMat);
      beam.position.set(x, 4.5, z);
      beam.lookAt(0, 0.8, 0);
      beam.rotateX(Math.PI / 2);
      group.add(beam);
    });

    return group;
  }

  // --- Distant Grandstand Architecture Silhouette ---
  private createGrandstandSilhouette(): THREE.Group {
    const group = new THREE.Group();
    // Tiered stadium ring silhouette
    for (let i = 1; i <= 3; i++) {
      const tierGeo = new THREE.CylinderGeometry(20 + i * 2.5, 20 + i * 2.5, 0.8, 36, 1, true, 0, Math.PI);
      const tierMat = new THREE.MeshBasicMaterial({
        color: 0x081018,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.6 - i * 0.15
      });
      const tier = new THREE.Mesh(tierGeo, tierMat);
      tier.position.set(0, i * 1.0, 0);
      group.add(tier);
    }
    return group;
  }

  // --- Procedural High-Detail Player (Used before GLB finishes loading) ---
  private createProceduralPlayer(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, 0, 0);

    // Torso with armor kit
    const torsoGeo = new THREE.CylinderGeometry(0.44, 0.32, 1.15, 16);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x0B1016,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x00E5FF,
      emissiveIntensity: 0.25
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    group.add(torso);

    // Crest #10
    const crestGeo = new THREE.PlaneGeometry(0.28, 0.28);
    const crestMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, side: THREE.DoubleSide });
    const crest = new THREE.Mesh(crestGeo, crestMat);
    crest.position.set(0, 1.2, 0.45);
    group.add(crest);

    // Head & Cyber Visor
    const headGeo = new THREE.SphereGeometry(0.24, 24, 24);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x141E28, roughness: 0.25, metalness: 0.85 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.82;
    head.castShadow = true;
    group.add(head);

    const visorGeo = new THREE.BoxGeometry(0.34, 0.09, 0.26);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x8CFF3D });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.83, 0.12);
    group.add(visor);

    // Legs & Cleats
    const legGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.78, 12);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.5 });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.2, 0.39, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.2, 0.39, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // Boots
    const cleatGeo = new THREE.BoxGeometry(0.14, 0.1, 0.28);
    const cleatMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
    const leftCleat = new THREE.Mesh(cleatGeo, cleatMat);
    leftCleat.position.set(-0.2, 0.05, 0.06);
    group.add(leftCleat);

    const rightCleat = new THREE.Mesh(cleatGeo, cleatMat);
    rightCleat.position.set(0.2, 0.05, 0.06);
    group.add(rightCleat);

    return group;
  }

  // --- 3D Match Football & Holographic Telemetry HUD (Chapter 5) ---
  private create3DHolographicBracket(): THREE.Group {
    const rootGroup = new THREE.Group();

    // 1. Math coordinates for truncated icosahedron (12 pentagons, 20 hexagons, 60 vertices)
    const phi = (1 + Math.sqrt(5)) / 2;
    const rawVerts: number[][] = [];
    const addPerms = (a: number, b: number, c: number) => {
      const perms = [[a, b, c], [b, c, a], [c, a, b]];
      for (const [x, y, z] of perms) {
        for (const sx of (x === 0 ? [0] : [-1, 1])) {
          for (const sy of (y === 0 ? [0] : [-1, 1])) {
            for (const sz of (z === 0 ? [0] : [-1, 1])) {
              const pt = [sx * Math.abs(x), sy * Math.abs(y), sz * Math.abs(z)];
              if (!rawVerts.some(v => Math.hypot(v[0] - pt[0], v[1] - pt[1], v[2] - pt[2]) < 1e-4)) {
                rawVerts.push(pt);
              }
            }
          }
        }
      }
    };
    addPerms(0, 1, 3 * phi);
    addPerms(2, 1 + 2 * phi, phi);
    addPerms(1, 2 + phi, 2 * phi);

    const adj: number[][] = Array.from({ length: 60 }, () => []);
    for (let i = 0; i < 60; i++) {
      for (let j = i + 1; j < 60; j++) {
        const d = Math.hypot(rawVerts[i][0] - rawVerts[j][0], rawVerts[i][1] - rawVerts[j][1], rawVerts[i][2] - rawVerts[j][2]);
        if (Math.abs(d - 2) < 1e-3) {
          adj[i].push(j);
          adj[j].push(i);
        }
      }
    }

    const orderCycle = (cycle: number[]) => {
      const ordered = [cycle[0]];
      const rem = new Set(cycle.slice(1));
      while (rem.size > 0) {
        const curr = ordered[ordered.length - 1];
        let next: number | null = null;
        for (const cand of rem) {
          if (adj[curr].includes(cand)) {
            next = cand;
            break;
          }
        }
        if (next !== null) {
          ordered.push(next);
          rem.delete(next);
        } else {
          break;
        }
      }
      const N = cycle.length;
      const cx = ordered.reduce((s, idx) => s + rawVerts[idx][0], 0) / N;
      const cy = ordered.reduce((s, idx) => s + rawVerts[idx][1], 0) / N;
      const cz = ordered.reduce((s, idx) => s + rawVerts[idx][2], 0) / N;
      const v0 = rawVerts[ordered[0]], v1 = rawVerts[ordered[1]];
      const e0 = [v0[0] - cx, v0[1] - cy, v0[2] - cz];
      const e1 = [v1[0] - cx, v1[1] - cy, v1[2] - cz];
      const cross = [
        e0[1] * e1[2] - e0[2] * e1[1],
        e0[2] * e1[0] - e0[0] * e1[2],
        e0[0] * e1[1] - e0[1] * e1[0]
      ];
      const dot = cross[0] * cx + cross[1] * cy + cross[2] * cz;
      if (dot < 0) ordered.reverse();
      return ordered;
    };

    const pentagons: number[][] = [];
    const seenPent = new Set<string>();
    for (let i = 0; i < 60; i++) {
      for (const j of adj[i]) {
        for (const k of adj[j]) {
          if (k === i) continue;
          for (const l of adj[k]) {
            if (l === j || l === i) continue;
            for (const m of adj[l]) {
              if (m === k || m === j || m === i) continue;
              if (adj[m].includes(i)) {
                const cycle = [i, j, k, l, m];
                const sorted = [...cycle].sort((a, b) => a - b).join(',');
                if (!seenPent.has(sorted)) {
                  seenPent.add(sorted);
                  pentagons.push(orderCycle(cycle));
                }
              }
            }
          }
        }
      }
    }

    const hexagons: number[][] = [];
    const seenHex = new Set<string>();
    for (let i = 0; i < 60; i++) {
      for (const j of adj[i]) {
        for (const k of adj[j]) {
          if (k === i) continue;
          for (const l of adj[k]) {
            if (l === j || l === i) continue;
            for (const m of adj[l]) {
              if (m === k || m === j || m === i) continue;
              for (const n of adj[m]) {
                if (n === l || n === k || n === j || n === i) continue;
                if (adj[n].includes(i)) {
                  const cycle = [i, j, k, l, m, n];
                  const cx = cycle.reduce((s, idx) => s + rawVerts[idx][0], 0) / 6;
                  const cy = cycle.reduce((s, idx) => s + rawVerts[idx][1], 0) / 6;
                  const cz = cycle.reduce((s, idx) => s + rawVerts[idx][2], 0) / 6;
                  if (Math.hypot(cx, cy, cz) < 4.6) {
                    const sorted = [...cycle].sort((a, b) => a - b).join(',');
                    if (!seenHex.has(sorted)) {
                      seenHex.add(sorted);
                      hexagons.push(orderCycle(cycle));
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    const radius = 0.26;
    const insetFactor = 0.052;
    const puffFactor = 1.028;

    const buildPanelGeometry = (faces: number[][]) => {
      const positions: number[] = [];
      for (const face of faces) {
        const N = face.length;
        let cx = 0, cy = 0, cz = 0;
        for (const idx of face) {
          cx += rawVerts[idx][0];
          cy += rawVerts[idx][1];
          cz += rawVerts[idx][2];
        }
        const cNorm = Math.hypot(cx, cy, cz);
        const cUnit = [cx / cNorm, cy / cNorm, cz / cNorm];
        const cPuff = [
          cUnit[0] * radius * puffFactor,
          cUnit[1] * radius * puffFactor,
          cUnit[2] * radius * puffFactor
        ];

        const insets: number[][] = [];
        const baseInsets: number[][] = [];
        for (let k = 0; k < N; k++) {
          const v = rawVerts[face[k]];
          const vNorm = Math.hypot(...v);
          const vUnit = [v[0] / vNorm, v[1] / vNorm, v[2] / vNorm];
          const ix = (vUnit[0] * (1 - insetFactor) + cUnit[0] * insetFactor) * radius;
          const iy = (vUnit[1] * (1 - insetFactor) + cUnit[1] * insetFactor) * radius;
          const iz = (vUnit[2] * (1 - insetFactor) + cUnit[2] * insetFactor) * radius;
          insets.push([ix, iy, iz]);
          baseInsets.push([
            vUnit[0] * radius * 0.984,
            vUnit[1] * radius * 0.984,
            vUnit[2] * radius * 0.984
          ]);
        }

        for (let k = 0; k < N; k++) {
          const next = (k + 1) % N;
          // Top cushion triangle
          positions.push(...cPuff, ...insets[k], ...insets[next]);
          // Side bevels descending into the recessed seam channel
          positions.push(...insets[k], ...baseInsets[k], ...baseInsets[next]);
          positions.push(...insets[k], ...baseInsets[next], ...insets[next]);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.computeVertexNormals();
      return geo;
    };

    // 2. Football Mesh Assembly
    const footballGroup = new THREE.Group();

    // 2A. Recessed Dark Seam Core Sphere
    const coreGeo = new THREE.SphereGeometry(radius * 0.982, 32, 24);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0A0B0E,
      roughness: 0.92,
      metalness: 0.05
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    footballGroup.add(coreMesh);

    // 2B. Pentagon Panels (Midnight Obsidian Carbon)
    const pentGeo = buildPanelGeometry(pentagons);
    const pentMat = new THREE.MeshStandardMaterial({
      color: 0x14161C,
      roughness: 0.28,
      metalness: 0.25
    });
    const pentMesh = new THREE.Mesh(pentGeo, pentMat);
    pentMesh.castShadow = true;
    footballGroup.add(pentMesh);

    // 2C. Hexagon Panels (Pearl White Luxury Leather)
    const hexGeo = buildPanelGeometry(hexagons);
    const hexMat = new THREE.MeshStandardMaterial({
      color: 0xF7F8FA,
      roughness: 0.24,
      metalness: 0.12
    });
    const hexMesh = new THREE.Mesh(hexGeo, hexMat);
    hexMesh.castShadow = true;
    footballGroup.add(hexMesh);

    // 2D. Gold Insignia on Equator Pentagons (FCForge Championship Accent)
    const goldCrestPositions: number[] = [];
    for (let pIdx = 0; pIdx < Math.min(4, pentagons.length); pIdx++) {
      const face = pentagons[pIdx];
      let cx = 0, cy = 0, cz = 0;
      for (const idx of face) {
        cx += rawVerts[idx][0];
        cy += rawVerts[idx][1];
        cz += rawVerts[idx][2];
      }
      const cNorm = Math.hypot(cx, cy, cz);
      const cUnit = [cx / cNorm, cy / cNorm, cz / cNorm];
      const crestPuff = [cUnit[0] * radius * 1.032, cUnit[1] * radius * 1.032, cUnit[2] * radius * 1.032];
      for (let k = 0; k < 5; k++) {
        const next = (k + 1) % 5;
        const v1 = rawVerts[face[k]], v2 = rawVerts[face[next]];
        const v1Norm = Math.hypot(...v1), v2Norm = Math.hypot(...v2);
        const p1 = [
          (v1[0] / v1Norm * 0.42 + cUnit[0] * 0.58) * radius * 1.03,
          (v1[1] / v1Norm * 0.42 + cUnit[1] * 0.58) * radius * 1.03,
          (v1[2] / v1Norm * 0.42 + cUnit[2] * 0.58) * radius * 1.03
        ];
        const p2 = [
          (v2[0] / v2Norm * 0.42 + cUnit[0] * 0.58) * radius * 1.03,
          (v2[1] / v2Norm * 0.42 + cUnit[1] * 0.58) * radius * 1.03,
          (v2[2] / v2Norm * 0.42 + cUnit[2] * 0.58) * radius * 1.03
        ];
        goldCrestPositions.push(...crestPuff, ...p1, ...p2);
      }
    }
    const goldCrestGeo = new THREE.BufferGeometry();
    goldCrestGeo.setAttribute('position', new THREE.Float32BufferAttribute(goldCrestPositions, 3));
    goldCrestGeo.computeVertexNormals();
    const goldCrestMat = new THREE.MeshStandardMaterial({
      color: 0xE5B869,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x332200,
      emissiveIntensity: 0.25
    });
    const goldCrestMesh = new THREE.Mesh(goldCrestGeo, goldCrestMat);
    footballGroup.add(goldCrestMesh);

    this.matchFootballMesh = footballGroup;
    rootGroup.add(footballGroup);

    // 3. Holographic Bracket Telemetry Orbit Rings (Active during Chapter 5)
    const hudGroup = new THREE.Group();

    // 3A. Outer Gold Gimbal Orbit Ring
    const outerRingGeo = new THREE.TorusGeometry(radius * 1.48, 0.0032, 16, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xE5B869,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    this.matchOrbitRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    this.matchOrbitRing.rotation.x = Math.PI / 3;
    hudGroup.add(this.matchOrbitRing);

    // 3B. Inner Cyan Telemetry Ring
    const innerRingGeo = new THREE.TorusGeometry(radius * 1.30, 0.0022, 16, 64);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    this.matchOrbitRingInner = new THREE.Mesh(innerRingGeo, innerRingMat);
    this.matchOrbitRingInner.rotation.y = Math.PI / 4;
    hudGroup.add(this.matchOrbitRingInner);

    // 3C. Holographic Corner Bracket Reticles (Replacing wireframe box with precision telemetry)
    const cornerMat = new THREE.LineBasicMaterial({
      color: 0xE5B869,
      transparent: true,
      opacity: 0.75
    });
    const bracketSize = radius * 1.5;
    const cornerArm = 0.08;
    const corners = [
      [-bracketSize, -bracketSize],
      [bracketSize, -bracketSize],
      [bracketSize, bracketSize],
      [-bracketSize, bracketSize]
    ];
    corners.forEach(([cx, cy]) => {
      const sx = cx > 0 ? -1 : 1;
      const sy = cy > 0 ? -1 : 1;
      const pts = [
        new THREE.Vector3(cx + sx * cornerArm, cy, 0),
        new THREE.Vector3(cx, cy, 0),
        new THREE.Vector3(cx, cy + sy * cornerArm, 0)
      ];
      const cornerGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const cornerLine = new THREE.Line(cornerGeo, cornerMat);
      hudGroup.add(cornerLine);
    });

    // 3D. Warm Ambient Telemetry Beacon Light
    const beaconLight = new THREE.PointLight(0xE5B869, 1.2, 2.5);
    beaconLight.position.set(0, 0, 0.2);
    hudGroup.add(beaconLight);

    rootGroup.add(hudGroup);
    return rootGroup;
  }

  // --- Championship Trophy (Chapter 7) ---
  private createChampionshipTrophy(): THREE.Group {
    const trophy = new THREE.Group();

    // 1. Heavy Obsidian Marble Base with Metallic Gold Trim
    const baseBottomGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.16, 32);
    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x12100E,
      roughness: 0.2,
      metalness: 0.85,
    });
    const baseBottom = new THREE.Mesh(baseBottomGeo, obsidianMat);
    baseBottom.position.y = -0.55;
    trophy.add(baseBottom);

    const baseGoldGeo = new THREE.CylinderGeometry(0.36, 0.42, 0.1, 32);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xE5B869,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x553300,
      emissiveIntensity: 0.2
    });
    const baseGold = new THREE.Mesh(baseGoldGeo, goldMat);
    baseGold.position.y = -0.42;
    trophy.add(baseGold);

    // Front Gold Plaque / Engraved Badge
    const plaqueGeo = new THREE.BoxGeometry(0.22, 0.08, 0.02);
    const plaqueMat = new THREE.MeshStandardMaterial({
      color: 0xFFF5D0,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xE5B869,
      emissiveIntensity: 0.3
    });
    const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaque.position.set(0, -0.42, 0.38);
    trophy.add(plaque);

    // 2. Sculpted Metallic Stem
    const stemGeo = new THREE.CylinderGeometry(0.1, 0.2, 0.35, 24);
    const stem = new THREE.Mesh(stemGeo, goldMat);
    stem.position.y = -0.2;
    trophy.add(stem);

    const stemRingGeo = new THREE.TorusGeometry(0.16, 0.035, 16, 32);
    const stemRing = new THREE.Mesh(stemRingGeo, goldMat);
    stemRing.position.y = -0.08;
    stemRing.rotation.x = Math.PI / 2;
    trophy.add(stemRing);

    // 3. Flared Golden Cup Bowl (Lathe Geometry for realistic trophy curve)
    const points: THREE.Vector2[] = [];
    points.push(new THREE.Vector2(0.06, 0.0));
    points.push(new THREE.Vector2(0.14, 0.12));
    points.push(new THREE.Vector2(0.28, 0.32));
    points.push(new THREE.Vector2(0.42, 0.58));
    points.push(new THREE.Vector2(0.40, 0.60));
    points.push(new THREE.Vector2(0.26, 0.32));
    points.push(new THREE.Vector2(0.12, 0.12));
    points.push(new THREE.Vector2(0.04, 0.0));

    const cupGeo = new THREE.LatheGeometry(points, 32);
    const cup = new THREE.Mesh(cupGeo, goldMat);
    cup.position.y = 0.0;
    trophy.add(cup);

    // Glowing Inner Cup Reservoir
    const innerGeo = new THREE.CylinderGeometry(0.38, 0.08, 0.52, 32);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0xFF8C00,
      emissiveIntensity: 0.4
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.y = 0.28;
    trophy.add(inner);

    // 4. Dual Sculpted Side Handles
    const handleGeo = new THREE.TorusGeometry(0.24, 0.03, 16, 32, Math.PI * 1.1);
    
    const leftHandle = new THREE.Mesh(handleGeo, goldMat);
    leftHandle.position.set(-0.36, 0.26, 0);
    leftHandle.rotation.z = Math.PI * 0.2;
    trophy.add(leftHandle);

    const rightHandle = new THREE.Mesh(handleGeo, goldMat);
    rightHandle.position.set(0.36, 0.26, 0);
    rightHandle.rotation.z = -Math.PI * 0.2;
    rightHandle.rotation.y = Math.PI;
    trophy.add(rightHandle);

    // 5. Crown Star Emblem Floating inside Cup
    const starShape = new THREE.Shape();
    const numPoints = 5;
    const outerRadius = 0.14;
    const innerRadius = 0.06;
    for (let i = 0; i < numPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / numPoints - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();

    const starExtrudeGeo = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.01,
      bevelThickness: 0.01
    });

    const starMat = new THREE.MeshStandardMaterial({
      color: 0xFFF090,
      metalness: 0.9,
      emissive: 0xFFC000,
      emissiveIntensity: 0.5
    });
    const star = new THREE.Mesh(starExtrudeGeo, starMat);
    star.position.set(0, 0.62, 0);
    trophy.add(star);

    return trophy;
  }

  // --- Atmospheric Night Stadium Particles ---
  private createAtmosphericParticles(count: number): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 16;
      positions[i + 1] = Math.random() * 8;
      positions[i + 2] = (Math.random() - 0.5) * 16;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.045,
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    return new THREE.Points(geometry, material);
  }

  // --- Celebration Particles (Gold streamers) ---
  private createCelebrationParticles(count: number): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 14;
      positions[i + 1] = Math.random() * 9;
      positions[i + 2] = (Math.random() - 0.5) * 14;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.065,
      color: 0xFFD700,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    return new THREE.Points(geometry, material);
  }

  // --- Scroll State Interpolation (Continuous Chapter Tracking) ---
  public setScrollProgress(progress: number, chapterFloat?: number) {
    this.scrollProgress = Math.max(0, Math.min(1, progress));
    if (typeof chapterFloat === 'number' && !isNaN(chapterFloat)) {
      this.targetChapterFloat = Math.max(1, Math.min(7, chapterFloat));
    } else {
      this.targetChapterFloat = 1 + this.scrollProgress * 6;
    }
  }

  // --- Public Interactive 3D Control Methods ---
  public rotatePlayerBy(deltaYaw: number, deltaPitch = 0) {
    this.targetUserRotationY += deltaYaw;
    this.targetUserRotationX = Math.max(-0.35, Math.min(0.35, this.targetUserRotationX + deltaPitch));
    this.dragVelocityX = 0;
    this.dragVelocityY = 0;
    this.lastInteractionTime = performance.now();
  }

  public setPlayerAngle(yaw: number, pitch = 0) {
    this.targetUserRotationY = yaw;
    this.targetUserRotationX = pitch;
    this.dragVelocityX = 0;
    this.dragVelocityY = 0;
    this.lastInteractionTime = performance.now();
  }

  public resetPlayerRotation() {
    this.setPlayerAngle(0, 0);
  }

  // --- Mouse & Touch Input Handlers ---
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

  private onVisibilityChange = () => {
    this.isDocumentVisible = document.visibilityState === 'visible';
    if (this.isDocumentVisible && this.animationFrameId === null) {
      this.clock.start();
      this.animate();
    }
  };

  // --- Interactive Pointer & Drag Handlers ---
  private onPointerDown = (e: PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target?.closest('button') || target?.closest('a') || target?.closest('input') || target?.closest('.floating-hero-card')) {
      return;
    }

    const isHeroInteractiveZone = target?.closest('#hero-3d-interactive-zone') ||
                                  target?.closest('#fcforge-player-canvas') ||
                                  (window.scrollY < window.innerHeight * 0.8 && e.clientX > window.innerWidth * 0.38);

    if (isHeroInteractiveZone) {
      this.isPointerDown = true;
      this.pointerStartX = e.clientX;
      this.pointerStartY = e.clientY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.dragVelocityX = 0;
      this.dragVelocityY = 0;
      this.lastInteractionTime = performance.now();
      document.body.classList.add('fcforge-grabbing');
      window.dispatchEvent(new CustomEvent('fcforge:model-drag-state', { detail: { isDragging: true } }));
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isPointerDown) return;

    const deltaX = e.clientX - this.lastPointerX;
    const deltaY = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;

    const sensitivity = this.isMobile ? 0.009 : 0.0065;
    this.targetUserRotationY += deltaX * sensitivity;
    this.targetUserRotationX = Math.max(-0.35, Math.min(0.35, this.targetUserRotationX + deltaY * (sensitivity * 0.4)));

    this.dragVelocityX = deltaX * sensitivity * 0.35;
    this.dragVelocityY = deltaY * sensitivity * 0.15;
    this.lastInteractionTime = performance.now();
  };

  private onPointerUp = () => {
    if (this.isPointerDown) {
      this.isPointerDown = false;
      document.body.classList.remove('fcforge-grabbing');
      window.dispatchEvent(new CustomEvent('fcforge:model-drag-state', { detail: { isDragging: false } }));
    }
  };

  // --- Main Render Loop (Optimized, Zero-GC Allocations) ---
  private animate = () => {
    if (!this.isDocumentVisible) {
      this.animationFrameId = null;
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Update skeletal animation mixer if available
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // Scroll progress smooth lerp
    this.currentProgress += (this.scrollProgress - this.currentProgress) * 0.08;
    this.currentChapterFloat += (this.targetChapterFloat - this.currentChapterFloat) * 0.08;

    // Interactive 3D Model rotation physics & momentum damping
    if (!this.isPointerDown) {
      this.targetUserRotationY += this.dragVelocityX;
      this.targetUserRotationX += this.dragVelocityY;
      this.dragVelocityX *= 0.92;
      this.dragVelocityY *= 0.92;

      // After 5s inactivity, gently ease pitch (X) back to 0
      const inactiveTime = performance.now() - this.lastInteractionTime;
      if (inactiveTime > 5000) {
        this.targetUserRotationX *= 0.98;
      }
    }

    this.userRotationY += (this.targetUserRotationY - this.userRotationY) * 0.12;
    this.userRotationX += (this.targetUserRotationX - this.userRotationX) * 0.12;

    // Mouse Parallax smooth lerp
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    // Distant LED board texture scroll
    if (this.ledCanvasTexture) {
      this.ledCanvasTexture.offset.x -= delta * 0.035;
    }

    // Dynamic ground halo pulse & rotation
    if (!this.isReducedMotion) {
      this.turfHaloRing.rotation.z = elapsed * 0.2;
      const haloScale = 1.0 + Math.sin(elapsed * 2.2) * 0.04;
      this.turfHaloRing.scale.set(haloScale, haloScale, 1);

      this.atmosphericParticles.rotation.y = elapsed * 0.025;
    }

    // Dynamic 3D Match Football & Holographic HUD Rotation
    if (!this.isReducedMotion) {
      if (this.matchFootballMesh) {
        this.matchFootballMesh.rotation.y += delta * 0.95;
        this.matchFootballMesh.rotation.x += delta * 0.35;
      }
      if (this.matchOrbitRing) {
        this.matchOrbitRing.rotation.z -= delta * 0.45;
        this.matchOrbitRing.rotation.x = Math.PI / 3 + Math.sin(elapsed * 1.2) * 0.12;
      }
      if (this.matchOrbitRingInner) {
        this.matchOrbitRingInner.rotation.z += delta * 0.6;
        this.matchOrbitRingInner.rotation.y = Math.PI / 4 + Math.cos(elapsed * 1.5) * 0.15;
      }
    }

    // Procedural lifelike motion (micro-breathing & stance sway) if GLB has no clips
    if (!this.mixer && this.playerSubGroup) {
      const breathY = Math.sin(elapsed * 1.8) * 0.008;
      const swayPitch = Math.sin(elapsed * 1.8) * 0.005;
      const swayYaw = Math.sin(elapsed * 0.9) * 0.015;

      this.playerSubGroup.position.y = breathY;
      this.playerSubGroup.rotation.x = swayPitch;
      this.playerSubGroup.rotation.y = swayYaw;
    }

    // Update multi-stage storyboard trajectory across the blank spots
    this.updateStoryboard(elapsed);

    // Apply Camera Parallax & Smooth Lerp (Using pre-allocated vectors to prevent GC pauses)
    if (!this.isReducedMotion) {
      const parallaxOffsetX = this.mouseX * (this.isMobile ? 0.15 : 0.32);
      const parallaxOffsetY = -this.mouseY * (this.isMobile ? 0.1 : 0.18);

      this.scratchCamTarget.set(
        this.targetCameraPos.x + parallaxOffsetX,
        this.targetCameraPos.y + parallaxOffsetY,
        this.targetCameraPos.z
      );
      this.currentCameraPos.lerp(this.scratchCamTarget, 0.065);

      this.scratchLookTarget.set(
        this.targetLookAt.x + parallaxOffsetX * 0.45,
        this.targetLookAt.y,
        this.targetLookAt.z
      );
      this.currentLookAt.lerp(this.scratchLookTarget, 0.065);

      this.camera.position.copy(this.currentCameraPos);
      this.camera.lookAt(this.currentLookAt);

      if (Math.abs(this.camera.fov - this.targetFov) > 0.08) {
        this.camera.fov += (this.targetFov - this.camera.fov) * 0.05;
        this.camera.updateProjectionMatrix();
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  // --- Storyboard Trajectory (Smooth Spline Motion across designated Blank Spots) ---
  private updateStoryboard(elapsed: number) {
    const isMob = this.isMobile;

    // Desktop Keyframe Poses:
    // Ch 1 (Arrival): Blank spot RIGHT (x=0.88), model faces user/left
    // Ch 2 (Profile): Blank spot RIGHT (x=0.85), closer heroic camera shot
    // Ch 3 (Games): Blank spot LEFT (x=-0.85), model glides across & faces right toward game cards
    // Ch 4 (Tournaments): Blank spot RIGHT (x=0.85), model glides across & faces left toward tourneys
    // Ch 5 (Match Engine): Blank spot LEFT (x=-0.85), model glides across & faces right toward bracket
    // Ch 6 (Rankings): Blank spot RIGHT (x=0.85), model glides across & faces left toward ladder
    // Ch 7 (Championship): Model centered behind trophy podium (x=0, z=-0.6)
    const desktopPoses = [
      { playerX: 0.88, playerY: 0, playerZ: 0, playerRotY: 0.12, camX: 0.35, camY: 1.35, camZ: 4.85, lookX: 0.35, lookY: 1.05, lookZ: 0, fov: 39, cyanRim: 14, greenRim: 9.5, keyLight: 4.2 },
      { playerX: 0.85, playerY: 0, playerZ: 0, playerRotY: -0.20, camX: 0.45, camY: 1.25, camZ: 3.90, lookX: 0.45, lookY: 1.00, lookZ: 0, fov: 38, cyanRim: 18, greenRim: 12.0, keyLight: 4.5 },
      { playerX: -0.85, playerY: 0, playerZ: 0, playerRotY: 0.42, camX: -0.35, camY: 1.35, camZ: 4.85, lookX: -0.20, lookY: 1.05, lookZ: 0, fov: 40, cyanRim: 16, greenRim: 11.0, keyLight: 4.2 },
      { playerX: 0.85, playerY: 0, playerZ: 0, playerRotY: -0.38, camX: 0.35, camY: 1.35, camZ: 4.85, lookX: 0.20, lookY: 1.05, lookZ: 0, fov: 40, cyanRim: 16, greenRim: 10.0, keyLight: 4.2 },
      { playerX: -0.85, playerY: 0, playerZ: 0, playerRotY: 0.35, camX: -0.35, camY: 1.40, camZ: 4.90, lookX: -0.15, lookY: 1.05, lookZ: 0, fov: 40, cyanRim: 18, greenRim: 12.0, keyLight: 4.4 },
      { playerX: 0.85, playerY: 0, playerZ: 0, playerRotY: -0.28, camX: 0.35, camY: 1.35, camZ: 4.85, lookX: 0.20, lookY: 1.05, lookZ: 0, fov: 40, cyanRim: 16, greenRim: 11.0, keyLight: 4.2 },
      { playerX: 0.00, playerY: 0, playerZ: -0.6, playerRotY: 0.00, camX: 0.00, camY: 1.25, camZ: 4.60, lookX: 0.00, lookY: 0.95, lookZ: 0, fov: 42, cyanRim: 22, greenRim: 14.0, keyLight: 5.5 }
    ];

    // Mobile Keyframe Poses (Centered to avoid edge clipping):
    const mobilePoses = [
      { playerX: 0, playerY: -0.15, playerZ: 0, playerRotY: 0.08, camX: 0, camY: 1.25, camZ: 5.6, lookX: 0, lookY: 0.95, lookZ: 0, fov: 44, cyanRim: 14, greenRim: 9.5, keyLight: 4.2 },
      { playerX: 0, playerY: -0.12, playerZ: 0, playerRotY: -0.15, camX: 0, camY: 1.15, camZ: 4.6, lookX: 0, lookY: 0.90, lookZ: 0, fov: 42, cyanRim: 18, greenRim: 11.0, keyLight: 4.5 },
      { playerX: 0, playerY: -0.15, playerZ: 0, playerRotY: 0.25, camX: 0, camY: 1.25, camZ: 5.4, lookX: 0, lookY: 0.90, lookZ: 0, fov: 44, cyanRim: 15, greenRim: 10.0, keyLight: 4.2 },
      { playerX: 0, playerY: -0.15, playerZ: 0, playerRotY: -0.22, camX: 0, camY: 1.25, camZ: 5.4, lookX: 0, lookY: 0.90, lookZ: 0, fov: 44, cyanRim: 15, greenRim: 10.0, keyLight: 4.2 },
      { playerX: 0, playerY: -0.15, playerZ: 0, playerRotY: 0.20, camX: 0, camY: 1.25, camZ: 5.4, lookX: 0, lookY: 0.90, lookZ: 0, fov: 44, cyanRim: 16, greenRim: 11.0, keyLight: 4.4 },
      { playerX: 0, playerY: -0.15, playerZ: 0, playerRotY: -0.18, camX: 0, camY: 1.25, camZ: 5.4, lookX: 0, lookY: 0.90, lookZ: 0, fov: 44, cyanRim: 15, greenRim: 10.0, keyLight: 4.2 },
      { playerX: 0, playerY: -0.10, playerZ: -0.4, playerRotY: 0.00, camX: 0, camY: 1.20, camZ: 5.0, lookX: 0, lookY: 0.90, lookZ: 0, fov: 44, cyanRim: 20, greenRim: 13.0, keyLight: 5.0 }
    ];

    // Storyboard Hermite spline evaluation across float progress [1.0 .. 7.0]
    const clampedFloat = Math.max(1, Math.min(7, this.currentChapterFloat));
    const baseIdx = Math.max(0, Math.min(5, Math.floor(clampedFloat - 1)));
    const nextIdx = Math.min(6, baseIdx + 1);
    const localT = Math.max(0, Math.min(1, (clampedFloat - 1) - baseIdx));
    // Hermite cubic ease for ultra-smooth acceleration & deceleration
    const ease = localT * localT * (3 - 2 * localT);

    const p1 = isMob ? mobilePoses[baseIdx] : desktopPoses[baseIdx];
    const p2 = isMob ? mobilePoses[nextIdx] : desktopPoses[nextIdx];

    const targetX = THREE.MathUtils.lerp(p1.playerX, p2.playerX, ease);
    const targetY = THREE.MathUtils.lerp(p1.playerY, p2.playerY, ease);
    const targetZ = THREE.MathUtils.lerp(p1.playerZ, p2.playerZ, ease);
    const targetRotY = THREE.MathUtils.lerp(p1.playerRotY, p2.playerRotY, ease);

    this.targetCameraPos.set(
      THREE.MathUtils.lerp(p1.camX, p2.camX, ease),
      THREE.MathUtils.lerp(p1.camY, p2.camY, ease),
      THREE.MathUtils.lerp(p1.camZ, p2.camZ, ease)
    );

    this.targetLookAt.set(
      THREE.MathUtils.lerp(p1.lookX, p2.lookX, ease),
      THREE.MathUtils.lerp(p1.lookY, p2.lookY, ease),
      THREE.MathUtils.lerp(p1.lookZ, p2.lookZ, ease)
    );

    this.targetFov = THREE.MathUtils.lerp(p1.fov, p2.fov, ease);

    // Apply smooth player movement with high-fidelity damping
    this.playerGroup.position.x += (targetX - this.playerGroup.position.x) * 0.085;
    this.playerGroup.position.y += (targetY - this.playerGroup.position.y) * 0.085;
    this.playerGroup.position.z += (targetZ - this.playerGroup.position.z) * 0.085;

    // Combine storyboard rotation with user interactive drag rotation
    const baseTurn = isMob ? 0 : this.mouseX * 0.08;
    const targetTotalRotY = targetRotY + baseTurn + this.userRotationY;
    this.playerGroup.rotation.y += (targetTotalRotY - this.playerGroup.rotation.y) * 0.085;
    this.playerGroup.rotation.x += (this.userRotationX - this.playerGroup.rotation.x) * 0.085;

    // Ground shadows, halo rings, and ground bounce light follow player in perfect lockstep
    this.contactShadowMesh.position.x = this.playerGroup.position.x;
    this.contactShadowMesh.position.z = this.playerGroup.position.z;
    this.turfHaloRing.position.x = this.playerGroup.position.x;
    this.turfHaloRing.position.z = this.playerGroup.position.z;
    this.turfInnerGlow.position.x = this.playerGroup.position.x;
    this.turfInnerGlow.position.z = this.playerGroup.position.z;
    this.groundFootLight.position.x = this.playerGroup.position.x;
    this.groundFootLight.position.z = this.playerGroup.position.z + 0.3;

    // Rim lighting boost when facing away (#10 jersey back view)
    const normalizedAngle = ((this.playerGroup.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const isFacingBack = Math.cos(normalizedAngle) < -0.15;
    const baseCyan = THREE.MathUtils.lerp(p1.cyanRim, p2.cyanRim, ease);
    const baseGreen = THREE.MathUtils.lerp(p1.greenRim, p2.greenRim, ease);
    const baseKey = THREE.MathUtils.lerp(p1.keyLight, p2.keyLight, ease);

    this.cyanRimLight.intensity = isFacingBack ? baseCyan * 1.5 : baseCyan;
    this.greenRimLight.intensity = isFacingBack ? baseGreen * 1.4 : baseGreen;
    this.keyLight.intensity = baseKey;

    // 3D Match Football & Holographic Telemetry HUD (Levitating in Chapter 5 Spotlight)
    const ch5Intensity = Math.max(0, 1 - Math.abs(this.currentChapterFloat - 5.0) * 1.5);

    let targetBallX: number;
    let targetBallY: number;
    let targetBallZ: number;

    if (this.currentChapterFloat < 4.2) {
      // Resting on turf beside the player's front cleat
      targetBallX = this.playerGroup.position.x + (isMob ? 0.28 : 0.42);
      targetBallY = 0.22;
      targetBallZ = this.playerGroup.position.z + 0.32;
    } else if (this.currentChapterFloat >= 4.2 && this.currentChapterFloat <= 5.8) {
      // Levitating up into the Chapter 5 Competition Engine spotlight
      const hoverBob = Math.sin(elapsed * 2.2) * 0.04;
      targetBallX = this.playerGroup.position.x + (isMob ? 0.0 : 0.72);
      targetBallY = 1.05 + hoverBob;
      targetBallZ = 0.32;
    } else {
      // Resting on pitch near leaderboard / trophy podium
      targetBallX = this.playerGroup.position.x + (isMob ? 0.28 : 0.42);
      targetBallY = 0.22;
      targetBallZ = this.playerGroup.position.z + 0.30;
    }

    this.holographicBracket3D.position.x += (targetBallX - this.holographicBracket3D.position.x) * 0.085;
    this.holographicBracket3D.position.y += (targetBallY - this.holographicBracket3D.position.y) * 0.085;
    this.holographicBracket3D.position.z += (targetBallZ - this.holographicBracket3D.position.z) * 0.085;
    this.holographicBracket3D.visible = true;

    // Fade holographic HUD rings in during Chapter 5
    if (this.matchOrbitRing && this.matchOrbitRing.material instanceof THREE.Material) {
      (this.matchOrbitRing.material as THREE.MeshBasicMaterial).opacity = ch5Intensity * 0.75;
    }
    if (this.matchOrbitRingInner && this.matchOrbitRingInner.material instanceof THREE.Material) {
      (this.matchOrbitRingInner.material as THREE.MeshBasicMaterial).opacity = ch5Intensity * 0.60;
    }

    // Championship celebration particles & lighting (Chapter 7 Podium Finale)
    if (this.currentChapterFloat >= 6.3) {
      this.celebrationParticles.visible = true;
      this.celebrationParticles.rotation.y = elapsed * 0.15;
      this.keyLight.color.setHex(0xFFD700);
      this.cyanRimLight.color.setHex(0xFF6B35);
    } else {
      this.celebrationParticles.visible = false;
      this.keyLight.color.setHex(0xF8F5EE);
      this.cyanRimLight.color.setHex(0xE5B869);
    }

    // Hide background duplicate trophy so foreground interactive 3D trophy stage takes center podium
    this.trophyGroup.visible = false;
    this.trophyGroup.scale.set(0, 0, 0);

    // Keep active chapter index updated for HUD
    this.currentChapter = Math.max(1, Math.min(7, Math.round(this.currentChapterFloat)));
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.0 : 1.5));
  };

  // --- Public Status Getter ---
  public getCurrentChapter(): number {
    return this.currentChapter;
  }

  public getCurrentChapterFloat(): number {
    return this.currentChapterFloat;
  }

  // --- Cleanup & Memory Disposal ---
  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    this.scene.clear();
    this.renderer.dispose();
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
  }
}
