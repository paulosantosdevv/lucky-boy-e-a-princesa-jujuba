import React, { useEffect, useState } from 'react';
import { CostumeId, DialogueLine } from '../types/game';
import { CharacterPortrait } from './CharacterArt';
import { audioSystem } from '../systems/audioSystem';
import { haptics } from '../systems/haptics';

interface Props {
  lines: DialogueLine[];
  costume: CostumeId;
  onComplete: () => void;
}

export const DialogueBox: React.FC<Props> = ({ lines, costume, onComplete }) => {
  const [index, setIndex] = useState(0);

  // CRITICAL FIX: Always reset dialogue index when a new sequence of lines is passed
  // (prevents mobile freeze after Prologue -> Level 1 transition!)
  useEffect(() => {
    setIndex(0);
  }, [lines]);

  const safeIndex = index < lines.length ? index : 0;
  const current = lines[safeIndex];

  useEffect(() => {
    if (!lines || lines.length === 0) {
      onComplete();
    }
  }, [lines, onComplete]);

  const advance = () => {
    haptics.dpad();
    audioSystem.playSfx('click');
    if (safeIndex + 1 < lines.length) {
      setIndex(safeIndex + 1);
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
        background: 'rgba(20, 42, 62, 0.56)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '18px 14px max(22px, env(safe-area-inset-bottom)) 14px',
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
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: 'pointer',
        }}
      >
        <CharacterPortrait
          character={current.speaker}
          size={82}
          costume={current.speaker === 'lucky' ? costume : 'classic'}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span
              className="seuss-title"
              style={{
                fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                color: '#c91d1d',
                fontWeight: 700,
              }}
            >
              {current.speakerName}
            </span>
            <span style={{ fontSize: 12, color: '#6b5c4d', fontWeight: 800 }}>
              {safeIndex + 1} / {lines.length}
            </span>
          </div>
          <p
            style={{
              margin: '6px 0 10px',
              fontSize: 'clamp(0.9rem, 2.2vw, 1.05rem)',
              lineHeight: 1.45,
              color: '#221b18',
              fontWeight: 800,
            }}
          >
            {current.text}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                haptics.dpad();
                audioSystem.playSfx('click');
                onComplete();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b5c4d',
                fontWeight: 800,
                fontSize: 12.5,
                cursor: 'pointer',
              }}
            >
              Pular diálogo »
            </button>
            <span className="seuss-btn seuss-btn-gold" style={{ padding: '6px 14px', fontSize: '0.88rem' }}>
              {safeIndex + 1 < lines.length ? 'Continuar ▶' : 'Vamos lá! 🐾'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
