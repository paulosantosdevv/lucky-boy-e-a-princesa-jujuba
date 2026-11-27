import React, { useState } from 'react';
import { ControlMode } from '../types/game';
import { inputManager, VirtualButton } from '../systems/inputSystem';
import { Pause } from 'lucide-react';

interface Props {
  mode: ControlMode;
  visible: boolean;
  onPauseClick: () => void;
  specialYLabel?: string;
}

const LABELS: Record<ControlMode, { a: string; b: string; x: string; y: string }> = {
  platform: { a: 'Pular', b: 'Latir', x: 'Rolar', y: 'Poder' },
  kart: { a: 'Acelerar', b: 'Frear', x: 'Drift', y: 'Item' },
  plane: { a: 'Impulso', b: 'Atirar', x: 'Manobra', y: 'Especial' },
  water: { a: 'Nadar', b: 'Ataque', x: 'Esquiva', y: 'Poder' },
};

export const TouchControls: React.FC<Props> = ({
  mode,
  visible,
  onPauseClick,
  specialYLabel,
}) => {
  const [active, setActive] = useState<Record<string, boolean>>({});
  const labels = LABELS[mode];

  if (!visible) return null;

  const bindBtn = (btn: VirtualButton) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      inputManager.setVirtual(btn, true);
      setActive((prev) => ({ ...prev, [btn]: true }));
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      inputManager.setVirtual(btn, false);
      setActive((prev) => ({ ...prev, [btn]: false }));
    },
    onPointerCancel: () => {
      inputManager.setVirtual(btn, false);
      setActive((prev) => ({ ...prev, [btn]: false }));
    },
    onLostPointerCapture: () => {
      inputManager.setVirtual(btn, false);
      setActive((prev) => ({ ...prev, [btn]: false }));
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const dpadSize = 'clamp(44px, 11vw, 58px)';
  const actionSize = 'clamp(50px, 12.5vw, 66px)';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'max(10px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))',
      }}
    >
      {/* Top-right pause button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', pointerEvents: 'none' }}>
        <button
          type="button"
          onClick={onPauseClick}
          className="touch-pad-btn"
          style={{
            pointerEvents: 'auto',
            width: 46,
            height: 46,
            borderRadius: 15,
            background: 'rgba(26, 17, 56, 0.82)',
            color: '#ffd166',
            marginTop: 52,
          }}
          aria-label="Pausar jogo"
        >
          <Pause size={22} />
        </button>
      </div>

      {/* Bottom Controls Row: D-Pad Left + 4 Command Buttons Right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          width: '100%',
          gap: 12,
        }}
      >
        {/* D-Pad */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'grid',
            gridTemplateColumns: `repeat(3, ${dpadSize})`,
            gridTemplateRows: `repeat(3, ${dpadSize})`,
            gap: 4,
            opacity: 0.9,
          }}
        >
          <div />
          <button
            type="button"
            className={`touch-pad-btn ${active.up ? 'pressed' : ''}`}
            style={{
              borderRadius: '14px 14px 6px 6px',
              background: 'rgba(30, 22, 62, 0.78)',
              color: '#fff8eb',
              fontSize: 20,
              fontWeight: 900,
            }}
            {...bindBtn('up')}
            aria-label="Cima"
          >
            ▲
          </button>
          <div />

          <button
            type="button"
            className={`touch-pad-btn ${active.left ? 'pressed' : ''}`}
            style={{
              borderRadius: '14px 6px 6px 14px',
              background: 'rgba(30, 22, 62, 0.78)',
              color: '#fff8eb',
              fontSize: 20,
              fontWeight: 900,
            }}
            {...bindBtn('left')}
            aria-label="Esquerda"
          >
            ◀
          </button>
          <div
            style={{
              borderRadius: 10,
              background: 'rgba(255, 209, 102, 0.18)',
              border: '2px solid rgba(255, 209, 102, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}
          >
            🐾
          </div>
          <button
            type="button"
            className={`touch-pad-btn ${active.right ? 'pressed' : ''}`}
            style={{
              borderRadius: '6px 14px 14px 6px',
              background: 'rgba(30, 22, 62, 0.78)',
              color: '#fff8eb',
              fontSize: 20,
              fontWeight: 900,
            }}
            {...bindBtn('right')}
            aria-label="Direita"
          >
            ▶
          </button>

          <div />
          <button
            type="button"
            className={`touch-pad-btn ${active.down ? 'pressed' : ''}`}
            style={{
              borderRadius: '6px 6px 14px 14px',
              background: 'rgba(30, 22, 62, 0.78)',
              color: '#fff8eb',
              fontSize: 20,
              fontWeight: 900,
            }}
            {...bindBtn('down')}
            aria-label="Baixo"
          >
            ▼
          </button>
          <div />
        </div>

        {/* 4 Command Buttons (Diamond Layout: Y top, X left, B right, A bottom) */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'grid',
            gridTemplateColumns: `repeat(3, ${actionSize})`,
            gridTemplateRows: `repeat(3, calc(${actionSize} * 0.78))`,
            gap: 2,
            alignItems: 'center',
            justifyItems: 'center',
            opacity: 0.92,
          }}
        >
          <div />
          {/* Y Button */}
          <button
            type="button"
            className={`touch-pad-btn ${active.y ? 'pressed' : ''} ${specialYLabel ? 'animate-glow' : ''}`}
            style={{
              width: actionSize,
              height: actionSize,
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #ffe066, #f4a216)',
              color: '#221338',
            }}
            {...bindBtn('y')}
            aria-label={`Botão Y - ${specialYLabel || labels.y}`}
          >
            <span style={{ fontWeight: 900, fontSize: 16, lineHeight: 1 }}>Y</span>
            <span style={{ fontSize: 9.5, fontWeight: 800, lineHeight: 1.05, textAlign: 'center', padding: '0 2px' }}>
              {specialYLabel || labels.y}
            </span>
          </button>
          <div />

          {/* X Button */}
          <button
            type="button"
            className={`touch-pad-btn ${active.x ? 'pressed' : ''}`}
            style={{
              width: actionSize,
              height: actionSize,
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #4cc9f0, #0077b6)',
              color: '#ffffff',
            }}
            {...bindBtn('x')}
            aria-label={`Botão X - ${labels.x}`}
          >
            <span style={{ fontWeight: 900, fontSize: 16, lineHeight: 1 }}>X</span>
            <span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1.1 }}>{labels.x}</span>
          </button>
          <div />
          {/* B Button */}
          <button
            type="button"
            className={`touch-pad-btn ${active.b ? 'pressed' : ''}`}
            style={{
              width: actionSize,
              height: actionSize,
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #ff5d6c, #c9182b)',
              color: '#ffffff',
            }}
            {...bindBtn('b')}
            aria-label={`Botão B - ${labels.b}`}
          >
            <span style={{ fontWeight: 900, fontSize: 16, lineHeight: 1 }}>B</span>
            <span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1.1 }}>{labels.b}</span>
          </button>

          <div />
          {/* A Button */}
          <button
            type="button"
            className={`touch-pad-btn ${active.a ? 'pressed' : ''}`}
            style={{
              width: actionSize,
              height: actionSize,
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #4ce098, #19945d)',
              color: '#0e241b',
            }}
            {...bindBtn('a')}
            aria-label={`Botão A - ${labels.a}`}
          >
            <span style={{ fontWeight: 900, fontSize: 16, lineHeight: 1 }}>A</span>
            <span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1.1 }}>{labels.a}</span>
          </button>
          <div />
        </div>
      </div>
    </div>
  );
};
