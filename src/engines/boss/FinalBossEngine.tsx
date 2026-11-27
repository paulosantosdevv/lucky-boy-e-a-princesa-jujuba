import React, { useEffect, useRef } from 'react';
import {
  CostumeId,
  HudSnapshot,
  LevelCompletionResult,
} from '../../types/game';
import { inputManager } from '../../systems/inputSystem';
import { audioSystem } from '../../systems/audioSystem';
import { haptics } from '../../systems/haptics';

interface Props {
  costume: CostumeId;
  lives: number;
  paused: boolean;
  onHudUpdate: (hud: HudSnapshot) => void;
  onFinish: (result: LevelCompletionResult) => void;
  onPauseRequest: () => void;
  onSpecialYLabelChange?: (label?: string) => void;
}

interface ArenaPlat {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  w: number;
  h: number;
  moveAmpY?: number;
  moveAmpX?: number;
  moveSpeed?: number;
  phase?: number;
}

interface Proj {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  fromPlayer: boolean;
  kind: 'star' | 'super_star' | 'ornament' | 'gift_bomb' | 'gear' | 'lula_orb';
  life: number;
  bounces?: number;
  color: string;
}

interface Wave {
  x: number;
  y: number;
  vx: number;
  w: number;
  h: number;
  color: string;
  life: number;
}

interface TelegraphBeam {
  x: number;
  w: number;
  timer: number; // > 0.35 warning, <= 0.35 active strike!
  maxTimer: number;
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
  shape?: 'circle' | 'star' | 'heart';
}

interface HeartDrop {
  x: number;
  y: number;
  vy: number;
  active: boolean;
}

