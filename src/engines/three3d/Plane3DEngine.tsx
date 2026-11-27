import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  CostumeId,
  HudSnapshot,
  LevelCompletionResult,
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

export const Plane3DEngine: React.FC<Props> = ({
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
    scene.background = new THREE.Color('#ffafcc');
    scene.fog = new THREE.Fog('#cdb4db', 35, 165);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      250
    );
    camera.position.set(0, 3.2, 13);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#fff8eb', '#7209b7', 1.15));
    const sun = new THREE.DirectionalLight('#ffd166', 1.25);
    sun.position.set(25, 40, 20);
    scene.add(sun);

    // Lucky Boy's Festive Biplane 3D
    const plane = new THREE.Group();
    const redMat = new THREE.MeshStandardMaterial({ color: '#e63946', roughness: 0.35 });
    const goldMat = new THREE.MeshStandardMaterial({ color: '#ffd166', roughness: 0.3 });
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.72, 3.2, 12), redMat);
    fuselage.rotation.x = Math.PI / 2;
    plane.add(fuselage);

    const wingTop = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.16, 1.1), redMat);
    wingTop.position.set(0, 0.65, -0.2);
    const wingBot = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 1.0), goldMat);
    wingBot.position.set(0, -0.35, -0.2);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.7), goldMat);
    tail.position.set(0, 0.25, 1.4);
    const propeller = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.2, 0.08),
      new THREE.MeshStandardMaterial({ color: '#fff8eb' })
    );
    propeller.position.set(0, 0, -1.7);
    const luckyHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 12, 12),
      new THREE.MeshStandardMaterial({ color: '#ffffff' })
    );
    luckyHead.position.set(0, 0.65, 0.2);
    plane.add(wingTop, wingBot, tail, propeller, luckyHead);
    scene.add(plane);

    // Decorative Cotton-Candy Clouds
    const clouds: THREE.Group[] = [];
    for (let i = 0; i < 28; i++) {
      const cg = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? '#ffffff' : '#ffe5ec', roughness: 0.9 });
      for (let j = 0; j < 3; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(2.5 + Math.random() * 2, 10, 10), mat);
        puff.position.set((j - 1) * 2.4, Math.random() * 1.2, 0);
        cg.add(puff);
      }
      cg.position.set((Math.random() - 0.5) * 65, (Math.random() - 0.5) * 24 - 4, -Math.random() * 150);
      scene.add(cg);
      clouds.push(cg);
    }

    // Dynamic Entities
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

    // Boss: Lula's Robotic Airship (appears at 100% flight distance)
    const airship = new THREE.Group();
    const balloon = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 18, 14),
      new THREE.MeshStandardMaterial({ color: '#5a189a', roughness: 0.4 })
    );
    balloon.scale.set(1.5, 0.9, 1.1);
    const stripe = new THREE.Mesh(
      new THREE.TorusGeometry(3.8, 0.4, 10, 20),
      new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ff9f1c', emissiveIntensity: 0.35 })
    );
    stripe.rotation.y = Math.PI / 2;
    const gondola = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 1.6, 2.2),
      new THREE.MeshStandardMaterial({ color: '#240046' })
    );
    gondola.position.y = -4.2;
    airship.add(balloon, stripe, gondola);
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
    let flightProgress = 0; // 0..100, at 100 boss arrives
    let bossActive = false;
    let bossHp = 18;
    const bossMaxHp = 18;
    let bossFireTimer = 1.4;
    let spawnTimer = 0.6;
    let timeSec = 0;
    let bannerText = '✈️ Passe pelos anéis, destrua drones e vença o Dirigível do Lula!';
    let bannerTimer = 3.2;
    let finished = false;
    let hudTick = 0;

    const firePlayerBullet = (triple = false) => {
      audioSystem.playSfx('shoot');
      const offsets = triple ? [-1.3, 0, 1.3] : [0];
      for (const ox of offsets) {
        const b = new THREE.Mesh(
          new THREE.SphereGeometry(triple ? 0.42 : 0.3, 8, 8),
          new THREE.MeshStandardMaterial({ color: triple ? '#ffd166' : '#00f5d4', emissive: '#ffd166', emissiveIntensity: 0.7 })
        );
        b.position.set(px + ox, py, -1.8);
        scene.add(b);
        bullets.push({ mesh: b, vx: ox * 2, vy: 0, vz: -75, fromPlayer: true });
      }
    };

    const spawnWave = () => {
      const r = Math.random();
      const sx = (Math.random() - 0.5) * 16;
      const sy = (Math.random() - 0.5) * 9;

      // Spawn the 3 Golden Paws evenly along flight
      if (pawsSpawned < 3 && flightProgress > (pawsSpawned + 1) * 26) {
        const pawMesh = new THREE.Mesh(
          new THREE.OctahedronGeometry(1.1),
          new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ff9f1c', emissiveIntensity: 0.8 })
        );
        pawMesh.position.set(sx * 0.7, sy * 0.7, -95);
        scene.add(pawMesh);
        entities.push({ mesh: pawMesh, kind: 'paw', pawIndex: pawsSpawned, hp: 1, alive: true });
        pawsSpawned++;
        return;
      }

      if (r < 0.35) {
        // Golden Ring
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(2.3, 0.28, 10, 22),
          new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ffb703', emissiveIntensity: 0.5 })
        );
        ring.position.set(sx * 0.8, sy * 0.8, -100);
        scene.add(ring);
        entities.push({ mesh: ring, kind: 'ring', hp: 1, alive: true });
      } else if (r < 0.72) {
        // Mechanical Drone Target
        const drone = new THREE.Mesh(
          new THREE.OctahedronGeometry(1.35),
          new THREE.MeshStandardMaterial({ color: '#e63946', emissive: '#9d0208', emissiveIntensity: 0.35 })
        );
        drone.position.set(sx, sy, -100);
        scene.add(drone);
        entities.push({ mesh: drone, kind: 'drone', hp: 2, alive: true });
      } else {
        // Electric Storm Cloud
        const storm = new THREE.Mesh(
          new THREE.DodecahedronGeometry(2.1),
          new THREE.MeshStandardMaterial({ color: '#3c096c', emissive: '#7209b7', emissiveIntensity: 0.5 })
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
      audioSystem.playSfx('hurt');
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

        // Plane movement
        const boost = inp.a ? 1.5 : 1.0;
        const dx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
        const dy = (inp.up ? 1 : 0) - (inp.down ? 1 : 0);
        px = Math.max(-10, Math.min(10, px + dx * 15 * dt));
        py = Math.max(-5.5, Math.min(5.5, py + dy * 12 * dt));

        // Barrel Roll (X)
        if (inp.xJustPressed && rollCooldown <= 0) {
          rollTimer = 0.45;
          rollCooldown = 1.2;
          audioSystem.playSfx('boost');
        }

        // Fire (B) & Special Triple Fire (Y)
        if (inp.b && shootCooldown <= 0) {
          shootCooldown = 0.2;
          firePlayerBullet(false);
        }
        if (inp.yJustPressed && specialCooldown <= 0) {
          specialCooldown = 2.0;
          firePlayerBullet(true);
        }

        plane.position.set(px, py, 0);
        plane.rotation.z = rollTimer > 0 ? rollTimer * Math.PI * 4.5 : -dx * 0.42;
        plane.rotation.x = dy * 0.25;
        plane.visible = invuln <= 0 || Math.floor(timeSec * 15) % 2 === 0;
        propeller.rotation.z += dt * 32;

        // Scroll Cotton Candy Clouds
        for (const c of clouds) {
          c.position.z += 38 * boost * dt;
          if (c.position.z > 20) {
            c.position.z = -140 - Math.random() * 20;
            c.position.x = (Math.random() - 0.5) * 65;
          }
        }

        // Flight progress toward Airship Boss
        if (!bossActive) {
          flightProgress = Math.min(100, flightProgress + dt * 3.8 * boost);
          spawnTimer -= dt;
          if (spawnTimer <= 0) {
            spawnTimer = 0.85;
            spawnWave();
          }
          if (flightProgress >= 100) {
            bossActive = true;
            airship.visible = true;
            bannerText = '🎈 CHEFE: Dirigível Robótico do Lula! Atire com B e Y!';
            bannerTimer = 3.5;
            audioSystem.playSfx('super_bark');
          }
        } else {
          // Move Airship smoothly in front of player
          const targetZ = -26;
          airship.position.z += (targetZ - airship.position.z) * Math.min(1, dt * 2);
          airship.position.x = Math.sin(timeSec * 1.15) * 7.5;
          airship.position.y = Math.cos(timeSec * 1.6) * 2.8 + 1.0;
          airship.rotation.z = Math.sin(timeSec * 1.15) * 0.12;

          bossFireTimer -= dt;
          if (bossFireTimer <= 0) {
            bossFireTimer = 1.25;
            const eb = new THREE.Mesh(
              new THREE.SphereGeometry(0.7, 10, 10),
              new THREE.MeshStandardMaterial({ color: '#ff006e', emissive: '#ff006e', emissiveIntensity: 0.7 })
            );
            eb.position.copy(airship.position);
            scene.add(eb);
            const aim = new THREE.Vector3(px - airship.position.x, py - airship.position.y, -airship.position.z).normalize();
            bullets.push({ mesh: eb, vx: aim.x * 28, vy: aim.y * 28, vz: aim.z * 28, fromPlayer: false });
          }
        }

        // Update Entities
        for (let i = entities.length - 1; i >= 0; i--) {
          const e = entities[i];
          e.mesh.position.z += 42 * boost * dt;
          if (e.kind === 'drone' || e.kind === 'paw') {
            e.mesh.rotation.y += dt * 3;
          }
          const dist = e.mesh.position.distanceTo(plane.position);
          if (e.kind === 'ring' && dist < 2.9 && e.alive) {
            e.alive = false;
            treatsCollected += 3;
            audioSystem.playSfx('treat');
            scene.remove(e.mesh);
          } else if (e.kind === 'paw' && dist < 2.5 && e.alive) {
            e.alive = false;
            goldenPaws[e.pawIndex!] = true;
            audioSystem.playSfx('paw');
            bannerText = `🐾 Patinha Dourada #${e.pawIndex! + 1} pega no céu!`;
            bannerTimer = 2.0;
            scene.remove(e.mesh);
          } else if ((e.kind === 'drone' || e.kind === 'storm') && dist < 2.4 && e.alive) {
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

        // Update Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.mesh.position.x += b.vx * dt;
          b.mesh.position.y += b.vy * dt;
          b.mesh.position.z += b.vz * dt;

          let remove = b.mesh.position.z < -115 || b.mesh.position.z > 20;

          if (!remove && b.fromPlayer) {
            for (const e of entities) {
              if (e.alive && e.kind === 'drone' && b.mesh.position.distanceTo(e.mesh.position) < 2.3) {
                e.hp--;
                remove = true;
                if (e.hp <= 0) {
                  e.alive = false;
                  treatsCollected += 2;
                  audioSystem.playSfx('enemy_defeat');
                  scene.remove(e.mesh);
                }
                break;
              }
            }
            if (!remove && bossActive && b.mesh.position.distanceTo(airship.position) < 5.5) {
              bossHp--;
              remove = true;
              audioSystem.playSfx('enemy_defeat');
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
            if (b.mesh.position.distanceTo(plane.position) < 1.9) {
              damagePlayer();
              remove = true;
            }
          }

          if (remove) {
            scene.remove(b.mesh);
            bullets.splice(i, 1);
          }
        }

        // Subtle camera follow
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
  }, [lives, onHudUpdate, onFinish, onPauseRequest]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};
