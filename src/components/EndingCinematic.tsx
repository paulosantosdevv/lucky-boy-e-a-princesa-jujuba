import React, { useEffect, useRef, useState } from 'react';
import { SaveData } from '../types/game';
import { ENDING_SCENE_LINES } from '../data/story';
import { CharacterPortrait } from './CharacterArt';
import { audioSystem } from '../systems/audioSystem';
import { haptics } from '../systems/haptics';

interface Props {
  save: SaveData;
  onContinueExploring: () => void;
}

interface Firework {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export const EndingCinematic: React.FC<Props> = ({ save, onContinueExploring }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [step, setStep] = useState<'reunion' | 'dialogue' | 'message'>('reunion');
  const [lineIdx, setLineIdx] = useState(0);

  const totalStars = Object.values(save.levelStats).reduce((s, st) => s + (st?.stars || 0), 0);
  const totalPaws = Object.values(save.levelStats).reduce(
    (s, st) => s + (st?.goldenPaws?.filter(Boolean).length || 0),
    0
  );

  // Live 60FPS Animated Christmas Celebration Canvas (Fireworks + Lucky running to Jujuba + Everyone Dancing!)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fireworks: Firework[] = [];
    const snow = Array.from({ length: 85 }, () => ({
      x: Math.random() * 1400,
      y: Math.random() * 800,
      r: 2 + Math.random() * 3.5,
      spd: 24 + Math.random() * 44,
      drift: Math.random() * Math.PI * 2,
    }));

    const fwColors = ['#ffe055', '#f46d75', '#6fd3f7', '#86db58', '#e47bb8', '#ff9f43'];
    const spawnFirework = (w: number, h: number) => {
      const cx = w * (0.12 + Math.random() * 0.76);
      const cy = h * (0.1 + Math.random() * 0.34);
      const col = fwColors[Math.floor(Math.random() * fwColors.length)];
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2 + Math.random() * 0.15;
        const spd = 65 + Math.random() * 155;
        fireworks.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          color: col,
          life: 0.9 + Math.random() * 0.65,
          maxLife: 1.55,
          size: 3 + Math.random() * 3.5,
        });
      }
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

    let time = 0;
    let fwTimer = 0.2;
    let lastTs = performance.now();
    let rafId = 0;

    // Auto advance reunion hug animation -> celebration dialogue after 4.2s
    const reunionTimer = window.setTimeout(() => {
      setStep((cur) => (cur === 'reunion' ? 'dialogue' : cur));
    }, 4400);

    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      time += dt;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      fwTimer -= dt;
      if (fwTimer <= 0) {
        fwTimer = 0.75 + Math.random() * 0.55;
        spawnFirework(w, h);
      }

      // 1. Radiant Starry Storybook Christmas Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#1c4c8c');
      sky.addColorStop(0.55, '#59b6eb');
      sky.addColorStop(1, '#d8f6ff');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Aurora Borealis Ribbons
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 224, 85, 0.34)';
      ctx.lineWidth = 34;
      ctx.beginPath();
      ctx.moveTo(-20, h * 0.25 + Math.sin(time) * 18);
      ctx.bezierCurveTo(w * 0.33, h * 0.12, w * 0.66, h * 0.36, w + 20, h * 0.2 + Math.cos(time) * 18);
      ctx.stroke();
      ctx.restore();

      // Fireworks
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const f = fireworks[i];
        f.life -= dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vy += 120 * dt;
        if (f.life <= 0) {
          fireworks.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 2. Giant Enchanted Star Rising to the Sky!
      const starY = Math.max(h * 0.13, h * 0.45 - time * 55);
      ctx.save();
      ctx.translate(w / 2, starY);
      const glowR = 54 + Math.sin(time * 5) * 8;
      const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, glowR);
      halo.addColorStop(0, 'rgba(255, 247, 170, 0.95)');
      halo.addColorStop(1, 'rgba(255, 224, 85, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '50px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', 0, 2);
      ctx.restore();

      // 3. Snowy Green Storybook Meadow + Giant Cat-in-the-Hat Christmas Tree behind Cast
      const groundY = h * 0.72;
      ctx.fillStyle = '#69b543';
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 18);
      ctx.quadraticCurveTo(w * 0.5, groundY - 38, w, groundY + 18);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Giant Christmas Tree in Center Background
      ctx.save();
      ctx.translate(w / 2, groundY + 6);
      const tscl = Math.min(1.25, w / 680);
      ctx.scale(tscl, tscl);
      ctx.fillStyle = '#8b623f';
      ctx.fillRect(-16, -34, 32, 34);
      ctx.strokeRect(-16, -34, 32, 34);
      ctx.fillStyle = '#5ea93f';
      ctx.beginPath();
      ctx.moveTo(0, -210);
      ctx.lineTo(-76, -120);
      ctx.lineTo(-42, -116);
      ctx.lineTo(-105, -32);
      ctx.lineTo(105, -32);
      ctx.lineTo(42, -116);
      ctx.lineTo(76, -120);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#e47bb8';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(-64, -120);
      ctx.quadraticCurveTo(0, -96, 64, -120);
      ctx.moveTo(-92, -55);
      ctx.quadraticCurveTo(0, -34, 92, -55);
      ctx.stroke();
      // Twinkling lights on tree
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = fwColors[(i + Math.floor(time * 3)) % fwColors.length];
        ctx.beginPath();
        ctx.arc(-62 + i * 18, -60 - (i % 3) * 32, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 4. ANIMATED CELEBRATING CAST ON THE MEADOW!
      // Lucky Boy runs happily from left into Princesa Jujuba's arms in the first 2.5 seconds!
      const runProgress = Math.min(1, time / 2.2);
      const luckyX = w * (0.14 + runProgress * 0.31);
      const luckyJump = Math.abs(Math.sin(time * (runProgress < 1 ? 14 : 6.5))) * (runProgress < 1 ? 26 : 18);
      const jujubaX = w * 0.55;
      const jujubaJump = runProgress >= 1 ? Math.abs(Math.sin(time * 6.5 + 0.5)) * 12 : 0;

      // Floating Hearts between Lucky & Princesa Jujuba once they hug!
      if (runProgress >= 1) {
        ctx.font = '26px serif';
        ctx.textAlign = 'center';
        for (let k = 0; k < 3; k++) {
          const hy = groundY - 78 - ((time * 42 + k * 28) % 75);
          ctx.fillText('💖', w * 0.5 + Math.sin(time * 4 + k) * 28, hy);
        }
      }

      // Draw Paulo (SPFC) waving Tricolor Flag on left!
      const pauloX = w * 0.2;
      const pauloJump = Math.abs(Math.sin(time * 5.8 + 1.2)) * 14;
      ctx.save();
      ctx.translate(pauloX, groundY - pauloJump);
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 2.8;
      // Waving SPFC Flag!
      ctx.save();
      ctx.translate(18, -36);
      ctx.rotate(Math.sin(time * 8) * 0.25);
      ctx.strokeStyle = '#8b623f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(0, -48);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, -48, 34, 22);
      ctx.fillStyle = '#d92626';
      ctx.fillRect(0, -41, 34, 5);
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, -33, 34, 5);
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, -48, 34, 22);
      ctx.restore();
      // Paulo Body
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(-15, -44, 30, 32, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d92626';
      ctx.fillRect(-14, -35, 28, 5);
      ctx.fillStyle = '#111111';
      ctx.fillRect(-14, -27, 28, 5);
      ctx.fillStyle = '#fbd8b6';
      ctx.beginPath();
      ctx.arc(0, -56, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#4a3222';
      ctx.beginPath();
      ctx.arc(0, -59, 12.5, Math.PI, 0);
      ctx.fill();
      ctx.restore();

      // Draw Lully (Black & White Shih Tzu with red bow) jumping joyfully!
      const lullyX = w * 0.34;
      const lullyJump = Math.abs(Math.sin(time * 7.2 + 2)) * 22;
      ctx.save();
      ctx.translate(lullyX, groundY - lullyJump);
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 2.6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, -14, 18, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#221b18';
      ctx.beginPath();
      ctx.ellipse(-13, -27, 6, 11, 0.2, 0, Math.PI * 2);
      ctx.ellipse(13, -27, 6, 11, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -30, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#221b18';
      ctx.beginPath();
      ctx.arc(-5, -31, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.arc(0, -43, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Draw LUCKY BOY Hero!
      ctx.save();
      ctx.translate(luckyX, groundY - luckyJump);
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 2.8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, -15, 20, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(8, -28, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d92626';
      ctx.fillRect(-6, -18, 22, 6);
      ctx.strokeRect(-6, -18, 22, 6);
      ctx.fillStyle = '#221b18';
      ctx.beginPath();
      ctx.arc(14, -30, 3, 0, Math.PI * 2);
      ctx.arc(21, -26, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw PRINCESA JUJUBA!
      ctx.save();
      ctx.translate(jujubaX, groundY - jujubaJump);
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 2.8;
      ctx.fillStyle = '#ffe055';
      ctx.beginPath();
      ctx.arc(0, -48, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e24b78';
      ctx.beginPath();
      ctx.moveTo(-22, -4);
      ctx.lineTo(-10, -38);
      ctx.lineTo(10, -38);
      ctx.lineTo(22, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffe7c8';
      ctx.beginPath();
      ctx.arc(0, -50, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffe055';
      ctx.beginPath();
      ctx.arc(0, -57, 13, Math.PI, 0);
      ctx.fill();
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.fillText('⭐', 0, -68);
      ctx.restore();

      // Draw REDEEMED LULA smiling with Santa Hat & Gift Bone on right!
      const lulaX = w * 0.78;
      const lulaJump = Math.abs(Math.sin(time * 5.2 + 0.8)) * 12;
      ctx.save();
      ctx.translate(lulaX, groundY - lulaJump);
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 2.8;
      ctx.fillStyle = '#5ea93f';
      ctx.beginPath();
      ctx.moveTo(-22, -2);
      ctx.lineTo(-14, -40);
      ctx.lineTo(14, -40);
      ctx.lineTo(22, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#c38ef5';
      ctx.beginPath();
      ctx.arc(0, -52, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d92626';
      ctx.beginPath();
      ctx.moveTo(-14, -64);
      ctx.lineTo(2, -88);
      ctx.lineTo(14, -64);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.font = '22px serif';
      ctx.fillText('🎁', -24, -22);
      ctx.restore();

      // Falling Golden & White Snowflakes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (const s of snow) {
        s.y += s.spd * dt;
        s.x += Math.sin(time + s.drift) * 16 * dt;
        if (s.y > h) {
          s.y = -8;
          s.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.arc(s.x % w, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      clearTimeout(reunionTimer);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const nextLine = () => {
    haptics.dpad();
    audioSystem.playSfx('click');
    if (lineIdx + 1 < ENDING_SCENE_LINES.length) {
      setLineIdx(lineIdx + 1);
    } else {
      audioSystem.playSfx('win');
      haptics.collect();
      setStep('message');
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Fullscreen Live Animated Christmas Celebration Scene */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

      {/* Top Festive Banner */}
      <div
        style={{
          position: 'absolute',
          top: 'max(14px, env(safe-area-inset-top))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          pointerEvents: 'none',
          textAlign: 'center',
          width: '92%',
        }}
      >
        <div
          className="seuss-title"
          style={{
            display: 'inline-block',
            background: '#fffdf5',
            border: '3.5px solid #221b18',
            borderRadius: 99,
            padding: '6px 22px',
            color: '#c91d1d',
            fontSize: 'clamp(1.1rem, 3.8vw, 1.8rem)',
            boxShadow: '0 5px 0 #221b18',
          }}
        >
          🎄 FELIZ NATAL EM JUBALÂNDIA! 🎄
        </div>
      </div>

      {/* Bottom Interactive Story / Celebration Card */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 15,
          padding: '12px 14px max(18px, env(safe-area-inset-bottom))',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {step === 'reunion' && (
          <div
            className="seuss-card"
            onClick={() => setStep('dialogue')}
            style={{ width: 'min(660px, 96vw)', padding: '14px 20px', textAlign: 'center', cursor: 'pointer' }}
          >
            <div className="seuss-title" style={{ color: '#c91d1d', fontSize: '1.15rem', marginBottom: 4 }}>
              ✨ O Grande Reencontro de Natal! ✨
            </div>
            <p style={{ margin: '0 0 10px', fontWeight: 800, fontSize: '0.96rem', color: '#221b18' }}>
              Lucky Boy corre até a Princesa Jujuba enquanto a Estrela Encantada ilumina todo o reino e Paulo (SPFC), Lully e Lula comemoram juntos!
            </p>
            <button type="button" className="seuss-btn seuss-btn-gold" style={{ padding: '7px 16px', fontSize: '0.9rem' }}>
              Ouvir a Comemoração ▶
            </button>
          </div>
        )}

        {step === 'dialogue' && (
          <div
            className="seuss-card"
            onClick={nextLine}
            style={{
              width: 'min(700px, 96vw)',
              padding: '14px 18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <CharacterPortrait
              character={ENDING_SCENE_LINES[lineIdx].speaker}
              size={76}
              costume={ENDING_SCENE_LINES[lineIdx].speaker === 'lucky' ? save.equippedCostume : 'classic'}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="seuss-title" style={{ color: '#c91d1d', fontSize: '1.15rem', marginBottom: 4 }}>
                {ENDING_SCENE_LINES[lineIdx].speakerName}
              </div>
              <p style={{ fontSize: 'clamp(0.9rem, 2.3vw, 1.05rem)', lineHeight: 1.45, margin: '0 0 10px', fontWeight: 800, color: '#221b18' }}>
                "{ENDING_SCENE_LINES[lineIdx].text}"
              </p>
              <button type="button" className="seuss-btn seuss-btn-gold" style={{ padding: '6px 14px', fontSize: '0.88rem' }}>
                {lineIdx + 1 < ENDING_SCENE_LINES.length ? 'Continuar ▶' : 'Ver Mensagem Final 🎄'}
              </button>
            </div>
          </div>
        )}

        {step === 'message' && (
          <div
            className="seuss-card scrollable-panel"
            style={{ width: 'min(700px, 96vw)', maxHeight: '58vh', padding: '18px 22px', textAlign: 'center' }}
          >
            <p
              style={{
                fontSize: 'clamp(0.95rem, 2.4vw, 1.12rem)',
                lineHeight: 1.55,
                fontWeight: 800,
                color: '#221b18',
                margin: '0 0 14px',
              }}
            >
              Naquela noite, todos descobriram que o maior herói de Jubalândia não precisava de uma espada, de uma
              armadura ou de uma coroa.
              <br />
              <span style={{ color: '#c91d1d' }}>
                Bastavam quatro patinhas, uma barriguinha e um coração cheio de amor.
              </span>
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
                background: '#f2e4c4',
                border: '2.5px solid #221b18',
                borderRadius: 14,
                padding: 10,
                marginBottom: 14,
                fontWeight: 900,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#5b4c3f' }}>Estrelas</div>
                <div style={{ fontSize: 17, color: '#c98a00' }}>★ {totalStars}/36</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#5b4c3f' }}>Patinhas</div>
                <div style={{ fontSize: 17, color: '#c91d1d' }}>🐾 {totalPaws}/36</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#5b4c3f' }}>Petiscos</div>
                <div style={{ fontSize: 17, color: '#2f7a24' }}>🦴 {save.totalTreats}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#5b4c3f' }}>Trajes</div>
                <div style={{ fontSize: 17, color: '#2272a3' }}>👕 {save.unlockedCostumes.length}/6</div>
              </div>
            </div>

            <button type="button" className="seuss-btn seuss-btn-primary" onClick={onContinueExploring}>
              🗺️ Continuar Explorando Jubalândia
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