export const FinalBossEngine: React.FC<Props> = ({
  costume,
  lives,
  paused,
  onHudUpdate,
  onFinish,
  onPauseRequest,
  onSpecialYLabelChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1280;
    const H = 720;
    const FLOOR_Y = 608;

    // 3 Golden Paws — one appears during each combat stage in daring spots!
    const goldenPaws = [
      { stage: 1, x: 640, y: 215, collected: false },
      { stage: 2, x: 640, y: 175, collected: false },
      { stage: 3, x: 210, y: 235, collected: false },
    ];

    // Dynamic arena platforms (reconfigured slightly per stage!)
    const platforms: ArenaPlat[] = [
      { x: 110, y: 485, baseX: 110, baseY: 485, w: 190, h: 26, moveAmpY: 0, moveSpeed: 1.4, phase: 0 },
      { x: 980, y: 485, baseX: 980, baseY: 485, w: 190, h: 26, moveAmpY: 0, moveSpeed: 1.4, phase: Math.PI },
      { x: 260, y: 350, baseX: 260, baseY: 350, w: 175, h: 24, moveAmpY: 0, moveSpeed: 1.6, phase: 1.0 },
      { x: 845, y: 350, baseX: 845, baseY: 350, w: 175, h: 24, moveAmpY: 0, moveSpeed: 1.6, phase: 4.1 },
      { x: 545, y: 270, baseX: 545, baseY: 270, w: 190, h: 24, moveAmpY: 0, moveSpeed: 1.5, phase: 2.2 },
    ];

    // Stage 1: 3 Energy Cores on the Giant Mecha Christmas Tree (centered at x=640)
    const treeCores = [
      { id: 0, ox: -105, oy: -82, hp: 5, maxHp: 5, hurt: 0 },
      { id: 1, ox: 105, oy: -82, hp: 5, maxHp: 5, hurt: 0 },
      { id: 2, ox: 0, oy: -210, hp: 6, maxHp: 6, hurt: 0 },
    ];
    let treeSlamTimer = 5.0;
    let treeYOffset = 0;

    // Stage 2: Midnight Clock — 3 Temporal Crystals + Swinging Pendulum + Countdown!
    const clockCrystals = [
      { x: 190, y: 280, hp: 4, maxHp: 4, hurt: 0 },
      { x: 640, y: 190, hp: 4, maxHp: 4, hurt: 0 },
      { x: 1090, y: 280, hp: 4, maxHp: 4, hurt: 0 },
    ];
    let clockCountdown = 48;
    let pendulumAngle = 0;

    // Stage 3 & 4: Lula Supremo -> Redeemed Lula!
    const lula = {
      x: 640,
      y: 320,
      vx: 0,
      vy: 0,
      hp: 22,
      maxHp: 22,
      hurt: 0,
      state: 'hover' as 'hover' | 'wave_cast' | 'spiral_cast' | 'dash_warn' | 'dash' | 'dizzy' | 'sad' | 'happy',
      stateTimer: 2.2,
      dashTargetX: 200,
      dashTargetY: 500,
      facing: -1,
    };

    // Player (Lucky Boy)
    const player = {
      x: 190,
      y: FLOOR_Y - 42,
      vx: 0,
      vy: 0,
      w: 44,
      h: 42,
      facing: 1,
      grounded: false,
      coyote: 0,
      jumpBuffer: 0,
      jumpsUsed: 0,
      rollTimer: 0,
      rollCooldown: 0,
      shootCooldown: 0,
      bellyFlopping: false,
      invuln: 0,
      hearts: 5,
      maxHearts: 5,
      starMeter: 50, // 0..100; at 100 press Y for SUPER STAR BEAM!
      runAnim: 0,
    };

    const projs: Proj[] = [];
    const waves: Wave[] = [];
    const beams: TelegraphBeam[] = [];
    const particles: Particle[] = [];
    const heartDrops: HeartDrop[] = [];

    // Snowflakes outside the Gothic Windows
    const snow = Array.from({ length: 75 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 2 + Math.random() * 3.5,
      spd: 28 + Math.random() * 48,
      drift: Math.random() * Math.PI * 2,
    }));

    let stage: 1 | 2 | 3 | 4 = 1;
    let attackTimer = 1.6;
    let screenShake = 0;
    let timeSec = 0;
    let bannerText = '⚔️ ETAPA 1/4 — A ÁRVORE DA DESTRUIÇÃO! Destrua os 3 núcleos brilhantes!';
    let bannerTimer = 4.0;
    let giftAnimTimer = 0; // > 0 plays the touching final gift animation before ending screen!
    let giftFlyingProgress = 0;
    let finished = false;
    let hudTick = 0;

    const showBanner = (msg: string, dur = 3.2) => {
      bannerText = msg;
      bannerTimer = dur;
    };

    const spawnParticles = (
      x: number,
      y: number,
      color: string,
      count = 14,
      spread = 220,
      shape: 'circle' | 'star' | 'heart' = 'circle'
    ) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 45 + Math.random() * spread;
        particles.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 60,
          size: 4 + Math.random() * 6,
          color,
          life: 0.45 + Math.random() * 0.55,
          maxLife: 1.0,
          shape,
        });
      }
    };

    const dropHeartFromJujuba = () => {
      heartDrops.push({
        x: 980,
        y: 195,
        vy: -120,
        active: true,
      });
      spawnParticles(1040, 195, '#ff5d8f', 12, 130, 'heart');
    };

    const damagePlayer = () => {
      if (player.invuln > 0 || player.rollTimer > 0 || stage === 4 || giftAnimTimer > 0) return;
      player.hearts--;
      player.invuln = 1.65;
      player.vy = -290;
      screenShake = 0.25;
      haptics.hurt();
      audioSystem.playSfx('hurt');
      spawnParticles(player.x + 22, player.y + 20, '#d92626', 16, 200);

      if (player.hearts <= 0) {
        finished = true;
        onSpecialYLabelChange?.(undefined);
        onFinish({
          levelId: 10,
          won: false,
          treatsCollected: 25,
          goldenPaws: [goldenPaws[0].collected, goldenPaws[1].collected, goldenPaws[2].collected],
          timeSec,
          heartsRemaining: 0,
          starsEarned: 0,
          extraNote: 'Não desista! Use X para rolar pelos ataques e Y quando a Super Estrela carregar!',
        });
      }
    };

    const fireStarShot = (isSuper = false) => {
      if (isSuper) {
        audioSystem.playSfx('super_bark');
        haptics.impact();
        screenShake = 0.2;
        player.starMeter = 0;
        // 3 big homing/spread golden star blasts!
        [-0.22, 0, 0.22].forEach((angOff) => {
          const baseAng = player.facing > 0 ? 0 : Math.PI;
          const a = baseAng + angOff;
          projs.push({
            x: player.x + 22,
            y: player.y + 18,
            vx: Math.cos(a) * 760,
            vy: Math.sin(a) * 760,
            r: 22,
            fromPlayer: true,
            kind: 'super_star',
            life: 1.4,
            color: '#ffe055',
          });
        });
        spawnParticles(player.x + 22, player.y + 18, '#ffe055', 22, 240, 'star');
        showBanner('🌟 SUPER ESTRELA ENCANTADA!', 1.6);
      } else {
        if (player.shootCooldown > 0) return;
        player.shootCooldown = 0.22;
        audioSystem.playSfx('bark');
        // Aim gently upward if pressing Up!
        const inp = inputManager.poll();
        const aimY = inp.up ? -340 : 0;
        const aimX = inp.up && !inp.left && !inp.right ? player.facing * 220 : player.facing * 640;
        projs.push({
          x: player.x + (player.facing > 0 ? 42 : 2),
          y: player.y + 18,
          vx: aimX,
          vy: aimY,
          r: 13,
          fromPlayer: true,
          kind: 'star',
          life: 1.25,
          color: '#ffe055',
        });
      }
    };

    const transitionToStage2 = () => {
      stage = 2;
      projs.length = 0;
      waves.length = 0;
      beams.length = 0;
      screenShake = 0.4;
      audioSystem.playSfx('star');
      haptics.collect();
      spawnParticles(640, 420, '#ffe055', 45, 360, 'star');
      dropHeartFromJujuba();
      // Enable moving clockwork gear platforms!
      platforms[0].moveAmpY = 42;
      platforms[1].moveAmpY = 42;
      platforms[2].moveAmpX = 52;
      platforms[3].moveAmpX = 52;
      platforms[4].moveAmpY = 28;
      attackTimer = 1.8;
      showBanner('⏰ ETAPA 2/4 — RELÓGIO DA MEIA-NOITE! Destrua os 3 cristais antes das 00:00!', 4.2);
    };

    const transitionToStage3 = () => {
      stage = 3;
      projs.length = 0;
      waves.length = 0;
      beams.length = 0;
      screenShake = 0.45;
      audioSystem.playSfx('super_bark');
      haptics.collect();
      spawnParticles(640, 300, '#c38ef5', 50, 380, 'star');
      dropHeartFromJujuba();
      // Settle platforms nicely for grand duel
      platforms.forEach((p) => {
        p.moveAmpY = 0;
        p.moveAmpX = 0;
        p.x = p.baseX;
        p.y = p.baseY;
      });
      lula.x = 640;
      lula.y = 260;
      lula.state = 'hover';
      lula.stateTimer = 1.6;
      showBanner('⚡ ETAPA 3/4 — LULA SUPREMO! Esquive com X e ataque quando ele ficar tonto!', 4.4);
    };

    const transitionToStage4 = () => {
      stage = 4;
      projs.length = 0;
      waves.length = 0;
      beams.length = 0;
      screenShake = 0.35;
      lula.state = 'sad';
      lula.x = 640;
      lula.y = FLOOR_Y - 56;
      audioSystem.playSfx('gift');
      haptics.collect();
      spawnParticles(640, 360, '#ffe055', 55, 340, 'star');
      onSpecialYLabelChange?.('Petisco 🦴');
      showBanner('💛 ETAPA 4/4 — Lula nunca ganhou um presente de Natal...', 5.0);
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(parent.clientWidth * dpr);
      canvas.height = Math.floor(parent.clientHeight * dpr);
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
      if (screenShake > 0) screenShake = Math.max(0, screenShake - dt);
      if (player.invuln > 0) player.invuln -= dt;
      if (player.rollTimer > 0) player.rollTimer -= dt;
      if (player.rollCooldown > 0) player.rollCooldown -= dt;
      if (player.shootCooldown > 0) player.shootCooldown -= dt;
      if (player.jumpBuffer > 0) player.jumpBuffer -= dt;

      // Snowflakes
      for (const s of snow) {
        s.y += s.spd * dt;
        s.x += Math.sin(timeSec + s.drift) * 18 * dt;
        if (s.y > H) {
          s.y = -8;
          s.x = Math.random() * W;
        }
      }

      // If Stage 4 gift celebration animation is playing
      if (giftAnimTimer > 0) {
        giftAnimTimer -= dt;
        giftFlyingProgress = Math.min(1, giftFlyingProgress + dt * 0.9);
        if (giftFlyingProgress >= 0.75 && lula.state !== 'happy') {
          lula.state = 'happy';
          audioSystem.playSfx('win');
          haptics.collect();
          spawnParticles(lula.x, lula.y - 40, '#ff5d8f', 36, 280, 'heart');
          spawnParticles(1040, 195, '#ffe055', 40, 300, 'star');
          showBanner('🎄 00:00 — A Estrela brilha! Princesa Jujuba está livre! FELIZ NATAL!', 4.0);
        }
        // Update celebration particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const pt = particles[i];
          pt.life -= dt;
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.vy += 180 * dt;
          if (pt.life <= 0) particles.splice(i, 1);
        }
        if (giftAnimTimer <= 0) {
          finished = true;
          onSpecialYLabelChange?.(undefined);
          const pawsCount = goldenPaws.filter((g) => g.collected).length;
          const starsEarned = Math.min(3, 1 + (pawsCount >= 2 ? 1 : 0) + (player.hearts >= 3 ? 1 : 0));
          onFinish({
            levelId: 10,
            won: true,
            treatsCollected: 60,
            goldenPaws: [goldenPaws[0].collected, goldenPaws[1].collected, goldenPaws[2].collected],
            timeSec,
            heartsRemaining: player.hearts,
            starsEarned,
            extraNote: 'Lucky ofereceu seu último petisco a Lula e salvou a Princesa Jujuba!',
          });
        }
        return;
      }

      // Move platforms (active in Stage 2)
      for (const p of platforms) {
        if (p.moveAmpY) p.y = p.baseY + Math.sin(timeSec * (p.moveSpeed || 1.5) + (p.phase || 0)) * p.moveAmpY;
        if (p.moveAmpX) p.x = p.baseX + Math.sin(timeSec * (p.moveSpeed || 1.5) + (p.phase || 0)) * p.moveAmpX;
      }

      // ================================================================
      // LUCKY BOY PLATFORMER PHYSICS (super crisp, double jump, roll, belly flop!)
      // ================================================================
      const move = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (move !== 0) player.facing = move > 0 ? 1 : -1;

      const maxSpd = player.rollTimer > 0 ? 500 : 320;
      if (player.rollTimer > 0) {
        player.vx = player.facing * 490;
      } else if (move !== 0) {
        player.vx += move * 2400 * dt;
        if (Math.abs(player.vx) > maxSpd) player.vx = Math.sign(player.vx) * maxSpd;
      } else {
        player.vx *= Math.pow(0.0004, dt);
        if (Math.abs(player.vx) < 8) player.vx = 0;
      }

      if (inp.xJustPressed && player.rollCooldown <= 0 && !player.bellyFlopping) {
        player.rollTimer = 0.28;
        player.rollCooldown = 0.65;
        player.vx = player.facing * 490;
        audioSystem.playSfx('jump');
        spawnParticles(player.x + 22, player.y + 36, '#ffe055', 8, 120);
      }

      if (player.grounded) {
        player.coyote = 0.14;
        player.jumpsUsed = 0;
      } else {
        player.coyote -= dt;
      }

      if (inp.aJustPressed) player.jumpBuffer = 0.14;

      if (player.jumpBuffer > 0) {
        if (player.coyote > 0) {
          player.vy = -700;
          player.grounded = false;
          player.coyote = 0;
          player.jumpBuffer = 0;
          player.jumpsUsed = 1;
          player.bellyFlopping = false;
          audioSystem.playSfx('jump');
        } else if (player.jumpsUsed < 2) {
          player.vy = -650;
          player.jumpBuffer = 0;
          player.jumpsUsed = 2;
          player.bellyFlopping = false;
          audioSystem.playSfx('double_jump');
          spawnParticles(player.x + 22, player.y + 38, '#ffe055', 10, 140, 'star');
        }
      }

      if (!inp.a && player.vy < -280) {
        player.vy += 1200 * dt;
      }

      // Belly Flop (Down + B in air) or Star Bark Shot (B)
      if (stage < 4) {
        if (!player.grounded && inp.down && inp.bJustPressed && !player.bellyFlopping) {
          player.bellyFlopping = true;
          player.vx *= 0.2;
          player.vy = 840;
          audioSystem.playSfx('belly_flop');
        } else if (inp.bJustPressed || (inp.b && player.shootCooldown <= 0)) {
          fireStarShot(false);
        }

        // Y: Super Star Blast when meter >= 100!
        if (inp.yJustPressed) {
          if (player.starMeter >= 100) {
            fireStarShot(true);
          } else {
            fireStarShot(false);
          }
        }
      } else {
        // STAGE 4: Offer Last Treat when near Lula!
        const distLula = Math.hypot(player.x + 22 - lula.x, player.y + 20 - lula.y);
        if ((inp.yJustPressed || inp.bJustPressed) && distLula < 190) {
          giftAnimTimer = 3.2;
          giftFlyingProgress = 0;
          audioSystem.playSfx('gift');
          haptics.collect();
          showBanner('🦴 Lucky ofereceu seu último petisco de Natal para Lula!', 3.2);
        }
      }

      // Gravity & movement
      player.vy = Math.min(920, player.vy + (player.bellyFlopping ? 2500 : 1460) * dt);
      const prevBottom = player.y + player.h;
      player.x = Math.max(36, Math.min(W - 36 - player.w, player.x + player.vx * dt));
      player.y += player.vy * dt;
      player.grounded = false;

      // One-way platform landing (super intuitive — jump up through platforms freely!)
      const wasBelly = player.bellyFlopping;
      if (player.vy >= 0 && !inp.down) {
        for (const p of platforms) {
          if (
            player.x + player.w - 6 > p.x &&
            player.x + 6 < p.x + p.w &&
            prevBottom <= p.y + 14 &&
            player.y + player.h >= p.y
          ) {
            player.y = p.y - player.h;
            player.vy = 0;
            player.grounded = true;
            player.bellyFlopping = false;
          }
        }
      }

      if (player.y + player.h >= FLOOR_Y) {
        player.y = FLOOR_Y - player.h;
        player.vy = 0;
        player.grounded = true;
        player.bellyFlopping = false;
        if (wasBelly) {
          screenShake = 0.22;
          haptics.impact();
          audioSystem.playSfx('belly_flop');
          spawnParticles(player.x + 22, FLOOR_Y, '#ffe055', 18, 260, 'star');
          // Shockwave damages nearby Stage 1 cores or dizzy Lula!
          if (stage === 1) {
            for (const c of treeCores) {
              if (c.hp > 0 && Math.hypot(640 + c.ox - (player.x + 22), FLOOR_Y + c.oy - player.y) < 155) {
                c.hp -= 2;
                c.hurt = 0.25;
                player.starMeter = Math.min(100, player.starMeter + 18);
                spawnParticles(640 + c.ox, FLOOR_Y + c.oy, '#ffe055', 18, 220, 'star');
              }
            }
          } else if (stage === 3 && Math.hypot(lula.x - (player.x + 22), lula.y - player.y) < 165) {
            lula.hp -= 3;
            lula.hurt = 0.25;
            player.starMeter = Math.min(100, player.starMeter + 22);
            spawnParticles(lula.x, lula.y, '#ffe055', 22, 260, 'star');
          }
        }
      }

      if (Math.abs(player.vx) > 25) player.runAnim += dt * 12;

      // Collect Golden Paw of current stage
      for (let i = 0; i < goldenPaws.length; i++) {
        const gp = goldenPaws[i];
        if (gp.stage === stage && !gp.collected && Math.hypot(gp.x - (player.x + 22), gp.y - (player.y + 20)) < 46) {
          gp.collected = true;
          haptics.collect();
          audioSystem.playSfx('paw');
          spawnParticles(gp.x, gp.y, '#ffe055', 24, 240, 'star');
          showBanner(`🐾 Patinha Dourada #${i + 1} da Fortaleza!`, 2.2);
        }
      }

      // Heart drops from Princesa Jujuba
      for (const hd of heartDrops) {
        if (!hd.active) continue;
        hd.vy += 600 * dt;
        hd.y += hd.vy * dt;
        if (hd.y > FLOOR_Y - 22) {
          hd.y = FLOOR_Y - 22;
          hd.vy = -210;
        }
        if (Math.hypot(hd.x - (player.x + 22), hd.y - (player.y + 20)) < 46) {
          hd.active = false;
          player.hearts = Math.min(player.maxHearts, player.hearts + 1);
          haptics.collect();
          audioSystem.playSfx('powerup');
          spawnParticles(hd.x, hd.y, '#ff5d8f', 18, 180, 'heart');
          showBanner('❤️ Princesa Jujuba enviou carinho (+1 Coração)!', 2.2);
        }
      }

      // ================================================================
      // STAGE 1: A ÁRVORE DA DESTRUIÇÃO
      // ================================================================
      if (stage === 1) {
        for (const c of treeCores) {
          if (c.hurt > 0) c.hurt -= dt;
        }

        attackTimer -= dt;
        if (attackTimer <= 0) {
          attackTimer = 1.65;
          // Alternate between Explosive Ornaments fan and Bouncing Gift-Bombs!
          if (Math.random() < 0.55) {
            for (const dir of [-1, 1]) {
              projs.push({
                x: 640 + dir * 75,
                y: FLOOR_Y - 190,
                vx: dir * (190 + Math.random() * 140),
                vy: -240 - Math.random() * 100,
                r: 16,
                fromPlayer: false,
                kind: 'gift_bomb',
                life: 4.5,
                bounces: 3,
                color: '#d92626',
              });
            }
          } else {
            const angToP = Math.atan2(player.y - (FLOOR_Y - 200), player.x - 640);
            [-0.28, 0, 0.28].forEach((off) => {
              projs.push({
                x: 640,
                y: FLOOR_Y - 200,
                vx: Math.cos(angToP + off) * 330,
                vy: Math.sin(angToP + off) * 330,
                r: 13,
                fromPlayer: false,
                kind: 'ornament',
                life: 3.4,
                color: '#9f7aea',
              });
            });
          }
          audioSystem.playSfx('shoot');
        }

        // Periodic Tree Stomp -> Ground Shockwaves!
        treeSlamTimer -= dt;
        if (treeSlamTimer < 0.7 && treeSlamTimer > 0) {
          treeYOffset = -Math.sin(((0.7 - treeSlamTimer) / 0.7) * Math.PI) * 55;
        } else if (treeSlamTimer <= 0) {
          treeSlamTimer = 5.4;
          treeYOffset = 0;
          screenShake = 0.3;
          audioSystem.playSfx('belly_flop');
          waves.push(
            { x: 560, y: FLOOR_Y - 28, vx: -360, w: 42, h: 30, color: '#e47bb8', life: 2.2 },
            { x: 720, y: FLOOR_Y - 28, vx: 360, w: 42, h: 30, color: '#e47bb8', life: 2.2 }
          );
        }

        if (treeCores.every((c) => c.hp <= 0)) {
          transitionToStage2();
        }
      }

      // ================================================================
      // STAGE 2: O RELÓGIO DA MEIA-NOITE
      // ================================================================
      else if (stage === 2) {
        clockCountdown -= dt;
        pendulumAngle = Math.sin(timeSec * 1.9) * 0.72;

        for (const c of clockCrystals) {
          if (c.hurt > 0) c.hurt -= dt;
        }

        // Pendulum bob collision (fair glowing golden orb swinging across center!)
        const pendX = 640 + Math.sin(pendulumAngle) * 305;
        const pendY = 175 + Math.cos(pendulumAngle) * 305;
        if (Math.hypot(pendX - (player.x + 22), pendY - (player.y + 20)) < 46) {
          damagePlayer();
        }

        // Clock strikes warning -> lightning beams & flying clock gears
        attackTimer -= dt;
        if (attackTimer <= 0) {
          attackTimer = 2.05;
          if (Math.random() < 0.55) {
            // Telegraph a vertical temporal lightning beam at player's X!
            beams.push({ x: player.x + 22, w: 66, timer: 1.25, maxTimer: 1.25 });
            audioSystem.playSfx('click');
          } else {
            const fromLeft = Math.random() < 0.5;
            projs.push({
              x: fromLeft ? 20 : W - 20,
              y: 230 + Math.random() * 290,
              vx: fromLeft ? 310 : -310,
              vy: 0,
              r: 18,
              fromPlayer: false,
              kind: 'gear',
              life: 4.5,
              color: '#ff9f43',
            });
            audioSystem.playSfx('shoot');
          }
        }

        if (clockCountdown <= 0) {
          clockCountdown = 36;
          damagePlayer();
          showBanner('⏰ Meia-Noite bateu! O tempo pulsa — continue destruindo os cristais!', 2.6);
        }

        if (clockCrystals.every((c) => c.hp <= 0)) {
          transitionToStage3();
        }
      }

      // ================================================================
      // STAGE 3: LULA SUPREMO
      // ================================================================
      else if (stage === 3) {
        if (lula.hurt > 0) lula.hurt -= dt;
        lula.stateTimer -= dt;
        lula.facing = player.x + 22 < lula.x ? -1 : 1;

        if (lula.state === 'hover') {
          lula.x += (640 + Math.sin(timeSec * 1.4) * 340 - lula.x) * Math.min(1, dt * 3);
          lula.y += (245 + Math.cos(timeSec * 2.1) * 60 - lula.y) * Math.min(1, dt * 3);
          if (lula.stateTimer <= 0) {
            const roll = Math.random();
            if (roll < 0.36) {
              lula.state = 'wave_cast';
              lula.stateTimer = 1.6;
              audioSystem.playSfx('super_bark');
            } else if (roll < 0.7) {
              lula.state = 'spiral_cast';
              lula.stateTimer = 2.0;
              attackTimer = 0.25;
            } else {
              lula.state = 'dash_warn';
              lula.stateTimer = 0.85;
              lula.x = player.x < W / 2 ? W - 130 : 130;
              lula.y = FLOOR_Y - 75;
              lula.dashTargetX = player.x < W / 2 ? 120 : W - 120;
              audioSystem.playSfx('click');
            }
          }
        } else if (lula.state === 'wave_cast') {
          lula.y += (FLOOR_Y - 82 - lula.y) * Math.min(1, dt * 6);
          if (lula.stateTimer <= 0.7 && lula.stateTimer + dt > 0.7) {
            screenShake = 0.28;
            audioSystem.playSfx('belly_flop');
            waves.push(
              { x: lula.x - 30, y: FLOOR_Y - 34, vx: -390, w: 46, h: 36, color: '#9f7aea', life: 2.6 },
              { x: lula.x + 30, y: FLOOR_Y - 34, vx: 390, w: 46, h: 36, color: '#9f7aea', life: 2.6 },
              { x: lula.x - 30, y: FLOOR_Y - 24, vx: -250, w: 34, h: 24, color: '#ffe055', life: 3.0 },
              { x: lula.x + 30, y: FLOOR_Y - 24, vx: 250, w: 34, h: 24, color: '#ffe055', life: 3.0 }
            );
          }
          if (lula.stateTimer <= 0) {
            lula.state = 'hover';
            lula.stateTimer = 2.0;
          }
        } else if (lula.state === 'spiral_cast') {
          lula.x += (640 - lula.x) * Math.min(1, dt * 5);
          lula.y += (230 - lula.y) * Math.min(1, dt * 5);
          attackTimer -= dt;
          if (attackTimer <= 0) {
            attackTimer = 0.32;
            const baseA = timeSec * 2.8;
            for (let k = 0; k < 4; k++) {
              const a = baseA + (k * Math.PI) / 2;
              projs.push({
                x: lula.x,
                y: lula.y,
                vx: Math.cos(a) * 300,
                vy: Math.sin(a) * 300,
                r: 13,
                fromPlayer: false,
                kind: 'lula_orb',
                life: 3.5,
                color: '#c38ef5',
              });
            }
            audioSystem.playSfx('shoot');
          }
          if (lula.stateTimer <= 0) {
            lula.state = 'hover';
            lula.stateTimer = 2.0;
          }
        } else if (lula.state === 'dash_warn') {
          if (lula.stateTimer <= 0) {
            lula.state = 'dash';
            lula.stateTimer = 0.95;
            lula.vx = lula.dashTargetX > lula.x ? 920 : -920;
            audioSystem.playSfx('boost');
          }
        } else if (lula.state === 'dash') {
          lula.x += lula.vx * dt;
          if (lula.x < 110 || lula.x > W - 110 || lula.stateTimer <= 0) {
            lula.x = Math.max(115, Math.min(W - 115, lula.x));
            lula.vx = 0;
            lula.state = 'dizzy';
            lula.stateTimer = 2.6;
            screenShake = 0.3;
            audioSystem.playSfx('belly_flop');
            showBanner('💫 Lula ficou tonto! Hora de atacar com tudo (B / Barrigada / Y)!', 2.4);
          }
        } else if (lula.state === 'dizzy') {
          lula.y = FLOOR_Y - 62;
          if (lula.stateTimer <= 0) {
            lula.state = 'hover';
            lula.stateTimer = 1.8;
          }
        }

        // Contact with Lula Supremo
        if (Math.hypot(lula.x - (player.x + 22), lula.y - (player.y + 20)) < 58) {
          const stomping = (player.vy > 60 || player.bellyFlopping) && player.y + player.h < lula.y + 8;
          if (stomping) {
            const dmg = player.bellyFlopping ? 3 : 2;
            lula.hp -= dmg;
            lula.hurt = 0.25;
            player.vy = -540;
            player.starMeter = Math.min(100, player.starMeter + 18);
            haptics.impact();
            audioSystem.playSfx('enemy_defeat');
            spawnParticles(lula.x, lula.y - 20, '#ffe055', 18, 220, 'star');
          } else if (lula.state !== 'dizzy') {
            damagePlayer();
          }
        }

        if (lula.hp <= 0) {
          transitionToStage4();
        }
      }

      // ================================================================
      // UPDATE PROJECTILES, SHOCKWAVES, BEAMS & PARTICLES
      // ================================================================
      for (let i = projs.length - 1; i >= 0; i--) {
        const pr = projs[i];
        pr.life -= dt;
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;

        if (pr.kind === 'gift_bomb') {
          pr.vy += 680 * dt;
          if (pr.y + pr.r > FLOOR_Y) {
            pr.y = FLOOR_Y - pr.r;
            pr.vy = -370;
            pr.bounces = (pr.bounces || 0) - 1;
            if (pr.bounces! <= 0) {
              spawnParticles(pr.x, pr.y, '#ff9f43', 10, 140);
              pr.life = 0;
            }
          }
        }

        if (pr.life <= 0 || pr.x < -40 || pr.x > W + 40 || pr.y < -40 || pr.y > H + 40) {
          projs.splice(i, 1);
          continue;
        }

        if (pr.fromPlayer) {
          let hit = false;
          const dmg = pr.kind === 'super_star' ? 2.5 : 1;

          if (stage === 1) {
            for (const c of treeCores) {
              if (c.hp <= 0) continue;
              const cx = 640 + c.ox;
              const cy = FLOOR_Y + c.oy + treeYOffset;
              if (Math.hypot(pr.x - cx, pr.y - cy) < pr.r + 32) {
                c.hp -= dmg;
                c.hurt = 0.2;
                player.starMeter = Math.min(100, player.starMeter + 10);
                haptics.dpad();
                audioSystem.playSfx('enemy_defeat');
                spawnParticles(cx, cy, '#ffe055', 14, 180, 'star');
                hit = true;
                break;
              }
            }
          } else if (stage === 2) {
            for (const c of clockCrystals) {
              if (c.hp <= 0) continue;
              if (Math.hypot(pr.x - c.x, pr.y - c.y) < pr.r + 32) {
                c.hp -= dmg;
                c.hurt = 0.2;
                player.starMeter = Math.min(100, player.starMeter + 12);
                haptics.dpad();
                audioSystem.playSfx('enemy_defeat');
                spawnParticles(c.x, c.y, '#6fd3f7', 16, 200, 'star');
                hit = true;
                break;
              }
            }
          } else if (stage === 3) {
            if (Math.hypot(pr.x - lula.x, pr.y - lula.y) < pr.r + 50) {
              lula.hp -= lula.state === 'dizzy' ? dmg * 1.5 : dmg;
              lula.hurt = 0.18;
              player.starMeter = Math.min(100, player.starMeter + 9);
              haptics.dpad();
              audioSystem.playSfx('enemy_defeat');
              spawnParticles(lula.x, lula.y, '#ffe055', 14, 200, 'star');
              hit = true;
            }
          }

          if (hit) projs.splice(i, 1);
        } else {
          if (Math.hypot(pr.x - (player.x + 22), pr.y - (player.y + 20)) < pr.r + 17) {
            damagePlayer();
            projs.splice(i, 1);
          }
        }
      }

      for (let i = waves.length - 1; i >= 0; i--) {
        const wv = waves[i];
        wv.life -= dt;
        wv.x += wv.vx * dt;
        if (
          player.x + player.w > wv.x - wv.w / 2 &&
          player.x < wv.x + wv.w / 2 &&
          player.y + player.h > wv.y &&
          player.y < wv.y + wv.h
        ) {
          damagePlayer();
        }
        if (wv.life <= 0 || wv.x < -80 || wv.x > W + 80) waves.splice(i, 1);
      }

      for (let i = beams.length - 1; i >= 0; i--) {
        const bm = beams[i];
        bm.timer -= dt;
        if (bm.timer <= 0.35 && bm.timer > 0) {
          if (Math.abs(player.x + 22 - bm.x) < bm.w * 0.45) {
            damagePlayer();
          }
        }
        if (bm.timer <= 0) beams.splice(i, 1);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life -= dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += 260 * dt;
        if (pt.life <= 0) particles.splice(i, 1);
      }

      // Dynamic Y Button label when Super Star is ready!
      if (stage < 4) {
        onSpecialYLabelChange?.(player.starMeter >= 100 ? 'Super ⭐' : undefined);
      }

      hudTick += dt;
      if (hudTick > 0.08) {
        hudTick = 0;
        const stageLabels = {
          1: 'Etapa 1/4 · Árvore da Destruição',
          2: `Etapa 2/4 · Relógio (${Math.ceil(clockCountdown)}s)`,
          3: 'Etapa 3/4 · Lula Supremo',
          4: 'Etapa 4/4 · O Verdadeiro Poder do Natal',
        };
        const hp =
          stage === 1
            ? treeCores.reduce((s, c) => s + Math.max(0, c.hp), 0)
            : stage === 2
            ? clockCrystals.reduce((s, c) => s + Math.max(0, c.hp), 0)
            : stage === 3
            ? Math.max(0, lula.hp)
            : 0;
        const maxHp = stage === 1 ? 16 : stage === 2 ? 12 : stage === 3 ? lula.maxHp : 0;

        onHudUpdate({
          hearts: player.hearts,
          maxHearts: player.maxHearts,
          treats: Math.round(player.starMeter),
          lives,
          goldenPaws: [goldenPaws[0].collected, goldenPaws[1].collected, goldenPaws[2].collected],
          activePower: player.starMeter >= 100 ? 'golden_bone' : null,
          powerTimer: player.starMeter >= 100 ? 999 : 0,
          hasShield: player.rollTimer > 0,
          progressLabel:
            stage < 4
              ? `⭐ Carga Super Estrela: ${Math.round(player.starMeter)}%`
              : '💛 Chegue perto de Lula!',
          bossName: stage < 4 ? 'LULA — O Devorador de Natais' : undefined,
          bossHp: hp,
          bossMaxHp: maxHp,
          bossStageLabel: stageLabels[stage],
          specialPrompt:
            stage === 4 && giftAnimTimer <= 0
              ? '🦴 Aproxime-se de LULA e aperte Y (ou B) para dar o Último Petisco!'
              : undefined,
          bannerText: bannerText || undefined,
        });
      }
    };

    const drawLula2D = (x: number, y: number, scale: number, mood: typeof lula.state, hurtFlash: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      if (hurtFlash > 0) ctx.filter = 'brightness(1.8)';

      // Aura in Stage 3 Supremo
      if (stage === 3 && mood !== 'dizzy') {
        ctx.fillStyle = 'rgba(195, 142, 245, 0.34)';
        ctx.beginPath();
        ctx.arc(0, -18, 62 + Math.sin(timeSec * 8) * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 3.2;

      // Flowing crooked purple inventor coat
      ctx.fillStyle = mood === 'happy' ? '#5ea93f' : '#6b2fa0';
      ctx.beginPath();
      ctx.moveTo(-36, 48);
      ctx.lineTo(-24, -14);
      ctx.lineTo(24, -14);
      ctx.lineTo(36, 48);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Collar lapels
      ctx.fillStyle = '#b38cd9';
      ctx.beginPath();
      ctx.moveTo(-24, -14);
      ctx.lineTo(-6, 6);
      ctx.lineTo(-30, 12);
      ctx.closePath();
      ctx.moveTo(24, -14);
      ctx.lineTo(6, 6);
      ctx.lineTo(30, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Head
      ctx.fillStyle = '#c38ef5';
      ctx.beginPath();
      ctx.arc(0, -34, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wild Dr. Seuss spiky hair
      ctx.strokeStyle = '#4c1d95';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(-18, -56);
      ctx.quadraticCurveTo(-8, -74, 0, -60);
      ctx.quadraticCurveTo(10, -78, 18, -56);
      ctx.stroke();

      // Brass Steampunk Goggles (off when sad/happy!)
      if (mood !== 'sad' && mood !== 'happy') {
        ctx.fillStyle = '#ffe055';
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(-11, -50, 8, 0, Math.PI * 2);
        ctx.arc(11, -50, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (mood === 'happy') {
        // Cute crooked Santa hat on redeemed Lula!
        ctx.fillStyle = '#d92626';
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-24, -52);
        ctx.lineTo(4, -84);
        ctx.lineTo(24, -52);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(4, -85, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Eyes & expression
      ctx.fillStyle = mood === 'sad' || mood === 'happy' ? '#ffffff' : '#ffea00';
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(-10, -34, 6.5, 0, Math.PI * 2);
      ctx.arc(10, -34, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#221b18';
      ctx.beginPath();
      ctx.arc(-10, -34, 2.8, 0, Math.PI * 2);
      ctx.arc(10, -34, 2.8, 0, Math.PI * 2);
      ctx.fill();

      if (mood === 'sad') {
        // Tear drop & quivering mouth
        ctx.fillStyle = '#6fd3f7';
        ctx.beginPath();
        ctx.arc(-13, -24, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -16, 7, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else if (mood === 'happy') {
        ctx.beginPath();
        ctx.arc(0, -24, 10, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      } else {
        // Grumpy eyebrows & smirk
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-20, -44);
        ctx.lineTo(-4, -39);
        ctx.moveTo(20, -44);
        ctx.lineTo(4, -39);
        ctx.stroke();
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-12, -20);
        ctx.quadraticCurveTo(0, -26, 12, -20);
        ctx.stroke();
      }

      // Dizzy spinning stars!
      if (mood === 'dizzy') {
        ctx.font = '18px serif';
        ctx.textAlign = 'center';
        for (let k = 0; k < 3; k++) {
          const a = timeSec * 5 + (k * Math.PI * 2) / 3;
          ctx.fillText('⭐', Math.cos(a) * 32, -68 + Math.sin(a) * 10);
        }
      }

      ctx.restore();
    };

    const drawPrincesaJujubaTower = () => {
      const tx = 1045;
      const ty = 195;
      ctx.save();
      ctx.translate(tx, ty);

      // Golden Rope Holding Cage (vanishes when Stage 4 happy!)
      if (lula.state !== 'happy') {
        ctx.strokeStyle = '#d99316';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, -195);
        ctx.lineTo(0, -56);
        ctx.stroke();
      }

      const sway = Math.sin(timeSec * 2) * 4;
      ctx.translate(sway, 0);

      // Royal Balcony Base
      ctx.fillStyle = '#ffe055';
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-48, 22, 96, 18, 8);
      ctx.fill();
      ctx.stroke();

      // Princesa Jujuba (radiant blonde hair + festive crimson gown + star tiara!)
      ctx.fillStyle = '#ffe055';
      ctx.beginPath();
      ctx.arc(0, -18, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e24b78';
      ctx.beginPath();
      ctx.moveTo(-22, 22);
      ctx.lineTo(-10, -8);
      ctx.lineTo(10, -8);
      ctx.lineTo(22, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffe7c8';
      ctx.beginPath();
      ctx.arc(0, -18, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffe055';
      ctx.beginPath();
      ctx.arc(0, -25, 13, Math.PI, 0);
      ctx.fill();
      // Tiny eyes & warm smile
      ctx.fillStyle = '#221b18';
      ctx.beginPath();
      ctx.arc(-4.5, -18, 2, 0, Math.PI * 2);
      ctx.arc(4.5, -18, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.fillText('⭐', 0, -34);

      // Magical Golden Cage Bars (dissolve when freed!)
      if (lula.state !== 'happy') {
        ctx.strokeStyle = 'rgba(255, 224, 85, 0.85)';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.roundRect(-44, -56, 88, 80, [44, 44, 6, 6]);
        ctx.stroke();
        for (const bx of [-22, 0, 22]) {
          ctx.beginPath();
          ctx.moveTo(bx, -54);
          ctx.lineTo(bx, 22);
          ctx.stroke();
        }
      } else {
        ctx.font = '24px serif';
        ctx.fillText('💖', 0, -56);
      }

      ctx.restore();
    };

    const render = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const scale = Math.min(w / W, h / H);
      const offsetX = (w - W * scale) / 2;
      const offsetY = (h - H * scale) / 2;

      ctx.save();
      // Outer letterbox painted with royal storybook midnight blue
      ctx.fillStyle = '#1b3564';
      ctx.fillRect(0, 0, w, h);

      const shakeX = screenShake > 0 ? (Math.random() - 0.5) * 14 : 0;
      const shakeY = screenShake > 0 ? (Math.random() - 0.5) * 14 : 0;
      ctx.translate(offsetX + shakeX, offsetY + shakeY);
      ctx.scale(scale, scale);

      // ================================================================
      // 1. GRAND ROYAL HALL BACKGROUND (Gothic Seuss Windows + Aurora + Clock!)
      // ================================================================
      const wallGrad = ctx.createLinearGradient(0, 0, 0, H);
      wallGrad.addColorStop(0, stage === 4 ? '#3c78b8' : '#2d4b82');
      wallGrad.addColorStop(0.65, stage === 4 ? '#69a7db' : '#4a6ba6');
      wallGrad.addColorStop(1, '#f3ebd3');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, W, H);

      // 3 Grand Arched Windows looking out to Snowy Aurora Night!
      [210, 640, 1070].forEach((wx) => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(wx - 115, 70, 230, 380, [115, 115, 14, 14]);
        ctx.clip();

        const skyG = ctx.createLinearGradient(0, 70, 0, 450);
        skyG.addColorStop(0, stage === 4 ? '#3fa9f5' : '#182b5c');
        skyG.addColorStop(1, stage === 4 ? '#b8f0ff' : '#4a8fd4');
        ctx.fillStyle = skyG;
        ctx.fillRect(wx - 115, 70, 230, 380);

        // Glowing Christmas Aurora Borealis ribbons!
        ctx.strokeStyle = stage === 4 ? 'rgba(255, 224, 85, 0.55)' : 'rgba(105, 224, 155, 0.42)';
        ctx.lineWidth = 28;
        ctx.beginPath();
        ctx.moveTo(wx - 120, 180 + Math.sin(timeSec) * 18);
        ctx.bezierCurveTo(wx - 40, 120, wx + 40, 250, wx + 125, 160 + Math.cos(timeSec) * 18);
        ctx.stroke();

        // Snowflakes outside window
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (const s of snow) {
          if (s.x > wx - 115 && s.x < wx + 115 && s.y > 70 && s.y < 450) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();

        // Ornate Golden Window Frame
        ctx.strokeStyle = '#ffe055';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.roundRect(wx - 115, 70, 230, 380, [115, 115, 14, 14]);
        ctx.stroke();
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      // Decorative Dr. Seuss Festive Pink Garlands & Golden Bells across upper hall
      ctx.strokeStyle = '#e47bb8';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(0, 62);
      ctx.quadraticCurveTo(320, 125, 640, 58);
      ctx.quadraticCurveTo(960, 125, 1280, 62);
      ctx.stroke();

      // GIANT MIDNIGHT CLOCK IN UPPER CENTER!
      {
        const cx = 640;
        const cy = 175;
        const r = stage === 2 ? 96 : 74;
        ctx.save();
        ctx.translate(cx, cy);

        // Stage 2 Swinging Golden Pendulum behind clock!
        if (stage === 2) {
          ctx.save();
          ctx.rotate(pendulumAngle);
          ctx.strokeStyle = '#ffe055';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 305);
          ctx.stroke();
          ctx.fillStyle = '#ffe055';
          ctx.strokeStyle = '#221b18';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 305, 34, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#d92626';
          ctx.beginPath();
          ctx.arc(0, 305, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = '#fff9eb';
        ctx.strokeStyle = '#d99316';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.fillStyle = '#c91d1d';
        ctx.font = `bold ${stage === 2 ? 22 : 17}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('XII', 0, -r + 22);
        ctx.fillText('III', r - 22, 0);
        ctx.fillText('VI', 0, r - 20);
        ctx.fillText('IX', -r + 22, 0);

        // Clock hands advance toward 00:00 across stages!
        const minuteAngle =
          stage === 1
            ? -0.45
            : stage === 2
            ? -(clockCountdown / 48) * 1.1
            : stage === 3
            ? -0.09
            : lula.state === 'happy'
            ? 0
            : -0.03;
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -r * 0.48);
        ctx.stroke();
        ctx.strokeStyle = '#d92626';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.sin(minuteAngle) * (r * 0.72), -Math.cos(minuteAngle) * (r * 0.72));
        ctx.stroke();
        ctx.restore();
      }

      // Princesa Jujuba in her Glowing Tower Cage!
      drawPrincesaJujubaTower();

      // Grand 2.5D Carpeted Fortress Floor
      ctx.fillStyle = '#d92626';
      ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
      ctx.fillStyle = '#ffe055';
      ctx.fillRect(0, FLOOR_Y, W, 14);
      ctx.fillStyle = '#5ea93f';
      ctx.fillRect(0, FLOOR_Y + 14, W, 16);
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, FLOOR_Y);
      ctx.lineTo(W, FLOOR_Y);
      ctx.stroke();

      // Arena Platforms (Golden Clockwork Bridges)
      for (const p of platforms) {
        ctx.save();
        // 2.5D shadow extrusion
        ctx.fillStyle = 'rgba(34, 27, 24, 0.3)';
        ctx.fillRect(p.x + 8, p.y + 8, p.w, p.h);
        ctx.fillStyle = '#c98842';
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffe055';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, 10, [10, 10, 3, 3]);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // ================================================================
      // 2. STAGE-SPECIFIC BOSS RENDERING
      // ================================================================
      if (stage === 1) {
        // GIANT MECHA CHRISTMAS TREE OF DESTRUCTION + LULA IN GLASS COCKPIT!
        const tx = 640;
        const ty = FLOOR_Y + treeYOffset;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 4;

        // Robotic golden legs/base
        ctx.fillStyle = '#d99316';
        ctx.beginPath();
        ctx.roundRect(-85, -38, 170, 38, 10);
        ctx.fill();
        ctx.stroke();

        // Lush 3-tier Dr. Seuss Mecha Pine Tree
        ctx.fillStyle = '#5ea93f';
        ctx.beginPath();
        ctx.moveTo(0, -335);
        ctx.lineTo(-105, -210);
        ctx.lineTo(-65, -205);
        ctx.lineTo(-145, -110);
        ctx.lineTo(-95, -105);
        ctx.lineTo(-165, -35);
        ctx.lineTo(165, -35);
        ctx.lineTo(95, -105);
        ctx.lineTo(145, -110);
        ctx.lineTo(65, -205);
        ctx.lineTo(105, -210);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pink Garland across Mecha Tree
        ctx.strokeStyle = '#e47bb8';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(-110, -125);
        ctx.quadraticCurveTo(0, -90, 110, -125);
        ctx.moveTo(-78, -220);
        ctx.quadraticCurveTo(0, -195, 78, -220);
        ctx.stroke();

        // Lula grinning inside the top glass dome cockpit!
        ctx.fillStyle = 'rgba(184, 240, 255, 0.45)';
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, -295, 36, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        drawLula2D(tx, ty - 285, 0.56, 'hover', 0);

        // 3 Glowing Energy Cores!
        for (const c of treeCores) {
          if (c.hp <= 0) continue;
          const cx = tx + c.ox;
          const cy = ty + c.oy;
          ctx.save();
          ctx.translate(cx, cy);
          const pulse = 1 + Math.sin(timeSec * 8 + c.id) * 0.1;
          ctx.scale(pulse, pulse);
          ctx.fillStyle = c.hurt > 0 ? '#ffffff' : '#ffe055';
          ctx.strokeStyle = '#d92626';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, 26, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#221b18';
          ctx.font = 'bold 14px Nunito, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${Math.ceil(c.hp)}`, 0, 1);
          ctx.restore();
        }
      } else if (stage === 2) {
        // 3 TEMPORAL CRYSTALS + Lula cheering from balcony!
        drawLula2D(640, 96, 0.52, 'hover', 0);
        for (const c of clockCrystals) {
          if (c.hp <= 0) continue;
          ctx.save();
          ctx.translate(c.x, c.y + Math.sin(timeSec * 4 + c.x) * 6);
          ctx.fillStyle = c.hurt > 0 ? '#ffffff' : '#6fd3f7';
          ctx.strokeStyle = '#221b18';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(0, -34);
          ctx.lineTo(24, 0);
          ctx.lineTo(0, 34);
          ctx.lineTo(-24, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#221b18';
          ctx.font = 'bold 15px Nunito, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${Math.ceil(c.hp)}`, 0, 1);
          ctx.restore();
        }
      } else {
        // STAGE 3 & 4: LULA SUPREMO / REDEEMED LULA!
        if (stage === 3 && lula.state === 'dash_warn') {
          ctx.strokeStyle = 'rgba(217, 38, 38, 0.72)';
          ctx.lineWidth = 10;
          ctx.setLineDash([16, 12]);
          ctx.beginPath();
          ctx.moveTo(lula.x, lula.y);
          ctx.lineTo(lula.dashTargetX, lula.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        drawLula2D(lula.x, lula.y, stage === 3 ? 1.32 : 1.0, lula.state, lula.hurt);

        // Stage 4 Touching Speech Bubble & Golden Arrow above Lula!
        if (stage === 4 && giftAnimTimer <= 0) {
          ctx.save();
          ctx.translate(lula.x, lula.y - 118 + Math.sin(timeSec * 5) * 6);
          ctx.fillStyle = '#fffdf5';
          ctx.strokeStyle = '#221b18';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(-165, -34, 330, 44, 16);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#221b18';
          ctx.font = 'bold 15px Nunito, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('"Snif... ninguém nunca me deu um presente..."', 0, -8);
          ctx.restore();
        }

        // Flying Gift Bone Animation!
        if (giftAnimTimer > 0 && giftFlyingProgress < 0.8) {
          const t = giftFlyingProgress / 0.8;
          const gx = player.x + 22 + (lula.x - (player.x + 22)) * t;
          const gy = player.y + (lula.y - 30 - player.y) * t - Math.sin(t * Math.PI) * 140;
          ctx.save();
          ctx.translate(gx, gy);
          ctx.fillStyle = 'rgba(255, 224, 85, 0.65)';
          ctx.beginPath();
          ctx.arc(0, 0, 28, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '32px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🎁', 0, 0);
          ctx.restore();
        }
      }

      // Draw Golden Paw of current stage
      for (const gp of goldenPaws) {
        if (gp.stage === stage && !gp.collected) {
          ctx.save();
          ctx.translate(gp.x, gp.y + Math.sin(timeSec * 4) * 7);
          ctx.fillStyle = 'rgba(255, 224, 85, 0.58)';
          ctx.strokeStyle = '#221b18';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.arc(0, 0, 23, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.font = '24px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🐾', 0, 1);
          ctx.restore();
        }
      }

      // Heart drops from Princesa Jujuba
      for (const hd of heartDrops) {
        if (!hd.active) continue;
        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❤️', hd.x, hd.y);
      }

      // Telegraph Temporal Lightning Beams (Stage 2)
      for (const bm of beams) {
        const active = bm.timer <= 0.35;
        ctx.fillStyle = active ? 'rgba(255, 224, 85, 0.85)' : 'rgba(217, 38, 38, 0.25)';
        ctx.fillRect(bm.x - bm.w / 2, 0, bm.w, FLOOR_Y);
        if (active) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bm.x - 10, 0, 20, FLOOR_Y);
        }
      }

      // Ground Shockwaves
      for (const wv of waves) {
        ctx.fillStyle = wv.color;
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(wv.x - wv.w / 2, wv.y + wv.h);
        ctx.quadraticCurveTo(wv.x, wv.y - 12, wv.x + wv.w / 2, wv.y + wv.h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Projectiles
      for (const pr of projs) {
        ctx.save();
        ctx.translate(pr.x, pr.y);
        if (pr.kind === 'star' || pr.kind === 'super_star') {
          ctx.fillStyle = 'rgba(255, 224, 85, 0.45)';
          ctx.beginPath();
          ctx.arc(0, 0, pr.r + 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = `${pr.r * 1.9}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', 0, 2);
        } else if (pr.kind === 'gift_bomb') {
          ctx.fillStyle = '#d92626';
          ctx.strokeStyle = '#221b18';
          ctx.lineWidth = 2.6;
          ctx.fillRect(-14, -14, 28, 28);
          ctx.strokeRect(-14, -14, 28, 28);
          ctx.fillStyle = '#ffe055';
          ctx.fillRect(-3, -14, 6, 28);
          ctx.fillRect(-14, -3, 28, 6);
        } else if (pr.kind === 'gear') {
          ctx.rotate(timeSec * 8);
          ctx.fillStyle = '#ff9f43';
          ctx.strokeStyle = '#221b18';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.arc(0, 0, pr.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#fff9eb';
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = pr.color;
          ctx.strokeStyle = '#221b18';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, pr.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // ================================================================
      // 3. DRAW LUCKY BOY HERO (with Enchanted Star Glow!)
      // ================================================================
      {
        ctx.save();
        ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
        if (player.invuln > 0 && Math.floor(timeSec * 16) % 2 === 0) ctx.globalAlpha = 0.45;
        if (player.rollTimer > 0) ctx.rotate(timeSec * 18 * player.facing);
        else if (player.bellyFlopping) ctx.scale(1.24, 0.78);
        ctx.scale(player.facing, 1);

        if (player.starMeter >= 100) {
          ctx.fillStyle = 'rgba(255, 224, 85, 0.35)';
          ctx.beginPath();
          ctx.arc(0, 0, 36 + Math.sin(timeSec * 10) * 4, 0, Math.PI * 2);
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
        ctx.restore();
      }

      // Particles (Stars, Hearts, Sparks)
      for (const pt of particles) {
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        if (pt.shape === 'heart') {
          ctx.font = `${pt.size * 2.4}px serif`;
          ctx.fillText('💖', pt.x, pt.y);
        } else if (pt.shape === 'star') {
          ctx.font = `${pt.size * 2.2}px serif`;
          ctx.fillText('✨', pt.x, pt.y);
        } else {
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

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
      onSpecialYLabelChange?.(undefined);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [costume, lives, onHudUpdate, onFinish, onPauseRequest, onSpecialYLabelChange]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
};
