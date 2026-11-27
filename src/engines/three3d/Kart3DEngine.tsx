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

    // Bright Lorax / Golden Book Sky!
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#74d4f7');
    scene.fog = new THREE.Fog('#b8eeff', 70, 270);

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

    const hemi = new THREE.HemisphereLight('#ffffff', '#5aa835', 1.25);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight('#fff7cc', 1.2);
    dir.position.set(50, 95, 45);
    scene.add(dir);

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

    // Vibrant Dr. Seuss Spring Meadow
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(620, 620),
      new THREE.MeshStandardMaterial({ color: '#69b543', roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.15;
    scene.add(ground);

    // Storybook Candy Road Mesh
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
      const c = new THREE.Color(stripe ? '#fff3d6' : '#f7d9a8');
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
    scene.add(new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 })));

    // Start/Finish Arch + Paulo's SPFC Stand
    {
      const startPt = trackCurve.getPointAt(0);
      const startTan = trackCurve.getTangentAt(0).normalize();
      const archGroup = new THREE.Group();
      archGroup.position.copy(startPt);
      archGroup.rotation.y = Math.atan2(startTan.x, startTan.z);

      const pillarMat = new THREE.MeshStandardMaterial({ color: '#d92626' });
      const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 10, 12), pillarMat);
      leftPillar.position.set(-TRACK_WIDTH / 2 - 1, 5, 0);
      const rightPillar = leftPillar.clone();
      rightPillar.position.set(TRACK_WIDTH / 2 + 1, 5, 0);
      const topBar = new THREE.Mesh(
        new THREE.BoxGeometry(TRACK_WIDTH + 4, 2.2, 1.5),
        new THREE.MeshStandardMaterial({ color: '#ffe055' })
      );
      topBar.position.set(0, 10, 0);
      archGroup.add(leftPillar, rightPillar, topBar);

      // SPFC Tricolor Cheering Stand (Paulo)
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(8, 4, 5),
        new THREE.MeshStandardMaterial({ color: '#ffffff' })
      );
      stand.position.set(TRACK_WIDTH / 2 + 7, 2, 0);
      const redBand = new THREE.Mesh(
        new THREE.BoxGeometry(8.2, 0.9, 5.2),
        new THREE.MeshStandardMaterial({ color: '#d92626' })
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

    // Lorax Truffula Trees + Cat-in-the-Hat Christmas Trees along track!
    const truffulaColors = ['#f46d75', '#ffe055', '#ff9f43', '#e278b8'];
    for (let i = 0; i < 44; i++) {
      const u = i / 44;
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x);
      const side = i % 2 === 0 ? 1 : -1;
      const dist = TRACK_WIDTH / 2 + 6 + (i % 3) * 5;
      const pos = pt.clone().addScaledVector(right, side * dist);

      if (i % 2 === 0) {
        // 3D Lorax Truffula Tree!
        const truf = new THREE.Group();
        truf.position.set(pos.x, 0, pos.z);
        truf.rotation.z = side * 0.12;
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.32, 0.48, 8.5, 8),
          new THREE.MeshStandardMaterial({ color: '#f7da59' })
        );
        trunk.position.y = 4.25;
        const tuft = new THREE.Mesh(
          new THREE.DodecahedronGeometry(3.2),
          new THREE.MeshStandardMaterial({ color: truffulaColors[i % truffulaColors.length], roughness: 0.7 })
        );
        tuft.position.y = 9.0;
        truf.add(trunk, tuft);
        scene.add(truf);
      } else {
        // 3D Christmas Tree with Pink Garland & Golden Bell!
        const tree = new THREE.Group();
        tree.position.set(pos.x, 0, pos.z);
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.8, 2.8, 8),
          new THREE.MeshStandardMaterial({ color: '#8b623f' })
        );
        trunk.position.y = 1.4;
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(3.6, 7.2, 10),
          new THREE.MeshStandardMaterial({ color: '#5ea93f' })
        );
        cone.position.y = 5.8;
        const garland = new THREE.Mesh(
          new THREE.TorusGeometry(2.2, 0.35, 8, 16),
          new THREE.MeshStandardMaterial({ color: '#e47bb8' })
        );
        garland.rotation.x = Math.PI / 2;
        garland.position.y = 4.8;
        const bell = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.85),
          new THREE.MeshStandardMaterial({ color: '#ffd447', emissive: '#ff9f1c', emissiveIntensity: 0.35 })
        );
        bell.position.y = 9.6;
        tree.add(trunk, cone, garland, bell);
        scene.add(tree);
      }
    }

    const boostPads = [0.14, 0.39, 0.64, 0.86].map((u) => {
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.16, 5.8),
        new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#ff9f1c', emissiveIntensity: 0.55 })
      );
      pad.position.set(pt.x, 0.12, pt.z);
      pad.rotation.y = Math.atan2(tan.x, tan.z);
      scene.add(pad);
      return { u, lane: 0 };
    });

    const itemBoxes = [0.22, 0.52, 0.77].map((u) => {
      const pt = trackCurve.getPointAt(u);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.8, 1.8),
        new THREE.MeshStandardMaterial({ color: '#f46d75', emissive: '#e278b8', emissiveIntensity: 0.4 })
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
        new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#f5b922', emissiveIntensity: 0.65 })
      );
      mesh.position.set(pos.x, 1.6, pos.z);
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
        new THREE.ConeGeometry(1.05, 2.2, 10),
        new THREE.MeshStandardMaterial({ color: '#d92626' })
      );
      mesh.position.set(pos.x, 1.1, pos.z);
      scene.add(mesh);
      return { u, lane, mesh };
    });

    const createKartMesh = (bodyColor: string, driverColor: string, isBoneKart: boolean) => {
      const g = new THREE.Group();
      const chassisMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.35 });
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.85, 3.2), chassisMat);
      chassis.position.y = 0.75;
      g.add(chassis);

      if (isBoneKart) {
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

      const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 12);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheelMat = new THREE.MeshStandardMaterial({ color: '#221b18' });
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

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 14, 14),
        new THREE.MeshStandardMaterial({ color: driverColor })
      );
      head.position.set(0, 1.65, -0.1);
      g.add(head);

      const scarf = new THREE.Mesh(
        new THREE.TorusGeometry(0.62, 0.16, 8, 16),
        new THREE.MeshStandardMaterial({ color: isBoneKart && costume === 'spfc' ? '#d92626' : '#d92626' })
      );
      scarf.rotation.x = Math.PI / 2;
      scarf.position.set(0, 1.25, -0.1);
      g.add(scarf);

      return g;
    };

    // FIXED BUG: Player starts at t = 0.002 on Lap 1 (no instant false lap increment!)
    const racers: Racer[] = [
      {
        name: 'Lucky Boy',
        mesh: createKartMesh('#fff9eb', '#ffffff', true),
        t: 0.002,
        lap: 1,
        laneOffset: 0,
        targetLane: 0,
        speed: 0,
        baseSpeed: 0.118,
        isPlayer: true,
        boostTimer: 0,
        spinTimer: 0,
      },
      {
        name: 'Lully',
        mesh: createKartMesh('#f46d75', '#221b18', false),
        t: 0.012,
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
        mesh: createKartMesh('#ff9f43', '#8b623f', false),
        t: 0.018,
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
        mesh: createKartMesh('#6fd3f7', '#1d3557', false),
        t: 0.024,
        lap: 1,
        laneOffset: -1.5,
        targetLane: -1.5,
        speed: 0.08,
        baseSpeed: 0.08,
        isPlayer: false,
        boostTimer: 0,
        spinTimer: 0,
      },
      {
        name: 'Cupcake Turbo',
        mesh: createKartMesh('#e278b8', '#fff0f5', false),
        t: 0.03,
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
        mesh: createKartMesh('#9f7aea', '#80ed99', false),
        t: 0.036,
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

        const maxSpd = playerRacer.boostTimer > 0 ? 0.145 : drifting ? 0.104 : 0.112;
        if (accel && playerRacer.spinTimer <= 0) {
          playerRacer.speed = Math.min(maxSpd, playerRacer.speed + 0.095 * dt);
        } else if (brake) {
          playerRacer.speed = Math.max(-0.025, playerRacer.speed - 0.12 * dt);
        } else {
          playerRacer.speed *= Math.pow(0.3, dt);
        }

        const steerRate = drifting ? 13.5 : 9.6;
        playerRacer.laneOffset += steer * steerRate * dt;
        playerRacer.laneOffset = Math.max(-TRACK_WIDTH / 2 + 1.5, Math.min(TRACK_WIDTH / 2 - 1.5, playerRacer.laneOffset));

        if (inp.yJustPressed && heldItem) {
          audioSystem.playSfx('boost');
          playerRacer.boostTimer = 2.6;
          bannerText = '🦴 TURBO DE OSSO ATIVADO!';
          bannerTimer = 1.8;
          heldItem = null;
        }

        for (const r of racers) {
          if (!r.isPlayer) {
            r.speed = r.baseSpeed + Math.sin(timeSec * 1.4 + r.laneOffset) * 0.007;
            if (Math.random() < dt * 0.6) {
              r.targetLane = (Math.random() - 0.5) * (TRACK_WIDTH - 4);
            }
            r.laneOffset += (r.targetLane - r.laneOffset) * Math.min(1, dt * 1.8);
          }

          const prevT = r.t;
          r.t += r.speed * dt;
          if (r.t >= 1) {
            r.t -= 1;
            if (prevT > 0.75) {
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
