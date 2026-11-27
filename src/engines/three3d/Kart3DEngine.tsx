import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  CostumeId,
  HudSnapshot,
  LevelCompletionResult,
  PowerUpType,
} from '../../types/game';
import { inputManager } from '../../systems/inputSystem';
import { audioSystem } from '../../systems/audioSystem';
import { haptics } from '../../systems/haptics';
import {
  createCheckeredTexture,
  createChristmasTree3D,
  createLucky3D,
  createLully3D,
  createSnowPoints,
  createSpfcBannerTexture,
  createTruffulaTree3D,
  createTruffulaTrunkTexture,
} from './models3d';

interface Props {
  costume: CostumeId;
  lives: number;
  paused: boolean;
  onHudUpdate: (hud: HudSnapshot) => void;
  onFinish: (result: LevelCompletionResult) => void;
  onPauseRequest: () => void;
}

interface Racer {
  name: string;
  mesh: THREE.Group;
  wheels: THREE.Mesh[];
  t: number;
  lap: number;
  laneOffset: number;
  targetLane: number;
  speed: number;
  baseSpeed: number;
  isPlayer: boolean;
  boostTimer: number;
  spinTimer: number;
  shieldActive: boolean;
  color: string;
}

interface MiniMapDot {
  x: number;
  y: number;
  color: string;
  isPlayer: boolean;
}

