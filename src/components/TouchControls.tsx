import React, { useState } from 'react';
import { ControlMode } from '../types/game';
import { inputManager, VirtualButton } from '../systems/inputSystem';
import { haptics } from '../systems/haptics';
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

  const isDpad = (btn: VirtualButton) =>
    btn === 'left' || btn === 'right' || btn === 'up' || btn === 'down';

  const bindBtn = (btn: VirtualButton) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      if (isDpad(btn)) haptics.tapDpad();
      else haptics.tapAction();
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

  const dpadSize = 'clamp(42px, 11.5vw, 56px)';
  const actionSize = 'clamp(46px, 12.2vw, 62px)';

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
        padding:
          'max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left))',
      }}
    >
      {/* Top-right pause button positioned cleanly below HUD bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', pointerEvents: 'none' }}>
        <button
          type="button"
          onClick={() => {
            haptics.tapUi();
            onPauseClick();
          }}
          className="touch-pad-btn"
          style={{
            pointerEvents: 'auto',
            width: 44,
            height: 44,
            borderRadius: 15,
            background: '#fff9eb',
            color: '#221b18',
            marginTop: 58,
          }}
          aria-label="Pausar jogo"
        >
          <Pause size={20} />
        </button>
      </div>

      {/* Bottom Controls Row: D-Pad Left + 4 Command Buttons Right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          width: '100%',
          gap: 8,
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
            opacity: 0.94,
          }}
        >
          <div />
          <button
            type="button"
            className={`touch-pad-btn ${active.up ? 'pressed' : ''}`}
            style={{
              borderRadius: '14px 14px 6px 6px',
              background: 'rgba(255, 249, 235, 0.94)',
              color: '#221b18',
              fontSize: 19,
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
              background: 'rgba(255, 249, 235, 0.94)',
              color: '#221b18',
              fontSize: 19,
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
              background: '#ffe770',
              border: '2.5px solid #221b18',
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
              background: 'rgba(255, 249, 235, 0.94)',
              color: '#221b18',
              fontSize: 19,
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
              background: 'rgba(255, 249, 235, 0.94)',
              color: '#221b18',
              fontSize: 19,
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
            opacity: 0.95,
          }}
        >
          <div />
          <button
            type="button"
            className={`touch-pad-btn ${active.y ? 'pressed' : ''} ${specialYLabel ? 'animate-glow' : ''}`}
            style={{
              width: actionSize,
              height: actionSize,
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #ffe770, #f5b922)',
              color: '#221b18',
            }}
            {...bindBtn('y')}
            aria-label={`Botão Y - ${specialYLabel || labels.y}`}
          >
            <span style={{ fontWeight: 900, fontSize: 15, lineHeight: 1 }}>Y</span>
            <span style={{ fontSize: 9, fontWeight: 900, lineHeight: 1.05, textAlign: 'center', padding: '0 2px' }}>
              {specialYLabel || labels.y}
            </span>
          </button>
          <div />

          <button
            type="button"
            className={`touch-pad-btn ${active.x ? 'pressed' : ''}`}
            style={{
              width: actionSize,
              height: actionSize,
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #6fd3f7, #2292c4)',
              color: '#ffffff',
            }}
            {...bindBtn('x')}
            aria-label={`Botão X - ${labels.x}`}
          >
            <span style={{ fontWeight: 900, fontSize: 15, lineHeight: 1 }}>X</span>
            <span style={{ fontSize: 9.5, fontWeight: 900, lineHeight: 1.1 }}>{labels.x}</span>
          </button>
          <div />
          <button
            type="button"
            className={`touch-pad-btn ${active.b ? 'pressed' : ''}`}
            style={{
              width: actionSize,
              height: actionSize,
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #f46d75, #d92626)',
              color: '#ffffff',
            }}
            {...bindBtn('b')}
            aria-label={`Botão B - ${labels.b}`}
          >
            <span style={{ fontWeight: 900, fontSize: 15, lineHeight: 1 }}>B</span>
            <span style={{ fontSize: 9.5, fontWeight: 900, lineHeight: 1.1 }}>{labels.b}</span>
          </button>

          <div />
          <button
            type="button"
            className={`touch-pad-btn ${active.a ? 'pressed' : ''}`}
            style={{
              width: actionSize,
              height: actionSize,
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #86db58, #4d9a31)',
              color: '#ffffff',
            }}
            {...bindBtn('a')}
            aria-label={`Botão A - ${labels.a}`}
          >
            <span style={{ fontWeight: 900, fontSize: 15, lineHeight: 1 }}>A</span>
            <span style={{ fontSize: 9.5, fontWeight: 900, lineHeight: 1.1 }}>{labels.a}</span>
          </button>
          <div />
        </div>
      </div>
    </div>
  );
};
