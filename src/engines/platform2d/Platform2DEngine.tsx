import React, { useEffect, useRef } from 'react';
import {
  CostumeId,
  HudSnapshot,
  LevelCompletionResult,
  LevelId,
  POWERUP_INFO,
  PermanentSkill,
  PowerUpType,
} from '../../types/game';
import { build2DLevel, EnemyDef, PlatformDef } from './levelData';
import { inputManager } from '../../systems/inputSystem';
import { audioSystem } from '../../systems/audioSystem';

interface Props {
  levelId: LevelId;
  costume: CostumeId;
  unlockedSkills: PermanentSkill[];
  lives: number;
  paused: boolean;
  onHudUpdate: (hud: HudSnapshot) => void;
  onFinish: (result: LevelCompletionResult) => void;
  onPauseRequest: () => void;
}

interface ActivePlatform extends PlatformDef {
  baseX: number;
  baseY: number;
  prevX: number;
  prevY: number;
  crumbleTimer: number; // >0 shaking, <0 broken
  respawnTimer: number;
  ghostAlpha: number;
}

interface ActiveEnemy extends EnemyDef {
  vx: number;
  vy: number;
  w: number;
  h: number;
  alive: boolean;
  frozenTimer: number;
  bobPhase: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fromPlayer: boolean;
  kind: 'fire' | 'frost' | 'bark' | 'sneeze' | 'cupcake' | 'ink' | 'snowball';
  life: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface ActiveBoss {
  name: string;
  kind: 'mushroom' | 'baker_bot' | 'octopus' | 'snowman';
  x: number;
  y: number;
  baseY: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  attackTimer: number;
  hurtFlash: number;
  defeated: boolean;
  dir: number;
}

export const Platform2DEngine: React.FC<Props> = ({
  levelId,
  costume,
  unlockedSkills,
  lives,
  paused,
  onHudUpdate,
  onFinish,
  onPauseRequest,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bp = build2DLevel(levelId);
    const hasDoubleJump = levelId >= 2 || unlockedSkills.includes('double_jump');
    const hasBellyFlop = levelId >= 2 || unlockedSkills.includes('belly_flop');
    const hasSecretSniff = levelId >= 4 || unlockedSkills.includes('secret_sniff');

    // Runtime platforms
    const platforms: ActivePlatform[] = bp.platforms.map((p) => ({
      ...p,
      baseX: p.x,
      baseY: p.y,
      prevX: p.x,
      prevY: p.y,
      crumbleTimer: 0,
      respawnTimer: 0,
      ghostAlpha: p.kind === 'ghost' ? 0.14 : 1,
    }));

    // Runtime enemies
    const enemies: ActiveEnemy[] = bp.enemies.map((e, idx) => ({
      ...e,
      vx: e.speed,
      vy: 0,
      w: e.kind === 'jellyfish' ? 42 : 40,
      h: e.kind === 'jellyfish' ? 44 : 38,
      alive: true,
      frozenTimer: 0,
      bobPhase: idx * 1.3,
    }));

    // Collectibles
    const treats = bp.treats.map((t) => ({ ...t, collected: false }));
    const goldenPaws = bp.goldenPaws.map((gp) => ({ ...gp, collected: false }));
    const powerUps = bp.powerUps.map((p) => ({ ...p, collected: false }));
    const treeSwitches = (bp.treeSwitches || []).map((t) => ({ ...t, lit: false }));

    const boss: ActiveBoss | null = bp.miniBoss
      ? {
          name: bp.miniBoss.name,
          kind: bp.miniBoss.kind,
          x: bp.miniBoss.x,
          y: bp.isWater ? bp.miniBoss.y : bp.miniBoss.y - 96,
          baseY: bp.isWater ? bp.miniBoss.y : bp.miniBoss.y - 96,
          w: 92,
          h: 96,
          hp: bp.miniBoss.hp,
          maxHp: bp.miniBoss.hp,
          attackTimer: 1.8,
          hurtFlash: 0,
          defeated: false,
          dir: -1,
        }
      : null;

    const projectiles: Projectile[] = [];
    const particles: Particle[] = [];

    // Snow / Bubbles ambience
    const ambience = Array.from({ length: 70 }, () => ({
      x: Math.random() * 1400,
      y: Math.random() * 750,
      r: 2 + Math.random() * 4,
      speed: 25 + Math.random() * 55,
      drift: Math.random() * Math.PI * 2,
    }));

    // Player state
    const player = {
      x: bp.spawn.x,
      y: bp.spawn.y,
      vx: 0,
      vy: 0,
      w: 44,
      h: 40,
      facing: 1,
      grounded: false,
      onIce: false,
      coyote: 0,
      jumpsUsed: 0,
      rollTimer: 0,
      rollCooldown: 0,
      barkTimer: 0,
      barkCooldown: 0,
      bellyFlopping: false,
      invulnTimer: 0,
      hearts: 3,
      maxHearts: 3,
      hasShield: false,
      activePower: null as PowerUpType | null,
      powerTimer: 0,
      checkpointReached: false,
      respawnX: bp.spawn.x,
      respawnY: bp.spawn.y,
      runAnim: 0,
    };

    let cameraX = 0;
    let timeSec = 0;
    let treatsCollected = 0;
    let bannerText = '';
    let bannerTimer = 0;
    let ghostRevealTimer = 0;
    let finished = false;
    let currentLives = lives;
    let hudTick = 0;

    const showBanner = (msg: string, duration = 2.5) => {
      bannerText = msg;
      bannerTimer = duration;
    };

    const spawnParticles = (x: number, y: number, color: string, count = 12, spread = 180) => {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * spread;
        particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 40,
          size: 3 + Math.random() * 5,
          color,
          life: 0.4 + Math.random() * 0.45,
          maxLife: 0.85,
        });
      }
    };

    const hurtPlayer = () => {
      if (player.invulnTimer > 0 || player.activePower === 'golden_bone') return;
      if (player.hasShield) {
        player.hasShield = false;
        player.invulnTimer = 1.3;
        audioSystem.playSfx('splash');
        spawnParticles(player.x + 22, player.y + 20, '#ff85d8', 16);
        showBanner('🫧 Bolha Protetora absorveu o golpe!', 1.8);
        return;
      }
      player.hearts--;
      player.invulnTimer = 1.6;
      player.vy = -260;
      player.vx = -player.facing * 200;
      audioSystem.playSfx('hurt');
      spawnParticles(player.x + 22, player.y + 20, '#ff4d6d', 14);

      if (player.hearts <= 0) {
        currentLives = Math.max(0, currentLives - 1);
        if (currentLives <= 0) {
          finished = true;
          onFinish({
            levelId,
            won: false,
            treatsCollected,
            goldenPaws: [goldenPaws[0].collected, goldenPaws[1].collected, goldenPaws[2].collected],
            timeSec,
            heartsRemaining: 0,
            starsEarned: 0,
          });
        } else {
          player.hearts = player.maxHearts;
          player.x = player.respawnX;
          player.y = player.respawnY;
          player.vx = 0;
          player.vy = 0;
          showBanner('🏠 Renasceu na Casinha Checkpoint!', 2.0);
        }
      }
    };

    const rectOverlap = (
      ax: number,
      ay: number,
      aw: number,
      ah: number,
      bx: number,
      by: number,
      bw: number,
      bh: number
    ) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

    const damageBoss = (amount = 1) => {
      if (!boss || boss.defeated || boss.hurtFlash > 0) return;
      boss.hp -= amount;
      boss.hurtFlash = 0.45;
      audioSystem.playSfx('enemy_defeat');
      spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ffd166', 18, 220);
      if (boss.hp <= 0) {
        boss.defeated = true;
        audioSystem.playSfx('star');
        spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ffd166', 40, 300);
        showBanner(`🎉 ${boss.name} derrotado! Pegue o Fragmento da Estrela!`, 3.5);
      }
    };

    const triggerBarkOrAttack = (superMode = false) => {
      if (player.barkCooldown > 0) return;
      const isSuper = superMode || player.activePower === 'super_bark';
      player.barkTimer = 0.28;
      player.barkCooldown = isSuper ? 0.35 : 0.28;

      if (isSuper) {
        audioSystem.playSfx('super_bark');
        ghostRevealTimer = 6.0;
        spawnParticles(player.x + 22, player.y + 18, '#ffd166', 20, 260);
        projectiles.push({
          x: player.x + (player.facing > 0 ? player.w : 0),
          y: player.y + 20,
          vx: player.facing * 520,
          vy: 0,
          radius: 26,
          fromPlayer: true,
          kind: 'bark',
          life: 0.75,
        });
      } else if (player.activePower === 'spicy_treat') {
        audioSystem.playSfx('shoot');
        projectiles.push({
          x: player.x + (player.facing > 0 ? player.w : 0),
          y: player.y + 18,
          vx: player.facing * 560,
          vy: -30,
          radius: 13,
          fromPlayer: true,
          kind: 'fire',
          life: 1.1,
        });
      } else if (player.activePower === 'frost_biscuit') {
        audioSystem.playSfx('shoot');
        projectiles.push({
          x: player.x + (player.facing > 0 ? player.w : 0),
          y: player.y + 18,
          vx: player.facing * 500,
          vy: 0,
          radius: 15,
          fromPlayer: true,
          kind: 'frost',
          life: 1.0,
        });
      } else {
        audioSystem.playSfx('bark');
        ghostRevealTimer = Math.max(ghostRevealTimer, 4.5);
        projectiles.push({
          x: player.x + (player.facing > 0 ? player.w : 0),
          y: player.y + 18,
          vx: player.facing * (bp.isWater ? 440 : 420),
          vy: 0,
          radius: bp.isWater ? 15 : 18,
          fromPlayer: true,
          kind: 'bark',
          life: bp.isWater ? 0.8 : 0.34,
        });
      }

      // Light up nearby Christmas trees in Level 9
      for (const t of treeSwitches) {
        if (!t.lit && Math.hypot(t.x - (player.x + 22), t.y - 40 - player.y) < 160) {
          t.lit = true;
          audioSystem.playSfx('star');
          spawnParticles(t.x, t.y - 50, '#ffd166', 25, 220);
          const litCount = treeSwitches.filter((x) => x.lit).length;
          showBanner(`🎄 Árvore iluminada! (${litCount}/${treeSwitches.length})`, 2.2);
        }
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let lastTs = performance.now();
    let rafId = 0;

    const update = (dt: number) => {
      const inp = inputManager.poll();
      if (inp.pauseJustPressed) {
        onPauseRequest();
        return;
      }
      if (pausedRef.current || finished) return;

      timeSec += dt;
      if (bannerTimer > 0) {
        bannerTimer -= dt;
        if (bannerTimer <= 0) bannerText = '';
      }
      if (ghostRevealTimer > 0) ghostRevealTimer -= dt;
      if (player.invulnTimer > 0) player.invulnTimer -= dt;
      if (player.rollTimer > 0) player.rollTimer -= dt;
      if (player.rollCooldown > 0) player.rollCooldown -= dt;
      if (player.barkTimer > 0) player.barkTimer -= dt;
      if (player.barkCooldown > 0) player.barkCooldown -= dt;

      if (player.activePower) {
        player.powerTimer -= dt;
        if (player.powerTimer <= 0) {
          player.activePower = null;
          player.powerTimer = 0;
        }
      }

      // Update platforms (moving, crumble, ghost)
      for (const p of platforms) {
        p.prevX = p.x;
        p.prevY = p.y;
        if (p.kind === 'moving' && p.moveRange && p.moveSpeed) {
          const offset = Math.sin(timeSec * p.moveSpeed) * p.moveRange;
          if (p.moveAxis === 'x') p.x = p.baseX + offset;
          else p.y = p.baseY + offset;
        }
        if (p.kind === 'crumble') {
          if (p.crumbleTimer > 0) {
            p.crumbleTimer -= dt;
            if (p.crumbleTimer <= 0) {
              p.crumbleTimer = -1;
              p.respawnTimer = 3.2;
              spawnParticles(p.x + p.w / 2, p.y + 12, '#cde8ff', 10);
            }
          } else if (p.crumbleTimer < 0) {
            p.respawnTimer -= dt;
            if (p.respawnTimer <= 0) {
              p.crumbleTimer = 0;
            }
          }
        }
        if (p.kind === 'ghost') {
          const target = ghostRevealTimer > 0 ? 0.96 : 0.14;
          p.ghostAlpha += (target - p.ghostAlpha) * Math.min(1, dt * 8);
        }
      }

      // =====================================================
      // PLAYER PHYSICS: WATER vs PLATFORM
      // =====================================================
      const moveInput = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (moveInput !== 0) player.facing = moveInput > 0 ? 1 : -1;

      if (bp.isWater) {
        // Underwater 360 swimming
        const swimAccel = 720;
        const maxSwim = inp.a ? 320 : 210;
        if (moveInput !== 0) {
          player.vx += moveInput * swimAccel * dt;
        } else {
          player.vx *= Math.pow(0.08, dt);
        }

        const vertInput = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
        if (vertInput !== 0) {
          player.vy += vertInput * swimAccel * dt;
        } else {
          // Gentle buoyancy
          player.vy += (28 - player.vy) * Math.min(1, dt * 3.5);
        }

        if (inp.aJustPressed) {
          audioSystem.playSfx('splash');
          player.vx += player.facing * 150;
          player.vy -= 90;
          spawnParticles(player.x + 22, player.y + 22, '#caf0f8', 6, 80);
        }

        if (inp.xJustPressed && player.rollCooldown <= 0) {
          player.rollTimer = 0.25;
          player.rollCooldown = 0.65;
          player.vx = player.facing * 420;
          audioSystem.playSfx('splash');
        }

        const speed = Math.hypot(player.vx, player.vy);
        if (speed > maxSwim && player.rollTimer <= 0) {
          player.vx = (player.vx / speed) * maxSwim;
          player.vy = (player.vy / speed) * maxSwim;
        }

        if (inp.bJustPressed) triggerBarkOrAttack(false);
        if (inp.yJustPressed) triggerBarkOrAttack(true);
      } else {
        // Classic Mario-inspired platformer physics
        const maxSpeed = player.rollTimer > 0 ? 430 : inp.x ? 330 : 260;
        const accel = player.onIce ? 520 : player.grounded ? 1900 : 1250;
        const friction = player.onIce ? 0.55 : player.grounded ? 0.0008 : 0.25;

        if (player.rollTimer > 0) {
          player.vx = player.facing * 410;
        } else if (moveInput !== 0) {
          player.vx += moveInput * accel * dt;
          if (Math.abs(player.vx) > maxSpeed) {
            player.vx = Math.sign(player.vx) * maxSpeed;
          }
        } else {
          player.vx *= Math.pow(friction, dt);
          if (Math.abs(player.vx) < 8) player.vx = 0;
        }

        // Roll / Dodge on X
        if (inp.xJustPressed && player.rollCooldown <= 0 && !player.bellyFlopping) {
          player.rollTimer = 0.24;
          player.rollCooldown = 0.62;
          player.vx = player.facing * 420;
          audioSystem.playSfx('jump');
          spawnParticles(player.x + 22, player.y + 36, '#fff8eb', 6, 90);
        }

        // Jump & Double Jump on A
        if (player.grounded) {
          player.coyote = 0.11;
          player.jumpsUsed = 0;
        } else {
          player.coyote -= dt;
        }

        const jumpPower = player.activePower === 'spring_paws' ? -725 : -575;
        if (inp.aJustPressed) {
          if (player.coyote > 0) {
            player.vy = jumpPower;
            player.grounded = false;
            player.coyote = 0;
            player.jumpsUsed = 1;
            player.bellyFlopping = false;
            audioSystem.playSfx('jump');
            spawnParticles(player.x + 22, player.y + 40, '#ffffff', 6, 80);
          } else if (hasDoubleJump && player.jumpsUsed < 2) {
            player.vy = jumpPower * 0.9;
            player.jumpsUsed = 2;
            player.bellyFlopping = false;
            audioSystem.playSfx('double_jump');
            spawnParticles(player.x + 22, player.y + 38, '#ffd166', 10, 120);
          }
        }

        // Belly Flop (Down + B in air)
        if (!player.grounded && inp.down && inp.bJustPressed && hasBellyFlop && !player.bellyFlopping) {
          player.bellyFlopping = true;
          player.vx *= 0.25;
          player.vy = 760;
          audioSystem.playSfx('belly_flop');
        } else if (inp.bJustPressed) {
          triggerBarkOrAttack(false);
        }

        // Y: Power / Super Bark / Interact
        if (inp.yJustPressed) {
          if (player.activePower === 'spicy_treat' || player.activePower === 'frost_biscuit') {
            triggerBarkOrAttack(false);
          } else {
            triggerBarkOrAttack(true);
          }
        }

        // Gravity
        const gravity = player.bellyFlopping ? 2400 : 1480;
        player.vy = Math.min(880, player.vy + gravity * dt);
      }

      // Move X & Collide
      player.x += player.vx * dt;
      player.x = Math.max(8, Math.min(bp.worldWidth - player.w - 8, player.x));

      for (const p of platforms) {
        if (p.kind === 'crumble' && p.crumbleTimer < 0) continue;
        if (p.kind === 'ghost' && p.ghostAlpha < 0.45) continue;
        if (p.kind === 'hazard') continue;
        if (rectOverlap(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)) {
          if (player.vx > 0) player.x = p.x - player.w;
          else if (player.vx < 0) player.x = p.x + p.w;
          player.vx = 0;
        }
      }

      // Move Y & Collide
      const wasBellyFlopping = player.bellyFlopping;
      player.y += player.vy * dt;
      player.grounded = false;
      player.onIce = false;

      if (bp.isWater) {
        player.y = Math.max(40, Math.min(bp.worldHeight - player.h - 20, player.y));
      }

      for (const p of platforms) {
        if (p.kind === 'crumble' && p.crumbleTimer < 0) continue;
        if (p.kind === 'ghost' && p.ghostAlpha < 0.45) continue;
        if (rectOverlap(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)) {
          if (p.kind === 'hazard') {
            hurtPlayer();
            player.vy = -520;
            continue;
          }
          if (player.vy >= 0) {
            player.y = p.y - player.h;
            player.vy = 0;
            player.grounded = true;
            player.bellyFlopping = false;

            if (p.kind === 'bounce') {
              player.vy = -780;
              player.grounded = false;
              audioSystem.playSfx('double_jump');
              spawnParticles(p.x + p.w / 2, p.y, '#ff5d8f', 12, 160);
            } else if (p.kind === 'conveyor') {
              player.x += (p.conveyorDir || 1) * 125 * dt;
            } else if (p.kind === 'ice') {
              player.onIce = true;
            } else if (p.kind === 'crumble' && p.crumbleTimer === 0) {
              p.crumbleTimer = 0.65;
            } else if (p.kind === 'moving') {
              player.x += p.x - p.prevX;
              player.y += p.y - p.prevY;
            }

            if (wasBellyFlopping) {
              audioSystem.playSfx('belly_flop');
              spawnParticles(player.x + 22, player.y + 40, '#ffd166', 18, 240);
              // Shockwave hurts nearby enemies!
              for (const en of enemies) {
                if (en.alive && Math.hypot(en.x - player.x, en.y - player.y) < 150) {
                  en.alive = false;
                  audioSystem.playSfx('enemy_defeat');
                  spawnParticles(en.x + 20, en.y + 20, '#ffd166', 14);
                }
              }
              if (boss && !boss.defeated && Math.hypot(boss.x + boss.w / 2 - player.x, boss.y + boss.h / 2 - player.y) < 165) {
                damageBoss(2);
              }
            }
          } else if (player.vy < 0) {
            player.y = p.y + p.h;
            player.vy = 0;
          }
        }
      }

      // Fall into pit
      if (player.y > bp.worldHeight + 80) {
        player.y = player.respawnY;
        player.x = player.respawnX;
        player.vx = 0;
        player.vy = 0;
        hurtPlayer();
      }

      if (Math.abs(player.vx) > 20) {
        player.runAnim += dt * 11;
      }

      // Checkpoint doghouse
      if (!player.checkpointReached && Math.hypot(player.x - bp.checkpoint.x, player.y - bp.checkpoint.y) < 85) {
        player.checkpointReached = true;
        player.respawnX = bp.checkpoint.x;
        player.respawnY = bp.checkpoint.y - 20;
        audioSystem.playSfx('checkpoint');
        spawnParticles(bp.checkpoint.x, bp.checkpoint.y, '#ffd166', 20, 200);
        showBanner('🏠 Checkpoint Casinha salvo!', 2.2);
      }

      // Level 9 Christmas tree switches on touch
      for (const t of treeSwitches) {
        if (!t.lit && Math.hypot(t.x - (player.x + 22), t.y - 45 - player.y) < 75) {
          t.lit = true;
          audioSystem.playSfx('star');
          spawnParticles(t.x, t.y - 55, '#ffd166', 25, 220);
          const litCount = treeSwitches.filter((x) => x.lit).length;
          showBanner(`🎄 Árvore iluminada! (${litCount}/${treeSwitches.length})`, 2.2);
        }
      }

      // Collect Treats
      for (const tr of treats) {
        if (!tr.collected && Math.hypot(tr.x - (player.x + 22), tr.y - (player.y + 20)) < 36) {
          tr.collected = true;
          treatsCollected++;
          audioSystem.playSfx('treat');
          spawnParticles(tr.x, tr.y, '#ffd166', 6, 90);
        }
      }

      // Collect Golden Paws
      goldenPaws.forEach((gp, idx) => {
        if (!gp.collected && Math.hypot(gp.x - (player.x + 22), gp.y - (player.y + 20)) < 42) {
          gp.collected = true;
          audioSystem.playSfx('paw');
          spawnParticles(gp.x, gp.y, '#ffd166', 22, 220);
          showBanner(`🐾 Patinha Dourada #${idx + 1} encontrada!`, 2.2);
        }
      });

      // Collect PowerUps
      for (const pu of powerUps) {
        if (!pu.collected && Math.hypot(pu.x - (player.x + 22), pu.y - (player.y + 20)) < 40) {
          pu.collected = true;
          audioSystem.playSfx('powerup');
          const info = POWERUP_INFO[pu.type];
          spawnParticles(pu.x, pu.y, info.color, 18, 200);
          if (pu.type === 'bubble_shield') {
            player.hasShield = true;
          } else {
            player.activePower = pu.type;
            player.powerTimer = info.duration;
          }
          showBanner(`${info.emoji} ${info.name}: ${info.desc}`, 2.6);
        }
      }

      // Update Enemies
      for (const en of enemies) {
        if (!en.alive) continue;
        if (en.frozenTimer > 0) {
          en.frozenTimer -= dt;
          continue;
        }
        en.bobPhase += dt * 4;
        if (en.kind === 'jellyfish') {
          en.y += en.vx * dt;
          if (en.y < en.patrolMin) {
            en.y = en.patrolMin;
            en.vx = Math.abs(en.speed);
          } else if (en.y > en.patrolMax) {
            en.y = en.patrolMax;
            en.vx = -Math.abs(en.speed);
          }
        } else {
          en.x += en.vx * dt;
          if (en.x < en.patrolMin) {
            en.x = en.patrolMin;
            en.vx = Math.abs(en.speed);
          } else if (en.x > en.patrolMax) {
            en.x = en.patrolMax;
            en.vx = -Math.abs(en.speed);
          }
        }

        // Player collision with enemy
        if (rectOverlap(player.x, player.y, player.w, player.h, en.x, en.y, en.w, en.h)) {
          const stomping =
            !bp.isWater && (player.vy > 80 || player.bellyFlopping) && player.y + player.h - 14 < en.y + en.h * 0.65;
          if (stomping || player.activePower === 'golden_bone' || player.rollTimer > 0) {
            en.alive = false;
            if (!bp.isWater) player.vy = -380;
            audioSystem.playSfx('enemy_defeat');
            spawnParticles(en.x + en.w / 2, en.y + en.h / 2, '#ffd166', 14);
          } else {
            hurtPlayer();
          }
        }
      }

      // Update Mini-Boss
      if (boss && !boss.defeated) {
        if (boss.hurtFlash > 0) boss.hurtFlash -= dt;
        const distToPlayer = Math.abs(player.x - boss.x);
        if (distToPlayer < 750) {
          // Patrol gently near arena
          boss.x += boss.dir * 68 * dt;
          const minX = bp.miniBoss!.x - 160;
          const maxX = bp.miniBoss!.x + 120;
          if (boss.x < minX) boss.dir = 1;
          if (boss.x > maxX) boss.dir = -1;
          if (bp.isWater) {
            boss.y = boss.baseY + Math.sin(timeSec * 2.4) * 95;
          }

          boss.attackTimer -= dt;
          if (boss.attackTimer <= 0) {
            boss.attackTimer = 2.05;
            const aimX = player.x - boss.x;
            const aimY = player.y - boss.y;
            const len = Math.max(1, Math.hypot(aimX, aimY));
            const spd = 290;
            const pKind =
              boss.kind === 'mushroom'
                ? 'sneeze'
                : boss.kind === 'baker_bot'
                ? 'cupcake'
                : boss.kind === 'octopus'
                ? 'ink'
                : 'snowball';
            projectiles.push({
              x: boss.x + boss.w / 2,
              y: boss.y + 38,
              vx: (aimX / len) * spd,
              vy: (aimY / len) * spd - (bp.isWater ? 0 : 75),
              radius: 15,
              fromPlayer: false,
              kind: pKind,
              life: 3.2,
            });
            audioSystem.playSfx('shoot');
          }

          if (rectOverlap(player.x, player.y, player.w, player.h, boss.x, boss.y, boss.w, boss.h)) {
            const stomping = !bp.isWater && player.vy > 60 && player.y + player.h - 18 < boss.y + 36;
            if (stomping || player.activePower === 'golden_bone') {
              damageBoss(player.bellyFlopping ? 2 : 1);
              player.vy = -490;
              player.vx = -220;
            } else {
              hurtPlayer();
            }
          }
        }
      }

      // Update Projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const pr = projectiles[i];
        pr.life -= dt;
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;
        if (!bp.isWater && (pr.kind === 'cupcake' || pr.kind === 'snowball' || pr.kind === 'fire')) {
          pr.vy += 320 * dt;
        }

        if (pr.life <= 0) {
          projectiles.splice(i, 1);
          continue;
        }

        if (pr.fromPlayer) {
          let hit = false;
          for (const en of enemies) {
            if (!en.alive) continue;
            if (Math.hypot(pr.x - (en.x + en.w / 2), pr.y - (en.y + en.h / 2)) < pr.radius + 24) {
              if (pr.kind === 'frost') {
                en.frozenTimer = 4.5;
                spawnParticles(en.x + 20, en.y + 20, '#90e0ef', 12);
              } else {
                en.alive = false;
                spawnParticles(en.x + 20, en.y + 20, '#ffd166', 12);
              }
              audioSystem.playSfx('enemy_defeat');
              hit = true;
              break;
            }
          }
          if (!hit && boss && !boss.defeated) {
            if (
              pr.x + pr.radius > boss.x &&
              pr.x - pr.radius < boss.x + boss.w &&
              pr.y + pr.radius > boss.y &&
              pr.y - pr.radius < boss.y + boss.h
            ) {
              damageBoss(pr.kind === 'fire' ? 1.5 : 1);
              hit = true;
            }
          }
          if (hit) projectiles.splice(i, 1);
        } else {
          // Enemy projectile hits player
          if (Math.hypot(pr.x - (player.x + 22), pr.y - (player.y + 20)) < pr.radius + 18) {
            hurtPlayer();
            projectiles.splice(i, 1);
          }
        }
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life -= dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += 320 * dt;
        if (pt.life <= 0) particles.splice(i, 1);
      }

      // Update Ambience
      for (const a of ambience) {
        if (bp.isWater) {
          a.y -= a.speed * dt * 0.7;
          a.x += Math.sin(timeSec * 2 + a.drift) * 14 * dt;
          if (a.y < -10) {
            a.y = 740;
            a.x = Math.random() * 1400;
          }
        } else {
          a.y += a.speed * dt;
          a.x += Math.sin(timeSec + a.drift) * 20 * dt;
          if (a.y > 740) {
            a.y = -10;
            a.x = Math.random() * 1400;
          }
        }
      }

      // Goal / Star Fragment Check
      const canFinishBoss = !boss || boss.defeated;
      const allTreesLit = treeSwitches.length === 0 || treeSwitches.every((t) => t.lit);
      if (Math.hypot(player.x + 22 - bp.goal.x, player.y + 20 - bp.goal.y) < 62) {
        if (!canFinishBoss) {
          showBanner(`Derrote ${boss!.name} para pegar o Fragmento!`, 1.8);
        } else if (!allTreesLit) {
          const left = treeSwitches.filter((t) => !t.lit).length;
          showBanner(`🎄 Ainda faltam ${left} árvores apagadas na vila!`, 2.0);
        } else {
          finished = true;
          audioSystem.playSfx('win');
          const pawsGot = goldenPaws.filter((g) => g.collected).length;
          const starsEarned = Math.min(3, 1 + (pawsGot >= 2 ? 1 : 0) + (player.hearts >= 2 && treatsCollected >= 10 ? 1 : 0));
          onFinish({
            levelId,
            won: true,
            treatsCollected,
            goldenPaws: [goldenPaws[0].collected, goldenPaws[1].collected, goldenPaws[2].collected],
            timeSec,
            heartsRemaining: player.hearts,
            starsEarned,
          });
        }
      }

      // Camera smooth follow
      const viewW = canvas.clientWidth;
      const targetCam = Math.max(0, Math.min(bp.worldWidth - viewW, player.x - viewW * 0.36));
      cameraX += (targetCam - cameraX) * Math.min(1, dt * 8);

      // Push HUD every ~80ms
      hudTick += dt;
      if (hudTick > 0.08) {
        hudTick = 0;
        let progressLabel = `${Math.round((player.x / bp.worldWidth) * 100)}% da fase`;
        if (treeSwitches.length > 0) {
          const lit = treeSwitches.filter((t) => t.lit).length;
          progressLabel = `🎄 Árvores acesas: ${lit}/${treeSwitches.length}`;
        }
        onHudUpdate({
          hearts: player.hearts,
          maxHearts: player.maxHearts,
          treats: treatsCollected,
          lives: currentLives,
          goldenPaws: [goldenPaws[0].collected, goldenPaws[1].collected, goldenPaws[2].collected],
          activePower: player.activePower,
          powerTimer: player.powerTimer,
          hasShield: player.hasShield,
          progressLabel,
          bossName: boss && !boss.defeated && Math.abs(player.x - boss.x) < 780 ? boss.name : undefined,
          bossHp: boss ? Math.max(0, boss.hp) : undefined,
          bossMaxHp: boss ? boss.maxHp : undefined,
          bannerText: bannerText || undefined,
        });
      }
    };

    const drawSeussTree = (x: number, y: number, scale: number, tint: string, lit = true) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      // Curved whimsical trunk
      ctx.strokeStyle = '#3b1f16';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-18, -45, 8, -95);
      ctx.stroke();
      // Spiraled Seuss foliage
      ctx.fillStyle = tint;
      ctx.strokeStyle = '#1b1030';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-42, -55);
      ctx.quadraticCurveTo(0, -165, 22, -145);
      ctx.quadraticCurveTo(50, -90, 42, -55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Ornaments
      if (lit) {
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(-10, -85, 6, 0, Math.PI * 2);
        ctx.arc(14, -108, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e63946';
        ctx.beginPath();
        ctx.arc(10, -72, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawLucky = () => {
      ctx.save();
      const cx = player.x - cameraX + player.w / 2;
      const cy = player.y + player.h / 2;
      ctx.translate(cx, cy);
      if (player.invulnTimer > 0 && Math.floor(timeSec * 16) % 2 === 0) {
        ctx.globalAlpha = 0.45;
      }

      if (player.rollTimer > 0) {
        ctx.rotate(timeSec * 18 * player.facing);
      } else if (player.bellyFlopping) {
        ctx.scale(1.22, 0.8);
      }
      ctx.scale(player.facing, 1);

      // Golden Bone invincibility aura
      if (player.activePower === 'golden_bone') {
        ctx.fillStyle = 'rgba(255, 209, 102, 0.38)';
        ctx.beginPath();
        ctx.arc(0, 0, 34, 0, Math.PI * 2);
        ctx.fill();
      }

      // Chubby fluffy white Shih Tzu body
      const bounce = player.grounded ? Math.sin(player.runAnim) * 2.5 : 0;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#231942';
      ctx.lineWidth = 3;

      // Tail wagging
      ctx.beginPath();
      ctx.arc(-20, -4 + Math.sin(timeSec * 14) * 3, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Round chubby torso
      ctx.beginPath();
      ctx.ellipse(-2, 4 + bounce, 20, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // SPFC Costume jersey stripes on Lucky!
      if (costume === 'spfc') {
        ctx.fillStyle = '#e63946';
        ctx.fillRect(-16, 0 + bounce, 26, 4);
        ctx.fillStyle = '#111111';
        ctx.fillRect(-16, 6 + bounce, 26, 4);
      }

      // Little stubby paws
      const pawSwing = Math.sin(player.runAnim) * 5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-10 + pawSwing, 17, 6, 4.5, 0, 0, Math.PI * 2);
      ctx.ellipse(10 - pawSwing, 17, 6, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Fluffy head
      ctx.beginPath();
      ctx.arc(10, -7 + bounce * 0.5, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Droopy fluffy white ear
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.ellipse(2, -4 + bounce * 0.5, 6, 11, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Red scarf trailing behind
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.roundRect(-4, 2 + bounce * 0.5, 22, 6, 3);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-4, 5 + bounce * 0.5);
      ctx.lineTo(-22, 2 + Math.sin(timeSec * 12) * 4);
      ctx.lineTo(-18, 10 + Math.sin(timeSec * 12) * 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Expressive eye & cute nose
      ctx.fillStyle = '#1e1633';
      ctx.beginPath();
      ctx.arc(16, -9 + bounce * 0.5, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(17, -10 + bounce * 0.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e1633';
      ctx.beginPath();
      ctx.arc(23, -5 + bounce * 0.5, 2.7, 0, Math.PI * 2);
      ctx.fill();

      // Santa Hat or Pilot Goggles or Star Crown
      if (costume === 'santa') {
        ctx.fillStyle = '#e63946';
        ctx.beginPath();
        ctx.moveTo(-2, -18);
        ctx.lineTo(12, -32);
        ctx.lineTo(22, -18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(12, -33, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (costume === 'pilot') {
        ctx.fillStyle = '#90e0ef';
        ctx.strokeStyle = '#d4a373';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(14, -17, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (costume === 'starlight') {
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(10, -25, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Diving Helmet in Water level or Diver costume
      if (bp.isWater || costume === 'diver') {
        ctx.fillStyle = 'rgba(144, 224, 239, 0.28)';
        ctx.strokeStyle = '#caf0f8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(10, -6, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Bubble shield
      if (player.hasShield) {
        ctx.fillStyle = 'rgba(255, 133, 216, 0.2)';
        ctx.strokeStyle = '#ff85d8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(2, 0, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Bark ring animation
      if (player.barkTimer > 0) {
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3;
        const r = 14 + (0.28 - player.barkTimer) * 90;
        ctx.beginPath();
        ctx.arc(26, -4, r, -0.7, 0.7);
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawAlly = (charId: string, wx: number, wy: number, msg: string) => {
      const sx = wx - cameraX;
      if (sx < -120 || sx > canvas.clientWidth + 120) return;
      ctx.save();
      ctx.translate(sx, wy);

      const bob = Math.sin(timeSec * 4) * 3;
      if (charId === 'paulo') {
        // Paulo wearing white SPFC jersey with red & black chest stripes!
        ctx.fillStyle = '#1d3557';
        ctx.fillRect(-10, -18, 8, 18);
        ctx.fillRect(2, -18, 8, 18);
        // White SPFC shirt
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#231942';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.roundRect(-14, -46 + bob, 28, 30, 6);
        ctx.fill();
        ctx.stroke();
        // Horizontal Red & Black Stripes
        ctx.fillStyle = '#e63946';
        ctx.fillRect(-13, -37 + bob, 26, 4.5);
        ctx.fillStyle = '#111111';
        ctx.fillRect(-13, -30 + bob, 26, 4.5);
        // Crest
        ctx.fillStyle = '#e63946';
        ctx.fillRect(-4, -38 + bob, 8, 9);
        // Head
        ctx.fillStyle = '#fbd8b6';
        ctx.beginPath();
        ctx.arc(0, -57 + bob, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Hair
        ctx.fillStyle = '#4a3222';
        ctx.beginPath();
        ctx.arc(0, -61 + bob, 11, Math.PI, 0);
        ctx.fill();
      } else if (charId === 'lully') {
        // Lully: black & white Shih Tzu with red Christmas bow
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#231942';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, -13 + bob, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#22223b';
        ctx.beginPath();
        ctx.arc(-10, -22 + bob, 6, 0, Math.PI * 2);
        ctx.arc(10, -22 + bob, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -24 + bob, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#22223b';
        ctx.beginPath();
        ctx.arc(-4, -25 + bob, 4.5, 0, Math.PI * 2);
        ctx.fill();
        // Red bow
        ctx.fillStyle = '#e63946';
        ctx.beginPath();
        ctx.arc(0, -35 + bob, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Professor Pinhão owl
        ctx.fillStyle = '#8d5b4c';
        ctx.strokeStyle = '#231942';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, -24 + bob, 16, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#2b2d42';
        ctx.fillRect(-12, -56 + bob, 24, 14);
        ctx.fillRect(-16, -44 + bob, 32, 4);
      }

      // Speech bubble when Lucky is close
      if (Math.abs(player.x - wx) < 260) {
        ctx.font = 'bold 12px Nunito, sans-serif';
        const metrics = ctx.measureText(msg);
        const bw = Math.min(280, Math.max(120, metrics.width + 22));
        ctx.fillStyle = 'rgba(255, 248, 235, 0.96)';
        ctx.strokeStyle = '#231942';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-bw / 2, -108, bw, 34, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#231942';
        ctx.textAlign = 'center';
        ctx.fillText(msg.slice(0, 46), 0, -87);
      }

      ctx.restore();
    };

    const render = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const scaleY = h / bp.worldHeight;

      ctx.save();
      // Sky Gradient (in Level 9, brightens as trees get lit!)
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, bp.skyTop);
      grad.addColorStop(0.55, bp.skyMid);
      grad.addColorStop(1, bp.skyBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.scale(1, scaleY);

      // Parallax Dr. Seuss Spiral Hills
      ctx.fillStyle = bp.hillColor1;
      ctx.beginPath();
      ctx.moveTo(0, bp.worldHeight);
      for (let x = 0; x <= w + 120; x += 90) {
        const wx = x + cameraX * 0.25;
        const hy = 420 + Math.sin(wx * 0.005) * 90 + Math.cos(wx * 0.011) * 35;
        ctx.lineTo(x, hy);
      }
      ctx.lineTo(w, bp.worldHeight);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = bp.hillColor2;
      ctx.beginPath();
      ctx.moveTo(0, bp.worldHeight);
      for (let x = 0; x <= w + 100; x += 70) {
        const wx = x + cameraX * 0.45;
        const hy = 510 + Math.sin(wx * 0.007 + 1.2) * 65;
        ctx.lineTo(x, hy);
      }
      ctx.lineTo(w, bp.worldHeight);
      ctx.closePath();
      ctx.fill();

      // Parallax Seuss Trees (or underwater light rays)
      if (!bp.isWater) {
        for (let i = 0; i < 16; i++) {
          const tx = i * 320 - ((cameraX * 0.55) % 320);
          drawSeussTree(tx, 585, 0.75 + (i % 3) * 0.16, i % 2 === 0 ? '#2a9d8f' : '#2ec4b6', levelId !== 9 || treeSwitches.some((t) => t.lit));
        }
      } else {
        ctx.fillStyle = 'rgba(202, 240, 248, 0.08)';
        for (let i = 0; i < 6; i++) {
          const rx = ((i * 290 - cameraX * 0.3) % (w + 200)) + 100;
          ctx.beginPath();
          ctx.moveTo(rx, 0);
          ctx.lineTo(rx + 90, 0);
          ctx.lineTo(rx + 20, bp.worldHeight);
          ctx.lineTo(rx - 60, bp.worldHeight);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Draw Platforms (with 2.5D depth extrusion on 2.5D levels!)
      for (const p of platforms) {
        if (p.kind === 'crumble' && p.crumbleTimer < 0) continue;
        const sx = p.x - cameraX;
        if (sx + p.w < -60 || sx > w + 60) continue;

        ctx.save();
        if (p.kind === 'ghost') {
          ctx.globalAlpha = p.ghostAlpha;
        }
        const shakeX = p.kind === 'crumble' && p.crumbleTimer > 0 ? Math.sin(timeSec * 45) * 4 : 0;

        // 2.5D side bevel
        if (bp.is25D) {
          ctx.fillStyle = 'rgba(15, 8, 35, 0.55)';
          ctx.fillRect(sx + 10 + shakeX, p.y + 10, p.w, p.h);
        }

        if (p.kind === 'bounce') {
          // Giant bouncy Seuss mushroom
          ctx.fillStyle = '#f8edeb';
          ctx.strokeStyle = '#231942';
          ctx.lineWidth = 3;
          ctx.fillRect(sx + p.w * 0.32, p.y + 14, p.w * 0.36, p.h - 10);
          ctx.fillStyle = '#e63946';
          ctx.beginPath();
          ctx.ellipse(sx + p.w / 2, p.y + 14, p.w / 2, 16, 0, Math.PI, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(sx + p.w * 0.35, p.y + 7, 4.5, 0, Math.PI * 2);
          ctx.arc(sx + p.w * 0.62, p.y + 8, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'hazard') {
          ctx.fillStyle = '#5c2c0c';
          ctx.fillRect(sx, p.y, p.w, p.h);
          ctx.fillStyle = '#9c4a1a';
          for (let bx = 0; bx < p.w; bx += 42) {
            const by = p.y + Math.sin(timeSec * 4 + bx) * 4;
            ctx.beginPath();
            ctx.arc(sx + bx + 20, by, 14, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = p.kind === 'ice' ? '#72efdd' : p.kind === 'ghost' ? '#9d4edd' : bp.platformFill;
          ctx.strokeStyle = '#1b1030';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(sx + shakeX, p.y, p.w, p.h, 10);
          ctx.fill();
          ctx.stroke();

          // Top snow/grass/conveyor strip
          ctx.fillStyle =
            p.kind === 'conveyor'
              ? '#ffd166'
              : p.kind === 'ice'
              ? '#ffffff'
              : p.kind === 'crumble'
              ? '#caf0f8'
              : bp.platformTop;
          ctx.beginPath();
          ctx.roundRect(sx + shakeX, p.y, p.w, Math.min(13, p.h), [10, 10, 3, 3]);
          ctx.fill();

          if (p.kind === 'conveyor') {
            ctx.fillStyle = '#231942';
            const offset = ((timeSec * 80 * (p.conveyorDir || 1)) % 32 + 32) % 32;
            for (let cx = offset; cx < p.w - 12; cx += 32) {
              ctx.fillText(p.conveyorDir! > 0 ? '»' : '«', sx + cx, p.y + 11);
            }
          }
        }
        ctx.restore();
      }

      // Draw Level 9 Christmas Tree Switches
      for (const t of treeSwitches) {
        const sx = t.x - cameraX;
        if (sx < -100 || sx > w + 100) continue;
        drawSeussTree(sx, t.y, 1.05, t.lit ? '#2ec4b6' : '#4a4e69', t.lit);
        if (t.lit) {
          ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
          ctx.beginPath();
          ctx.arc(sx, t.y - 95, 42 + Math.sin(timeSec * 6) * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Checkpoint Doghouse
      {
        const cx = bp.checkpoint.x - cameraX;
        if (cx > -100 && cx < w + 100) {
          ctx.save();
          ctx.translate(cx, bp.checkpoint.y + 80);
          ctx.fillStyle = player.checkpointReached ? '#e63946' : '#6c757d';
          ctx.strokeStyle = '#231942';
          ctx.lineWidth = 3;
          ctx.fillRect(-26, -42, 52, 42);
          ctx.strokeRect(-26, -42, 52, 42);
          ctx.fillStyle = '#ffd166';
          ctx.beginPath();
          ctx.moveTo(-34, -40);
          ctx.lineTo(0, -68);
          ctx.lineTo(34, -40);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#1e1633';
          ctx.beginPath();
          ctx.arc(0, -14, 13, Math.PI, 0);
          ctx.lineTo(13, 0);
          ctx.lineTo(-13, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw Allies (Paulo SPFC, Lully, Prof. Pinhão)
      for (const ally of bp.allies) {
        drawAlly(ally.character, ally.x, ally.y, ally.message);
      }

      // Draw Treats (Bones)
      for (const tr of treats) {
        if (tr.collected) continue;
        const sx = tr.x - cameraX;
        if (sx < -40 || sx > w + 40) continue;
        const bob = Math.sin(timeSec * 5 + tr.x * 0.05) * 4;
        ctx.save();
        ctx.translate(sx, tr.y + bob);
        ctx.fillStyle = '#fff3b0';
        ctx.strokeStyle = '#582f0e';
        ctx.lineWidth = 2;
        ctx.fillRect(-9, -4, 18, 8);
        ctx.beginPath();
        ctx.arc(-10, -4, 4.5, 0, Math.PI * 2);
        ctx.arc(-10, 4, 4.5, 0, Math.PI * 2);
        ctx.arc(10, -4, 4.5, 0, Math.PI * 2);
        ctx.arc(10, 4, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Draw Golden Paws
      for (const gp of goldenPaws) {
        if (gp.collected) continue;
        const sx = gp.x - cameraX;
        if (sx < -60 || sx > w + 60) continue;
        const bob = Math.sin(timeSec * 4) * 6;
        ctx.save();
        ctx.translate(sx, gp.y + bob);
        ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '26px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐾', 0, 0);
        ctx.restore();
      }

      // Secret Sniff indicator toward nearest uncollected Golden Paw
      if (hasSecretSniff) {
        const nearest = goldenPaws.find((g) => !g.collected);
        if (nearest) {
          const dx = nearest.x - player.x;
          const dy = nearest.y - player.y;
          const ang = Math.atan2(dy, dx);
          const px = player.x - cameraX + 22 + Math.cos(ang) * 42;
          const py = player.y + 18 + Math.sin(ang) * 42;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(ang);
          ctx.fillStyle = '#ffd166';
          ctx.beginPath();
          ctx.moveTo(10, 0);
          ctx.lineTo(-6, -6);
          ctx.lineTo(-6, 6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw PowerUps
      for (const pu of powerUps) {
        if (pu.collected) continue;
        const sx = pu.x - cameraX;
        if (sx < -50 || sx > w + 50) continue;
        const info = POWERUP_INFO[pu.type];
        const bob = Math.sin(timeSec * 4.5) * 5;
        ctx.save();
        ctx.translate(sx, pu.y + bob);
        ctx.fillStyle = info.color;
        ctx.strokeStyle = '#231942';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 19, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.emoji, 0, 1);
        ctx.restore();
      }

      // Draw Enemies
      for (const en of enemies) {
        if (!en.alive) continue;
        const sx = en.x - cameraX;
        if (sx < -60 || sx > w + 60) continue;
        ctx.save();
        ctx.translate(sx + en.w / 2, en.y + en.h / 2);
        if (en.frozenTimer > 0) {
          ctx.fillStyle = 'rgba(144, 224, 239, 0.72)';
          ctx.fillRect(-24, -24, 48, 48);
        }
        ctx.strokeStyle = '#1b1030';
        ctx.lineWidth = 2.8;
        if (en.kind === 'jellyfish') {
          ctx.fillStyle = '#ff5d8f';
          ctx.beginPath();
          ctx.arc(0, -4, 18, Math.PI, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = '#ffccd5';
          for (let t = -10; t <= 10; t += 10) {
            ctx.beginPath();
            ctx.moveTo(t, -2);
            ctx.quadraticCurveTo(t + Math.sin(timeSec * 6 + t) * 5, 10, t, 20);
            ctx.stroke();
          }
        } else if (en.kind === 'ghost_goof') {
          ctx.fillStyle = 'rgba(235, 225, 255, 0.88)';
          ctx.beginPath();
          ctx.arc(0, -4, 18, Math.PI, 0);
          ctx.lineTo(18, 16);
          ctx.lineTo(8, 10);
          ctx.lineTo(0, 16);
          ctx.lineTo(-8, 10);
          ctx.lineTo(-18, 16);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (en.kind === 'snowball_roller') {
          ctx.fillStyle = '#e0fbfc';
          ctx.beginPath();
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle =
            en.kind === 'chomper'
              ? '#e63946'
              : en.kind === 'candy_bot'
              ? '#ff9f1c'
              : en.kind === 'living_chair'
              ? '#8d5b4c'
              : '#9d4edd';
          ctx.beginPath();
          ctx.roundRect(-19, -18, 38, 36, 12);
          ctx.fill();
          ctx.stroke();
        }
        // Silly cartoon eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-6, -4, 4.5, 0, Math.PI * 2);
        ctx.arc(6, -4, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-6, -4, 2, 0, Math.PI * 2);
        ctx.arc(6, -4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Mini-Boss
      if (boss && !boss.defeated) {
        const sx = boss.x - cameraX;
        if (sx > -150 && sx < w + 150) {
          ctx.save();
          ctx.translate(sx + boss.w / 2, boss.y + boss.h / 2);
          if (boss.hurtFlash > 0) ctx.filter = 'brightness(1.8)';
          ctx.strokeStyle = '#1b1030';
          ctx.lineWidth = 4;

          if (boss.kind === 'mushroom') {
            ctx.fillStyle = '#fff8eb';
            ctx.fillRect(-24, -6, 48, 52);
            ctx.strokeRect(-24, -6, 48, 52);
            ctx.fillStyle = '#e63946';
            ctx.beginPath();
            ctx.ellipse(0, -10, 52, 34, 0, Math.PI, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ffd166';
            ctx.beginPath();
            ctx.arc(-20, -24, 9, 0, Math.PI * 2);
            ctx.arc(18, -22, 10, 0, Math.PI * 2);
            ctx.fill();
          } else if (boss.kind === 'baker_bot') {
            ctx.fillStyle = '#ff9f1c';
            ctx.beginPath();
            ctx.roundRect(-40, -34, 80, 78, 16);
            ctx.fill();
            ctx.stroke();
            // Chef hat
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-15, -42, 16, 0, Math.PI * 2);
            ctx.arc(0, -48, 19, 0, Math.PI * 2);
            ctx.arc(15, -42, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (boss.kind === 'octopus') {
            ctx.fillStyle = '#7209b7';
            ctx.beginPath();
            ctx.arc(0, -12, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            for (let t = -32; t <= 32; t += 16) {
              ctx.beginPath();
              ctx.moveTo(t, 20);
              ctx.quadraticCurveTo(t + Math.sin(timeSec * 5 + t) * 10, 38, t, 48);
              ctx.stroke();
            }
          } else {
            // Giant Snowman
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 18, 34, 0, Math.PI * 2);
            ctx.arc(0, -20, 26, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ff7b00';
            ctx.beginPath();
            ctx.moveTo(0, -20);
            ctx.lineTo(-22, -16);
            ctx.lineTo(0, -12);
            ctx.closePath();
            ctx.fill();
          }

          // Angry goofy eyes
          ctx.fillStyle = '#ffea00';
          ctx.beginPath();
          ctx.arc(-14, -6, 7, 0, Math.PI * 2);
          ctx.arc(14, -6, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#111';
          ctx.beginPath();
          ctx.arc(-14, -6, 3, 0, Math.PI * 2);
          ctx.arc(14, -6, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw Goal Star Fragment
      {
        const gx = bp.goal.x - cameraX;
        if (gx > -100 && gx < w + 100) {
          const locked = (boss && !boss.defeated) || (treeSwitches.length > 0 && !treeSwitches.every((t) => t.lit));
          const bob = Math.sin(timeSec * 3.5) * 10;
          ctx.save();
          ctx.translate(gx, bp.goal.y + bob);
          ctx.globalAlpha = locked ? 0.4 : 1;
          ctx.fillStyle = 'rgba(255, 209, 102, 0.45)';
          ctx.beginPath();
          ctx.arc(0, 0, 44, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '46px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', 0, 0);
          ctx.restore();
        }
      }

      // Draw Lucky Boy
      drawLucky();

      // Draw Projectiles
      for (const pr of projectiles) {
        const sx = pr.x - cameraX;
        ctx.save();
        ctx.translate(sx, pr.y);
        if (pr.kind === 'bark') {
          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, pr.radius, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle =
            pr.kind === 'fire'
              ? '#ff4d4d'
              : pr.kind === 'frost'
              ? '#6ce5ff'
              : pr.kind === 'sneeze'
              ? '#80ed99'
              : pr.kind === 'cupcake'
              ? '#ff758f'
              : pr.kind === 'ink'
              ? '#240046'
              : '#ffffff';
          ctx.strokeStyle = '#1b1030';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, pr.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw Particles
      for (const pt of particles) {
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x - cameraX, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Snowflakes or Bubbles foreground
      const count = bp.isWater ? 40 : Math.floor(ambience.length * bp.snowIntensity);
      ctx.fillStyle = bp.isWater ? 'rgba(202, 240, 248, 0.45)' : 'rgba(255, 255, 255, 0.78)';
      for (let i = 0; i < count; i++) {
        const a = ambience[i];
        ctx.beginPath();
        ctx.arc(a.x % w, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      update(dt);
      render();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [levelId, costume, unlockedSkills, lives, onHudUpdate, onFinish, onPauseRequest]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};
