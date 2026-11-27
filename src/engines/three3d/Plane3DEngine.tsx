import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  CostumeId,
  HudSnapshot,
  LevelCompletionResult,
} from '../../types/game';
import { inputManager } from '../../systems/inputSystem';
import { audioSystem } from '../../systems/audioSystem';
import { haptics } from '../../systems/haptics';
import { createLucky3D } from './models3d';

interface Props {
  costume: CostumeId;
  lives: number;
  paused: boolean;
  onHudUpdate: (hud: HudSnapshot) => void;
  onFinish: (result: LevelCompletionResult) => void;
  onPauseRequest: () => void;
}

export const Plane3DEngine: React.FC<Props> = ({
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
    scene.fog = new THREE.Fog('#d8f4ff', 42, 185);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      260
    );
    camera.position.set(0, 3.2, 13);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#ffffff', '#f46d75', 1.25));
    const sun = new THREE.DirectionalLight('#fff6cc', 1.35);
    sun.position.set(25, 45, 25);
    scene.add(sun);

    // Rainbow Arch in the Distant Cotton-Candy Sky!
    const rainbowCols = ['#f46d75', '#ff9f43', '#ffe055', '#69b543', '#6fd3f7', '#b38cd9'];
    rainbowCols.forEach((col, i) => {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(62 - i * 2.2, 1.1, 8, 48, Math.PI),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.45 })
      );
      arc.position.set(0, -18, -145);
      scene.add(arc);
    });

    // Detailed 3D Festive Biplane with Struts, Tail Fin, Wheels, Spinning Blur Disc & Detailed Lucky 3D!
    const plane = new THREE.Group();
    const redMat = new THREE.MeshStandardMaterial({ color: '#d92626', roughness: 0.3, metalness: 0.15 });
    const goldMat = new THREE.MeshStandardMaterial({ color: '#ffe055', roughness: 0.28, metalness: 0.25 });
    const creamMat = new THREE.MeshStandardMaterial({ color: '#fff9eb', roughness: 0.4 });
    const darkMat = new THREE.MeshStandardMaterial({ color: '#221b18', roughness: 0.6 });

    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.78, 3.5, 14), redMat);
    fuselage.rotation.x = Math.PI / 2;
    const noseCone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.65, 14), goldMat);
    noseCone.rotation.x = -Math.PI / 2;
    noseCone.position.z = -2.0;

    const wingTop = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.16, 1.15), redMat);
    wingTop.position.set(0, 0.78, -0.2);
    const wingBot = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.16, 1.05), creamMat);
    wingBot.position.set(0, -0.35, -0.2);
    const wingStripe = new THREE.Mesh(new THREE.BoxGeometry(5.55, 0.18, 0.24), goldMat);
    wingStripe.position.set(0, 0.78, -0.2);

    // Wing Struts
    const strutGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.15, 8);
    [-1.65, 1.65].forEach((sx) => {
      const s = new THREE.Mesh(strutGeo, goldMat);
      s.position.set(sx, 0.22, -0.2);
      plane.add(s);
    });

    // Tail Wing + Vertical Rudder
    const tailH = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 0.7), goldMat);
    tailH.position.set(0, 0.22, 1.55);
    const tailV = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.15, 0.85), redMat);
    tailV.position.set(0, 0.68, 1.55);

    // Landing Gear Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.18, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    [-0.75, 0.75].forEach((wx) => {
      const w = new THREE.Mesh(wheelGeo, darkMat);
      w.position.set(wx, -0.78, -0.5);
      plane.add(w);
    });

    // Propeller + Blur Disc
    const propeller = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 0.08), creamMat);
    propeller.position.set(0, 0, -2.3);
    const propBlur = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 1.05, 20),
      new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide, transparent: true, opacity: 0.25 })
    );
    propBlur.position.set(0, 0, -2.28);

    // Detailed Lucky Boy in Cockpit!
    const luckyPilot = createLucky3D(costume === 'classic' ? 'pilot' : costume, 0.56);
    luckyPilot.position.set(0, 0.2, 0.22);
    luckyPilot.rotation.y = Math.PI;

    // Aiming crosshair ring ahead of plane
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.85, 22),
      new THREE.MeshBasicMaterial({ color: '#d92626', side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
    );
    reticle.position.set(0, 0, -15);

    plane.add(fuselage, noseCone, wingTop, wingBot, wingStripe, tailH, tailV, propeller, propBlur, luckyPilot, reticle);
    scene.add(plane);

    // Fluffy Cotton-Candy Clouds
    const clouds: THREE.Group[] = [];
    for (let i = 0; i < 30; i++) {
      const cg = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? '#ffd6e6' : '#ffffff', roughness: 0.92 });
      for (let j = 0; j < 4; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(2.4 + Math.random() * 2.2, 10, 10), mat);
        puff.position.set((j - 1.5) * 2.1, Math.random() * 1.4, (Math.random() - 0.5) * 1.5);
        cg.add(puff);
      }
      cg.position.set((Math.random() - 0.5) * 70, (Math.random() - 0.5) * 24 - 4, -Math.random() * 155);
      scene.add(cg);
      clouds.push(cg);
    }

    interface SkyEntity {
      mesh: THREE.Object3D;
      kind: 'ring' | 'drone' | 'storm' | 'paw';
      pawIndex?: number;
      hp: number;
      alive: boolean;
    }
    const entities: SkyEntity[] = [];

    interface Bullet {
      mesh: THREE.Mesh;
      vz: number;
      fromPlayer: boolean;
      vx: number;
      vy: number;
    }
    const bullets: Bullet[] = [];

    interface Puff3D {
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      life: number;
    }
    const puffs: Puff3D[] = [];
    const puffGeo = new THREE.SphereGeometry(0.32, 8, 8);

    const spawnBurst = (pos: THREE.Vector3, color: string, count = 10) => {
      for (let i = 0; i < count; i++) {
        const m = new THREE.Mesh(puffGeo, new THREE.MeshBasicMaterial({ color }));
        m.position.copy(pos);
        scene.add(m);
        puffs.push({
          mesh: m,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.5) * 16,
          vz: (Math.random() - 0.5) * 12,
          life: 0.55,
        });
      }
    };

    // Detailed Boss: Lula's Robotic Airship (Striped Hull + Side Propellers + Glowing Cabin!)
    const airship = new THREE.Group();
    const balloonMat = new THREE.MeshStandardMaterial({ color: '#7c3aed', roughness: 0.35 });
    const balloon = new THREE.Mesh(new THREE.SphereGeometry(4.3, 20, 16), balloonMat);
    balloon.scale.set(1.55, 0.9, 1.1);
    const stripe1 = new THREE.Mesh(
      new THREE.TorusGeometry(3.85, 0.42, 10, 24),
      new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#ff9f1c', emissiveIntensity: 0.4 })
    );
    stripe1.rotation.y = Math.PI / 2;
    const stripe2 = stripe1.clone();
    stripe2.position.x = -2.2;
    stripe2.scale.setScalar(0.84);
    const stripe3 = stripe1.clone();
    stripe3.position.x = 2.2;
    stripe3.scale.setScalar(0.84);
    const gondola = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 1.8, 2.4),
      new THREE.MeshStandardMaterial({ color: '#221b18', roughness: 0.5 })
    );
    gondola.position.y = -4.2;
    const cabinWindow = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.75, 2.5),
      new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#ffe055', emissiveIntensity: 0.75 })
    );
    cabinWindow.position.y = -4.1;
    const sideRotorL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.6, 0.35), goldMat);
    sideRotorL.position.set(-4.6, -1.8, 1.6);
    const sideRotorR = sideRotorL.clone();
    sideRotorR.position.x = 4.6;
    airship.add(balloon, stripe1, stripe2, stripe3, gondola, cabinWindow, sideRotorL, sideRotorR);
    airship.position.set(0, 1, -85);
    airship.visible = false;
    scene.add(airship);

    let px = 0;
    let py = 0;
    let hearts = 4;
    const maxHearts = 4;
    let invuln = 0;
    let rollTimer = 0;
    let rollCooldown = 0;
    let shootCooldown = 0;
    let specialCooldown = 0;
    let treatsCollected = 0;
    const goldenPaws: [boolean, boolean, boolean] = [false, false, false];
    let pawsSpawned = 0;
    let flightProgress = 0;
    let bossActive = false;
    let bossHp = 16;
    const bossMaxHp = 16;
    let bossHurtFlash = 0;
    let bossFireTimer = 1.5;
    let spawnTimer = 0.6;
    let timeSec = 0;
    let bannerText = '✈️ Passe pelos anéis, atire com B/Y e vença o Dirigível do Lula!';
    let bannerTimer = 3.2;
    let finished = false;
    let hudTick = 0;

    const firePlayerBullet = (triple = false) => {
      audioSystem.playSfx('shoot');
      const offsets = triple ? [-1.3, 0, 1.3] : [0];
      for (const ox of offsets) {
        const b = new THREE.Mesh(
          new THREE.SphereGeometry(triple ? 0.45 : 0.35, 8, 8),
          new THREE.MeshStandardMaterial({ color: triple ? '#ffe055' : '#ff5d6c', emissive: '#ff9f1c', emissiveIntensity: 0.75 })
        );
        b.position.set(px + ox, py, -1.8);
        scene.add(b);
        bullets.push({ mesh: b, vx: ox * 1.5, vy: 0, vz: -78, fromPlayer: true });
      }
    };

    const spawnWave = () => {
      const r = Math.random();
      const sx = (Math.random() - 0.5) * 15;
      const sy = (Math.random() - 0.5) * 8.5;

      if (pawsSpawned < 3 && flightProgress > (pawsSpawned + 1) * 26) {
        const pawMesh = new THREE.Mesh(
          new THREE.OctahedronGeometry(1.2),
          new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#f5b922', emissiveIntensity: 0.85 })
        );
        pawMesh.position.set(sx * 0.65, sy * 0.65, -95);
        scene.add(pawMesh);
        entities.push({ mesh: pawMesh, kind: 'paw', pawIndex: pawsSpawned, hp: 1, alive: true });
        pawsSpawned++;
        return;
      }

      if (r < 0.38) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(2.5, 0.34, 12, 24),
          new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#f5b922', emissiveIntensity: 0.55 })
        );
        ring.position.set(sx * 0.75, sy * 0.75, -100);
        scene.add(ring);
        entities.push({ mesh: ring, kind: 'ring', hp: 1, alive: true });
      } else if (r < 0.75) {
        const drone = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.OctahedronGeometry(1.35),
          new THREE.MeshStandardMaterial({ color: '#d92626', metalness: 0.35, roughness: 0.3 })
        );
        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(1.5, 0.16, 8, 16),
          new THREE.MeshStandardMaterial({ color: '#ffe055' })
        );
        drone.add(body, halo);
        drone.position.set(sx, sy, -100);
        scene.add(drone);
        entities.push({ mesh: drone, kind: 'drone', hp: 2, alive: true });
      } else {
        const storm = new THREE.Mesh(
          new THREE.DodecahedronGeometry(2.0),
          new THREE.MeshStandardMaterial({ color: '#6b2fa0', emissive: '#9f7aea', emissiveIntensity: 0.45 })
        );
        storm.position.set(sx, sy, -100);
        scene.add(storm);
        entities.push({ mesh: storm, kind: 'storm', hp: 99, alive: true });
      }
    };

    const damagePlayer = () => {
      if (invuln > 0 || rollTimer > 0) return;
      hearts--;
      invuln = 1.4;
      haptics.hurt();
      audioSystem.playSfx('hurt');
      spawnBurst(plane.position, '#d92626', 8);
      if (hearts <= 0) {
        finished = true;
        onFinish({
          levelId: 6,
          won: false,
          treatsCollected,
          goldenPaws,
          timeSec,
          heartsRemaining: 0,
          starsEarned: 0,
        });
      }
    };

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
        if (invuln > 0) invuln -= dt;
        if (rollTimer > 0) rollTimer -= dt;
        if (rollCooldown > 0) rollCooldown -= dt;
        if (shootCooldown > 0) shootCooldown -= dt;
        if (specialCooldown > 0) specialCooldown -= dt;
        if (bossHurtFlash > 0) {
          bossHurtFlash -= dt;
          balloonMat.emissive.set(bossHurtFlash > 0 ? '#ffffff' : '#000000');
          balloonMat.emissiveIntensity = bossHurtFlash > 0 ? 0.65 : 0;
        }

        const boost = inp.a ? 1.5 : 1.0;
        const dx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
        const dy = (inp.up ? 1 : 0) - (inp.down ? 1 : 0);
        px = Math.max(-10, Math.min(10, px + dx * 15.5 * dt));
        py = Math.max(-5.5, Math.min(5.5, py + dy * 12.5 * dt));

        if (inp.xJustPressed && rollCooldown <= 0) {
          rollTimer = 0.45;
          rollCooldown = 1.1;
          haptics.bounce();
          audioSystem.playSfx('boost');
        }

        if (inp.b && shootCooldown <= 0) {
          shootCooldown = 0.19;
          firePlayerBullet(false);
        }
        if (inp.yJustPressed && specialCooldown <= 0) {
          specialCooldown = 1.8;
          firePlayerBullet(true);
        }

        plane.position.set(px, py, 0);
        plane.rotation.z = rollTimer > 0 ? rollTimer * Math.PI * 4.5 : -dx * 0.42;
        plane.rotation.x = dy * 0.25;
        plane.visible = invuln <= 0 || Math.floor(timeSec * 15) % 2 === 0;
        propeller.rotation.z += dt * 36;
        sideRotorL.rotation.z += dt * 16;
        sideRotorR.rotation.z -= dt * 16;

        // Plane smoke trail
        if (Math.random() < 0.45) {
          const trail = new THREE.Mesh(puffGeo, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.65 }));
          trail.position.set(px, py, 1.9);
          scene.add(trail);
          puffs.push({ mesh: trail, vx: 0, vy: 0.3, vz: 18 * boost, life: 0.4 });
        }

        for (let i = puffs.length - 1; i >= 0; i--) {
          const pf = puffs[i];
          pf.life -= dt;
          pf.mesh.position.x += pf.vx * dt;
          pf.mesh.position.y += pf.vy * dt;
          pf.mesh.position.z += pf.vz * dt;
          pf.mesh.scale.setScalar(Math.max(0.01, pf.life * 2.2));
          if (pf.life <= 0) {
            scene.remove(pf.mesh);
            puffs.splice(i, 1);
          }
        }

        for (const c of clouds) {
          c.position.z += 38 * boost * dt;
          if (c.position.z > 20) {
            c.position.z = -140 - Math.random() * 20;
            c.position.x = (Math.random() - 0.5) * 70;
          }
        }

        if (!bossActive) {
          flightProgress = Math.min(100, flightProgress + dt * 4.2 * boost);
          spawnTimer -= dt;
          if (spawnTimer <= 0) {
            spawnTimer = 0.85;
            spawnWave();
          }
          if (flightProgress >= 100) {
            bossActive = true;
            airship.visible = true;
            bannerText = '🎈 CHEFE: Dirigível Robótico do Lula! Mire e atire com B e Y!';
            bannerTimer = 3.5;
            audioSystem.playSfx('super_bark');
          }
        } else {
          airship.position.z += (-25 - airship.position.z) * Math.min(1, dt * 2.2);
          airship.position.x = Math.sin(timeSec * 1.1) * 7.2;
          airship.position.y = Math.cos(timeSec * 1.5) * 2.6 + 0.8;
          airship.rotation.z = Math.sin(timeSec * 1.1) * 0.12;

          bossFireTimer -= dt;
          if (bossFireTimer <= 0) {
            bossFireTimer = 1.35;
            const eb = new THREE.Mesh(
              new THREE.SphereGeometry(0.7, 10, 10),
              new THREE.MeshStandardMaterial({ color: '#d92626', emissive: '#ff5d6c', emissiveIntensity: 0.7 })
            );
            eb.position.copy(airship.position);
            scene.add(eb);
            const aim = new THREE.Vector3(px - airship.position.x, py - airship.position.y, -airship.position.z).normalize();
            bullets.push({ mesh: eb, vx: aim.x * 26, vy: aim.y * 26, vz: aim.z * 26, fromPlayer: false });
          }
        }

        for (let i = entities.length - 1; i >= 0; i--) {
          const e = entities[i];
          e.mesh.position.z += 42 * boost * dt;
          if (e.kind === 'drone' || e.kind === 'paw') e.mesh.rotation.y += dt * 3;
          const dist = e.mesh.position.distanceTo(plane.position);
          if (e.kind === 'ring' && dist < 3.2 && e.alive) {
            e.alive = false;
            treatsCollected += 3;
            haptics.dpad();
            audioSystem.playSfx('treat');
            spawnBurst(e.mesh.position, '#ffe055', 8);
            scene.remove(e.mesh);
          } else if (e.kind === 'paw' && dist < 2.8 && e.alive) {
            e.alive = false;
            goldenPaws[e.pawIndex!] = true;
            haptics.collect();
            audioSystem.playSfx('paw');
            spawnBurst(e.mesh.position, '#ffe055', 14);
            bannerText = `🐾 Patinha Dourada #${e.pawIndex! + 1} pega no céu!`;
            bannerTimer = 2.0;
            scene.remove(e.mesh);
          } else if ((e.kind === 'drone' || e.kind === 'storm') && dist < 2.2 && e.alive) {
            damagePlayer();
            if (e.kind === 'drone') {
              e.alive = false;
              scene.remove(e.mesh);
            }
          }

          if (!e.alive || e.mesh.position.z > 16) {
            scene.remove(e.mesh);
            entities.splice(i, 1);
          }
        }

        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.mesh.position.x += b.vx * dt;
          b.mesh.position.y += b.vy * dt;
          b.mesh.position.z += b.vz * dt;

          let remove = b.mesh.position.z < -115 || b.mesh.position.z > 20;

          if (!remove && b.fromPlayer) {
            for (const e of entities) {
              if (e.alive && e.kind === 'drone' && b.mesh.position.distanceTo(e.mesh.position) < 2.8) {
                e.hp--;
                remove = true;
                if (e.hp <= 0) {
                  e.alive = false;
                  treatsCollected += 2;
                  haptics.impact();
                  audioSystem.playSfx('enemy_defeat');
                  spawnBurst(e.mesh.position, '#ff9f43', 12);
                  scene.remove(e.mesh);
                }
                break;
              }
            }
            if (!remove && bossActive && b.mesh.position.distanceTo(airship.position) < 6.0) {
              bossHp--;
              bossHurtFlash = 0.16;
              remove = true;
              haptics.impact();
              audioSystem.playSfx('enemy_defeat');
              spawnBurst(b.mesh.position, '#ffe055', 10);
              if (bossHp <= 0) {
                finished = true;
                audioSystem.playSfx('win');
                const pawsCount = goldenPaws.filter(Boolean).length;
                const starsEarned = Math.min(3, 1 + (pawsCount >= 2 ? 1 : 0) + (hearts >= 2 ? 1 : 0));
                onFinish({
                  levelId: 6,
                  won: true,
                  treatsCollected: treatsCollected + 15,
                  goldenPaws,
                  timeSec,
                  heartsRemaining: hearts,
                  starsEarned,
                  extraNote: 'Dirigível Robótico do Lula destruído!',
                });
              }
            }
          } else if (!remove && !b.fromPlayer) {
            if (b.mesh.position.distanceTo(plane.position) < 1.8) {
              damagePlayer();
              remove = true;
            }
          }

          if (remove) {
            scene.remove(b.mesh);
            bullets.splice(i, 1);
          }
        }

        camera.position.x += (px * 0.32 - camera.position.x) * Math.min(1, dt * 5);
        camera.position.y += (py * 0.25 + 2.8 - camera.position.y) * Math.min(1, dt * 5);
        camera.lookAt(px * 0.25, py * 0.15, -20);

        hudTick += dt;
        if (hudTick > 0.08) {
          hudTick = 0;
          onHudUpdate({
            hearts,
            maxHearts,
            treats: treatsCollected,
            lives,
            goldenPaws: [...goldenPaws] as [boolean, boolean, boolean],
            activePower: null,
            powerTimer: 0,
            hasShield: rollTimer > 0,
            progressLabel: bossActive ? '🎈 Batalha Aérea!' : `✈️ Voo: ${Math.round(flightProgress)}%`,
            bossName: bossActive ? 'Dirigível Robótico do Lula' : undefined,
            bossHp: bossActive ? Math.max(0, bossHp) : undefined,
            bossMaxHp: bossActive ? bossMaxHp : undefined,
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
