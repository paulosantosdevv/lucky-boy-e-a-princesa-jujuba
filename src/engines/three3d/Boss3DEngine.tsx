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

    // Storybook Christmas Sky (bright festive twilight blue, high contrast!)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#4a8fd4');
    scene.fog = new THREE.Fog('#7cb9f0', 36, 130);

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

    scene.add(new THREE.HemisphereLight('#ffffff', '#69b543', 1.25));
    const keyLight = new THREE.DirectionalLight('#fff5cc', 1.3);
    keyLight.position.set(16, 34, 18);
    scene.add(keyLight);

    // Storybook Round Christmas Rug Arena (inspired by Thing 1 & Thing 2 floor rug!)
    const ARENA_R = 17.5;
    const arenaFloor = new THREE.Mesh(
      new THREE.CylinderGeometry(ARENA_R, ARENA_R + 1.5, 1.4, 36),
      new THREE.MeshStandardMaterial({ color: '#b38cd9', roughness: 0.78 })
    );
    arenaFloor.position.y = -0.7;
    scene.add(arenaFloor);

    const greenRing = new THREE.Mesh(
      new THREE.RingGeometry(ARENA_R - 2.6, ARENA_R - 0.5, 42),
      new THREE.MeshStandardMaterial({ color: '#69b543', side: THREE.DoubleSide })
    );
    greenRing.rotation.x = -Math.PI / 2;
    greenRing.position.y = 0.03;
    scene.add(greenRing);

    const goldRing = new THREE.Mesh(
      new THREE.TorusGeometry(ARENA_R - 0.3, 0.35, 10, 48),
      new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#f5b922', emissiveIntensity: 0.35 })
    );
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = 0.08;
    scene.add(goldRing);

    // Whimsical Candy Cane Pillars around Arena
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const pil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 1.2, 13, 10),
        new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? '#d92626' : '#fff9eb' })
      );
      pil.position.set(Math.cos(ang) * (ARENA_R + 3), 6, Math.sin(ang) * (ARENA_R + 3));
      pil.rotation.z = Math.sin(i) * 0.14;
      scene.add(pil);
    }

    // Princesa Jujuba glowing platform at North side (-Z)
    const jujubaGroup = new THREE.Group();
    jujubaGroup.position.set(0, 4.5, -ARENA_R - 3.5);
    const dress = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 3.2, 12),
      new THREE.MeshStandardMaterial({ color: '#e24b78' })
    );
    const jHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 14, 14),
      new THREE.MeshStandardMaterial({ color: '#ffe7c8' })
    );
    jHead.position.y = 2.1;
    const jHair = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 14, 14),
      new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#ffd447', emissiveIntensity: 0.25 })
    );
    jHair.position.set(0, 2.25, -0.2);
    const cage = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 5.2, 12, 1, true),
      new THREE.MeshStandardMaterial({ color: '#ffe055', transparent: true, opacity: 0.32, wireframe: true })
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
      new THREE.MeshStandardMaterial({ color: costume === 'spfc' ? '#d92626' : '#d92626' })
    );
    scarf.rotation.x = Math.PI / 2;
    scarf.position.set(0, 1.15, 0.55);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), whiteMat);
    tail.position.set(0, 1.15, -1.05);
    luckyGroup.add(body, head, scarf, tail);
    scene.add(luckyGroup);

    // STAGE 1: ÁRVORE DA DESTRUIÇÃO (Cat-in-the-Hat style giant tree with pink garland & 3 cores)
    const treeBossGroup = new THREE.Group();
    const treeCone1 = new THREE.Mesh(
      new THREE.ConeGeometry(4.4, 5.5, 12),
      new THREE.MeshStandardMaterial({ color: '#5ea93f' })
    );
    treeCone1.position.y = 3.2;
    const treeCone2 = new THREE.Mesh(
      new THREE.ConeGeometry(3.2, 4.5, 12),
      new THREE.MeshStandardMaterial({ color: '#69b543' })
    );
    treeCone2.position.y = 6.5;
    const treeGarland = new THREE.Mesh(
      new THREE.TorusGeometry(3.1, 0.35, 8, 20),
      new THREE.MeshStandardMaterial({ color: '#e47bb8' })
    );
    treeGarland.rotation.x = Math.PI / 2;
    treeGarland.position.y = 4.2;
    treeBossGroup.add(treeCone1, treeCone2, treeGarland);

    const treeCores = [0, 1, 2].map((i) => {
      const ang = (i / 3) * Math.PI * 2;
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.0),
        new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#f46d75', emissiveIntensity: 0.7 })
      );
      core.position.set(Math.cos(ang) * 4.3, 2.0, Math.sin(ang) * 4.3);
      treeBossGroup.add(core);
      return { mesh: core, hp: 3, alive: true };
    });
    scene.add(treeBossGroup);

    // STAGE 2: RELÓGIO DA MEIA-NOITE (3 Accessible Golden Gear Platforms + Crystals)
    const clockGroup = new THREE.Group();
    clockGroup.visible = false;
    const clockFace = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 3.6, 0.5, 24),
      new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#ff9f1c', emissiveIntensity: 0.25 })
    );
    clockFace.rotation.x = Math.PI / 2;
    clockFace.position.set(0, 6.2, 0);
    const clockHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 3.0, 0.35),
      new THREE.MeshStandardMaterial({ color: '#d92626' })
    );
    clockHand.position.set(0, 6.2, 0.4);
    clockGroup.add(clockFace, clockHand);

    const clockCrystals = [0, 1, 2].map((i) => {
      const ang = (i / 3) * Math.PI * 2 + 0.5;
      const dist = 9.2;
      const plat = new THREE.Mesh(
        new THREE.CylinderGeometry(3.0, 3.2, 0.7, 14),
        new THREE.MeshStandardMaterial({ color: '#ff9f43' })
      );
      plat.position.set(Math.cos(ang) * dist, 1.45, Math.sin(ang) * dist);
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.1),
        new THREE.MeshStandardMaterial({ color: '#6fd3f7', emissive: '#22a6e0', emissiveIntensity: 0.75 })
      );
      crystal.position.set(Math.cos(ang) * dist, 3.2, Math.sin(ang) * dist);
      clockGroup.add(plat, crystal);
      return { plat, crystal, x: Math.cos(ang) * dist, z: Math.sin(ang) * dist, active: true };
    });
    scene.add(clockGroup);

    // STAGE 3 & 4: LULA SUPREMO -> O ÚLTIMO PETISCO
    const lulaGroup = new THREE.Group();
    lulaGroup.visible = false;
    const lulaCoatMat = new THREE.MeshStandardMaterial({ color: '#6b2fa0', roughness: 0.4 });
    const lulaCoat = new THREE.Mesh(new THREE.ConeGeometry(2.4, 5.0, 12), lulaCoatMat);
    lulaCoat.position.y = 2.6;
    const lulaHead = new THREE.Mesh(
      new THREE.SphereGeometry(1.55, 14, 14),
      new THREE.MeshStandardMaterial({ color: '#c38ef5' })
    );
    lulaHead.position.y = 5.6;
    const lulaGoggles = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.55, 0.6),
      new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#f5b922', emissiveIntensity: 0.4 })
    );
    lulaGoggles.position.set(0, 6.2, 1.3);
    lulaGroup.add(lulaCoat, lulaHead, lulaGoggles);
    scene.add(lulaGroup);

    const goldenPawMeshes = [
      { x: -12, z: -7, collected: false },
      { x: 12, z: -7, collected: false },
      { x: 0, z: 12, collected: false },
    ].map((gp) => {
      const m = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.95),
        new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#f5b922', emissiveIntensity: 0.7 })
      );
      m.position.set(gp.x, 1.6, gp.z);
      scene.add(m);
      return { ...gp, mesh: m };
    });

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
    let lulaHp = 12;
    const lulaMaxHp = 12;
    let lulaHurtFlash = 0;
    let attackTimer = 1.6;
    let timeSec = 0;
    let bannerText = '⚔️ ETAPA 1/4: Atire com B/Y para destruir os 3 núcleos da Árvore!';
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
      fireCooldown = 0.25;
      audioSystem.playSfx('bark');
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.48, 10, 10),
        new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#ff9f1c', emissiveIntensity: 0.85 })
      );
      m.position.set(px, py + 1.3, pz);
      scene.add(m);
      const targetPos =
        stage === 3
          ? lulaGroup.position.clone().add(new THREE.Vector3(0, 3.0, 0))
          : new THREE.Vector3(0, 2.0, 0);
      const toTarget = targetPos.sub(new THREE.Vector3(px, py + 1.3, pz));
      const dirVec =
        toTarget.length() > 1
          ? toTarget.normalize()
          : new THREE.Vector3(Math.sin(facingAngle), 0, Math.cos(facingAngle));
      projs.push({ mesh: m, vx: dirVec.x * 34, vy: dirVec.y * 12, vz: dirVec.z * 34, fromPlayer: true, life: 1.5 });
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
        if (lulaHurtFlash > 0) {
          lulaHurtFlash -= dt;
          lulaCoatMat.emissive.set(lulaHurtFlash > 0 ? '#ffffff' : '#000000');
          lulaCoatMat.emissiveIntensity = lulaHurtFlash > 0 ? 0.6 : 0;
        }

        const mx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
        const mz = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
        const spd = dashTimer > 0 ? 19.5 : 12.0;

        if (mx !== 0 || mz !== 0) {
          const len = Math.hypot(mx, mz);
          px += (mx / len) * spd * dt;
          pz += (mz / len) * spd * dt;
          facingAngle = Math.atan2(mx, mz);
        }

        const distFromCenter = Math.hypot(px, pz);
        if (distFromCenter > ARENA_R - 1.2) {
          px = (px / distFromCenter) * (ARENA_R - 1.2);
          pz = (pz / distFromCenter) * (ARENA_R - 1.2);
        }

        if (inp.aJustPressed && jumpsUsed < 2) {
          vy = jumpsUsed === 0 ? 15.5 : 13.8;
          jumpsUsed++;
          audioSystem.playSfx(jumpsUsed === 1 ? 'jump' : 'double_jump');
        }
        if (inp.xJustPressed && dashCooldown <= 0) {
          dashTimer = 0.28;
          dashCooldown = 0.75;
          audioSystem.playSfx('boost');
        }

        vy -= 36 * dt;
        const prevPy = py;
        py += vy * dt;
        let floorY = 0;
        // FIXED BUG: Forgiving landing on Stage 2 elevated gear platforms!
        if (stage === 2) {
          for (const c of clockCrystals) {
            if (Math.hypot(px - c.x, pz - c.z) < 3.4 && (prevPy >= 1.5 || py >= 1.5)) {
              floorY = 1.8;
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

        goldenPawMeshes.forEach((gp, idx) => {
          gp.mesh.rotation.y += dt * 3;
          if (gp.collected) {
            gp.mesh.visible = false;
            return;
          }
          if (Math.hypot(px - gp.x, pz - gp.z) < 2.4) {
            gp.collected = true;
            audioSystem.playSfx('paw');
            bannerText = `🐾 Patinha Dourada #${idx + 1} da Fortaleza!`;
            bannerTimer = 2.0;
          }
        });

        if (stage === 1) {
          treeBossGroup.rotation.y += dt * 0.7;
          if (inp.bJustPressed || inp.yJustPressed) shootStarBark();

          attackTimer -= dt;
          if (attackTimer <= 0) {
            attackTimer = 1.75;
            for (let k = 0; k < 4; k++) {
              const a = timeSec + (k * Math.PI) / 2;
              const orb = new THREE.Mesh(
                new THREE.SphereGeometry(0.62, 10, 10),
                new THREE.MeshStandardMaterial({ color: k % 2 === 0 ? '#d92626' : '#ffe055' })
              );
              orb.position.set(0, 2.0, 0);
              scene.add(orb);
              projs.push({ mesh: orb, vx: Math.cos(a) * 10.5, vy: 0, vz: Math.sin(a) * 10.5, fromPlayer: false, life: 2.5 });
            }
          }

          if (treeCores.every((c) => !c.alive)) {
            stage = 2;
            treeBossGroup.visible = false;
            clockGroup.visible = true;
            audioSystem.playSfx('star');
            bannerText = '⏰ ETAPA 2/4: Pule nas 3 engrenagens laranjas para desativar os cristais!';
            bannerTimer = 4.2;
          }
        } else if (stage === 2) {
          clockHand.rotation.z -= dt * 1.4;
          if (inp.bJustPressed || inp.yJustPressed) shootStarBark();

          for (const c of clockCrystals) {
            c.crystal.rotation.y += dt * 3;
            if (c.active && Math.hypot(px - c.x, pz - c.z) < 3.2 && py >= 1.2) {
              c.active = false;
              c.crystal.visible = false;
              audioSystem.playSfx('checkpoint');
              bannerText = '✨ Cristal do Relógio desativado!';
              bannerTimer = 1.8;
            }
          }

          attackTimer -= dt;
          if (attackTimer <= 0) {
            attackTimer = 2.3;
            const ringMesh = new THREE.Mesh(
              new THREE.TorusGeometry(1.0, 0.25, 8, 32),
              new THREE.MeshStandardMaterial({ color: '#d92626', emissive: '#ff5d6c', emissiveIntensity: 0.6 })
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
            bannerText = '⚡ ETAPA 3/4: LULA SUPREMO! Pule as ondas e atire com B ou Y!';
            bannerTimer = 4.0;
          }
        } else if (stage === 3) {
          lulaGroup.position.x = Math.sin(timeSec * 1.05) * 4.5;
          lulaGroup.position.z = Math.cos(timeSec * 0.85) * 3.5 - 2;
          lulaGroup.lookAt(px, 2, pz);

          if (inp.bJustPressed || inp.yJustPressed) shootStarBark();

          attackTimer -= dt;
          if (attackTimer <= 0) {
            attackTimer = 2.0;
            const ringMesh = new THREE.Mesh(
              new THREE.TorusGeometry(1.0, 0.28, 8, 36),
              new THREE.MeshStandardMaterial({ color: '#9f7aea', emissive: '#6b2fa0', emissiveIntensity: 0.7 })
            );
            ringMesh.rotation.x = Math.PI / 2;
            ringMesh.position.set(lulaGroup.position.x, 0.55, lulaGroup.position.z);
            scene.add(ringMesh);
            rings.push({ mesh: ringMesh, radius: 1.0 });
          }

          if (lulaHp <= 0) {
            stage = 4;
            lulaGroup.scale.setScalar(0.88);
            lulaGroup.position.set(0, 0, 0);
            rings.forEach((r) => scene.remove(r.mesh));
            rings.length = 0;
            projs.forEach((p) => scene.remove(p.mesh));
            projs.length = 0;
            onSpecialYLabelChange?.('Petisco 🦴');
            audioSystem.playSfx('gift');
            bannerText = '💛 ETAPA 4/4: Lula nunca ganhou um presente de Natal...';
            bannerTimer = 5.0;
          }
        } else if (stage === 4) {
          lulaGroup.lookAt(px, 1.5, pz);
          const distToLula = Math.hypot(px - lulaGroup.position.x, pz - lulaGroup.position.z);
          if ((inp.yJustPressed || inp.bJustPressed) && distToLula < 8.0) {
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
                if (pr.mesh.position.distanceTo(worldCore) < 2.6) {
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
              if (pr.mesh.position.distanceTo(targetPos) < 3.8) {
                lulaHp--;
                lulaHurtFlash = 0.16;
                remove = true;
                audioSystem.playSfx('enemy_defeat');
              }
            }
          } else if (!remove && !pr.fromPlayer) {
            if (Math.hypot(pr.mesh.position.x - px, pr.mesh.position.z - pz) < 1.45 && py < 2.0) {
              damagePlayer();
              remove = true;
            }
          }

          if (remove) {
            scene.remove(pr.mesh);
            projs.splice(i, 1);
          }
        }

        for (let i = rings.length - 1; i >= 0; i--) {
          const rg = rings[i];
          rg.radius += 9.2 * dt;
          rg.mesh.scale.setScalar(rg.radius);
          const distP = Math.hypot(px - rg.mesh.position.x, pz - rg.mesh.position.z);
          if (Math.abs(distP - rg.radius) < 0.72 && py < 1.1) {
            damagePlayer();
          }
          if (rg.radius > ARENA_R + 2) {
            scene.remove(rg.mesh);
            rings.splice(i, 1);
          }
        }

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
