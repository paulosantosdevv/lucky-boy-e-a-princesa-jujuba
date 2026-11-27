import React from 'react';
import { LEVELS } from '../data/levels';
import { LevelId, SaveData } from '../types/game';
import { FRAGMENTS_REQUIRED, getFragmentsCount, isLevelUnlocked, TOTAL_LEVELS } from '../systems/saveSystem';
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
        background: 'linear-gradient(180deg, #6fd3f7 0%, #c6f1ff 60%, #78c44d 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Storybook Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 14px',
          background: '#fff9eb',
          borderBottom: '3.5px solid #221b18',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 13.5, fontWeight: 900, color: '#221b18' }}>
          <span style={{ color: '#c91d1d' }}>⭐ Fragmentos: {fragments}/{FRAGMENTS_REQUIRED}</span>
          <span>🐾 Patinhas: {totalPaws}/{TOTAL_LEVELS * 3}</span>
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
            className="seuss-btn seuss-btn-gold"
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

      {/* Bright Dr. Seuss / Lorax Illustrated World Map */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          margin: '10px 12px 6px',
          borderRadius: 24,
          border: '4px solid #221b18',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #6fd3f7 0%, #b8eeff 46%, #7ac74f 48%, #5da93a 100%)',
          boxShadow: '0 8px 0 rgba(34,27,24,0.22)',
        }}
      >
        <svg
          viewBox="0 0 1000 560"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          {/* Bright Rolling Meadow & Hills */}
          <path d="M0 280 Q240 200 500 265 Q760 325 1000 220 L1000 560 L0 560 Z" fill="#7ac74f" stroke="#221b18" strokeWidth="3.5" />
          {/* Candy Lake for Level 5 */}
          <ellipse cx="560" cy="435" rx="165" ry="88" fill="#52c4f2" stroke="#221b18" strokeWidth="3.5" />
          {/* Snowy Mountain Peak Top-Right for Level 8 & 10 */}
          <path d="M710 290 Q835 35 975 110 L1000 320 L700 320 Z" fill="#e6f5ff" stroke="#221b18" strokeWidth="3.5" />
          <path d="M865 112 L910 38 L955 112 Z" fill="#9f7aea" stroke="#221b18" strokeWidth="3.5" />

          {/* Decorative Lorax Truffula Trees */}
          {[
            { x: 140, y: 340, c: '#ffe055' },
            { x: 265, y: 280, c: '#f46d75' },
            { x: 390, y: 350, c: '#ff9f43' },
            { x: 650, y: 245, c: '#f46d75' },
            { x: 465, y: 245, c: '#ffe055' },
          ].map((t, i) => (
            <g key={i}>
              <path d={`M${t.x} ${t.y + 62} Q${t.x - 14} ${t.y + 25} ${t.x} ${t.y}`} stroke="#f7da59" strokeWidth="8" fill="none" />
              <circle cx={t.x} cy={t.y} r="28" fill={t.c} stroke="#221b18" strokeWidth="3" />
            </g>
          ))}

          {/* Storybook Dashed Golden Road connecting all 10 levels */}
          <polyline
            fill="none"
            stroke="#221b18"
            strokeWidth="12"
            strokeDasharray="15 11"
            strokeLinecap="round"
            points={LEVELS.map((l) => `${l.mapPos.x * 10},${l.mapPos.y * 5.6}`).join(' ')}
          />
          <polyline
            fill="none"
            stroke="#ffe055"
            strokeWidth="7"
            strokeDasharray="15 11"
            strokeLinecap="round"
            points={LEVELS.map((l) => `${l.mapPos.x * 10},${l.mapPos.y * 5.6}`).join(' ')}
          />
        </svg>

        {/* Map Banner */}
        <div
          className="seuss-title"
          style={{
            position: 'absolute',
            top: 10,
            left: 14,
            background: '#fff9eb',
            border: '3px solid #221b18',
            borderRadius: 16,
            padding: '4px 14px',
            fontSize: 'clamp(0.85rem, 2.2vw, 1.12rem)',
            color: '#c91d1d',
            boxShadow: '0 4px 0 #221b18',
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
                transform: `translate(-50%, -50%) scale(${isSel ? 1.2 : 1})`,
                width: 'clamp(36px, 6.2vw, 52px)',
                height: 'clamp(36px, 6.2vw, 52px)',
                borderRadius: '50%',
                border: isSel ? '4px solid #d92626' : '3px solid #221b18',
                background: !isUnl
                  ? '#b8b2a6'
                  : isDone
                  ? 'linear-gradient(180deg, #ffe770, #f5b922)'
                  : '#fff9eb',
                color: '#221b18',
                fontWeight: 900,
                fontSize: 'clamp(12px, 2.2vw, 16px)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSel
                  ? '0 0 0 4px #ffe055, 0 5px 0 #221b18'
                  : '0 4px 0 #221b18',
                transition: 'transform 0.2s ease',
                zIndex: isSel ? 12 : 6,
              }}
              title={`${lvl.id}. ${lvl.title}`}
            >
              {isUnl ? (
                <>
                  <span>{lvl.id}</span>
                  {st && st.stars > 0 && (
                    <span style={{ fontSize: 8, lineHeight: 1, color: '#c91d1d' }}>
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

        {/* Lucky Boy Avatar */}
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

      {/* Selected Level Storybook Info Card */}
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
                background: '#d92626',
                color: '#fff',
                border: '2px solid #221b18',
                padding: '2px 9px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {selected.tag}
            </span>
            <h3 className="seuss-title" style={{ margin: 0, fontSize: 'clamp(1rem, 2.6vw, 1.3rem)', color: '#221b18' }}>
              {selected.id.toString().padStart(2, '0')} · {selected.title}
            </h3>
          </div>
          <p style={{ margin: '4px 0 6px', fontSize: 'clamp(0.82rem, 2vw, 0.94rem)', color: '#3b312a', fontWeight: 700 }}>
            {selected.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5, fontWeight: 800, flexWrap: 'wrap' }}>
            <span>
              Estrelas:{' '}
              <span style={{ color: '#d98a00' }}>
                {'★'.repeat(selStat?.stars || 0)}
                {'☆'.repeat(3 - (selStat?.stars || 0))}
              </span>
            </span>
            <span>
              Patinhas:{' '}
              {(selStat?.goldenPaws || [false, false, false]).map((got, idx) => (
                <span key={idx} style={{ opacity: got ? 1 : 0.3 }}>
                  🐾
                </span>
              ))}
            </span>
            {selected.allyAppearance && (
              <span style={{ color: '#2f7a24' }}>
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
          ) : selected.id === 12 ? (
            <>
              <Lock size={16} /> Requer {FRAGMENTS_REQUIRED} Fragmentos
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
