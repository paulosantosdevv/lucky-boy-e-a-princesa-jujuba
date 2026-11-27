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
  onSpecialYLabelChange?: (label?: string) => void;
}

export const Boss3DEngine: React.FC<Props> = ({
  costume,
  lives,
  paused,
  onHudUpdate,
  onFinish,
  onPauseRequest,
  onSpecialYLabelChange,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#14082e');
    scene.fog = new THREE.Fog('#240046', 32, 120);

    const camera = new THREE.PerspectiveCamera(
      58,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      200
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#ffd6ff', '#1b0a33', 1.1));
    const keyLight = new THREE.DirectionalLight('#ffd166', 1.35);
    keyLight.position.set(16, 30, 18);
    scene.add(keyLight);

    // Grand Circular Fortress Arena
    const ARENA_R = 17.5;
    const arenaFloor = new THREE.Mesh(
      new THREE.CylinderGeometry(ARENA_R, ARENA_R + 1.5, 1.4, 36),
      new THREE.MeshStandardMaterial({ color: '#3c1361', roughness: 0.75 })
    );
    arenaFloor.position.y = -0.7;
    scene.add(arenaFloor);

    const goldRing = new THREE.Mesh(
      new THREE.TorusGeometry(ARENA_R - 0.3, 0.35, 10, 48),
      new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ff9f1c', emissiveIntensity: 0.35 })
    );
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = 0.08;
    scene.add(goldRing);

    // Crooked Fortress Pillars & Princesa Jujuba's glowing tower cage in background
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const pil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 1.3, 14, 10),
        new THREE.MeshStandardMaterial({ color: '#240046' })
      );
      pil.position.set(Math.cos(ang) * (ARENA_R + 3), 6, Math.sin(ang) * (ARENA_R + 3));
      pil.rotation.z = Math.sin(i) * 0.14;
      scene.add(pil);
    }

    // Princesa Jujuba glowing crystal platform at North side (-Z)
    const jujubaGroup = new THREE.Group();
    jujubaGroup.position.set(0, 4.5, -ARENA_R - 3.5);
    const dress = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 3.2, 12),
      new THREE.MeshStandardMaterial({ color: '#e63946' })
    );
    const jHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 14, 14),
      new THREE.MeshStandardMaterial({ color: '#ffe5c4' })
    );
    jHead.position.y = 2.1;
    const jHair = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 14, 14),
      new THREE.MeshStandardMaterial({ color: '#ffe066', emissive: '#ffd166', emissiveIntensity: 0.25 })
    );
    jHair.position.set(0, 2.25, -0.2);
    const cage = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 5.2, 12, 1, true),
      new THREE.MeshStandardMaterial({ color: '#90e0ef', transparent: true, opacity: 0.28, wireframe: true })
    );
    cage.position.y = 1.2;
    jujubaGroup.add(dress, jHead, jHair, cage);
    scene.add(jujubaGroup);

    // Lucky Boy 3D Hero
    const luckyGroup = new THREE.Group();
    const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.95, 14, 14), whiteMat);
    body.scale.set(1.0, 0.85, 1.25);
    body.position.y = 0.9;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.75, 14, 14), whiteMat);
    head.position.set(0, 1.55, 0.72);
    const scarf = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.16, 8, 16),
      new THREE.MeshStandardMaterial({ color: costume === 'spfc' ? '#e63946' : '#e63946' })
    );
    scarf.rotation.x = Math.PI / 2;
    scarf.position.set(0, 1.15, 0.55);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), whiteMat);
    tail.position.set(0, 1.15, -1.05);
    luckyGroup.add(body, head, scarf, tail);
    scene.add(luckyGroup);

    // ========================================================
    // STAGE 1: ÁRVORE DA DESTRUIÇÃO (Robotic Christmas Tree + 3 Cores)
    // ========================================================
    const treeBossGroup = new THREE.Group();
    const treeCone1 = new THREE.Mesh(
      new THREE.ConeGeometry(4.4, 5.5, 12),
      new THREE.MeshStandardMaterial({ color: '#1b4332' })
    );
    treeCone1.position.y = 3.2;
    const treeCone2 = new THREE.Mesh(
      new THREE.ConeGeometry(3.2, 4.5, 12),
      new THREE.MeshStandardMaterial({ color: '#2d6a4f' })
    );
    treeCone2.position.y = 6.5;
    treeBossGroup.add(treeCone1, treeCone2);

    const treeCores = [0, 1, 2].map((i) => {
      const ang = (i / 3) * Math.PI * 2;
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.95),
        new THREE.MeshStandardMaterial({ color: '#ffbe0b', emissive: '#ff5d8f', emissiveIntensity: 0.7 })
      );
      core.position.set(Math.cos(ang) * 4.2, 2.0, Math.sin(ang) * 4.2);
      treeBossGroup.add(core);
      return { mesh: core, hp: 3, alive: true };
    });
    scene.add(treeBossGroup);

    // ========================================================
    // STAGE 2: RELÓGIO DA MEIA-NOITE (3 Elevated Gears + Crystals)
    // ========================================================
    const clockGroup = new THREE.Group();
    clockGroup.visible = false;
    const clockFace = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 3.6, 0.5, 24),
      new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ff9f1c', emissiveIntensity: 0.25 })
    );
    clockFace.rotation.x = Math.PI / 2;
    clockFace.position.set(0, 6.2, 0);
    const clockHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 3.0, 0.35),
      new THREE.MeshStandardMaterial({ color: '#e63946' })
    );
    clockHand.position.set(0, 6.2, 0.4);
    clockGroup.add(clockFace, clockHand);

    const clockCrystals = [0, 1, 2].map((i) => {
      const ang = (i / 3) * Math.PI * 2 + 0.5;
      const dist = 9.5;
      const plat = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 2.6, 0.6, 12),
        new THREE.MeshStandardMaterial({ color: '#ff9f1c' })
      );
      plat.position.set(Math.cos(ang) * dist, 1.8, Math.sin(ang) * dist);
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.0),
        new THREE.MeshStandardMaterial({ color: '#00f5d4', emissive: '#00bbf9', emissiveIntensity: 0.8 })
      );
      crystal.position.set(Math.cos(ang) * dist, 3.6, Math.sin(ang) * dist);
      clockGroup.add(plat, crystal);
      return { plat, crystal, x: Math.cos(ang) * dist, z: Math.sin(ang) * dist, active: true };
    });
    scene.add(clockGroup);

    // ========================================================
    // STAGE 3 & 4: LULA SUPREMO -> LULA EMOCIONADO (O Último Petisco)
    // ========================================================
    const lulaGroup = new THREE.Group();
    lulaGroup.visible = false;
    const lulaCoat = new THREE.Mesh(
      new THREE.ConeGeometry(2.4, 5.0, 12),
      new THREE.MeshStandardMaterial({ color: '#5a189a', emissive: '#3c096c', emissiveIntensity: 0.3 })
    );
    lulaCoat.position.y = 2.6;
    const lulaHead = new THREE.Mesh(
      new THREE.SphereGeometry(1.55, 14, 14),
      new THREE.MeshStandardMaterial({ color: '#c77dff' })
    );
    lulaHead.position.y = 5.6;
    const lulaGoggles = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.55, 0.6),
      new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ffb703', emissiveIntensity: 0.4 })
    );
    lulaGoggles.position.set(0, 6.2, 1.3);
    lulaGroup.add(lulaCoat, lulaHead, lulaGoggles);
    scene.add(lulaGroup);

    // 3 Golden Paws in Arena corners
    const goldenPawMeshes = [
      { x: -12, z: -7, collected: false },
      { x: 12, z: -7, collected: false },
      { x: 0, z: 12, collected: false },
    ].map((gp) => {
      const m = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.9),
        new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ffb703', emissiveIntensity: 0.7 })
      );
      m.position.set(gp.x, 1.6, gp.z);
      scene.add(m);
      return { ...gp, mesh: m };
    });

    // Projectiles & Shockwaves
    interface BossProj {
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      fromPlayer: boolean;
      life: number;
    }
    const projs: BossProj[] = [];

    interface ShockRing {
      mesh: THREE.Mesh;
      radius: number;
    }
    const rings: ShockRing[] = [];

    // State
    let stage: 1 | 2 | 3 | 4 = 1;
    let px = 0;
    let py = 0;
    let pz = 11;
    let vy = 0;
    let facingAngle = Math.PI;
    let jumpsUsed = 0;
    let dashTimer = 0;
    let dashCooldown = 0;
    let fireCooldown = 0;
    let hearts = 5;
    const maxHearts = 5;
    let invuln = 0;
    let lulaHp = 14;
    const lulaMaxHp = 14;
    let attackTimer = 1.6;
    let timeSec = 0;
    let bannerText = '⚔️ ETAPA 1/4: Destrua os 3 núcleos da Árvore da Destruição!';
    let bannerTimer = 3.5;
    let finished = false;
    let hudTick = 0;

    const damagePlayer = () => {
      if (invuln > 0 || dashTimer > 0 || stage === 4) return;
      hearts--;
      invuln = 1.4;
      audioSystem.playSfx('hurt');
      if (hearts <= 0) {
        finished = true;
        onFinish({
          levelId: 10,
          won: false,
          treatsCollected: 20,
          goldenPaws: [goldenPawMeshes[0].collected, goldenPawMeshes[1].collected, goldenPawMeshes[2].collected],
          timeSec,
          heartsRemaining: 0,
          starsEarned: 0,
        });
      }
    };

    const shootStarBark = () => {
      if (fireCooldown > 0) return;
      fireCooldown = 0.28;
      audioSystem.playSfx('bark');
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 10, 10),
        new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ff9f1c', emissiveIntensity: 0.8 })
      );
      m.position.set(px, py + 1.3, pz);
      scene.add(m);
      // Slight auto-aim toward center boss for super fun mobile + desktop feel
      const toCenter = new THREE.Vector3(-px, 2.2 - (py + 1.3), -pz);
      const dirVec =
        toCenter.length() > 1
          ? toCenter.normalize()
          : new THREE.Vector3(Math.sin(facingAngle), 0, Math.cos(facingAngle));
      projs.push({ mesh: m, vx: dirVec.x * 32, vy: dirVec.y * 10, vz: dirVec.z * 32, fromPlayer: true, life: 1.5 });
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
        if (dashTimer > 0) dashTimer -= dt;
        if (dashCooldown > 0) dashCooldown -= dt;
        if (fireCooldown > 0) fireCooldown -= dt;

        // Player 3D Movement
        const mx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
        const mz = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
        const spd = dashTimer > 0 ? 19 : 11.5;

        if (mx !== 0 || mz !== 0) {
          const len = Math.hypot(mx, mz);
          px += (mx / len) * spd * dt;
          pz += (mz / len) * spd * dt;
          facingAngle = Math.atan2(mx, mz);
        }

        // Clamp inside circular arena
        const distFromCenter = Math.hypot(px, pz);
        if (distFromCenter > ARENA_R - 1.2) {
          px = (px / distFromCenter) * (ARENA_R - 1.2);
          pz = (pz / distFromCenter) * (ARENA_R - 1.2);
        }

        // Jump & Double Jump (A)
        if (inp.aJustPressed && jumpsUsed < 2) {
          vy = jumpsUsed === 0 ? 14.5 : 13.0;
          jumpsUsed++;
          audioSystem.playSfx(jumpsUsed === 1 ? 'jump' : 'double_jump');
        }
        // Roll/Dash (X)
        if (inp.xJustPressed && dashCooldown <= 0) {
          dashTimer = 0.28;
          dashCooldown = 0.8;
          audioSystem.playSfx('boost');
        }

        // Gravity & Floor + Clock Gear Platforms in Stage 2
        vy -= 36 * dt;
        py += vy * dt;
        let floorY = 0;
        if (stage === 2) {
          for (const c of clockCrystals) {
            if (Math.hypot(px - c.x, pz - c.z) < 2.9 && py >= 1.7) {
              floorY = 2.1;
            }
          }
        }
        if (py <= floorY) {
          py = floorY;
          vy = 0;
          jumpsUsed = 0;
        }

        luckyGroup.position.set(px, py, pz);
        luckyGroup.rotation.y = facingAngle;
        luckyGroup.visible = invuln <= 0 || Math.floor(timeSec * 16) % 2 === 0;

        // Collect Golden Paws
        goldenPawMeshes.forEach((gp, idx) => {
          gp.mesh.rotation.y += dt * 3;
          if (gp.collected) {
            gp.mesh.visible = false;
            return;
          }
          if (Math.hypot(px - gp.x, pz - gp.z) < 2.2) {
            gp.collected = true;
            audioSystem.playSfx('paw');
            bannerText = `🐾 Patinha Dourada #${idx + 1} da Fortaleza!`;
            bannerTimer = 2.0;
          }
        });

        // =====================================================
        // STAGE 1: ÁRVORE DA DESTRUIÇÃO
        // =====================================================
        if (stage === 1) {
          treeBossGroup.rotation.y += dt * 0.75;
          if (inp.bJustPressed || inp.yJustPressed) shootStarBark();

          attackTimer -= dt;
          if (attackTimer <= 0) {
            attackTimer = 1.65;
            // Throw explosive Christmas ornaments around arena
            for (let k = 0; k < 4; k++) {
              const a = timeSec + (k * Math.PI) / 2;
              const orb = new THREE.Mesh(
                new THREE.SphereGeometry(0.65, 10, 10),
                new THREE.MeshStandardMaterial({ color: k % 2 === 0 ? '#e63946' : '#ffd166' })
              );
              orb.position.set(0, 2.2, 0);
              scene.add(orb);
              projs.push({ mesh: orb, vx: Math.cos(a) * 11, vy: 0, vz: Math.sin(a) * 11, fromPlayer: false, life: 2.5 });
            }
          }

          if (treeCores.every((c) => !c.alive)) {
            stage = 2;
            treeBossGroup.visible = false;
            clockGroup.visible = true;
            audioSystem.playSfx('star');
            bannerText = '⏰ ETAPA 2/4: Suba nas engrenagens e desative os 3 cristais do Relógio!';
            bannerTimer = 4.0;
          }
        }
        // =====================================================
        // STAGE 2: O RELÓGIO DA MEIA-NOITE
        // =====================================================
        else if (stage === 2) {
          clockHand.rotation.z -= dt * 1.4;
          if (inp.bJustPressed || inp.yJustPressed) shootStarBark();

          for (const c of clockCrystals) {
            c.crystal.rotation.y += dt * 3;
            if (c.active && Math.hypot(px - c.x, pz - c.z) < 2.6 && py >= 1.5) {
              c.active = false;
              c.crystal.visible = false;
              audioSystem.playSfx('checkpoint');
              bannerText = '✨ Cristal do Relógio desativado!';
              bannerTimer = 1.8;
            }
          }

          attackTimer -= dt;
          if (attackTimer <= 0) {
            attackTimer = 2.2;
            const ringMesh = new THREE.Mesh(
              new THREE.TorusGeometry(1.0, 0.25, 8, 32),
              new THREE.MeshStandardMaterial({ color: '#ff5d8f', emissive: '#ff006e', emissiveIntensity: 0.6 })
            );
            ringMesh.rotation.x = Math.PI / 2;
            ringMesh.position.y = 0.5;
            scene.add(ringMesh);
            rings.push({ mesh: ringMesh, radius: 1.0 });
          }

          if (clockCrystals.every((c) => !c.active)) {
            stage = 3;
            clockGroup.visible = false;
            lulaGroup.visible = true;
            lulaGroup.scale.setScalar(1.45);
            audioSystem.playSfx('super_bark');
            bannerText = '⚡ ETAPA 3/4: LULA SUPREMO! Pule as ondas e ataque com B ou Y!';
            bannerTimer = 4.0;
          }
        }
        // =====================================================
        // STAGE 3: LULA SUPREMO
        // =====================================================
        else if (stage === 3) {
          lulaGroup.position.x = Math.sin(timeSec * 1.1) * 4.5;
          lulaGroup.position.z = Math.cos(timeSec * 0.9) * 3.5 - 2;
          lulaGroup.lookAt(px, 2, pz);

          if (inp.bJustPressed || inp.yJustPressed) shootStarBark();

          attackTimer -= dt;
          if (attackTimer <= 0) {
            attackTimer = 1.9;
            // Shockwave ring to jump over!
            const ringMesh = new THREE.Mesh(
              new THREE.TorusGeometry(1.0, 0.28, 8, 36),
              new THREE.MeshStandardMaterial({ color: '#c77dff', emissive: '#9d4edd', emissiveIntensity: 0.8 })
            );
            ringMesh.rotation.x = Math.PI / 2;
            ringMesh.position.set(lulaGroup.position.x, 0.55, lulaGroup.position.z);
            scene.add(ringMesh);
            rings.push({ mesh: ringMesh, radius: 1.0 });
          }

          if (lulaHp <= 0) {
            stage = 4;
            lulaGroup.scale.setScalar(0.85);
            lulaGroup.position.set(0, 0, 0);
            // Clear hostile rings & projectiles
            rings.forEach((r) => scene.remove(r.mesh));
            rings.length = 0;
            projs.forEach((p) => scene.remove(p.mesh));
            projs.length = 0;
            onSpecialYLabelChange?.('Petisco 🦴');
            audioSystem.playSfx('gift');
            bannerText = '💛 ETAPA 4/4: Lula nunca ganhou um presente de Natal...';
            bannerTimer = 5.0;
          }
        }
        // =====================================================
        // STAGE 4: O VERDADEIRO PODER DO NATAL (Oferecer o Último Petisco!)
        // =====================================================
        else if (stage === 4) {
          lulaGroup.lookAt(px, 1.5, pz);
          const distToLula = Math.hypot(px - lulaGroup.position.x, pz - lulaGroup.position.z);
          if ((inp.yJustPressed || inp.bJustPressed) && distToLula < 7.5) {
            finished = true;
            onSpecialYLabelChange?.(undefined);
            audioSystem.playSfx('win');
            const pawsCount = goldenPawMeshes.filter((g) => g.collected).length;
            const starsEarned = Math.min(3, 1 + (pawsCount >= 2 ? 1 : 0) + (hearts >= 3 ? 1 : 0));
            onFinish({
              levelId: 10,
              won: true,
              treatsCollected: 50,
              goldenPaws: [goldenPawMeshes[0].collected, goldenPawMeshes[1].collected, goldenPawMeshes[2].collected],
              timeSec,
              heartsRemaining: hearts,
              starsEarned,
              extraNote: 'Lucky ofereceu seu último petisco a Lula e salvou a Princesa Jujuba!',
            });
          }
        }

        // Update Projectiles
        for (let i = projs.length - 1; i >= 0; i--) {
          const pr = projs[i];
          pr.life -= dt;
          pr.mesh.position.x += pr.vx * dt;
          pr.mesh.position.y += pr.vy * dt;
          pr.mesh.position.z += pr.vz * dt;
          let remove = pr.life <= 0;

          if (!remove && pr.fromPlayer) {
            if (stage === 1) {
              for (const core of treeCores) {
                if (!core.alive) continue;
                const worldCore = new THREE.Vector3();
                core.mesh.getWorldPosition(worldCore);
                if (pr.mesh.position.distanceTo(worldCore) < 2.2) {
                  core.hp--;
                  remove = true;
                  audioSystem.playSfx('enemy_defeat');
                  if (core.hp <= 0) {
                    core.alive = false;
                    core.mesh.visible = false;
                  }
                  break;
                }
              }
            } else if (stage === 3) {
              const targetPos = lulaGroup.position.clone().add(new THREE.Vector3(0, 3.2, 0));
              if (pr.mesh.position.distanceTo(targetPos) < 3.5) {
                lulaHp--;
                remove = true;
                audioSystem.playSfx('enemy_defeat');
              }
            }
          } else if (!remove && !pr.fromPlayer) {
            if (Math.hypot(pr.mesh.position.x - px, pr.mesh.position.z - pz) < 1.5 && py < 2.1) {
              damagePlayer();
              remove = true;
            }
          }

          if (remove) {
            scene.remove(pr.mesh);
            projs.splice(i, 1);
          }
        }

        // Update Shockwave Rings
        for (let i = rings.length - 1; i >= 0; i--) {
          const rg = rings[i];
          rg.radius += 9.5 * dt;
          rg.mesh.scale.setScalar(rg.radius);
          const distP = Math.hypot(px - rg.mesh.position.x, pz - rg.mesh.position.z);
          if (Math.abs(distP - rg.radius) < 0.75 && py < 1.15) {
            damagePlayer();
          }
          if (rg.radius > ARENA_R + 2) {
            scene.remove(rg.mesh);
            rings.splice(i, 1);
          }
        }

        // Camera framing arena heroically
        camera.position.lerp(new THREE.Vector3(px * 0.48, 12.5, pz * 0.45 + 19), Math.min(1, dt * 4.5));
        camera.lookAt(px * 0.2, 2.2, pz * 0.15 - 1);

        hudTick += dt;
        if (hudTick > 0.08) {
          hudTick = 0;
          const stageLabels = {
            1: 'Etapa 1/4 · Árvore da Destruição',
            2: 'Etapa 2/4 · Relógio da Meia-Noite',
            3: 'Etapa 3/4 · Lula Supremo',
            4: 'Etapa 4/4 · O Verdadeiro Poder do Natal',
          };
          const stageHp =
            stage === 1
              ? treeCores.reduce((s, c) => s + Math.max(0, c.hp), 0)
              : stage === 2
              ? clockCrystals.filter((c) => c.active).length
              : stage === 3
              ? Math.max(0, lulaHp)
              : 0;
          const stageMax = stage === 1 ? 9 : stage === 2 ? 3 : stage === 3 ? lulaMaxHp : 0;

          onHudUpdate({
            hearts,
            maxHearts,
            treats: 35,
            lives,
            goldenPaws: [goldenPawMeshes[0].collected, goldenPawMeshes[1].collected, goldenPawMeshes[2].collected],
            activePower: null,
            powerTimer: 0,
            hasShield: false,
            progressLabel: '🏰 Fortaleza do Último Natal',
            bossName: stage < 4 ? 'LULA — O Devorador de Natais' : undefined,
            bossHp: stageHp,
            bossMaxHp: stageMax,
            bossStageLabel: stageLabels[stage],
            specialPrompt:
              stage === 4
                ? '🦴 Chegue perto de LULA e aperte Y (ou B) para oferecer o Último Petisco!'
                : undefined,
            bannerText: bannerText || undefined,
          });
        }
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      onSpecialYLabelChange?.(undefined);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [costume, lives, onHudUpdate, onFinish, onPauseRequest, onSpecialYLabelChange]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};
