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
        aspectRatio: '16 / 9',
        borderRadius: 24,
        overflow: 'hidden',
        border: '4px solid #221b18',
        boxShadow: '0 10px 0 rgba(34,27,24,0.28), 0 18px 38px rgba(20,55,75,0.28)',
        display: 'flex',
      }}
    >
      {/* Classic Big Golden Book Decorative Spine on Left */}
      <div
        className="golden-spine"
        style={{
          width: 'clamp(22px, 4.2vw, 38px)',
          height: '100%',
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

      {/* Main Dr. Seuss / Lorax / Cat in the Hat Christmas Storybook Scene */}
      <div style={{ position: 'relative', flex: 1, height: '100%' }}>
        <svg viewBox="0 0 920 540" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <linearGradient id="seussSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#66cef5" />
              <stop offset="65%" stopColor="#a7e7ff" />
              <stop offset="100%" stopColor="#dcf7ff" />
            </linearGradient>
            <linearGradient id="seussHill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#80cb4b" />
              <stop offset="100%" stopColor="#4f9932" />
            </linearGradient>
            <radialGradient id="bellGold" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fff7a8" />
              <stop offset="60%" stopColor="#ffd23f" />
              <stop offset="100%" stopColor="#d48c11" />
            </radialGradient>
          </defs>

          {/* Bright Lorax Sky */}
          <rect width="920" height="540" fill="url(#seussSky)" />

          {/* Sunburst sketchy white lines (like The Lorax cover!) */}
          <g stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.62">
            <line x1="460" y1="220" x2="210" y2="95" />
            <line x1="460" y1="220" x2="155" y2="195" />
            <line x1="460" y1="220" x2="710" y2="105" />
            <line x1="460" y1="220" x2="780" y2="210" />
            <line x1="460" y1="220" x2="310" y2="55" />
            <line x1="460" y1="220" x2="625" y2="55" />
          </g>

          {/* Lorax Truffula Tree Left (Yellow Fluffy Tuft) */}
          <path d="M112 435 Q82 285 118 145" fill="none" stroke="#f7da59" strokeWidth="14" strokeLinecap="round" />
          <path d="M112 435 Q82 285 118 145" fill="none" stroke="#221b18" strokeWidth="2.8" strokeDasharray="3 10" />
          <path
            d="M52 145 C42 95, 90 62, 125 70 C168 62, 198 102, 182 148 C166 176, 86 184, 52 145 Z"
            fill="#ffe566"
            stroke="#221b18"
            strokeWidth="3.2"
          />

          {/* Lorax Truffula Tree Right (Coral Pink Fluffy Tuft) */}
          <path d="M810 445 Q842 290 795 148" fill="none" stroke="#f7da59" strokeWidth="15" strokeLinecap="round" />
          <path d="M810 445 Q842 290 795 148" fill="none" stroke="#221b18" strokeWidth="2.8" strokeDasharray="3 10" />
          <path
            d="M726 146 C714 96, 766 56, 812 66 C862 60, 892 108, 868 152 C846 184, 756 186, 726 146 Z"
            fill="#f46d75"
            stroke="#221b18"
            strokeWidth="3.2"
          />

          {/* Giant Lush Dr. Seuss Christmas Tree in Center (like Cat in the Hat Christmas!) */}
          <rect x="430" y="325" width="60" height="100" fill="#8b623f" stroke="#221b18" strokeWidth="3.5" />
          <path
            d="M460 22 C375 55, 250 105, 192 162 C240 165, 278 168, 290 175 C215 210, 156 268, 130 315 C208 320, 260 314, 292 308 C222 355, 185 385, 175 402 L745 402 C735 385, 698 355, 628 308 C660 314, 712 320, 790 315 C764 268, 705 210, 630 175 C642 168, 680 165, 728 162 C670 105, 545 55, 460 22 Z"
            fill="#5ea93f"
            stroke="#221b18"
            strokeWidth="3.8"
            strokeLinejoin="round"
          />

          {/* Pink Fluffy Christmas Garland draped across tree */}
          <path
            d="M245 145 Q385 182 545 130 Q625 110 688 158"
            fill="none"
            stroke="#e47bb8"
            strokeWidth="15"
            strokeLinecap="round"
          />
          <path
            d="M245 145 Q385 182 545 130 Q625 110 688 158"
            fill="none"
            stroke="#f7b5dc"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="6 10"
          />
          <path
            d="M196 276 Q375 316 565 268 Q660 250 732 288"
            fill="none"
            stroke="#e47bb8"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* 3 Giant Golden Bells in center of tree (iconic from reference #1!) */}
          {[
            { x: 412, y: 238, r: -14, s: 0.9 },
            { x: 508, y: 238, r: 14, s: 0.9 },
            { x: 460, y: 244, r: 0, s: 1.08 },
          ].map((b, i) => (
            <g key={i} transform={`translate(${b.x}, ${b.y}) rotate(${b.r}) scale(${b.s})`}>
              <path
                d="M-24 22 C-22 -8, -16 -24, 0 -24 C16 -24, 22 -8, 24 22 C28 28, -28 28, -24 22 Z"
                fill="url(#bellGold)"
                stroke="#8c5807"
                strokeWidth="3"
              />
              <circle cx="0" cy="26" r="6" fill="#d99316" stroke="#221b18" strokeWidth="2.2" />
            </g>
          ))}

          {/* Bright Ornaments & Candy Canes */}
          {[
            [310, 198, '#e63946'],
            [355, 260, '#ffd447'],
            [565, 255, '#4cc9f0'],
            [622, 200, '#ff9f1c'],
            [275, 290, '#4cc9f0'],
            [650, 295, '#e63946'],
            [458, 120, '#ffd447'],
          ].map(([cx, cy, fill], idx) => (
            <circle key={idx} cx={cx as number} cy={cy as number} r="10" fill={fill as string} stroke="#221b18" strokeWidth="2.5" />
          ))}

          {/* Rolling Storybook Green Meadow Hill */}
          <path d="M0 398 Q230 342 460 375 Q690 408 920 356 L920 540 L0 540 Z" fill="url(#seussHill)" stroke="#221b18" strokeWidth="3.8" />
          <path d="M0 456 Q280 412 560 460 Q760 490 920 448 L920 540 L0 540 Z" fill="#89d455" opacity="0.7" />
        </svg>

        {/* Big Golden Book Badge */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 16,
            background: '#fff8dc',
            border: '2.5px solid #221b18',
            borderRadius: 99,
            padding: '3px 11px',
            fontSize: 11,
            fontWeight: 900,
            color: '#7a4d09',
            boxShadow: '0 3px 0 rgba(34,27,24,0.22)',
          }}
        >
          📖 Edição Especial de Natal · Jubalândia
        </div>

        {/* Storybook Title (Curved / Festive like Cat in the Hat Christmas!) */}
        <div
          style={{
            position: 'absolute',
            top: '9%',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            width: '92%',
            pointerEvents: 'none',
          }}
        >
          <div
            className="seuss-title"
            style={{
              fontSize: 'clamp(1.3rem, 3.6vw, 2.45rem)',
              fontWeight: 700,
              color: '#fffdf2',
              WebkitTextStroke: '2px #221b18',
              textShadow: '0 4px 0 #221b18',
              lineHeight: 1.04,
            }}
          >
            Lucky Boy e a Princesa Jujuba
          </div>
          <div
            className="seuss-title"
            style={{
              marginTop: 2,
              fontSize: 'clamp(0.92rem, 2.2vw, 1.4rem)',
              fontWeight: 700,
              color: '#d92626',
              WebkitTextStroke: '1px #fffdf2',
              textShadow: '0 2px 0 #221b18',
            }}
          >
            Uma Aventura Extraordinária de Natal!
          </div>
        </div>

        {/* Princesa Jujuba & Villain Lula positioned playfully */}
        <div style={{ position: 'absolute', left: '6%', bottom: '28%' }} className="animate-float">
          <CharacterPortrait character="jujuba" size={74} />
        </div>
        <div style={{ position: 'absolute', right: '6%', bottom: '28%' }}>
          <CharacterPortrait character="lula" size={76} />
        </div>

        {/* Foreground Cast Trio on Green Meadow: Lully + LUCKY BOY + Paulo (SPFC) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '5%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 'clamp(8px, 2vw, 20px)',
          }}
        >
          <div style={{ transform: 'rotate(-5deg)' }}>
            <CharacterPortrait character="lully" size={82} />
          </div>
          <div className="animate-float" style={{ transform: 'translateY(-6px)' }}>
            <CharacterPortrait character="lucky" size={114} costume={costume} />
          </div>
          <div style={{ transform: 'rotate(5deg)' }}>
            <CharacterPortrait character="paulo" size={82} />
          </div>
        </div>
      </div>
    </div>
  );
};
