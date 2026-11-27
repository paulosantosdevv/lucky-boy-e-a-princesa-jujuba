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
  t: number; // 0..1 progress along loop
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
    scene.background = new THREE.Color('#2d1b69');
    scene.fog = new THREE.Fog('#3c1f7b', 60, 260);

    const camera = new THREE.PerspectiveCamera(
      62,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      400
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Lighting
    const hemi = new THREE.HemisphereLight('#fff5e4', '#3b1d5e', 1.15);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight('#ffd166', 1.2);
    dir.position.set(50, 90, 40);
    scene.add(dir);

    // Track spline (whimsical Dr. Seuss Candy Circuit)
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

    // Ground plane (mint snow candy field)
    const groundGeo = new THREE.PlaneGeometry(600, 600);
    const groundMat = new THREE.MeshStandardMaterial({ color: '#42b883', roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.15;
    scene.add(ground);

    // Build Track Road Mesh
    const segments = 180;
    const roadPositions: number[] = [];
    const roadColors: number[] = [];
    const roadIndices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x);

      const leftPt = pt.clone().addScaledVector(right, -TRACK_WIDTH / 2);
      const rightPt = pt.clone().addScaledVector(right, TRACK_WIDTH / 2);
      roadPositions.push(leftPt.x, 0.05, leftPt.z, rightPt.x, 0.05, rightPt.z);

      const stripe = i % 4 < 2;
      const c = new THREE.Color(stripe ? '#ff99c8' : '#ffb3d9');
      roadColors.push(c.r, c.g, c.b, c.r, c.g, c.b);

      if (i < segments) {
        const a = i * 2;
        const b = a + 1;
        const cIdx = a + 2;
        const d = a + 3;
        roadIndices.push(a, b, cIdx, b, d, cIdx);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
    roadGeo.setAttribute('color', new THREE.Float32BufferAttribute(roadColors, 3));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();
    const roadMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
    scene.add(new THREE.Mesh(roadGeo, roadMat));

    // Start/Finish Arch + Paulo (SPFC) cheering stand!
    {
      const startPt = trackCurve.getPointAt(0);
      const startTan = trackCurve.getTangentAt(0).normalize();
      const archGroup = new THREE.Group();
      archGroup.position.copy(startPt);
      archGroup.rotation.y = Math.atan2(startTan.x, startTan.z);

      const pillarMat = new THREE.MeshStandardMaterial({ color: '#e63946' });
      const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 10, 12), pillarMat);
      leftPillar.position.set(-TRACK_WIDTH / 2 - 1, 5, 0);
      const rightPillar = leftPillar.clone();
      rightPillar.position.set(TRACK_WIDTH / 2 + 1, 5, 0);
      const topBar = new THREE.Mesh(
        new THREE.BoxGeometry(TRACK_WIDTH + 4, 2.2, 1.5),
        new THREE.MeshStandardMaterial({ color: '#ffd166' })
      );
      topBar.position.set(0, 10, 0);
      archGroup.add(leftPillar, rightPillar, topBar);

      // Tricolor SPFC banner stand next to start line
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(8, 4, 5),
        new THREE.MeshStandardMaterial({ color: '#ffffff' })
      );
      stand.position.set(TRACK_WIDTH / 2 + 7, 2, 0);
      const redBand = new THREE.Mesh(
        new THREE.BoxGeometry(8.2, 0.9, 5.2),
        new THREE.MeshStandardMaterial({ color: '#e63946' })
      );
      redBand.position.set(TRACK_WIDTH / 2 + 7, 2.7, 0);
      const blackBand = new THREE.Mesh(
        new THREE.BoxGeometry(8.2, 0.9, 5.2),
        new THREE.MeshStandardMaterial({ color: '#111111' })
      );
      blackBand.position.set(TRACK_WIDTH / 2 + 7, 1.5, 0);
      archGroup.add(stand, redBand, blackBand);
      scene.add(archGroup);
    }

    // Dr. Seuss Giant Candy Canes & Crooked Christmas Trees around track
    for (let i = 0; i < 42; i++) {
      const u = i / 42;
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x);
      const side = i % 2 === 0 ? 1 : -1;
      const dist = TRACK_WIDTH / 2 + 6 + (i % 3) * 5;
      const pos = pt.clone().addScaledVector(right, side * dist);

      if (i % 3 === 0) {
        // Giant Lollipop
        const stick = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 7, 8),
          new THREE.MeshStandardMaterial({ color: '#ffffff' })
        );
        stick.position.set(pos.x, 3.5, pos.z);
        const candy = new THREE.Mesh(
          new THREE.CylinderGeometry(2.6, 2.6, 0.9, 18),
          new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? '#ff5d8f' : '#00bbf9' })
        );
        candy.rotation.x = Math.PI / 2;
        candy.position.set(pos.x, 7.6, pos.z);
        scene.add(stick, candy);
      } else {
        // Whimsical Tilted Christmas Tree
        const tree = new THREE.Group();
        tree.position.set(pos.x, 0, pos.z);
        tree.rotation.z = side * 0.14;
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.8, 3, 8),
          new THREE.MeshStandardMaterial({ color: '#582f0e' })
        );
        trunk.position.y = 1.5;
        const cone1 = new THREE.Mesh(
          new THREE.ConeGeometry(3.5, 6.5, 9),
          new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? '#2a9d8f' : '#2ec4b6' })
        );
        cone1.position.y = 5.5;
        const star = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.85),
          new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ff9f1c', emissiveIntensity: 0.4 })
        );
        star.position.y = 9.2;
        tree.add(trunk, cone1, star);
        scene.add(tree);
      }
    }

    // Track items: Boost Pads, Treats, Item Boxes, 3 Golden Paws
    const boostPads = [0.14, 0.39, 0.64, 0.86].map((u) => {
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 0.15, 5.5),
        new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ff9f1c', emissiveIntensity: 0.6 })
      );
      pad.position.set(pt.x, 0.12, pt.z);
      pad.rotation.y = Math.atan2(tan.x, tan.z);
      scene.add(pad);
      return { u, lane: 0 };
    });

    const itemBoxes = [0.22, 0.52, 0.77].map((u) => {
      const pt = trackCurve.getPointAt(u);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 1.7, 1.7),
        new THREE.MeshStandardMaterial({ color: '#00f5d4', emissive: '#00bbf9', emissiveIntensity: 0.45 })
      );
      mesh.position.set(pt.x, 1.5, pt.z);
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
        new THREE.OctahedronGeometry(1.15),
        new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ffb703', emissiveIntensity: 0.7 })
      );
      mesh.position.set(pos.x, 1.6, pos.z);
      scene.add(mesh);
      return { ...p, mesh };
    });

    const candyObstacles = [0.18, 0.44, 0.71, 0.83].map((u, idx) => {
      const lane = idx % 2 === 0 ? 3.2 : -3.2;
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x);
      const pos = pt.clone().addScaledVector(right, lane);
      const mesh = new THREE.Mesh(
        new THREE.ConeGeometry(1.1, 2.2, 10),
        new THREE.MeshStandardMaterial({ color: '#e63946' })
      );
      mesh.position.set(pos.x, 1.1, pos.z);
      scene.add(mesh);
      return { u, lane, mesh };
    });

    // Helper: Create Bone Kart + Dog / Rival Racer Mesh
    const createKartMesh = (bodyColor: string, driverColor: string, isBoneKart: boolean) => {
      const g = new THREE.Group();
      const chassisMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.35 });
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.85, 3.2), chassisMat);
      chassis.position.y = 0.75;
      g.add(chassis);

      if (isBoneKart) {
        // Bone-shaped front & back knobs!
        const knobGeo = new THREE.SphereGeometry(0.75, 12, 12);
        [
          [-0.95, 0.75, 1.5],
          [0.95, 0.75, 1.5],
          [-0.95, 0.75, -1.5],
          [0.95, 0.75, -1.5],
        ].forEach(([x, y, z]) => {
          const k = new THREE.Mesh(knobGeo, chassisMat);
          k.position.set(x, y, z);
          g.add(k);
        });
      }

      // 4 Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 12);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheelMat = new THREE.MeshStandardMaterial({ color: '#1b1030' });
      [
        [-1.15, 0.55, 1.1],
        [1.15, 0.55, 1.1],
        [-1.15, 0.55, -1.1],
        [1.15, 0.55, -1.1],
      ].forEach(([x, y, z]) => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.position.set(x, y, z);
        g.add(w);
      });

      // Driver Head (Lucky Boy white Shih Tzu or rival)
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 14, 14),
        new THREE.MeshStandardMaterial({ color: driverColor })
      );
      head.position.set(0, 1.65, -0.1);
      g.add(head);

      // Red scarf or costume stripe
      const scarf = new THREE.Mesh(
        new THREE.TorusGeometry(0.62, 0.16, 8, 16),
        new THREE.MeshStandardMaterial({ color: isBoneKart && costume === 'spfc' ? '#e63946' : '#e63946' })
      );
      scarf.rotation.x = Math.PI / 2;
      scarf.position.set(0, 1.25, -0.1);
      g.add(scarf);

      return g;
    };

    // 6 Racers: Lucky Boy + 5 AI (including Lully!)
    const racers: Racer[] = [
      {
        name: 'Lucky Boy',
        mesh: createKartMesh('#fff8eb', '#ffffff', true),
        t: 0.99,
        lap: 1,
        laneOffset: 0,
        targetLane: 0,
        speed: 0,
        baseSpeed: 0.115,
        isPlayer: true,
        boostTimer: 0,
        spinTimer: 0,
      },
      {
        name: 'Lully',
        mesh: createKartMesh('#ff5d8f', '#22223b', false),
        t: 0.015,
        lap: 1,
        laneOffset: -3.2,
        targetLane: -3.2,
        speed: 0.088,
        baseSpeed: 0.088,
        isPlayer: false,
        boostTimer: 0,
        spinTimer: 0,
      },
      {
        name: 'Biscoitão',
        mesh: createKartMesh('#f4a261', '#8d5b4c', false),
        t: 0.025,
        lap: 1,
        laneOffset: 3.2,
        targetLane: 3.2,
        speed: 0.084,
        baseSpeed: 0.084,
        isPlayer: false,
        boostTimer: 0,
        spinTimer: 0,
      },
      {
        name: 'Pinguim Noel',
        mesh: createKartMesh('#4cc9f0', '#1d3557', false),
        t: 0.032,
        lap: 1,
        laneOffset: -1.5,
        targetLane: -1.5,
        speed: 0.081,
        baseSpeed: 0.081,
        isPlayer: false,
        boostTimer: 0,
        spinTimer: 0,
      },
      {
        name: 'Cupcake Turbo',
        mesh: createKartMesh('#c77dff', '#ffccd5', false),
        t: 0.038,
        lap: 1,
        laneOffset: 2.0,
        targetLane: 2.0,
        speed: 0.077,
        baseSpeed: 0.077,
        isPlayer: false,
        boostTimer: 0,
        spinTimer: 0,
      },
      {
        name: 'Duende Rabugento',
        mesh: createKartMesh('#5a189a', '#80ed99', false),
        t: 0.044,
        lap: 1,
        laneOffset: -4.2,
        targetLane: -4.2,
        speed: 0.074,
        baseSpeed: 0.074,
        isPlayer: false,
        boostTimer: 0,
        spinTimer: 0,
      },
    ];
    racers.forEach((r) => scene.add(r.mesh));

    const playerRacer = racers[0];
    let heldItem: PowerUpType | null = null;
    let treatsCollected = 0;
    let timeSec = 0;
    let bannerText = '🏁 Corrida de 3 Voltas! Chegue no Top 3!';
    let bannerTimer = 3.0;
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
      if (inp.pauseJustPressed) {
        onPauseRequest();
      }

      if (!pausedRef.current && !finished) {
        timeSec += dt;
        if (bannerTimer > 0) {
          bannerTimer -= dt;
          if (bannerTimer <= 0) bannerText = '';
        }

        // Player Kart controls (A or Up accelerates, B or Down brakes, Left/Right steers, X drifts, Y uses item)
        const accel = inp.a || inp.up;
        const brake = inp.b || inp.down;
        const steer = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
        const drifting = inp.x && Math.abs(steer) > 0;

        if (playerRacer.boostTimer > 0) playerRacer.boostTimer -= dt;
        if (playerRacer.spinTimer > 0) playerRacer.spinTimer -= dt;

        const maxSpd = playerRacer.boostTimer > 0 ? 0.145 : drifting ? 0.102 : 0.108;
        if (accel && playerRacer.spinTimer <= 0) {
          playerRacer.speed = Math.min(maxSpd, playerRacer.speed + 0.085 * dt);
        } else if (brake) {
          playerRacer.speed = Math.max(-0.03, playerRacer.speed - 0.12 * dt);
        } else {
          playerRacer.speed *= Math.pow(0.25, dt);
        }

        // Drift mini-boost on release
        const steerRate = drifting ? 13.5 : 9.2;
        playerRacer.laneOffset += steer * steerRate * dt;
        playerRacer.laneOffset = Math.max(-TRACK_WIDTH / 2 + 1.5, Math.min(TRACK_WIDTH / 2 - 1.5, playerRacer.laneOffset));

        // Use Held Item (Y)
        if (inp.yJustPressed && heldItem) {
          audioSystem.playSfx('boost');
          playerRacer.boostTimer = 2.6;
          bannerText = '🦴 TURBO DE OSSO ATIVADO!';
          bannerTimer = 1.8;
          heldItem = null;
        }

        // Advance all racers
        for (const r of racers) {
          if (!r.isPlayer) {
            r.speed = r.baseSpeed + Math.sin(timeSec * 1.4 + r.laneOffset) * 0.008;
            if (Math.random() < dt * 0.6) {
              r.targetLane = (Math.random() - 0.5) * (TRACK_WIDTH - 4);
            }
            r.laneOffset += (r.targetLane - r.laneOffset) * Math.min(1, dt * 1.8);
          }

          const prevT = r.t;
          r.t += r.speed * dt;
          if (r.t >= 1) {
            r.t -= 1;
            if (prevT > 0.5) {
              r.lap++;
              if (r.isPlayer) {
                audioSystem.playSfx('checkpoint');
                treatsCollected += 8;
                if (r.lap <= 3) {
                  bannerText = `🏁 Volta ${r.lap}/3!`;
                  bannerTimer = 2.0;
                }
              }
            }
          } else if (r.t < 0) {
            r.t += 1;
          }

          // Place kart on 3D spline
          const pt = trackCurve.getPointAt(r.t);
          const tan = trackCurve.getTangentAt(r.t).normalize();
          const right = new THREE.Vector3(-tan.z, 0, tan.x);
          const worldPos = pt.clone().addScaledVector(right, r.laneOffset);
          r.mesh.position.copy(worldPos);
          r.mesh.rotation.y = Math.atan2(tan.x, tan.z) + (r.isPlayer && drifting ? -steer * 0.35 : 0);
          if (r.spinTimer > 0) {
            r.mesh.rotation.y += timeSec * 14;
          }
        }

        // Check Boost Pads
        for (const pad of boostPads) {
          const distU = Math.min(Math.abs(playerRacer.t - pad.u), 1 - Math.abs(playerRacer.t - pad.u));
          if (distU < 0.015 && Math.abs(playerRacer.laneOffset - pad.lane) < 3.5) {
            if (playerRacer.boostTimer < 0.5) {
              playerRacer.boostTimer = 1.6;
              audioSystem.playSfx('boost');
              treatsCollected += 2;
            }
          }
        }

        // Check Item Boxes
        for (const box of itemBoxes) {
          box.mesh.rotation.y += dt * 2.5;
          if (box.cooldown > 0) {
            box.cooldown -= dt;
            box.mesh.visible = false;
            continue;
          }
          box.mesh.visible = true;
          const distU = Math.min(Math.abs(playerRacer.t - box.u), 1 - Math.abs(playerRacer.t - box.u));
          if (distU < 0.014 && Math.abs(playerRacer.laneOffset - box.lane) < 2.6) {
            box.cooldown = 4;
            heldItem = 'golden_bone';
            audioSystem.playSfx('powerup');
            bannerText = '🎁 Item obtido! Aperte Y para TURBO!';
            bannerTimer = 2.0;
          }
        }

        // Check Golden Paws
        goldenPawNodes.forEach((gp, idx) => {
          gp.mesh.rotation.y += dt * 3;
          if (gp.collected) {
            gp.mesh.visible = false;
            return;
          }
          const distU = Math.min(Math.abs(playerRacer.t - gp.u), 1 - Math.abs(playerRacer.t - gp.u));
          if (distU < 0.016 && Math.abs(playerRacer.laneOffset - gp.lane) < 3.0) {
            gp.collected = true;
            audioSystem.playSfx('paw');
            bannerText = `🐾 Patinha Dourada #${idx + 1} coletada!`;
            bannerTimer = 2.0;
          }
        });

        // Check Candy Obstacles
        for (const ob of candyObstacles) {
          const distU = Math.min(Math.abs(playerRacer.t - ob.u), 1 - Math.abs(playerRacer.t - ob.u));
          if (distU < 0.012 && Math.abs(playerRacer.laneOffset - ob.lane) < 2.1 && playerRacer.boostTimer <= 0 && playerRacer.spinTimer <= 0) {
            playerRacer.spinTimer = 0.65;
            playerRacer.speed *= 0.35;
            audioSystem.playSfx('hurt');
          }
        }

        // Calculate Race Position
        const progressScore = (r: Racer) => r.lap + r.t;
        const sorted = [...racers].sort((a, b) => progressScore(b) - progressScore(a));
        const rank = sorted.findIndex((r) => r.isPlayer) + 1;

        // Finish after 3 laps!
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

        // Smooth Chase Camera behind Bone Kart
        const tan = trackCurve.getTangentAt(playerRacer.t).normalize();
        const desiredCam = playerRacer.mesh.position
          .clone()
          .addScaledVector(tan, -11.5)
          .add(new THREE.Vector3(0, 5.4, 0));
        camera.position.lerp(desiredCam, Math.min(1, dt * 8));
        const lookAt = playerRacer.mesh.position.clone().addScaledVector(tan, 12).add(new THREE.Vector3(0, 1.5, 0));
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
