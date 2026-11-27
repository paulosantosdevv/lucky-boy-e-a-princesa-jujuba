import React, { useEffect, useState } from 'react';
import { CostumeId, DialogueLine } from '../types/game';
import { CharacterPortrait } from './CharacterArt';
import { audioSystem } from '../systems/audioSystem';

interface Props {
  lines: DialogueLine[];
  costume: CostumeId;
  onComplete: () => void;
}

export const DialogueBox: React.FC<Props> = ({ lines, costume, onComplete }) => {
  const [index, setIndex] = useState(0);
  const current = lines[index];

  const advance = () => {
    audioSystem.playSfx('click');
    if (index + 1 < lines.length) {
      setIndex(index + 1);
    } else {
      onComplete();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!current) return null;

  return (
    <div
      onClick={advance}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(10, 6, 28, 0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '18px 16px max(22px, env(safe-area-inset-bottom)) 16px',
      }}
    >
      <div
        className="seuss-card"
        onClick={(e) => {
          e.stopPropagation();
          advance();
        }}
        style={{
          width: 'min(760px, 96vw)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          cursor: 'pointer',
        }}
      >
        <CharacterPortrait
          character={current.speaker}
          size={86}
          costume={current.speaker === 'lucky' ? costume : 'classic'}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span
              className="seuss-title"
              style={{
                fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                color: '#ffd166',
                fontWeight: 700,
              }}
            >
              {current.speakerName}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>
              {index + 1} / {lines.length}
            </span>
          </div>
          <p
            style={{
              margin: '6px 0 10px',
              fontSize: 'clamp(0.92rem, 2.2vw, 1.06rem)',
              lineHeight: 1.45,
              color: '#fff8eb',
              fontWeight: 700,
            }}
          >
            {current.text}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                audioSystem.playSfx('click');
                onComplete();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.65)',
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer',
              }}
            >
              Pular diálogo »
            </button>
            <span
              className="seuss-btn seuss-btn-gold"
              style={{ padding: '6px 14px', fontSize: '0.88rem' }}
            >
              {index + 1 < lines.length ? 'Continuar ▶' : 'Vamos lá! 🐾'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
