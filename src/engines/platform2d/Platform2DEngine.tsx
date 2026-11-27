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
  crumbleTimer: number;
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

    const platforms: ActivePlatform[] = bp.platforms.map((p) => ({
      ...p,
      baseX: p.x,
      baseY: p.y,
      prevX: p.x,
      prevY: p.y,
      crumbleTimer: 0,
      respawnTimer: 0,
      ghostAlpha: p.kind === 'ghost' ? 0.24 : 1,
    }));

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

    const treats = bp.treats.map((t) => ({ ...t, collected: false }));
    const goldenPaws = bp.goldenPaws.map((gp) => ({ ...gp, collected: false }));
    const powerUps = bp.powerUps.map((p) => ({ ...p, collected: false }));
    const treeSwitches = (bp.treeSwitches || []).map((t) => ({ ...t, lit: false }));

    const boss: ActiveBoss | null = bp.miniBoss
      ? {
          name: bp.miniBoss.name,
          kind: bp.miniBoss.kind,
          x: bp.miniBoss.x,
          y: bp.isWater ? bp.miniBoss.y : bp.miniBoss.y - 92,
          baseY: bp.isWater ? bp.miniBoss.y : bp.miniBoss.y - 92,
          w: 90,
          h: 92,
          hp: bp.miniBoss.hp,
          maxHp: bp.miniBoss.hp,
          attackTimer: 1.9,
          hurtFlash: 0,
          defeated: false,
          dir: -1,
        }
      : null;

    const projectiles: Projectile[] = [];
    const particles: Particle[] = [];

    const ambience = Array.from({ length: 65 }, () => ({
      x: Math.random() * 1800,
      y: Math.random() * 750,
      r: 2.5 + Math.random() * 4,
      speed: 22 + Math.random() * 50,
      drift: Math.random() * Math.PI * 2,
    }));

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
      jumpBuffer: 0,
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
      lastSafeX: bp.spawn.x,
      lastSafeY: bp.spawn.y,
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

    const showBanner = (msg: string, duration = 2.4) => {
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
          life: 0.35 + Math.random() * 0.45,
          maxLife: 0.8,
        });
      }
    };

    const hurtPlayer = (fromPit = false) => {
      if (!fromPit && (player.invulnTimer > 0 || player.activePower === 'golden_bone')) return;
      if (!fromPit && player.hasShield) {
        player.hasShield = false;
        player.invulnTimer = 1.4;
        audioSystem.playSfx('splash');
        spawnParticles(player.x + 22, player.y + 20, '#e278b8', 16);
        showBanner('🫧 Bolha Protetora absorveu o golpe!', 1.8);
        return;
      }

      player.hearts--;
      player.invulnTimer = 1.8;
      audioSystem.playSfx('hurt');
      spawnParticles(player.x + 22, player.y + 20, '#d92626', 14);

      if (fromPit) {
        player.x = player.lastSafeX;
        player.y = player.lastSafeY - 8;
        player.vx = 0;
        player.vy = 0;
      } else {
        player.vy = -270;
        player.vx = -player.facing * 150;
      }

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
      boss.hurtFlash = 0.42;
      audioSystem.playSfx('enemy_defeat');
      spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ffe055', 18, 220);
      if (boss.hp <= 0) {
        boss.defeated = true;
        audioSystem.playSfx('star');
        spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ffe055', 42, 300);
        showBanner(`🎉 ${boss.name} derrotado! Pegue o Fragmento da Estrela!`, 3.5);
      }
    };

    const triggerBarkOrAttack = (superMode = false) => {
      if (player.barkCooldown > 0) return;
      const isSuper = superMode || player.activePower === 'super_bark';
      player.barkTimer = 0.3;
      player.barkCooldown = isSuper ? 0.34 : 0.25;

      if (isSuper) {
        audioSystem.playSfx('super_bark');
        ghostRevealTimer = 8.5;
        spawnParticles(player.x + 22, player.y + 18, '#ffe055', 20, 260);
        projectiles.push({
          x: player.x + (player.facing > 0 ? player.w : 0),
          y: player.y + 20,
          vx: player.facing * 540,
          vy: 0,
          radius: 26,
          fromPlayer: true,
          kind: 'bark',
          life: 0.85,
        });
      } else if (player.activePower === 'spicy_treat') {
        audioSystem.playSfx('shoot');
        projectiles.push({
          x: player.x + (player.facing > 0 ? player.w : 0),
          y: player.y + 18,
          vx: player.facing * 580,
          vy: -35,
          radius: 14,
          fromPlayer: true,
          kind: 'fire',
          life: 1.15,
        });
      } else if (player.activePower === 'frost_biscuit') {
        audioSystem.playSfx('shoot');
        projectiles.push({
          x: player.x + (player.facing > 0 ? player.w : 0),
          y: player.y + 18,
          vx: player.facing * 520,
          vy: 0,
          radius: 16,
          fromPlayer: true,
          kind: 'frost',
          life: 1.05,
        });
      } else {
        audioSystem.playSfx('bark');
        ghostRevealTimer = Math.max(ghostRevealTimer, 8.0);
        projectiles.push({
          x: player.x + (player.facing > 0 ? player.w : 0),
          y: player.y + 18,
          vx: player.facing * 490,
          vy: 0,
          radius: 19,
          fromPlayer: true,
          kind: 'bark',
          life: 0.72, // ~350px comfortable reach!
        });
      }

      for (const t of treeSwitches) {
        if (!t.lit && Math.hypot(t.x - (player.x + 22), t.y - 45 - player.y) < 180) {
          t.lit = true;
          audioSystem.playSfx('star');
          spawnParticles(t.x, t.y - 50, '#ffe055', 25, 220);
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
      if (player.jumpBuffer > 0) player.jumpBuffer -= dt;

      if (player.activePower) {
        player.powerTimer -= dt;
        if (player.powerTimer <= 0) {
          player.activePower = null;
          player.powerTimer = 0;
        }
      }

      // Update dynamic platforms
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
              p.respawnTimer = 2.8;
              spawnParticles(p.x + p.w / 2, p.y + 12, '#eefaff', 10);
            }
          } else if (p.crumbleTimer < 0) {
            p.respawnTimer -= dt;
            if (p.respawnTimer <= 0) {
              p.crumbleTimer = 0;
            }
          }
        }
        if (p.kind === 'ghost') {
          const target = ghostRevealTimer > 0 ? 0.98 : 0.22;
          p.ghostAlpha += (target - p.ghostAlpha) * Math.min(1, dt * 8);
        }
      }

      const moveInput = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (moveInput !== 0) player.facing = moveInput > 0 ? 1 : -1;

      if (bp.isWater) {
        const swimAccel = 780;
        const maxSwim = inp.a ? 330 : 225;
        if (moveInput !== 0) {
          player.vx += moveInput * swimAccel * dt;
        } else {
          player.vx *= Math.pow(0.08, dt);
        }

        const vertInput = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
        if (vertInput !== 0) {
          player.vy += vertInput * swimAccel * dt;
        } else {
          player.vy += (24 - player.vy) * Math.min(1, dt * 3.5);
        }

        if (inp.aJustPressed) {
          audioSystem.playSfx('splash');
          player.vx += player.facing * 150;
          player.vy -= 95;
          spawnParticles(player.x + 22, player.y + 22, '#ffffff', 6, 80);
        }

        if (inp.xJustPressed && player.rollCooldown <= 0) {
          player.rollTimer = 0.25;
          player.rollCooldown = 0.62;
          player.vx = player.facing * 430;
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
        // Super responsive Super Mario-style movement
        const maxSpeed = player.rollTimer > 0 ? 440 : inp.x ? 350 : 285;
        const accel = player.onIce ? 560 : player.grounded ? 2100 : 1450;
        const friction = player.onIce ? 0.52 : player.grounded ? 0.0005 : 0.22;

        if (player.rollTimer > 0) {
          player.vx = player.facing * 425;
        } else if (moveInput !== 0) {
          player.vx += moveInput * accel * dt;
          if (Math.abs(player.vx) > maxSpeed) {
            player.vx = Math.sign(player.vx) * maxSpeed;
          }
        } else {
          player.vx *= Math.pow(friction, dt);
          if (Math.abs(player.vx) < 8) player.vx = 0;
        }

        if (inp.xJustPressed && player.rollCooldown <= 0 && !player.bellyFlopping) {
          player.rollTimer = 0.24;
          player.rollCooldown = 0.58;
          player.vx = player.facing * 430;
          audioSystem.playSfx('jump');
          spawnParticles(player.x + 22, player.y + 36, '#fff9eb', 6, 90);
        }

        if (player.grounded) {
          player.coyote = 0.14;
          player.jumpsUsed = 0;
        } else {
          player.coyote -= dt;
        }

        if (inp.aJustPressed) {
          player.jumpBuffer = 0.14;
        }

        // Generous jump height (~165px single jump, ~215px with Spring Paws!)
        const jumpPower = player.activePower === 'spring_paws' ? -790 : -685;
        if (player.jumpBuffer > 0) {
          if (player.coyote > 0) {
            player.vy = jumpPower;
            player.grounded = false;
            player.coyote = 0;
            player.jumpBuffer = 0;
            player.jumpsUsed = 1;
            player.bellyFlopping = false;
            audioSystem.playSfx('jump');
            spawnParticles(player.x + 22, player.y + 40, '#ffffff', 6, 80);
          } else if (hasDoubleJump && player.jumpsUsed < 2) {
            player.vy = jumpPower * 0.92;
            player.jumpBuffer = 0;
            player.jumpsUsed = 2;
            player.bellyFlopping = false;
            audioSystem.playSfx('double_jump');
            spawnParticles(player.x + 22, player.y + 38, '#ffe055', 10, 120);
          }
        }

        // Variable jump height (short hop when releasing A early)
        if (!inp.a && player.vy < -280) {
          player.vy += 1200 * dt;
        }

        // Belly Flop (Down + B in air)
        if (!player.grounded && inp.down && inp.bJustPressed && hasBellyFlop && !player.bellyFlopping) {
          player.bellyFlopping = true;
          player.vx *= 0.25;
          player.vy = 780;
          audioSystem.playSfx('belly_flop');
        } else if (inp.bJustPressed) {
          triggerBarkOrAttack(false);
        }

        if (inp.yJustPressed) {
          if (player.activePower === 'spicy_treat' || player.activePower === 'frost_biscuit') {
            triggerBarkOrAttack(false);
          } else {
            triggerBarkOrAttack(true);
          }
        }

        const gravity = player.bellyFlopping ? 2450 : 1420;
        player.vy = Math.min(880, player.vy + gravity * dt);
      }

      // Move X & Collide (NOTE: bounce mushrooms & hazards NEVER block horizontal movement!)
      player.x += player.vx * dt;
      player.x = Math.max(8, Math.min(bp.worldWidth - player.w - 8, player.x));

      for (const p of platforms) {
        if (p.kind === 'crumble' && p.crumbleTimer < 0) continue;
        if (p.kind === 'ghost' && p.ghostAlpha < 0.45) continue;
        if (p.kind === 'hazard' || p.kind === 'bounce') continue;
        if (rectOverlap(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)) {
          // Only block side if it's a real wall (not tiny lip when stepping up)
          if (player.y + player.h - p.y > 10) {
            if (player.vx > 0) player.x = p.x - player.w;
            else if (player.vx < 0) player.x = p.x + p.w;
            player.vx = 0;
          }
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
            hurtPlayer(false);
            player.vy = -560;
            continue;
          }
          if (p.kind === 'bounce') {
            player.y = p.y - player.h;
            player.vy = -850;
            player.grounded = false;
            player.jumpsUsed = 1;
            player.bellyFlopping = false;
            audioSystem.playSfx('double_jump');
            spawnParticles(p.x + p.w / 2, p.y, '#f46d75', 14, 180);
            continue;
          }
          if (player.vy >= 0) {
            player.y = p.y - player.h;
            player.vy = 0;
            player.grounded = true;
            player.bellyFlopping = false;

            if (p.kind === 'normal' || p.kind === 'ice') {
              // Remember safe grounded spot (away from edges) for forgiving pit respawn
              if (player.x > p.x + 12 && player.x + player.w < p.x + p.w - 12) {
                player.lastSafeX = player.x;
                player.lastSafeY = player.y;
              }
            }

            if (p.kind === 'conveyor') {
              player.x += (p.conveyorDir || 1) * 115 * dt;
            } else if (p.kind === 'ice') {
              player.onIce = true;
            } else if (p.kind === 'crumble' && p.crumbleTimer === 0) {
              p.crumbleTimer = 0.72;
            } else if (p.kind === 'moving') {
              player.x += p.x - p.prevX;
              player.y += p.y - p.prevY;
            }

            if (wasBellyFlopping) {
              audioSystem.playSfx('belly_flop');
              spawnParticles(player.x + 22, player.y + 40, '#ffe055', 18, 240);
              for (const en of enemies) {
                if (en.alive && Math.hypot(en.x - player.x, en.y - player.y) < 165) {
                  en.alive = false;
                  audioSystem.playSfx('enemy_defeat');
                  spawnParticles(en.x + 20, en.y + 20, '#ffe055', 14);
                }
              }
              if (boss && !boss.defeated && Math.hypot(boss.x + boss.w / 2 - player.x, boss.y + boss.h / 2 - player.y) < 175) {
                damageBoss(2);
              }
            }
          } else if (player.vy < 0) {
            player.y = p.y + p.h;
            player.vy = 0;
          }
        }
      }

      // Fall into pit -> forgiving safe respawn
      if (player.y > bp.worldHeight + 80) {
        hurtPlayer(true);
      }

      if (Math.abs(player.vx) > 20) {
        player.runAnim += dt * 11;
      }

      // Checkpoint doghouse
      if (!player.checkpointReached && Math.hypot(player.x - bp.checkpoint.x, player.y - bp.checkpoint.y) < 95) {
        player.checkpointReached = true;
        player.respawnX = bp.checkpoint.x;
        player.respawnY = bp.checkpoint.y - 20;
        player.lastSafeX = bp.checkpoint.x;
        player.lastSafeY = bp.checkpoint.y - 20;
        audioSystem.playSfx('checkpoint');
        spawnParticles(bp.checkpoint.x, bp.checkpoint.y, '#ffe055', 22, 200);
        showBanner('🏠 Checkpoint Casinha salvo!', 2.2);
      }

      // Level 9 Christmas tree switches on touch
      for (const t of treeSwitches) {
        if (!t.lit && Math.hypot(t.x - (player.x + 22), t.y - 45 - player.y) < 85) {
          t.lit = true;
          audioSystem.playSfx('star');
          spawnParticles(t.x, t.y - 55, '#ffe055', 25, 220);
          const litCount = treeSwitches.filter((x) => x.lit).length;
          showBanner(`🎄 Árvore iluminada! (${litCount}/${treeSwitches.length})`, 2.2);
        }
      }

      for (const tr of treats) {
        if (!tr.collected && Math.hypot(tr.x - (player.x + 22), tr.y - (player.y + 20)) < 38) {
          tr.collected = true;
          treatsCollected++;
          audioSystem.playSfx('treat');
          spawnParticles(tr.x, tr.y, '#ffe055', 6, 90);
        }
      }

      goldenPaws.forEach((gp, idx) => {
        if (!gp.collected && Math.hypot(gp.x - (player.x + 22), gp.y - (player.y + 20)) < 44) {
          gp.collected = true;
          audioSystem.playSfx('paw');
          spawnParticles(gp.x, gp.y, '#ffe055', 22, 220);
          showBanner(`🐾 Patinha Dourada #${idx + 1} encontrada!`, 2.2);
        }
      });

      for (const pu of powerUps) {
        if (!pu.collected && Math.hypot(pu.x - (player.x + 22), pu.y - (player.y + 20)) < 42) {
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

        if (rectOverlap(player.x, player.y, player.w, player.h, en.x, en.y, en.w, en.h)) {
          const stomping =
            !bp.isWater && (player.vy > 40 || player.bellyFlopping) && player.y + player.h - 16 < en.y + en.h * 0.7;
          if (stomping || player.activePower === 'golden_bone' || player.rollTimer > 0) {
            en.alive = false;
            if (!bp.isWater) player.vy = -420;
            audioSystem.playSfx('enemy_defeat');
            spawnParticles(en.x + en.w / 2, en.y + en.h / 2, '#ffe055', 14);
          } else {
            hurtPlayer(false);
          }
        }
      }

      // Mini-Boss Update (stays in arena before goal!)
      if (boss && !boss.defeated) {
        if (boss.hurtFlash > 0) boss.hurtFlash -= dt;
        const distToPlayer = Math.abs(player.x - boss.x);
        if (distToPlayer < 780) {
          boss.x += boss.dir * 65 * dt;
          const minX = bp.miniBoss!.x - 150;
          const maxX = Math.min(bp.goal.x - 160, bp.miniBoss!.x + 110);
          if (boss.x < minX) boss.dir = 1;
          if (boss.x > maxX) boss.dir = -1;
          if (bp.isWater) {
            boss.y = boss.baseY + Math.sin(timeSec * 2.2) * 90;
          }

          boss.attackTimer -= dt;
          if (boss.attackTimer <= 0) {
            boss.attackTimer = 2.15;
            const aimX = player.x - boss.x;
            const aimY = player.y - boss.y;
            const len = Math.max(1, Math.hypot(aimX, aimY));
            const spd = 275;
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
              vy: (aimY / len) * spd - (bp.isWater ? 0 : 70),
              radius: 14,
              fromPlayer: false,
              kind: pKind,
              life: 3.0,
            });
            audioSystem.playSfx('shoot');
          }

          if (rectOverlap(player.x, player.y, player.w, player.h, boss.x, boss.y, boss.w, boss.h)) {
            const stomping = !bp.isWater && player.vy > 40 && player.y + player.h - 20 < boss.y + 42;
            if (stomping || player.activePower === 'golden_bone') {
              damageBoss(player.bellyFlopping ? 2 : 1);
              player.vy = -540;
              player.vx = -220;
            } else {
              hurtPlayer(false);
            }
          }
        }
      }

      for (let i = projectiles.length - 1; i >= 0; i--) {
        const pr = projectiles[i];
        pr.life -= dt;
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;
        if (!bp.isWater && (pr.kind === 'cupcake' || pr.kind === 'snowball' || pr.kind === 'fire')) {
          pr.vy += 300 * dt;
        }
        if (pr.life <= 0) {
          projectiles.splice(i, 1);
          continue;
        }

        if (pr.fromPlayer) {
          let hit = false;
          for (const en of enemies) {
            if (!en.alive) continue;
            if (Math.hypot(pr.x - (en.x + en.w / 2), pr.y - (en.y + en.h / 2)) < pr.radius + 26) {
              if (pr.kind === 'frost') {
                en.frozenTimer = 5.0;
                spawnParticles(en.x + 20, en.y + 20, '#6fd3f7', 12);
              } else {
                en.alive = false;
                spawnParticles(en.x + 20, en.y + 20, '#ffe055', 12);
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
          if (Math.hypot(pr.x - (player.x + 22), pr.y - (player.y + 20)) < pr.radius + 17) {
            hurtPlayer(false);
            projectiles.splice(i, 1);
          }
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life -= dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += 320 * dt;
        if (pt.life <= 0) particles.splice(i, 1);
      }

      for (const a of ambience) {
        if (bp.isWater) {
          a.y -= a.speed * dt * 0.7;
          a.x += Math.sin(timeSec * 2 + a.drift) * 14 * dt;
          if (a.y < -10) {
            a.y = 740;
            a.x = Math.random() * 1800;
          }
        } else {
          a.y += a.speed * dt;
          a.x += Math.sin(timeSec + a.drift) * 18 * dt;
          if (a.y > 740) {
            a.y = -10;
            a.x = Math.random() * 1800;
          }
        }
      }

      // Goal Check
      const canFinishBoss = !boss || boss.defeated;
      const allTreesLit = treeSwitches.length === 0 || treeSwitches.every((t) => t.lit);
      if (Math.hypot(player.x + 22 - bp.goal.x, player.y + 20 - bp.goal.y) < 68) {
        if (!canFinishBoss) {
          showBanner(`Derrote ${boss!.name} (pule ou lata B) para pegar o Fragmento!`, 2.0);
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

      // Proportional Viewport Camera (ZERO distortion on mobile/desktop!)
      const scale = canvas.clientHeight / bp.worldHeight;
      const viewW = canvas.clientWidth / Math.max(0.25, scale);
      const targetCam = Math.max(0, Math.min(Math.max(0, bp.worldWidth - viewW), player.x - viewW * 0.36));
      cameraX += (targetCam - cameraX) * Math.min(1, dt * 8.5);

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

    // Draw Lorax Truffula Tree (slender striped yellow curved trunk + fluffy pink/yellow/orange tuft!)
    const drawTruffulaTree = (x: number, y: number, scale: number, tuftColor: string) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.strokeStyle = '#f7da59';
      ctx.lineWidth = 11;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-24, -75, 10, -155);
      ctx.stroke();

      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 2.6;
      ctx.setLineDash([4, 9]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Fluffy Lorax starburst tuft
      ctx.fillStyle = tuftColor;
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const r = i % 2 === 0 ? 48 : 34;
        const px = 10 + Math.cos(a) * r;
        const py = -168 + Math.sin(a) * (r * 0.78);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    // Draw Lush Cat-in-the-Hat Christmas Tree (green tiered pine + pink garland + golden bell + ornaments!)
    const drawChristmasTree = (x: number, y: number, scale: number, lit = true) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#8b623f';
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 3;
      ctx.fillRect(-10, -28, 20, 28);
      ctx.strokeRect(-10, -28, 20, 28);

      ctx.fillStyle = lit ? '#5ea93f' : '#80917e';
      ctx.beginPath();
      ctx.moveTo(0, -142);
      ctx.quadraticCurveTo(-30, -108, -46, -86);
      ctx.lineTo(-26, -82);
      ctx.quadraticCurveTo(-48, -56, -58, -32);
      ctx.lineTo(58, -32);
      ctx.quadraticCurveTo(48, -56, 26, -82);
      ctx.lineTo(46, -86);
      ctx.quadraticCurveTo(30, -108, 0, -142);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (lit) {
        // Pink garland ribbon
        ctx.strokeStyle = '#e47bb8';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-36, -84);
        ctx.quadraticCurveTo(0, -68, 36, -84);
        ctx.moveTo(-48, -46);
        ctx.quadraticCurveTo(0, -32, 48, -46);
        ctx.stroke();

        // Golden Bell in middle
        ctx.fillStyle = '#ffd447';
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -62, 9, Math.PI, 0);
        ctx.lineTo(11, -50);
        ctx.lineTo(-11, -50);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Colorful ornaments
        const orbs: [number, number, string][] = [
          [-18, -96, '#d92626'],
          [16, -92, '#4cc9f0'],
          [-26, -54, '#ffe055'],
          [26, -54, '#d92626'],
        ];
        for (const [ox, oy, oc] of orbs) {
          ctx.fillStyle = oc;
          ctx.beginPath();
          ctx.arc(ox, oy, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
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

      if (player.activePower === 'golden_bone') {
        ctx.fillStyle = 'rgba(255, 224, 85, 0.45)';
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.fill();
      }

      const bounce = player.grounded ? Math.sin(player.runAnim) * 2.5 : 0;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(-20, -4 + Math.sin(timeSec * 14) * 3, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(-2, 4 + bounce, 20, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (costume === 'spfc') {
        ctx.fillStyle = '#d92626';
        ctx.fillRect(-16, 0 + bounce, 26, 4);
        ctx.fillStyle = '#111111';
        ctx.fillRect(-16, 6 + bounce, 26, 4);
      }

      const pawSwing = Math.sin(player.runAnim) * 5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-10 + pawSwing, 17, 6, 4.5, 0, 0, Math.PI * 2);
      ctx.ellipse(10 - pawSwing, 17, 6, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(10, -7 + bounce * 0.5, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff9eb';
      ctx.beginPath();
      ctx.ellipse(2, -4 + bounce * 0.5, 6, 11, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Red-and-white striped Seuss scarf
      ctx.fillStyle = '#d92626';
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

      ctx.fillStyle = '#221b18';
      ctx.beginPath();
      ctx.arc(16, -9 + bounce * 0.5, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(17, -10 + bounce * 0.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#221b18';
      ctx.beginPath();
      ctx.arc(23, -5 + bounce * 0.5, 2.7, 0, Math.PI * 2);
      ctx.fill();

      if (costume === 'santa') {
        ctx.fillStyle = '#d92626';
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
        ctx.fillStyle = '#a8e6ff';
        ctx.strokeStyle = '#d99316';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(14, -17, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (costume === 'starlight') {
        ctx.fillStyle = '#ffe055';
        ctx.beginPath();
        ctx.arc(10, -25, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (bp.isWater || costume === 'diver') {
        ctx.fillStyle = 'rgba(184, 240, 255, 0.34)';
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(10, -6, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      if (player.hasShield) {
        ctx.fillStyle = 'rgba(226, 120, 184, 0.24)';
        ctx.strokeStyle = '#e278b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(2, 0, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      if (player.barkTimer > 0) {
        ctx.strokeStyle = '#d92626';
        ctx.lineWidth = 3.5;
        const r = 14 + (0.3 - player.barkTimer) * 90;
        ctx.beginPath();
        ctx.arc(26, -4, r, -0.7, 0.7);
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawAlly = (charId: string, wx: number, wy: number, msg: string, viewW: number) => {
      const sx = wx - cameraX;
      if (sx < -120 || sx > viewW + 120) return;
      ctx.save();
      ctx.translate(sx, wy);

      const bob = Math.sin(timeSec * 4) * 3;
      if (charId === 'paulo') {
        ctx.fillStyle = '#1d3557';
        ctx.fillRect(-10, -18, 8, 18);
        ctx.fillRect(2, -18, 8, 18);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.roundRect(-14, -46 + bob, 28, 30, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#d92626';
        ctx.fillRect(-13, -37 + bob, 26, 4.5);
        ctx.fillStyle = '#111111';
        ctx.fillRect(-13, -30 + bob, 26, 4.5);
        ctx.fillStyle = '#d92626';
        ctx.fillRect(-4, -38 + bob, 8, 9);
        ctx.fillStyle = '#fbd8b6';
        ctx.beginPath();
        ctx.arc(0, -57 + bob, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#4a3222';
        ctx.beginPath();
        ctx.arc(0, -61 + bob, 11, Math.PI, 0);
        ctx.fill();
      } else if (charId === 'lully') {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.ellipse(0, -13 + bob, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#221b18';
        ctx.beginPath();
        ctx.arc(-10, -22 + bob, 6, 0, Math.PI * 2);
        ctx.arc(10, -22 + bob, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -24 + bob, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#221b18';
        ctx.beginPath();
        ctx.arc(-4, -25 + bob, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d92626';
        ctx.beginPath();
        ctx.arc(0, -35 + bob, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#a46a47';
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.ellipse(0, -24 + bob, 16, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-12, -56 + bob, 24, 14);
        ctx.strokeRect(-12, -56 + bob, 24, 14);
        ctx.fillStyle = '#d92626';
        ctx.fillRect(-12, -50 + bob, 24, 4);
      }

      if (Math.abs(player.x - wx) < 280) {
        ctx.font = 'bold 12px Nunito, sans-serif';
        const shown = msg.slice(0, 48);
        const bw = Math.min(310, Math.max(130, ctx.measureText(shown).width + 24));
        ctx.fillStyle = '#fffdf5';
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.roundRect(-bw / 2, -110, bw, 34, 14);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#221b18';
        ctx.textAlign = 'center';
        ctx.fillText(shown, 0, -89);
      }

      ctx.restore();
    };

    const render = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const scale = h / bp.worldHeight;
      const viewW = w / Math.max(0.25, scale);

      ctx.save();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, bp.skyTop);
      grad.addColorStop(0.55, bp.skyMid);
      grad.addColorStop(1, bp.skyBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Uniform proportional scale!
      ctx.scale(scale, scale);

      if (bp.isIndoor) {
        // Thing 1 & Thing 2 storybook living room / candy factory string lights!
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 2.5;
        for (let s = 0; s < 6; s++) {
          const sx = s * 420 - ((cameraX * 0.35) % 420) - 60;
          ctx.beginPath();
          ctx.moveTo(sx, 75);
          ctx.quadraticCurveTo(sx + 210, 155, sx + 420, 75);
          ctx.stroke();
          const bulbColors = ['#d92626', '#69b543', '#ffe055', '#6fd3f7', '#e278b8'];
          for (let b = 1; b <= 5; b++) {
            const t = b / 6;
            const bx = sx + 420 * t;
            const by = 75 + 4 * t * (1 - t) * 80;
            ctx.fillStyle = bulbColors[(b + s) % bulbColors.length];
            ctx.beginPath();
            ctx.arc(bx, by + 6, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
      } else if (!bp.isWater) {
        // Fluffy storybook clouds + Lorax sunburst rays
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const cx = ((i * 340 - cameraX * 0.15) % (viewW + 300) + (viewW + 300)) % (viewW + 300) - 100;
          const cy = 95 + (i % 3) * 42;
          ctx.beginPath();
          ctx.arc(cx, cy, 26, 0, Math.PI * 2);
          ctx.arc(cx + 26, cy - 8, 32, 0, Math.PI * 2);
          ctx.arc(cx + 55, cy, 24, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Rolling Green Dr. Seuss Hills with Ink Outline
      ctx.fillStyle = bp.hillColor1;
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, bp.worldHeight);
      for (let x = 0; x <= viewW + 120; x += 80) {
        const wx = x + cameraX * 0.25;
        const hy = 450 + Math.sin(wx * 0.0045) * 75 + Math.cos(wx * 0.009) * 28;
        ctx.lineTo(x, hy);
      }
      ctx.lineTo(viewW + 120, bp.worldHeight);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = bp.hillColor2;
      ctx.beginPath();
      ctx.moveTo(0, bp.worldHeight);
      for (let x = 0; x <= viewW + 120; x += 70) {
        const wx = x + cameraX * 0.45;
        const hy = 530 + Math.sin(wx * 0.0065 + 1.2) * 52;
        ctx.lineTo(x, hy);
      }
      ctx.lineTo(viewW + 120, bp.worldHeight);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Parallax Lorax Truffula Trees & Cat-in-the-Hat Christmas Trees!
      if (!bp.isWater && !bp.isIndoor) {
        const tufts = ['#f46d75', '#ffe055', '#ff9f43', '#e278b8'];
        for (let i = 0; i < 16; i++) {
          const tx = i * 290 - ((cameraX * 0.52) % 290);
          if (i % 2 === 0) {
            drawTruffulaTree(tx, 590, 0.8 + (i % 3) * 0.14, tufts[i % tufts.length]);
          } else {
            drawChristmasTree(tx, 595, 0.85 + (i % 2) * 0.18, levelId !== 9 || treeSwitches.some((t) => t.lit));
          }
        }
      } else if (bp.isWater) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        for (let i = 0; i < 6; i++) {
          const rx = ((i * 290 - cameraX * 0.3) % (viewW + 250)) + 60;
          ctx.beginPath();
          ctx.moveTo(rx, 0);
          ctx.lineTo(rx + 85, 0);
          ctx.lineTo(rx + 20, bp.worldHeight);
          ctx.lineTo(rx - 55, bp.worldHeight);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Draw Platforms
      for (const p of platforms) {
        if (p.kind === 'crumble' && p.crumbleTimer < 0) continue;
        const sx = p.x - cameraX;
        if (sx + p.w < -60 || sx > viewW + 60) continue;

        ctx.save();
        if (p.kind === 'ghost') {
          ctx.globalAlpha = p.ghostAlpha;
        }
        const shakeX = p.kind === 'crumble' && p.crumbleTimer > 0 ? Math.sin(timeSec * 45) * 4 : 0;

        if (bp.is25D) {
          ctx.fillStyle = 'rgba(34, 27, 24, 0.25)';
          ctx.fillRect(sx + 10 + shakeX, p.y + 10, p.w, p.h);
        }

        if (p.kind === 'bounce') {
          ctx.fillStyle = '#fff9eb';
          ctx.strokeStyle = '#221b18';
          ctx.lineWidth = 3;
          ctx.fillRect(sx + p.w * 0.32, p.y + 14, p.w * 0.36, p.h - 10);
          ctx.strokeRect(sx + p.w * 0.32, p.y + 14, p.w * 0.36, p.h - 10);
          ctx.fillStyle = '#d92626';
          ctx.beginPath();
          ctx.ellipse(sx + p.w / 2, p.y + 15, p.w / 2, 16, 0, Math.PI, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#fffdf5';
          ctx.beginPath();
          ctx.arc(sx + p.w * 0.34, p.y + 7, 5, 0, Math.PI * 2);
          ctx.arc(sx + p.w * 0.64, p.y + 8, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'hazard') {
          ctx.fillStyle = '#6b3314';
          ctx.fillRect(sx, p.y, p.w, p.h);
          ctx.fillStyle = '#a85322';
          for (let bx = 0; bx < p.w; bx += 40) {
            const by = p.y + Math.sin(timeSec * 4 + bx) * 4;
            ctx.beginPath();
            ctx.arc(sx + bx + 20, by, 14, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = p.kind === 'ice' ? '#8be0f7' : p.kind === 'ghost' ? '#b38cd9' : bp.platformFill;
          ctx.strokeStyle = '#221b18';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.roundRect(sx + shakeX, p.y, p.w, p.h, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle =
            p.kind === 'conveyor'
              ? '#ffe055'
              : p.kind === 'ice'
              ? '#ffffff'
              : p.kind === 'crumble'
              ? '#dff7ff'
              : bp.platformTop;
          ctx.beginPath();
          ctx.roundRect(sx + shakeX, p.y, p.w, Math.min(14, p.h), [12, 12, 4, 4]);
          ctx.fill();
          ctx.stroke();

          if (p.kind === 'conveyor') {
            ctx.fillStyle = '#221b18';
            ctx.font = 'bold 12px Nunito, sans-serif';
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
        if (sx < -100 || sx > viewW + 100) continue;
        drawChristmasTree(sx, t.y, 1.05, t.lit);
        if (t.lit) {
          ctx.fillStyle = 'rgba(255, 224, 85, 0.35)';
          ctx.beginPath();
          ctx.arc(sx, t.y - 80, 44 + Math.sin(timeSec * 6) * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Checkpoint Doghouse (only sitting on floor/base)
      {
        const cx = bp.checkpoint.x - cameraX;
        if (cx > -100 && cx < viewW + 100) {
          ctx.save();
          ctx.translate(cx, bp.checkpoint.y + 80);
          ctx.fillStyle = player.checkpointReached ? '#d92626' : '#c9b89e';
          ctx.strokeStyle = '#221b18';
          ctx.lineWidth = 3;
          ctx.fillRect(-26, -42, 52, 42);
          ctx.strokeRect(-26, -42, 52, 42);
          ctx.fillStyle = '#ffe055';
          ctx.beginPath();
          ctx.moveTo(-34, -40);
          ctx.lineTo(0, -68);
          ctx.lineTo(34, -40);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#221b18';
          ctx.beginPath();
          ctx.arc(0, -14, 13, Math.PI, 0);
          ctx.lineTo(13, 0);
          ctx.lineTo(-13, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      for (const ally of bp.allies) {
        drawAlly(ally.character, ally.x, ally.y, ally.message, viewW);
      }

      for (const tr of treats) {
        if (tr.collected) continue;
        const sx = tr.x - cameraX;
        if (sx < -40 || sx > viewW + 40) continue;
        const bob = Math.sin(timeSec * 5 + tr.x * 0.05) * 4;
        ctx.save();
        ctx.translate(sx, tr.y + bob);
        ctx.fillStyle = '#fff6cc';
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 2.4;
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

      for (const gp of goldenPaws) {
        if (gp.collected) continue;
        const sx = gp.x - cameraX;
        if (sx < -60 || sx > viewW + 60) continue;
        const bob = Math.sin(timeSec * 4) * 6;
        ctx.save();
        ctx.translate(sx, gp.y + bob);
        ctx.fillStyle = 'rgba(255, 224, 85, 0.55)';
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐾', 0, 1);
        ctx.restore();
      }

      if (hasSecretSniff) {
        const nearest = goldenPaws.find((g) => !g.collected);
        if (nearest) {
          const dx = nearest.x - player.x;
          const dy = nearest.y - player.y;
          const ang = Math.atan2(dy, dx);
          const px = player.x - cameraX + 22 + Math.cos(ang) * 44;
          const py = player.y + 18 + Math.sin(ang) * 44;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(ang);
          ctx.fillStyle = '#ffe055';
          ctx.strokeStyle = '#221b18';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(11, 0);
          ctx.lineTo(-6, -6);
          ctx.lineTo(-6, 6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      for (const pu of powerUps) {
        if (pu.collected) continue;
        const sx = pu.x - cameraX;
        if (sx < -50 || sx > viewW + 50) continue;
        const info = POWERUP_INFO[pu.type];
        const bob = Math.sin(timeSec * 4.5) * 5;
        ctx.save();
        ctx.translate(sx, pu.y + bob);
        ctx.fillStyle = info.color;
        ctx.strokeStyle = '#221b18';
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

      for (const en of enemies) {
        if (!en.alive) continue;
        const sx = en.x - cameraX;
        if (sx < -60 || sx > viewW + 60) continue;
        ctx.save();
        ctx.translate(sx + en.w / 2, en.y + en.h / 2);
        if (en.frozenTimer > 0) {
          ctx.fillStyle = 'rgba(111, 211, 247, 0.72)';
          ctx.fillRect(-24, -24, 48, 48);
        }
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 2.8;
        if (en.kind === 'jellyfish') {
          ctx.fillStyle = '#f46d75';
          ctx.beginPath();
          ctx.arc(0, -4, 18, Math.PI, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = '#e278b8';
          for (let t = -10; t <= 10; t += 10) {
            ctx.beginPath();
            ctx.moveTo(t, -2);
            ctx.quadraticCurveTo(t + Math.sin(timeSec * 6 + t) * 5, 10, t, 20);
            ctx.stroke();
          }
        } else if (en.kind === 'ghost_goof') {
          ctx.fillStyle = '#ffffff';
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
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle =
            en.kind === 'chomper'
              ? '#d92626'
              : en.kind === 'candy_bot'
              ? '#ff9f43'
              : en.kind === 'living_chair'
              ? '#b38cd9'
              : '#9f7aea';
          ctx.beginPath();
          ctx.roundRect(-19, -18, 38, 36, 12);
          ctx.fill();
          ctx.stroke();
        }
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-6, -4, 4.5, 0, Math.PI * 2);
        ctx.arc(6, -4, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#221b18';
        ctx.beginPath();
        ctx.arc(-6, -4, 2, 0, Math.PI * 2);
        ctx.arc(6, -4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (boss && !boss.defeated) {
        const sx = boss.x - cameraX;
        if (sx > -150 && sx < viewW + 150) {
          ctx.save();
          ctx.translate(sx + boss.w / 2, boss.y + boss.h / 2);
          if (boss.hurtFlash > 0) ctx.filter = 'brightness(1.75)';
          ctx.strokeStyle = '#221b18';
          ctx.lineWidth = 3.6;

          if (boss.kind === 'mushroom') {
            ctx.fillStyle = '#fff9eb';
            ctx.fillRect(-24, -6, 48, 50);
            ctx.strokeRect(-24, -6, 48, 50);
            ctx.fillStyle = '#d92626';
            ctx.beginPath();
            ctx.ellipse(0, -10, 50, 32, 0, Math.PI, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ffe055';
            ctx.beginPath();
            ctx.arc(-20, -24, 9, 0, Math.PI * 2);
            ctx.arc(18, -22, 10, 0, Math.PI * 2);
            ctx.fill();
          } else if (boss.kind === 'baker_bot') {
            ctx.fillStyle = '#ff9f43';
            ctx.beginPath();
            ctx.roundRect(-40, -34, 80, 76, 16);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-15, -42, 16, 0, Math.PI * 2);
            ctx.arc(0, -48, 19, 0, Math.PI * 2);
            ctx.arc(15, -42, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (boss.kind === 'octopus') {
            ctx.fillStyle = '#9f7aea';
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

          ctx.fillStyle = '#ffe055';
          ctx.beginPath();
          ctx.arc(-14, -6, 7, 0, Math.PI * 2);
          ctx.arc(14, -6, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#221b18';
          ctx.beginPath();
          ctx.arc(-14, -6, 3, 0, Math.PI * 2);
          ctx.arc(14, -6, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Goal Star Fragment
      {
        const gx = bp.goal.x - cameraX;
        if (gx > -100 && gx < viewW + 100) {
          const locked = (boss && !boss.defeated) || (treeSwitches.length > 0 && !treeSwitches.every((t) => t.lit));
          const bob = Math.sin(timeSec * 3.5) * 10;
          ctx.save();
          ctx.translate(gx, bp.goal.y + bob);
          ctx.globalAlpha = locked ? 0.45 : 1;
          ctx.fillStyle = 'rgba(255, 224, 85, 0.55)';
          ctx.strokeStyle = '#221b18';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 40, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.font = '44px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', 0, 2);
          ctx.restore();
        }
      }

      drawLucky();

      for (const pr of projectiles) {
        const sx = pr.x - cameraX;
        ctx.save();
        ctx.translate(sx, pr.y);
        if (pr.kind === 'bark') {
          ctx.strokeStyle = '#d92626';
          ctx.fillStyle = 'rgba(255, 224, 85, 0.5)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, pr.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle =
            pr.kind === 'fire'
              ? '#d92626'
              : pr.kind === 'frost'
              ? '#6fd3f7'
              : pr.kind === 'sneeze'
              ? '#80ed99'
              : pr.kind === 'cupcake'
              ? '#e278b8'
              : pr.kind === 'ink'
              ? '#4c1d95'
              : '#ffffff';
          ctx.strokeStyle = '#221b18';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, pr.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      for (const pt of particles) {
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x - cameraX, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const count = bp.isWater ? 40 : Math.floor(ambience.length * bp.snowIntensity);
      ctx.fillStyle = bp.isWater ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.85)';
      for (let i = 0; i < count; i++) {
        const a = ambience[i];
        ctx.beginPath();
        ctx.arc(a.x % viewW, a.y, a.r, 0, Math.PI * 2);
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

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
};
