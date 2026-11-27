import React from 'react';
import { LEVELS } from '../data/levels';
import { LevelId, SaveData } from '../types/game';
import { getFragmentsCount, isLevelUnlocked } from '../systems/saveSystem';
import { CharacterPortrait } from './CharacterArt';
import { audioSystem } from '../systems/audioSystem';
import { ArrowLeft, Play, Settings, Shirt, Sparkles, Lock } from 'lucide-react';

interface Props {
  save: SaveData;
  onSelectLevel: (id: LevelId) => void;
  onPlayLevel: (id: LevelId) => void;
  onBackMenu: () => void;
  onOpenCostumes: () => void;
  onOpenSettings: () => void;
}

export const WorldMap: React.FC<Props> = ({
  save,
  onSelectLevel,
  onPlayLevel,
  onBackMenu,
  onOpenCostumes,
  onOpenSettings,
}) => {
  const selected = LEVELS.find((l) => l.id === save.selectedLevel) || LEVELS[0];
  const unlocked = isLevelUnlocked(save, selected.id);
  const fragments = getFragmentsCount(save);
  const selStat = save.levelStats[selected.id];

  const totalPaws = Object.values(save.levelStats).reduce(
    (sum, s) => sum + (s?.goldenPaws?.filter(Boolean).length || 0),
    0
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'radial-gradient(circle at 50% 20%, #2b1a63 0%, #120c2c 80%)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'rgba(15, 9, 38, 0.85)',
          borderBottom: '2px solid rgba(255, 209, 102, 0.35)',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className="seuss-btn seuss-btn-ghost"
          style={{ padding: '7px 12px', fontSize: '0.88rem' }}
          onClick={() => {
            audioSystem.playSfx('click');
            onBackMenu();
          }}
        >
          <ArrowLeft size={16} /> Menu
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 13.5, fontWeight: 800 }}>
          <span style={{ color: '#ffd166' }}>⭐ Fragmentos: {fragments}/9</span>
          <span>🐾 Patinhas: {totalPaws}/30</span>
          <span>🦴 Petiscos: {save.totalTreats}</span>
          <span>🐶 Vidas: {save.lives}</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="seuss-btn seuss-btn-mint"
            style={{ padding: '7px 12px', fontSize: '0.85rem' }}
            onClick={() => {
              audioSystem.playSfx('click');
              onOpenCostumes();
            }}
          >
            <Shirt size={16} /> Trajes
          </button>
          <button
            type="button"
            className="seuss-btn seuss-btn-ghost"
            style={{ padding: '7px 12px', fontSize: '0.85rem' }}
            onClick={() => {
              audioSystem.playSfx('click');
              onOpenSettings();
            }}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Interactive Jubalandia World Map */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          margin: '10px 12px 6px',
          borderRadius: 24,
          border: '3px solid #ffd166',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #1b1245 0%, #2f4858 38%, #2a9d8f 75%, #0077b6 100%)',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.45)',
        }}
      >
        {/* Background SVG Map Path & Landmarks */}
        <svg
          viewBox="0 0 1000 560"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          {/* Snowy Peak top-right for Lula's Fortress */}
          <path d="M720 260 Q850 60 990 140 L1000 320 L700 320 Z" fill="#3c1361" opacity="0.82" />
          {/* Ocean Bay bottom-center */}
          <ellipse cx="560" cy="450" rx="180" ry="95" fill="#0096c7" opacity="0.65" />
          {/* Candy Plains left */}
          <ellipse cx="220" cy="410" rx="220" ry="125" fill="#52b788" opacity="0.45" />
          {/* Dashed Super Mario World path connecting all 10 levels */}
          <polyline
            fill="none"
            stroke="#ffd166"
            strokeWidth="7"
            strokeDasharray="14 10"
            strokeLinecap="round"
            points={LEVELS.map((l) => `${l.mapPos.x * 10},${l.mapPos.y * 5.6}`).join(' ')}
          />
        </svg>

        {/* Map Title Badge */}
        <div
          className="seuss-title"
          style={{
            position: 'absolute',
            top: 10,
            left: 14,
            background: 'rgba(18, 12, 44, 0.8)',
            border: '2px solid #ffd166',
            borderRadius: 14,
            padding: '4px 12px',
            fontSize: 'clamp(0.85rem, 2.2vw, 1.1rem)',
            color: '#ffd166',
          }}
        >
          🗺️ Mapa de Jubalândia
        </div>

        {/* 10 Level Nodes */}
        {LEVELS.map((lvl) => {
          const isUnl = isLevelUnlocked(save, lvl.id);
          const isDone = save.completedLevels.includes(lvl.id);
          const isSel = selected.id === lvl.id;
          const st = save.levelStats[lvl.id];

          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => {
                audioSystem.playSfx('click');
                onSelectLevel(lvl.id);
              }}
              style={{
                position: 'absolute',
                left: `${lvl.mapPos.x}%`,
                top: `${lvl.mapPos.y}%`,
                transform: `translate(-50%, -50%) scale(${isSel ? 1.18 : 1})`,
                width: 'clamp(36px, 6.2vw, 52px)',
                height: 'clamp(36px, 6.2vw, 52px)',
                borderRadius: '50%',
                border: isSel ? '4px solid #ffffff' : '3px solid #231942',
                background: !isUnl
                  ? '#4a4e69'
                  : isDone
                  ? 'linear-gradient(180deg, #ffe066, #f4a216)'
                  : `linear-gradient(180deg, ${lvl.themeColor}, #231942)`,
                color: isDone ? '#231942' : '#ffffff',
                fontWeight: 900,
                fontSize: 'clamp(12px, 2.2vw, 16px)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSel
                  ? '0 0 22px rgba(255, 209, 102, 0.95)'
                  : '0 4px 10px rgba(0,0,0,0.5)',
                transition: 'transform 0.2s ease',
                zIndex: isSel ? 12 : 6,
              }}
              title={`${lvl.id}. ${lvl.title}`}
            >
              {isUnl ? (
                <>
                  <span>{lvl.id}</span>
                  {st && st.stars > 0 && (
                    <span style={{ fontSize: 8, lineHeight: 1 }}>
                      {'★'.repeat(st.stars)}
                    </span>
                  )}
                </>
              ) : (
                <Lock size={15} />
              )}
            </button>
          );
        })}

        {/* Lucky Boy Avatar Walking on Selected Node */}
        <div
          style={{
            position: 'absolute',
            left: `${selected.mapPos.x}%`,
            top: `calc(${selected.mapPos.y}% - 44px)`,
            transform: 'translateX(-50%)',
            transition: 'left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: 'none',
            zIndex: 15,
          }}
          className="animate-float"
        >
          <CharacterPortrait character="lucky" size={48} costume={save.equippedCostume} />
        </div>
      </div>

      {/* Selected Level Info Card */}
      <div
        className="seuss-card"
        style={{
          margin: '6px 12px max(12px, env(safe-area-inset-bottom))',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                background: selected.themeColor,
                color: '#fff',
                padding: '2px 9px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {selected.tag}
            </span>
            <h3 className="seuss-title" style={{ margin: 0, fontSize: 'clamp(1rem, 2.6vw, 1.3rem)', color: '#ffd166' }}>
              {selected.id.toString().padStart(2, '0')} · {selected.title}
            </h3>
          </div>
          <p style={{ margin: '4px 0 6px', fontSize: 'clamp(0.8rem, 2vw, 0.92rem)', color: 'rgba(255,248,235,0.9)' }}>
            {selected.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5, fontWeight: 800, flexWrap: 'wrap' }}>
            <span>
              Estrelas: <span style={{ color: '#ffd166' }}>{'★'.repeat(selStat?.stars || 0)}{'☆'.repeat(3 - (selStat?.stars || 0))}</span>
            </span>
            <span>
              Patinhas:{' '}
              {(selStat?.goldenPaws || [false, false, false]).map((got, idx) => (
                <span key={idx} style={{ opacity: got ? 1 : 0.3 }}>🐾</span>
              ))}
            </span>
            {selected.allyAppearance && (
              <span style={{ color: '#90e0ef' }}>
                <Sparkles size={13} style={{ verticalAlign: 'middle' }} /> Aliados:{' '}
                {selected.allyAppearance
                  .map((a) => (a === 'paulo' ? 'Paulo (SPFC)' : a === 'lully' ? 'Lully' : a === 'pinhao' ? 'Prof. Pinhão' : 'Princesa Jujuba'))
                  .join(', ')}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={!unlocked}
          className={`seuss-btn ${unlocked ? 'seuss-btn-primary' : 'seuss-btn-ghost'}`}
          style={{
            minWidth: 165,
            opacity: unlocked ? 1 : 0.55,
            cursor: unlocked ? 'pointer' : 'not-allowed',
          }}
          onClick={() => {
            if (!unlocked) return;
            audioSystem.playSfx('star');
            onPlayLevel(selected.id);
          }}
        >
          {unlocked ? (
            <>
              <Play size={18} /> JOGAR FASE
            </>
          ) : selected.id === 10 ? (
            <>
              <Lock size={16} /> Requer 9 Fragmentos
            </>
          ) : (
            <>
              <Lock size={16} /> Fase Bloqueada
            </>
          )}
        </button>
      </div>
    </div>
  );
};
