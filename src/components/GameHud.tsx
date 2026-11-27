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
            background: 'rgba(255, 250, 236, 0.94)',
            border: '3px solid #221b18',
            borderRadius: 18,
            padding: '5px 12px',
            boxShadow: '0 4px 0 rgba(34,27,24,0.28)',
            color: '#221b18',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {Array.from({ length: hud.maxHearts }).map((_, i) => (
              <span
                key={i}
                style={{
                  fontSize: 'clamp(14px, 3vw, 19px)',
                  filter: i < hud.hearts ? 'none' : 'grayscale(1) opacity(0.3)',
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

          <div style={{ width: 2, height: 18, background: 'rgba(34,27,24,0.2)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 900, fontSize: 14 }}>
            <span>🦴</span>
            <span style={{ color: '#c91d1d' }}>{hud.treats}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 900, fontSize: 14 }}>
            <span>🐶</span>
            <span>x{hud.lives}</span>
          </div>
        </div>

        {/* Center: Level Title & Progress */}
        <div
          style={{
            background: 'rgba(255, 250, 236, 0.94)',
            border: '3px solid #221b18',
            borderRadius: 16,
            padding: '4px 14px',
            textAlign: 'center',
            boxShadow: '0 4px 0 rgba(34,27,24,0.28)',
            color: '#221b18',
          }}
        >
          <div className="seuss-title" style={{ fontSize: 'clamp(12px, 2.3vw, 15px)', color: '#c91d1d' }}>
            {level.id.toString().padStart(2, '0')} · {level.title}
          </div>
          {hud.progressLabel && (
            <div style={{ fontSize: 11.5, fontWeight: 900, color: '#2f7a24' }}>{hud.progressLabel}</div>
          )}
        </div>

        {/* Right: Golden Paws + Active Power */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255, 250, 236, 0.94)',
            border: '3px solid #221b18',
            borderRadius: 18,
            padding: '5px 12px',
            boxShadow: '0 4px 0 rgba(34,27,24,0.28)',
            color: '#221b18',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {hud.goldenPaws.map((got, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: 16,
                  filter: got ? 'drop-shadow(0 0 5px #f5b922)' : 'grayscale(1) opacity(0.3)',
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
                background: '#ffe770',
                borderRadius: 12,
                padding: '2px 8px',
                border: '2px solid #221b18',
                fontSize: 12,
                fontWeight: 900,
                color: '#221b18',
              }}
            >
              <span>{powerInfo.emoji}</span>
              <span>{hud.powerTimer < 100 ? `${Math.ceil(hud.powerTimer)}s` : 'ATIVO'}</span>
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
            background: 'rgba(255, 250, 236, 0.96)',
            border: '3px solid #221b18',
            borderRadius: 16,
            padding: '6px 12px',
            boxShadow: '0 4px 0 rgba(34,27,24,0.28)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 900, marginBottom: 4 }}>
            <span style={{ color: '#c91d1d' }}>👑 {hud.bossName}</span>
            {hud.bossStageLabel && <span style={{ color: '#2f7a24' }}>{hud.bossStageLabel}</span>}
          </div>
          <div style={{ height: 12, borderRadius: 99, background: '#e6dcc5', border: '2px solid #221b18', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, ((hud.bossHp || 0) / hud.bossMaxHp) * 100))}%`,
                background: 'linear-gradient(90deg, #d92626, #ff9f1c, #ffe055)',
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
            background: '#ffe770',
            color: '#221b18',
            padding: '6px 18px',
            borderRadius: 99,
            fontWeight: 700,
            fontSize: 'clamp(13px, 2.8vw, 17px)',
            boxShadow: '0 4px 0 #221b18',
            border: '3px solid #221b18',
          }}
        >
          {hud.bannerText}
        </div>
      )}

      {/* Special Prompt */}
      {hud.specialPrompt && (
        <div
          className="seuss-title animate-glow"
          style={{
            margin: '8px auto 0',
            background: 'linear-gradient(135deg, #f24242, #ff9f43)',
            color: '#fffef9',
            padding: '10px 22px',
            borderRadius: 20,
            fontWeight: 700,
            fontSize: 'clamp(14px, 3vw, 19px)',
            border: '3px solid #221b18',
            textAlign: 'center',
          }}
        >
          {hud.specialPrompt}
        </div>
      )}
    </div>
  );
};
