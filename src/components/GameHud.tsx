import React from 'react';
import { HudSnapshot, LevelMeta, POWERUP_INFO } from '../types/game';

interface Props {
  hud: HudSnapshot;
  level: LevelMeta;
}

export const GameHud: React.FC<Props> = ({ hud, level }) => {
  const powerInfo = hud.activePower ? POWERUP_INFO[hud.activePower] : null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        pointerEvents: 'none',
        padding: 'max(8px, env(safe-area-inset-top)) 12px 0 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {/* Left: Hearts + Lives + Treats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(20, 13, 46, 0.82)',
            border: '2px solid rgba(255, 209, 102, 0.7)',
            borderRadius: 18,
            padding: '6px 12px',
            backdropFilter: 'blur(6px)',
          }}
        >
          {/* Hearts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {Array.from({ length: hud.maxHearts }).map((_, i) => (
              <span
                key={i}
                style={{
                  fontSize: 'clamp(14px, 3vw, 19px)',
                  filter: i < hud.hearts ? 'none' : 'grayscale(1) opacity(0.35)',
                }}
              >
                ❤️
              </span>
            ))}
            {hud.hasShield && (
              <span title="Bolha Protetora" style={{ fontSize: 17, marginLeft: 2 }}>
                🫧
              </span>
            )}
          </div>

          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)' }} />

          {/* Treats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800, fontSize: 14 }}>
            <span>🦴</span>
            <span style={{ color: '#ffd166' }}>{hud.treats}</span>
          </div>

          {/* Lives */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800, fontSize: 14 }}>
            <span>🐶</span>
            <span>x{hud.lives}</span>
          </div>
        </div>

        {/* Center: Level Title & Progress */}
        <div
          style={{
            background: 'rgba(20, 13, 46, 0.78)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            borderRadius: 16,
            padding: '5px 12px',
            textAlign: 'center',
          }}
        >
          <div className="seuss-title" style={{ fontSize: 'clamp(12px, 2.3vw, 15px)', color: '#fff8eb' }}>
            {level.id.toString().padStart(2, '0')} · {level.title}
          </div>
          {hud.progressLabel && (
            <div style={{ fontSize: 11.5, fontWeight: 800, color: '#ffd166' }}>{hud.progressLabel}</div>
          )}
        </div>

        {/* Right: Golden Paws + Active Power */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(20, 13, 46, 0.82)',
            border: '2px solid rgba(255, 209, 102, 0.7)',
            borderRadius: 18,
            padding: '6px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {hud.goldenPaws.map((got, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: 16,
                  filter: got ? 'drop-shadow(0 0 6px #ffd166)' : 'grayscale(1) opacity(0.3)',
                }}
              >
                🐾
              </span>
            ))}
          </div>

          {powerInfo && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: '2px 8px',
                border: `1.5px solid ${powerInfo.color}`,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              <span>{powerInfo.emoji}</span>
              <span style={{ color: powerInfo.color }}>
                {hud.powerTimer < 100 ? `${Math.ceil(hud.powerTimer)}s` : 'ATIVO'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Boss Bar */}
      {hud.bossName && hud.bossMaxHp && hud.bossMaxHp > 0 && (
        <div
          style={{
            margin: '0 auto',
            width: 'min(440px, 86vw)',
            background: 'rgba(26, 10, 48, 0.88)',
            border: '2.5px solid #ffd166',
            borderRadius: 16,
            padding: '6px 12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800, marginBottom: 4 }}>
            <span style={{ color: '#ffd166' }}>👑 {hud.bossName}</span>
            {hud.bossStageLabel && <span style={{ color: '#90e0ef' }}>{hud.bossStageLabel}</span>}
          </div>
          <div style={{ height: 11, borderRadius: 99, background: 'rgba(255,255,255,0.16)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, ((hud.bossHp || 0) / hud.bossMaxHp) * 100))}%`,
                background: 'linear-gradient(90deg, #e63946, #ff9f1c, #ffd166)',
                transition: 'width 0.18s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Banner Notification */}
      {hud.bannerText && (
        <div
          className="seuss-title"
          style={{
            margin: '4px auto 0',
            background: 'rgba(255, 209, 102, 0.95)',
            color: '#23133a',
            padding: '6px 18px',
            borderRadius: 99,
            fontWeight: 700,
            fontSize: 'clamp(13px, 2.8vw, 17px)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
            border: '2.5px solid #23133a',
          }}
        >
          {hud.bannerText}
        </div>
      )}

      {/* Special Prompt (e.g. Boss Stage 4 Offer Last Treat!) */}
      {hud.specialPrompt && (
        <div
          className="seuss-title animate-glow"
          style={{
            margin: '8px auto 0',
            background: 'linear-gradient(135deg, #e63946, #f4a216)',
            color: '#fff',
            padding: '10px 22px',
            borderRadius: 20,
            fontWeight: 700,
            fontSize: 'clamp(14px, 3vw, 19px)',
            border: '3px solid #fff8eb',
            textAlign: 'center',
          }}
        >
          {hud.specialPrompt}
        </div>
      )}
    </div>
  );
};