export const Kart3DEngine: React.FC<Props> = ({
  costume,
  lives,
  paused,
  onHudUpdate,
  onFinish,
  onPauseRequest,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const [countdownText, setCountdownText] = useState<string>('3');
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [miniDots, setMiniDots] = useState<MiniMapDot[]>([]);
  const [miniPath, setMiniPath] = useState<string>('');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#66cef5');
    scene.fog = new THREE.Fog('#c2f0ff', 80, 310);

    const camera = new THREE.PerspectiveCamera(
      62,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      460
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#ffffff', '#5aa835', 1.25));
    const sun = new THREE.DirectionalLight('#fff7cc', 1.35);
    sun.position.set(60, 115, 50);
    sun.castShadow = true;
    scene.add(sun);

    // Gentle Festive Snowflakes in 3D
    const snow = createSnowPoints(240, 220, 48);
    snow.position.set(0, 0, -80);
    scene.add(snow);

    // Whimsical Rolling Candy Circuit (with subtle height hills!)
    const curvePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(65, 2.5, -25),
      new THREE.Vector3(105, 5.5, -85),
      new THREE.Vector3(70, 2.0, -150),
      new THREE.Vector3(-10, 0, -165),
      new THREE.Vector3(-85, 4.0, -135),
      new THREE.Vector3(-105, 1.5, -60),
      new THREE.Vector3(-60, 0, 5),
    ];
    const trackCurve = new THREE.CatmullRomCurve3(curvePoints, true, 'catmullrom', 0.5);
    const TRACK_WIDTH = 16.5;

    // Precompute minimap SVG path (mapped to 0..100 x 0..100)
    const toMini = (pt: THREE.Vector3) => ({
      x: ((pt.x + 125) / 250) * 86 + 7,
      y: ((pt.z + 185) / 210) * 86 + 7,
    });
    const pathSamples: string[] = [];
    for (let i = 0; i <= 48; i++) {
      const m = toMini(trackCurve.getPointAt(i / 48));
      pathSamples.push(`${m.x.toFixed(1)},${m.y.toFixed(1)}`);
    }
    setMiniPath(pathSamples.join(' '));

    // Vibrant Dr. Seuss Spring Meadow
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(760, 760),
      new THREE.MeshStandardMaterial({ color: '#69b543', roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.3;
    ground.receiveShadow = true;
    scene.add(ground);

    // Whimsical Dr. Seuss Hot Air Balloons floating in the sky!
    const balloons: THREE.Group[] = [];
    const balCols = ['#f46d75', '#ffe055', '#e278b8', '#ff9f43', '#4cc9f0'];
    for (let i = 0; i < 7; i++) {
      const bg = new THREE.Group();
      const env = new THREE.Mesh(
        new THREE.SphereGeometry(6.5, 16, 14),
        new THREE.MeshStandardMaterial({ color: balCols[i % balCols.length], roughness: 0.5 })
      );
      env.scale.set(1, 1.2, 1);
      const stripe = new THREE.Mesh(
        new THREE.TorusGeometry(6.3, 0.7, 8, 22),
        new THREE.MeshStandardMaterial({ color: '#fff9eb' })
      );
      stripe.rotation.x = Math.PI / 2;
      const basket = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 2.2, 2.6),
        new THREE.MeshStandardMaterial({ color: '#8b623f' })
      );
      basket.position.y = -10.5;
      bg.add(env, stripe, basket);
      const ang = (i / 7) * Math.PI * 2;
      bg.position.set(Math.cos(ang) * 145, 36 + (i % 3) * 8, -80 + Math.sin(ang) * 135);
      scene.add(bg);
      balloons.push(bg);
    }

    // Track Road + Red/White Racing Curbs following 3D hill elevation!
    const segments = 210;
    const roadPositions: number[] = [];
    const roadColors: number[] = [];
    const roadIndices: number[] = [];
    const curbPositions: number[] = [];
    const curbColors: number[] = [];
    const curbIndices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

      const leftPt = pt.clone().addScaledVector(right, -TRACK_WIDTH / 2);
      const rightPt = pt.clone().addScaledVector(right, TRACK_WIDTH / 2);
      roadPositions.push(leftPt.x, leftPt.y + 0.08, leftPt.z, rightPt.x, rightPt.y + 0.08, rightPt.z);

      const stripe = i % 4 < 2;
      const c = new THREE.Color(stripe ? '#fff4d9' : '#f2d3a0');
      roadColors.push(c.r, c.g, c.b, c.r, c.g, c.b);

      const outerL = pt.clone().addScaledVector(right, -TRACK_WIDTH / 2 - 1.5);
      const outerR = pt.clone().addScaledVector(right, TRACK_WIDTH / 2 + 1.5);
      curbPositions.push(
        outerL.x, outerL.y + 0.2, outerL.z,
        leftPt.x, leftPt.y + 0.2, leftPt.z,
        rightPt.x, rightPt.y + 0.2, rightPt.z,
        outerR.x, outerR.y + 0.2, outerR.z
      );
      const cc = new THREE.Color(i % 2 === 0 ? '#d92626' : '#ffffff');
      for (let k = 0; k < 4; k++) curbColors.push(cc.r, cc.g, cc.b);

      if (i < segments) {
        const a = i * 2;
        roadIndices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        const ca = i * 4;
        curbIndices.push(ca, ca + 1, ca + 4, ca + 1, ca + 5, ca + 4);
        curbIndices.push(ca + 2, ca + 3, ca + 6, ca + 3, ca + 7, ca + 6);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
    roadGeo.setAttribute('color', new THREE.Float32BufferAttribute(roadColors, 3));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();
    scene.add(new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72 })));

    const curbGeo = new THREE.BufferGeometry();
    curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPositions, 3));
    curbGeo.setAttribute('color', new THREE.Float32BufferAttribute(curbColors, 3));
    curbGeo.setIndex(curbIndices);
    curbGeo.computeVertexNormals();
    scene.add(new THREE.Mesh(curbGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 })));

    // Giant Candy Cane Arches spanning over the track!
    [0.25, 0.5, 0.75].forEach((u, idx) => {
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(TRACK_WIDTH / 2 + 1.5, 0.95, 10, 28, Math.PI),
        new THREE.MeshStandardMaterial({ color: idx % 2 === 0 ? '#d92626' : '#e47bb8', roughness: 0.35 })
      );
      arch.position.set(pt.x, pt.y, pt.z);
      arch.rotation.y = Math.atan2(tan.x, tan.z) + Math.PI / 2;
      scene.add(arch);
    });

    // Start/Finish Checkered Arch + Paulo's SPFC Grandstand!
    {
      const startPt = trackCurve.getPointAt(0);
      const startTan = trackCurve.getTangentAt(0).normalize();
      const archGroup = new THREE.Group();
      archGroup.position.copy(startPt);
      archGroup.rotation.y = Math.atan2(startTan.x, startTan.z);

      const checkTex = createCheckeredTexture();
      const startLine = new THREE.Mesh(
        new THREE.PlaneGeometry(TRACK_WIDTH, 3.4),
        new THREE.MeshBasicMaterial({ map: checkTex })
      );
      startLine.rotation.x = -Math.PI / 2;
      startLine.position.y = 0.14;
      archGroup.add(startLine);

      const pillarMat = new THREE.MeshStandardMaterial({ color: '#d92626', roughness: 0.4 });
      const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 10.8, 14), pillarMat);
      leftPillar.position.set(-TRACK_WIDTH / 2 - 1.5, 5.4, 0);
      const rightPillar = leftPillar.clone();
      rightPillar.position.set(TRACK_WIDTH / 2 + 1.5, 5.4, 0);
      const topBanner = new THREE.Mesh(
        new THREE.BoxGeometry(TRACK_WIDTH + 5, 2.4, 1.4),
        new THREE.MeshStandardMaterial({ map: checkTex })
      );
      topBanner.position.set(0, 10.8, 0);
      archGroup.add(leftPillar, rightPillar, topBanner);

      const spfcTex = createSpfcBannerTexture();
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(10.5, 5.4, 5.2),
        new THREE.MeshStandardMaterial({ map: spfcTex })
      );
      stand.position.set(TRACK_WIDTH / 2 + 8.5, 2.7, 0);
      archGroup.add(stand);
      scene.add(archGroup);
    }

    // Truffula Trees + Christmas Trees
    const trunkTex = createTruffulaTrunkTexture();
    const truffulaColors = ['#f46d75', '#ffe055', '#ff9f43', '#e278b8'];
    for (let i = 0; i < 42; i++) {
      const u = i / 42;
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const dist = TRACK_WIDTH / 2 + 6.5 + (i % 3) * 5;
      const pos = pt.clone().addScaledVector(right, side * dist);

      if (i % 2 === 0) {
        const truf = createTruffulaTree3D(truffulaColors[i % truffulaColors.length], trunkTex);
        truf.position.set(pos.x, 0, pos.z);
        truf.rotation.z = side * 0.1;
        scene.add(truf);
      } else {
        const tree = createChristmasTree3D(1.0 + (i % 2) * 0.22);
        tree.position.set(pos.x, 0, pos.z);
        scene.add(tree);
      }
    }

    const boostPads = [0.14, 0.39, 0.64, 0.86].map((u) => {
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 0.18, 6.2),
        new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#ff9f1c', emissiveIntensity: 0.7 })
      );
      pad.position.set(pt.x, pt.y + 0.15, pt.z);
      pad.rotation.y = Math.atan2(tan.x, tan.z);
      scene.add(pad);
      return { u, lane: 0 };
    });

    const itemBoxes = [0.22, 0.52, 0.77].map((u) => {
      const pt = trackCurve.getPointAt(u);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 2.0, 2.0),
        new THREE.MeshStandardMaterial({ color: '#f46d75', emissive: '#e278b8', emissiveIntensity: 0.5 })
      );
      mesh.position.set(pt.x, pt.y + 1.8, pt.z);
      scene.add(mesh);
      return { u, lane: 0, mesh, cooldown: 0 };
    });

    const goldenPawNodes = [
      { u: 0.31, lane: -4.2, collected: false },
      { u: 0.58, lane: 4.2, collected: false },
      { u: 0.91, lane: -3.5, collected: false },
    ].map((p) => {
      const pt = trackCurve.getPointAt(p.u);
      const tan = trackCurve.getTangentAt(p.u).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const pos = pt.clone().addScaledVector(right, p.lane);
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.25),
        new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#f5b922', emissiveIntensity: 0.75 })
      );
      mesh.position.set(pos.x, pos.y + 1.8, pos.z);
      scene.add(mesh);
      return { ...p, mesh };
    });

    const candyObstacles = [0.18, 0.44, 0.71, 0.83].map((u, idx) => {
      const lane = idx % 2 === 0 ? 3.5 : -3.5;
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const pos = pt.clone().addScaledVector(right, lane);
      const mesh = new THREE.Mesh(
        new THREE.ConeGeometry(1.05, 2.3, 12),
        new THREE.MeshStandardMaterial({ color: '#d92626' })
      );
      mesh.position.set(pos.x, pos.y + 1.2, pos.z);
      scene.add(mesh);
      return { u, lane, mesh };
    });

    const buildKart = (
      bodyColor: string,
      driverType: 'lucky' | 'lully' | 'rival',
      rivalColor = '#ff9f43'
    ): { group: THREE.Group; wheels: THREE.Mesh[] } => {
      const g = new THREE.Group();
      const chassisMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.3, metalness: 0.12 });
      const chromeMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.75, roughness: 0.2 });

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 3.3), chassisMat);
      chassis.position.y = 0.78;
      chassis.castShadow = true;
      g.add(chassis);

      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.85, 0.45),
        new THREE.MeshStandardMaterial({ color: '#d92626' })
      );
      seat.position.set(0, 1.35, -0.85);
      const wheelSteer = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 8, 14), chromeMat);
      wheelSteer.position.set(0, 1.48, 0.65);
      wheelSteer.rotation.x = 0.4;
      const pipeL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.9, 10), chromeMat);
      pipeL.rotation.x = Math.PI / 2.3;
      pipeL.position.set(-0.55, 1.05, -1.75);
      const pipeR = pipeL.clone();
      pipeR.position.x = 0.55;
      g.add(seat, wheelSteer, pipeL, pipeR);

      const lightMat = new THREE.MeshStandardMaterial({ color: '#fff7a8', emissive: '#ffe055', emissiveIntensity: 0.8 });
      const hlL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), lightMat);
      hlL.position.set(-0.65, 0.95, 1.66);
      const hlR = hlL.clone();
      hlR.position.x = 0.65;
      g.add(hlL, hlR);

      if (driverType === 'lucky') {
        const knobGeo = new THREE.SphereGeometry(0.76, 14, 14);
        [
          [-0.95, 0.78, 1.5],
          [0.95, 0.78, 1.5],
          [-0.95, 0.78, -1.5],
          [0.95, 0.78, -1.5],
        ].forEach(([x, y, z]) => {
          const k = new THREE.Mesh(knobGeo, chassisMat);
          k.position.set(x, y, z);
          g.add(k);
        });
        const luckyDriver = createLucky3D(costume, 0.76);
        luckyDriver.position.set(0, 0.85, -0.15);
        g.add(luckyDriver);
      } else if (driverType === 'lully') {
        const lullyDriver = createLully3D(0.76);
        lullyDriver.position.set(0, 0.85, -0.15);
        g.add(lullyDriver);
      } else {
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.72, 14, 14),
          new THREE.MeshStandardMaterial({ color: rivalColor })
        );
        head.position.set(0, 1.75, -0.1);
        g.add(head);
      }

      const wheels: THREE.Mesh[] = [];
      const tireGeo = new THREE.CylinderGeometry(0.56, 0.56, 0.48, 14);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMat = new THREE.MeshStandardMaterial({ color: '#221b18', roughness: 0.8 });
      const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.5, 10);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMat = new THREE.MeshStandardMaterial({ color: '#ffe055', metalness: 0.5 });

      [
        [-1.18, 0.56, 1.1],
        [1.18, 0.56, 1.1],
        [-1.18, 0.56, -1.1],
        [1.18, 0.56, -1.1],
      ].forEach(([x, y, z]) => {
        const w = new THREE.Mesh(tireGeo, tireMat);
        const rim = new THREE.Mesh(rimGeo, rimMat);
        w.add(rim);
        w.position.set(x, y, z);
        g.add(w);
        wheels.push(w);
      });

      return { group: g, wheels };
    };

    const specs: Array<{ name: string; body: string; driver: 'lucky' | 'lully' | 'rival'; rivalCol: string; t: number; lane: number; baseSpeed: number; isPlayer: boolean }> = [
      { name: 'Lucky Boy', body: '#fff9eb', driver: 'lucky', rivalCol: '#ffe055', t: 0.002, lane: 0, baseSpeed: 0.12, isPlayer: true },
      { name: 'Lully', body: '#f46d75', driver: 'lully', rivalCol: '#f46d75', t: 0.012, lane: -3.2, baseSpeed: 0.088, isPlayer: false },
      { name: 'Biscoitão', body: '#ff9f43', driver: 'rival', rivalCol: '#ff9f43', t: 0.018, lane: 3.2, baseSpeed: 0.084, isPlayer: false },
      { name: 'Pinguim Noel', body: '#6fd3f7', driver: 'rival', rivalCol: '#6fd3f7', t: 0.024, lane: -1.5, baseSpeed: 0.08, isPlayer: false },
      { name: 'Cupcake Turbo', body: '#e278b8', driver: 'rival', rivalCol: '#e278b8', t: 0.03, lane: 2.0, baseSpeed: 0.077, isPlayer: false },
      { name: 'Duende Rabugento', body: '#9f7aea', driver: 'rival', rivalCol: '#9f7aea', t: 0.036, lane: -4.2, baseSpeed: 0.074, isPlayer: false },
    ];

    const racers: Racer[] = specs.map((s) => {
      const built = buildKart(s.body, s.driver, s.rivalCol);
      scene.add(built.group);
      return {
        name: s.name,
        mesh: built.group,
        wheels: built.wheels,
        t: s.t,
        lap: 1,
        laneOffset: s.lane,
        targetLane: s.lane,
        speed: 0,
        baseSpeed: s.baseSpeed,
        isPlayer: s.isPlayer,
        boostTimer: 0,
        spinTimer: 0,
        shieldActive: false,
        color: s.rivalCol,
      };
    });

    interface Spark3D {
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      life: number;
    }
    const sparks: Spark3D[] = [];
    const sparkGeo = new THREE.SphereGeometry(0.24, 6, 6);

    const playerRacer = racers[0];
    let heldItem: PowerUpType | null = null;
    let treatsCollected = 0;
    let countdown = 2.6; // 3 - 2 - 1 - JÁ!
    let timeSec = 0;
    let bannerText = '🏁 Prepare-se para a largada!';
    let bannerTimer = 2.6;
    let finished = false;
    let hudTick = 0;

    const resize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / Math.max(1, container.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', resize);

    let lastTs = performance.now();
    let rafId = 0;

    const animate = (ts: number) => {
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      const inp = inputManager.poll();
      if (inp.pauseJustPressed) onPauseRequest();

      if (!pausedRef.current && !finished) {
        timeSec += dt;

        // Float balloons & snow
        balloons.forEach((b, idx) => {
          b.position.y += Math.sin(timeSec * 1.2 + idx) * 0.03;
          b.rotation.y += dt * 0.25;
        });
        const snowPos = snow.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < snowPos.count; i++) {
          let ny = snowPos.getY(i) - 4.5 * dt;
          if (ny < 0) ny = 48;
          snowPos.setY(i, ny);
        }
        snowPos.needsUpdate = true;

        if (bannerTimer > 0) {
          bannerTimer -= dt;
          if (bannerTimer <= 0) bannerText = '';
        }

        // Start Countdown 3 - 2 - 1 - JÁ!
        const racingStarted = countdown <= 0;
        if (countdown > 0) {
          const prevC = Math.ceil(countdown);
          countdown -= dt;
          const nextC = Math.ceil(countdown);
          if (nextC !== prevC) {
            if (nextC > 0) {
              setCountdownText(String(nextC));
              audioSystem.playSfx('click');
            } else {
              setCountdownText('JÁ! 🏁');
              audioSystem.playSfx('boost');
              haptics.bounce();
              window.setTimeout(() => setCountdownText(''), 900);
            }
          }
        }

        const accel = racingStarted && (inp.a || inp.up);
        const brake = racingStarted && (inp.b || inp.down);
        const steer = racingStarted ? (inp.right ? 1 : 0) - (inp.left ? 1 : 0) : 0;
        const drifting = racingStarted && inp.x && Math.abs(steer) > 0;

        if (playerRacer.boostTimer > 0) playerRacer.boostTimer -= dt;
        if (playerRacer.spinTimer > 0) playerRacer.spinTimer -= dt;

        const maxSpd = playerRacer.boostTimer > 0 ? 0.148 : drifting ? 0.106 : 0.116;
        if (accel && playerRacer.spinTimer <= 0) {
          playerRacer.speed = Math.min(maxSpd, playerRacer.speed + 0.098 * dt);
        } else if (brake) {
          playerRacer.speed = Math.max(-0.025, playerRacer.speed - 0.12 * dt);
        } else {
          playerRacer.speed *= Math.pow(0.3, dt);
        }

        const steerRate = drifting ? 14.0 : 10.0;
        playerRacer.laneOffset += steer * steerRate * dt;
        playerRacer.laneOffset = Math.max(-TRACK_WIDTH / 2 + 1.5, Math.min(TRACK_WIDTH / 2 - 1.5, playerRacer.laneOffset));

        // Use Held Item (3 real Mario Kart items: Golden Bone Turbo, Spicy Pepper Attack, Bubble Shield!)
        if (racingStarted && inp.yJustPressed && heldItem) {
          haptics.bounce();
          if (heldItem === 'golden_bone') {
            audioSystem.playSfx('boost');
            playerRacer.boostTimer = 2.8;
            bannerText = '🦴 TURBO DE OSSO ATIVADO!';
          } else if (heldItem === 'spicy_treat') {
            audioSystem.playSfx('super_bark');
            playerRacer.boostTimer = 1.6;
            // Spin nearest rival ahead!
            const ahead = racers.find((r) => !r.isPlayer && (r.lap + r.t > playerRacer.lap + playerRacer.t));
            if (ahead) {
              ahead.spinTimer = 1.4;
              ahead.speed *= 0.25;
              bannerText = `🌶️ Pimenta acertou ${ahead.name}!`;
            } else {
              bannerText = '🌶️ TURBO APIMENTADO!';
            }
          } else {
            audioSystem.playSfx('powerup');
            playerRacer.shieldActive = true;
            playerRacer.boostTimer = 1.4;
            bannerText = '🫧 BOLHA PROTETORA ATIVADA!';
          }
          bannerTimer = 2.0;
          heldItem = null;
        }

        if ((drifting || playerRacer.boostTimer > 0) && Math.random() < 0.7) {
          const sp = new THREE.Mesh(
            sparkGeo,
            new THREE.MeshBasicMaterial({ color: playerRacer.boostTimer > 0 ? '#ffe055' : '#6fd3f7' })
          );
          sp.position.copy(playerRacer.mesh.position).add(new THREE.Vector3((Math.random() - 0.5) * 1.4, 0.6, (Math.random() - 0.5) * 1.4));
          scene.add(sp);
          sparks.push({ mesh: sp, vx: (Math.random() - 0.5) * 5, vy: 2 + Math.random() * 4, vz: (Math.random() - 0.5) * 5, life: 0.45 });
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.life -= dt;
          s.mesh.position.x += s.vx * dt;
          s.mesh.position.y += s.vy * dt;
          s.mesh.position.z += s.vz * dt;
          s.mesh.scale.setScalar(Math.max(0.01, s.life * 2));
          if (s.life <= 0) {
            scene.remove(s.mesh);
            sparks.splice(i, 1);
          }
        }

        for (const r of racers) {
          if (!r.isPlayer) {
            if (!racingStarted) {
              r.speed = 0;
            } else if (r.spinTimer > 0) {
              r.spinTimer -= dt;
              r.speed *= Math.pow(0.4, dt);
            } else {
              const targetS = r.baseSpeed + Math.sin(timeSec * 1.4 + r.laneOffset) * 0.007;
              r.speed += (targetS - r.speed) * Math.min(1, dt * 3);
            }
            if (racingStarted && Math.random() < dt * 0.6) {
              r.targetLane = (Math.random() - 0.5) * (TRACK_WIDTH - 4);
            }
            r.laneOffset += (r.targetLane - r.laneOffset) * Math.min(1, dt * 1.8);
          }

          for (const w of r.wheels) w.rotation.x += r.speed * 115 * dt;

          const prevT = r.t;
          r.t += r.speed * dt;
          if (r.t >= 1) {
            r.t -= 1;
            if (prevT > 0.75) {
              r.lap++;
              if (r.isPlayer) {
                haptics.collect();
                audioSystem.playSfx('checkpoint');
                treatsCollected += 8;
                if (r.lap <= 3) {
                  bannerText = `🏁 Volta ${r.lap}/3!`;
                  bannerTimer = 2.0;
                }
              }
            }
          } else if (r.t < 0) {
            r.t = 0;
          }

          const pt = trackCurve.getPointAt(r.t);
          const tan = trackCurve.getTangentAt(r.t).normalize();
          const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
          const worldPos = pt.clone().addScaledVector(right, r.laneOffset);
          r.mesh.position.copy(worldPos);
          r.mesh.rotation.y = Math.atan2(tan.x, tan.z) + (r.isPlayer && drifting ? -steer * 0.35 : 0);
          if (r.spinTimer > 0) r.mesh.rotation.y += timeSec * 14;
        }

        for (const pad of boostPads) {
          const distU = Math.min(Math.abs(playerRacer.t - pad.u), 1 - Math.abs(playerRacer.t - pad.u));
          if (distU < 0.015 && Math.abs(playerRacer.laneOffset - pad.lane) < 3.6) {
            if (playerRacer.boostTimer < 0.5) {
              playerRacer.boostTimer = 1.65;
              haptics.bounce();
              audioSystem.playSfx('boost');
              treatsCollected += 2;
            }
          }
        }

        const itemPool: PowerUpType[] = ['golden_bone', 'spicy_treat', 'bubble_shield'];
        for (const box of itemBoxes) {
          box.mesh.rotation.y += dt * 2.5;
          if (box.cooldown > 0) {
            box.cooldown -= dt;
            box.mesh.visible = false;
            continue;
          }
          box.mesh.visible = true;
          const distU = Math.min(Math.abs(playerRacer.t - box.u), 1 - Math.abs(playerRacer.t - box.u));
          if (distU < 0.016 && Math.abs(playerRacer.laneOffset - box.lane) < 3.0) {
            box.cooldown = 4;
            heldItem = itemPool[Math.floor(Math.random() * itemPool.length)];
            haptics.collect();
            audioSystem.playSfx('powerup');
            bannerText = '🎁 Item obtido! Aperte Y para usar!';
            bannerTimer = 2.0;
          }
        }

        goldenPawNodes.forEach((gp, idx) => {
          gp.mesh.rotation.y += dt * 3;
          if (gp.collected) {
            gp.mesh.visible = false;
            return;
          }
          const distU = Math.min(Math.abs(playerRacer.t - gp.u), 1 - Math.abs(playerRacer.t - gp.u));
          if (distU < 0.017 && Math.abs(playerRacer.laneOffset - gp.lane) < 3.4) {
            gp.collected = true;
            haptics.collect();
            audioSystem.playSfx('paw');
            bannerText = `🐾 Patinha Dourada #${idx + 1} coletada!`;
            bannerTimer = 2.0;
          }
        });

        for (const ob of candyObstacles) {
          const distU = Math.min(Math.abs(playerRacer.t - ob.u), 1 - Math.abs(playerRacer.t - ob.u));
          if (distU < 0.012 && Math.abs(playerRacer.laneOffset - ob.lane) < 2.0 && playerRacer.boostTimer <= 0 && playerRacer.spinTimer <= 0) {
            if (playerRacer.shieldActive) {
              playerRacer.shieldActive = false;
              audioSystem.playSfx('splash');
            } else {
              playerRacer.spinTimer = 0.55;
              playerRacer.speed *= 0.4;
              haptics.hurt();
              audioSystem.playSfx('hurt');
            }
          }
        }

        const progressScore = (r: Racer) => r.lap + r.t;
        const sorted = [...racers].sort((a, b) => progressScore(b) - progressScore(a));
        const rank = sorted.findIndex((r) => r.isPlayer) + 1;

        if (playerRacer.lap > 3) {
          finished = true;
          const won = rank <= 3;
          audioSystem.playSfx(won ? 'win' : 'hurt');
          const starsEarned = won ? (rank === 1 ? 3 : rank === 2 ? 2 : 1) : 0;
          onFinish({
            levelId: 3,
            won,
            treatsCollected,
            goldenPaws: [goldenPawNodes[0].collected, goldenPawNodes[1].collected, goldenPawNodes[2].collected],
            timeSec,
            heartsRemaining: won ? 3 : 0,
            starsEarned,
            extraNote: `Você chegou em ${rank}º lugar de 6 pilotos!`,
          });
        }

        const tan = trackCurve.getTangentAt(playerRacer.t).normalize();
        const desiredCam = playerRacer.mesh.position
          .clone()
          .addScaledVector(tan, -11.5)
          .add(new THREE.Vector3(0, 5.4, 0));
        camera.position.lerp(desiredCam, Math.min(1, dt * 8));
        const lookAt = playerRacer.mesh.position.clone().addScaledVector(tan, 12).add(new THREE.Vector3(0, 1.6, 0));
        camera.lookAt(lookAt);

        hudTick += dt;
        if (hudTick > 0.09) {
          hudTick = 0;
          setSpeedKmh(Math.round(Math.max(0, playerRacer.speed * 1350)));
          setMiniDots(
            racers.map((r) => {
              const m = toMini(r.mesh.position);
              return { x: m.x, y: m.y, color: r.color, isPlayer: r.isPlayer };
            })
          );
          onHudUpdate({
            hearts: 3,
            maxHearts: 3,
            treats: treatsCollected,
            lives,
            goldenPaws: [goldenPawNodes[0].collected, goldenPawNodes[1].collected, goldenPawNodes[2].collected],
            activePower: heldItem,
            powerTimer: heldItem ? 999 : 0,
            hasShield: playerRacer.shieldActive,
            progressLabel: `🏆 ${rank}º Lugar · Volta ${Math.min(3, playerRacer.lap)}/3`,
            bannerText: bannerText || undefined,
          });
        }
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [costume, lives, onHudUpdate, onFinish, onPauseRequest]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Live Mini-Map + Speedometer Overlay */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 98,
          zIndex: 18,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 86,
            height: 86,
            background: 'rgba(255, 249, 235, 0.9)',
            border: '3px solid #221b18',
            borderRadius: 16,
            boxShadow: '0 4px 0 rgba(34,27,24,0.28)',
          }}
        >
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            <polygon points={miniPath} fill="none" stroke="#c98842" strokeWidth="7" strokeLinejoin="round" />
            {miniDots.map((d, idx) => (
              <circle
                key={idx}
                cx={d.x}
                cy={d.y}
                r={d.isPlayer ? 5.5 : 3.6}
                fill={d.isPlayer ? '#d92626' : d.color}
                stroke="#221b18"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>

        <div
          className="seuss-title"
          style={{
            background: '#ffe770',
            border: '2.5px solid #221b18',
            borderRadius: 12,
            padding: '2px 10px',
            fontSize: 13,
            fontWeight: 900,
            color: '#221b18',
          }}
        >
          {speedKmh} km/h
        </div>
      </div>

      {/* Big Festive Start Countdown 3 - 2 - 1 - JÁ! */}
      {countdownText && (
        <div
          className="seuss-title"
          style={{
            position: 'absolute',
            left: '50%',
            top: '42%',
            transform: 'translate(-50%, -50%)',
            zIndex: 30,
            pointerEvents: 'none',
            fontSize: 'clamp(3.2rem, 12vw, 5.5rem)',
            color: '#ffe055',
            textShadow: '0 6px 0 #c91d1d, 0 10px 24px rgba(0,0,0,0.45)',
          }}
        >
          {countdownText}
        </div>
      )}
    </div>
  );
};
