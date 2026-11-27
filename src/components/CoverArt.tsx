import React from 'react';
import { CharacterPortrait } from './CharacterArt';
import { CostumeId } from '../types/game';

interface Props {
  costume: CostumeId;
}

export const CoverArt: React.FC<Props> = ({ costume }) => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 780,
        borderRadius: 24,
        overflow: 'hidden',
        border: '4px solid #221b18',
        boxShadow: '0 10px 0 rgba(34,27,24,0.28), 0 18px 36px rgba(20,55,75,0.26)',
        display: 'flex',
        background: '#74d4f7',
      }}
    >
      {/* Classic Big Golden Book Spine on Left */}
      <div
        className="golden-spine"
        style={{
          width: 'clamp(22px, 5vw, 38px)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '10px 0',
          fontSize: 13,
          color: '#3a2b18',
          zIndex: 4,
        }}
      >
        <span>🐾</span>
        <span>🎄</span>
        <span>🦴</span>
        <span>⭐</span>
        <span>🔔</span>
        <span>🐾</span>
      </div>

      {/* Main Cover Content: Clean Stacked Layout so Title & Cast NEVER Overlap on Mobile! */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'clamp(10px, 2.5vw, 18px) clamp(10px, 2.5vw, 20px) clamp(12px, 2.6vw, 20px)',
          gap: 'clamp(10px, 2.2vw, 16px)',
          overflow: 'hidden',
        }}
      >
        {/* Background Storybook SVG Illustration */}
        <svg
          viewBox="0 0 920 540"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
        >
          <defs>
            <linearGradient id="seussSky2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#66cef5" />
              <stop offset="68%" stopColor="#b0ebff" />
              <stop offset="100%" stopColor="#e2f9ff" />
            </linearGradient>
            <linearGradient id="seussHill2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#82ce4c" />
              <stop offset="100%" stopColor="#4f9932" />
            </linearGradient>
          </defs>

          <rect width="920" height="540" fill="url(#seussSky2)" />

          {/* Lorax Sunburst Rays */}
          <g stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.55">
            <line x1="460" y1="250" x2="170" y2="90" />
            <line x1="460" y1="250" x2="120" y2="220" />
            <line x1="460" y1="250" x2="750" y2="95" />
            <line x1="460" y1="250" x2="810" y2="230" />
          </g>

          {/* Left Yellow Truffula Tree */}
          <path d="M90 450 Q62 300 95 165" fill="none" stroke="#f7da59" strokeWidth="14" strokeLinecap="round" />
          <path d="M90 450 Q62 300 95 165" fill="none" stroke="#221b18" strokeWidth="2.8" strokeDasharray="3 10" />
          <path
            d="M36 168 C28 122, 72 90, 102 96 C142 90, 170 126, 155 168 C140 194, 68 200, 36 168 Z"
            fill="#ffe566"
            stroke="#221b18"
            strokeWidth="3.2"
          />

          {/* Right Coral-Pink Truffula Tree */}
          <path d="M835 450 Q862 300 822 165" fill="none" stroke="#f7da59" strokeWidth="14" strokeLinecap="round" />
          <path d="M835 450 Q862 300 822 165" fill="none" stroke="#221b18" strokeWidth="2.8" strokeDasharray="3 10" />
          <path
            d="M758 168 C746 122, 794 86, 834 94 C878 88, 906 130, 886 172 C866 202, 784 202, 758 168 Z"
            fill="#f46d75"
            stroke="#221b18"
            strokeWidth="3.2"
          />

          {/* Giant Lush Christmas Tree Center */}
          <rect x="432" y="340" width="56" height="90" fill="#8b623f" stroke="#221b18" strokeWidth="3.5" />
          <path
            d="M460 72 C380 105, 275 152, 224 202 C264 205, 295 208, 305 215 C240 248, 190 296, 168 338 C236 342, 282 336, 310 330 C252 372, 220 398, 212 414 L708 414 C700 398, 668 372, 610 330 C638 336, 684 342, 752 338 C730 296, 680 248, 615 215 C625 208, 656 205, 696 202 C645 152, 540 105, 460 72 Z"
            fill="#5ea93f"
            stroke="#221b18"
            strokeWidth="3.8"
            strokeLinejoin="round"
          />
          <path d="M268 195 Q395 232 540 184 Q615 166 664 204" fill="none" stroke="#e47bb8" strokeWidth="14" strokeLinecap="round" />
          <path d="M222 308 Q390 344 560 300 Q645 282 708 318" fill="none" stroke="#e47bb8" strokeWidth="13" strokeLinecap="round" />

          {/* Ornaments & Golden Bells */}
          {[
            [330, 240, '#e63946'],
            [380, 295, '#ffd447'],
            [545, 290, '#4cc9f0'],
            [598, 242, '#ff9f1c'],
            [460, 255, '#ffd447'],
          ].map(([cx, cy, fill], idx) => (
            <circle key={idx} cx={cx as number} cy={cy as number} r="11" fill={fill as string} stroke="#221b18" strokeWidth="2.6" />
          ))}

          {/* Green Storybook Hill */}
          <path d="M0 390 Q240 345 460 375 Q680 405 920 355 L920 540 L0 540 Z" fill="url(#seussHill2)" stroke="#221b18" strokeWidth="3.8" />
        </svg>

        {/* Crisp, High-Legibility Big Golden Book Header Plaque (ZERO overlap!) */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            textAlign: 'center',
          }}
        >
          {/* Top Golden Book Tag */}
          <div
            style={{
              background: '#fff8dc',
              border: '2.5px solid #221b18',
              borderRadius: 99,
              padding: '2px 12px',
              fontSize: 'clamp(10px, 2.3vw, 12px)',
              fontWeight: 900,
              color: '#7a4d09',
              boxShadow: '0 2px 0 #221b18',
            }}
          >
            📖 Edição Especial de Natal · 12 Fases em Jubalândia
          </div>

          {/* Title Box with warm cream pill & clean bold shadow */}
          <div
            style={{
              background: 'linear-gradient(180deg, #fffdf5 0%, #fff0c2 100%)',
              border: '3.5px solid #221b18',
              borderRadius: '22px 14px 22px 14px',
              padding: 'clamp(6px, 1.8vw, 10px) clamp(12px, 3vw, 24px)',
              boxShadow: '0 5px 0 #221b18',
              maxWidth: '98%',
            }}
          >
            <h1
              className="seuss-title"
              style={{
                margin: 0,
                fontSize: 'clamp(1.2rem, 4.4vw, 2.25rem)',
                fontWeight: 700,
                color: '#c91d1d',
                lineHeight: 1.08,
                textShadow: '0 2px 0 #ffe055',
              }}
            >
              Lucky Boy e a Princesa Jujuba
            </h1>
            <div
              style={{
                marginTop: 4,
                display: 'inline-block',
                background: '#d92626',
                color: '#fffef9',
                border: '2px solid #221b18',
                borderRadius: 99,
                padding: '2px 12px',
                fontSize: 'clamp(0.72rem, 2.2vw, 0.95rem)',
                fontWeight: 800,
                letterSpacing: '0.02em',
              }}
            >
              ★ Uma Aventura Extraordinária de Natal ★
            </div>
          </div>
        </div>

        {/* Clean Non-Overlapping Cast Showcase (Responsive for Portrait Mobile & Desktop!) */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 'clamp(4px, 1.5vw, 14px)',
            paddingTop: 4,
          }}
        >
          <div style={{ transform: 'translateY(-10px)' }}>
            <CharacterPortrait character="jujuba" size={58} />
          </div>
          <div style={{ transform: 'rotate(-4deg)' }}>
            <CharacterPortrait character="lully" size={68} />
          </div>
          <div className="animate-float">
            <CharacterPortrait character="lucky" size={94} costume={costume} />
          </div>
          <div style={{ transform: 'rotate(4deg)' }}>
            <CharacterPortrait character="paulo" size={68} />
          </div>
          <div style={{ transform: 'translateY(-10px)' }}>
            <CharacterPortrait character="lula" size={58} />
          </div>
        </div>
      </div>
    </div>
  );
};
