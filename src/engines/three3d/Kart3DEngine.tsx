import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#6fd3f7');
    scene.fog = new THREE.Fog('#c2f0ff', 75, 290);

    const camera = new THREE.PerspectiveCamera(
      62,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      450
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#ffffff', '#5aa835', 1.2));
    const sun = new THREE.DirectionalLight('#fff7cc', 1.3);
    sun.position.set(60, 110, 50);
    sun.castShadow = true;
    scene.add(sun);

    const curvePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(65, 0, -25),
      new THREE.Vector3(105, 0, -85),
      new THREE.Vector3(70, 0, -150),
      new THREE.Vector3(-10, 0, -165),
      new THREE.Vector3(-85, 0, -135),
      new THREE.Vector3(-105, 0, -60),
      new THREE.Vector3(-60, 0, 5),
    ];
    const trackCurve = new THREE.CatmullRomCurve3(curvePoints, true, 'catmullrom', 0.5);
    const TRACK_WIDTH = 16;

    // Vibrant Dr. Seuss Spring Meadow + Distant Rolling Hills
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(700, 700),
      new THREE.MeshStandardMaterial({ color: '#69b543', roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.15;
    ground.receiveShadow = true;
    scene.add(ground);

    // Decorative fluffy white clouds in the sky
    for (let i = 0; i < 16; i++) {
      const cl = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95 });
      for (let j = 0; j < 3; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(5 + j * 1.5, 10, 10), mat);
        puff.position.set((j - 1) * 5.2, j % 2 === 0 ? 0 : 1.8, 0);
        cl.add(puff);
      }
      const ang = (i / 16) * Math.PI * 2;
      cl.position.set(Math.cos(ang) * 185, 42 + (i % 3) * 10, -80 + Math.sin(ang) * 165);
      scene.add(cl);
    }

    // Track Road + Red/White Racing Curbs!
    const segments = 200;
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
      const right = new THREE.Vector3(-tan.z, 0, tan.x);

      const leftPt = pt.clone().addScaledVector(right, -TRACK_WIDTH / 2);
      const rightPt = pt.clone().addScaledVector(right, TRACK_WIDTH / 2);
      roadPositions.push(leftPt.x, 0.05, leftPt.z, rightPt.x, 0.05, rightPt.z);

      const stripe = i % 4 < 2;
      const c = new THREE.Color(stripe ? '#fff4d9' : '#f2d3a0');
      roadColors.push(c.r, c.g, c.b, c.r, c.g, c.b);

      // Left & right candy curbs
      const outerL = pt.clone().addScaledVector(right, -TRACK_WIDTH / 2 - 1.4);
      const outerR = pt.clone().addScaledVector(right, TRACK_WIDTH / 2 + 1.4);
      curbPositions.push(
        outerL.x, 0.14, outerL.z,
        leftPt.x, 0.14, leftPt.z,
        rightPt.x, 0.14, rightPt.z,
        outerR.x, 0.14, outerR.z
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
    const roadMesh = new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72 }));
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    const curbGeo = new THREE.BufferGeometry();
    curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPositions, 3));
    curbGeo.setAttribute('color', new THREE.Float32BufferAttribute(curbColors, 3));
    curbGeo.setIndex(curbIndices);
    curbGeo.computeVertexNormals();
    scene.add(new THREE.Mesh(curbGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 })));

    // Start/Finish Checkered Arch + Paulo's SPFC Grandstand!
    {
      const startPt = trackCurve.getPointAt(0);
      const startTan = trackCurve.getTangentAt(0).normalize();
      const archGroup = new THREE.Group();
      archGroup.position.copy(startPt);
      archGroup.rotation.y = Math.atan2(startTan.x, startTan.z);

      const checkTex = createCheckeredTexture();
      const startLine = new THREE.Mesh(
        new THREE.PlaneGeometry(TRACK_WIDTH, 3.2),
        new THREE.MeshBasicMaterial({ map: checkTex })
      );
      startLine.rotation.x = -Math.PI / 2;
      startLine.position.y = 0.09;
      archGroup.add(startLine);

      const pillarMat = new THREE.MeshStandardMaterial({ color: '#d92626', roughness: 0.4 });
      const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 10.5, 14), pillarMat);
      leftPillar.position.set(-TRACK_WIDTH / 2 - 1.5, 5.2, 0);
      const rightPillar = leftPillar.clone();
      rightPillar.position.set(TRACK_WIDTH / 2 + 1.5, 5.2, 0);
      const topBanner = new THREE.Mesh(
        new THREE.BoxGeometry(TRACK_WIDTH + 5, 2.4, 1.4),
        new THREE.MeshStandardMaterial({ map: checkTex })
      );
      topBanner.position.set(0, 10.5, 0);
      archGroup.add(leftPillar, rightPillar, topBanner);

      // Paulo's SPFC Cheering Grandstand with crisp Tricolor Shield Texture!
      const spfcTex = createSpfcBannerTexture();
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(10, 5.2, 5.2),
        new THREE.MeshStandardMaterial({ map: spfcTex })
      );
      stand.position.set(TRACK_WIDTH / 2 + 8.5, 2.6, 0);
      archGroup.add(stand);
      scene.add(archGroup);
    }

    // Lush Lorax Truffula Trees + Cat-in-the-Hat Christmas Trees
    const trunkTex = createTruffulaTrunkTexture();
    const truffulaColors = ['#f46d75', '#ffe055', '#ff9f43', '#e278b8'];
    for (let i = 0; i < 42; i++) {
      const u = i / 42;
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x);
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
        new THREE.BoxGeometry(4.6, 0.16, 6.0),
        new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#ff9f1c', emissiveIntensity: 0.65 })
      );
      pad.position.set(pt.x, 0.13, pt.z);
      pad.rotation.y = Math.atan2(tan.x, tan.z);
      scene.add(pad);
      return { u, lane: 0 };
    });

    const itemBoxes = [0.22, 0.52, 0.77].map((u) => {
      const pt = trackCurve.getPointAt(u);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 1.9, 1.9),
        new THREE.MeshStandardMaterial({ color: '#f46d75', emissive: '#e278b8', emissiveIntensity: 0.45 })
      );
      mesh.position.set(pt.x, 1.6, pt.z);
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
      const right = new THREE.Vector3(-tan.z, 0, tan.x);
      const pos = pt.clone().addScaledVector(right, p.lane);
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.2),
        new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#f5b922', emissiveIntensity: 0.7 })
      );
      mesh.position.set(pos.x, 1.7, pos.z);
      scene.add(mesh);
      return { ...p, mesh };
    });

    const candyObstacles = [0.18, 0.44, 0.71, 0.83].map((u, idx) => {
      const lane = idx % 2 === 0 ? 3.5 : -3.5;
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x);
      const pos = pt.clone().addScaledVector(right, lane);
      const mesh = new THREE.Mesh(
        new THREE.ConeGeometry(1.05, 2.3, 12),
        new THREE.MeshStandardMaterial({ color: '#d92626' })
      );
      mesh.position.set(pos.x, 1.15, pos.z);
      scene.add(mesh);
      return { u, lane, mesh };
    });

    // Detailed Kart Builder (Bone Kart + Lucky 3D, Pink Heart Kart + Lully 3D, and Rivals!)
    const buildKart = (
      bodyColor: string,
      driverType: 'lucky' | 'lully' | 'rival',
      rivalColor = '#ff9f43'
    ): { group: THREE.Group; wheels: THREE.Mesh[] } => {
      const g = new THREE.Group();
      const chassisMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.3, metalness: 0.1 });
      const chromeMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.75, roughness: 0.2 });

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 3.3), chassisMat);
      chassis.position.y = 0.78;
      chassis.castShadow = true;
      g.add(chassis);

      // Red plush seat + steering wheel + twin exhaust pipes!
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

      // Golden headlights
      const lightMat = new THREE.MeshStandardMaterial({ color: '#fff7a8', emissive: '#ffe055', emissiveIntensity: 0.8 });
      const hlL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), lightMat);
      hlL.position.set(-0.65, 0.95, 1.66);
      const hlR = hlL.clone();
      hlR.position.x = 0.65;
      g.add(hlL, hlR);

      if (driverType === 'lucky') {
        // Bone-shaped Kart ends!
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

      // 4 Spinning Wheels with Golden Rims
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
      { name: 'Lucky Boy', body: '#fff9eb', driver: 'lucky', rivalCol: '#fff', t: 0.002, lane: 0, baseSpeed: 0.118, isPlayer: true },
      { name: 'Lully', body: '#f46d75', driver: 'lully', rivalCol: '#221b18', t: 0.012, lane: -3.2, baseSpeed: 0.088, isPlayer: false },
      { name: 'Biscoitão', body: '#ff9f43', driver: 'rival', rivalCol: '#8b623f', t: 0.018, lane: 3.2, baseSpeed: 0.084, isPlayer: false },
      { name: 'Pinguim Noel', body: '#6fd3f7', driver: 'rival', rivalCol: '#1d3557', t: 0.024, lane: -1.5, baseSpeed: 0.08, isPlayer: false },
      { name: 'Cupcake Turbo', body: '#e278b8', driver: 'rival', rivalCol: '#fff0f5', t: 0.03, lane: 2.0, baseSpeed: 0.077, isPlayer: false },
      { name: 'Duende Rabugento', body: '#9f7aea', driver: 'rival', rivalCol: '#80ed99', t: 0.036, lane: -4.2, baseSpeed: 0.074, isPlayer: false },
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
        speed: s.isPlayer ? 0 : s.baseSpeed,
        baseSpeed: s.baseSpeed,
        isPlayer: s.isPlayer,
        boostTimer: 0,
        spinTimer: 0,
      };
    });

    // Drift & Boost 3D Spark Particles
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
    let timeSec = 0;
    let bannerText = '🏁 Volta 1/3! Segure A (ou ▲) para acelerar e chegue no Top 3!';
    let bannerTimer = 3.2;
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
        if (bannerTimer > 0) {
          bannerTimer -= dt;
          if (bannerTimer <= 0) bannerText = '';
        }

        const accel = inp.a || inp.up;
        const brake = inp.b || inp.down;
        const steer = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
        const drifting = inp.x && Math.abs(steer) > 0;

        if (playerRacer.boostTimer > 0) playerRacer.boostTimer -= dt;
        if (playerRacer.spinTimer > 0) playerRacer.spinTimer -= dt;

        const maxSpd = playerRacer.boostTimer > 0 ? 0.145 : drifting ? 0.105 : 0.114;
        if (accel && playerRacer.spinTimer <= 0) {
          playerRacer.speed = Math.min(maxSpd, playerRacer.speed + 0.095 * dt);
        } else if (brake) {
          playerRacer.speed = Math.max(-0.025, playerRacer.speed - 0.12 * dt);
        } else {
          playerRacer.speed *= Math.pow(0.3, dt);
        }

        const steerRate = drifting ? 13.8 : 9.8;
        playerRacer.laneOffset += steer * steerRate * dt;
        playerRacer.laneOffset = Math.max(-TRACK_WIDTH / 2 + 1.5, Math.min(TRACK_WIDTH / 2 - 1.5, playerRacer.laneOffset));

        if (inp.yJustPressed && heldItem) {
          haptics.bounce();
          audioSystem.playSfx('boost');
          playerRacer.boostTimer = 2.6;
          bannerText = '🦴 TURBO DE OSSO ATIVADO!';
          bannerTimer = 1.8;
          heldItem = null;
        }

        // Spawn drift/boost sparks!
        if ((drifting || playerRacer.boostTimer > 0) && Math.random() < 0.65) {
          const sp = new THREE.Mesh(
            sparkGeo,
            new THREE.MeshBasicMaterial({ color: playerRacer.boostTimer > 0 ? '#ffe055' : '#6fd3f7' })
          );
          sp.position.copy(playerRacer.mesh.position).add(new THREE.Vector3((Math.random() - 0.5) * 1.4, 0.5, (Math.random() - 0.5) * 1.4));
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
            r.speed = r.baseSpeed + Math.sin(timeSec * 1.4 + r.laneOffset) * 0.007;
            if (Math.random() < dt * 0.6) {
              r.targetLane = (Math.random() - 0.5) * (TRACK_WIDTH - 4);
            }
            r.laneOffset += (r.targetLane - r.laneOffset) * Math.min(1, dt * 1.8);
          }

          // Spin wheels proportional to speed!
          for (const w of r.wheels) {
            w.rotation.x += r.speed * 110 * dt;
          }

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
          const right = new THREE.Vector3(-tan.z, 0, tan.x);
          const worldPos = pt.clone().addScaledVector(right, r.laneOffset);
          r.mesh.position.copy(worldPos);
          r.mesh.rotation.y = Math.atan2(tan.x, tan.z) + (r.isPlayer && drifting ? -steer * 0.35 : 0);
          if (r.spinTimer > 0) r.mesh.rotation.y += timeSec * 14;
        }

        for (const pad of boostPads) {
          const distU = Math.min(Math.abs(playerRacer.t - pad.u), 1 - Math.abs(playerRacer.t - pad.u));
          if (distU < 0.015 && Math.abs(playerRacer.laneOffset - pad.lane) < 3.5) {
            if (playerRacer.boostTimer < 0.5) {
              playerRacer.boostTimer = 1.6;
              haptics.bounce();
              audioSystem.playSfx('boost');
              treatsCollected += 2;
            }
          }
        }

        for (const box of itemBoxes) {
          box.mesh.rotation.y += dt * 2.5;
          if (box.cooldown > 0) {
            box.cooldown -= dt;
            box.mesh.visible = false;
            continue;
          }
          box.mesh.visible = true;
          const distU = Math.min(Math.abs(playerRacer.t - box.u), 1 - Math.abs(playerRacer.t - box.u));
          if (distU < 0.015 && Math.abs(playerRacer.laneOffset - box.lane) < 2.8) {
            box.cooldown = 4;
            heldItem = 'golden_bone';
            haptics.collect();
            audioSystem.playSfx('powerup');
            bannerText = '🎁 Item obtido! Aperte Y para TURBO!';
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
          if (distU < 0.017 && Math.abs(playerRacer.laneOffset - gp.lane) < 3.2) {
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
            playerRacer.spinTimer = 0.55;
            playerRacer.speed *= 0.4;
            haptics.hurt();
            audioSystem.playSfx('hurt');
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
        if (hudTick > 0.08) {
          hudTick = 0;
          onHudUpdate({
            hearts: 3,
            maxHearts: 3,
            treats: treatsCollected,
            lives,
            goldenPaws: [goldenPawNodes[0].collected, goldenPawNodes[1].collected, goldenPawNodes[2].collected],
            activePower: heldItem,
            powerTimer: heldItem ? 999 : 0,
            hasShield: false,
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

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};
