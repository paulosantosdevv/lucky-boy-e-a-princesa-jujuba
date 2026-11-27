import React, { useState } from 'react';
import { SaveData } from '../types/game';
import { ENDING_SCENE_LINES } from '../data/story';
import { CharacterPortrait } from './CharacterArt';
import { audioSystem } from '../systems/audioSystem';

interface Props {
  save: SaveData;
  onContinueExploring: () => void;
}

export const EndingCinematic: React.FC<Props> = ({ save, onContinueExploring }) => {
  const [step, setStep] = useState<'dialogue' | 'message'>('dialogue');
  const [lineIdx, setLineIdx] = useState(0);

  const totalStars = Object.values(save.levelStats).reduce((s, st) => s + (st?.stars || 0), 0);
  const totalPaws = Object.values(save.levelStats).reduce(
    (s, st) => s + (st?.goldenPaws?.filter(Boolean).length || 0),
    0
  );

  const nextLine = () => {
    audioSystem.playSfx('click');
    if (lineIdx + 1 < ENDING_SCENE_LINES.length) {
      setLineIdx(lineIdx + 1);
    } else {
      audioSystem.playSfx('win');
      setStep('message');
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 50% 25%, #3c1e78 0%, #140b33 78%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        overflowY: 'auto',
      }}
      className="scrollable-panel"
    >
      {/* Radiant Enchanted Star */}
      <div style={{ fontSize: 58, marginBottom: 8 }} className="animate-float">
        ⭐
      </div>

      {/* Happy Reunion Cast */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 'clamp(8px, 2vw, 18px)',
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <CharacterPortrait character="lully" size={74} />
        <CharacterPortrait character="lucky" size={98} costume={save.equippedCostume} />
        <CharacterPortrait character="jujuba" size={98} />
        <CharacterPortrait character="paulo" size={74} />
        <CharacterPortrait character="lula" size={74} />
      </div>

      {step === 'dialogue' ? (
        <div
          className="seuss-card"
          onClick={nextLine}
          style={{ width: 'min(680px, 95vw)', padding: '18px 22px', cursor: 'pointer', textAlign: 'center' }}
        >
          <div className="seuss-title" style={{ color: '#ffd166', fontSize: '1.25rem', marginBottom: 6 }}>
            {ENDING_SCENE_LINES[lineIdx].speakerName}
          </div>
          <p style={{ fontSize: '1.08rem', lineHeight: 1.5, margin: '0 0 14px', fontWeight: 700 }}>
            "{ENDING_SCENE_LINES[lineIdx].text}"
          </p>
          <button type="button" className="seuss-btn seuss-btn-gold">
            {lineIdx + 1 < ENDING_SCENE_LINES.length ? 'Continuar ▶' : 'Ver Final de Natal 🎄'}
          </button>
        </div>
      ) : (
        <div className="seuss-card" style={{ width: 'min(700px, 95vw)', padding: '24px 26px', textAlign: 'center' }}>
          <h1
            className="seuss-title"
            style={{
              margin: '0 0 12px',
              color: '#ffd166',
              fontSize: 'clamp(1.6rem, 4.5vw, 2.5rem)',
              textShadow: '0 4px 0 #8b1222',
            }}
          >
            🎄 FELIZ NATAL! 🎄
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2.4vw, 1.18rem)',
              lineHeight: 1.65,
              fontWeight: 700,
              color: '#fff8eb',
              margin: '0 0 18px',
            }}
          >
            Naquela noite, todos descobriram que o maior herói de Jubalândia não precisava de uma espada, de uma
            armadura ou de uma coroa.
            <br />
            <span style={{ color: '#ffd166' }}>
              Bastavam quatro patinhas, uma barriguinha e um coração cheio de amor.
            </span>
          </p>

          {/* Adventure Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 10,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: 14,
              marginBottom: 18,
              fontWeight: 800,
            }}
          >
            <div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Estrelas</div>
              <div style={{ fontSize: 20, color: '#ffd166' }}>★ {totalStars}/30</div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Patinhas Douradas</div>
              <div style={{ fontSize: 20, color: '#ffd166' }}>🐾 {totalPaws}/30</div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Petiscos</div>
              <div style={{ fontSize: 20, color: '#7bf1a8' }}>🦴 {save.totalTreats}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Trajes</div>
              <div style={{ fontSize: 20, color: '#90e0ef' }}>👕 {save.unlockedCostumes.length}/6</div>
            </div>
          </div>

          <button type="button" className="seuss-btn seuss-btn-primary" onClick={onContinueExploring}>
            🗺️ Continuar Explorando Jubalândia
          </button>
        </div>
      )}
    </div>
  );
};
