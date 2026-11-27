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
        maxWidth: 760,
        aspectRatio: '16 / 9',
        borderRadius: 28,
        overflow: 'hidden',
        border: '4px solid #ffd166',
        boxShadow: '0 20px 55px rgba(0,0,0,0.6), 0 0 30px rgba(255,209,102,0.28)',
      }}
    >
      <svg viewBox="0 0 960 540" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="coverSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f0a2e" />
            <stop offset="48%" stopColor="#2b1963" />
            <stop offset="100%" stopColor="#5d2a7e" />
          </linearGradient>
          <radialGradient id="starHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff8b8" stopOpacity="1" />
            <stop offset="45%" stopColor="#ffd166" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#ffd166" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="snowHill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#cde8ff" />
          </linearGradient>
        </defs>

        {/* Night Sky */}
        <rect width="960" height="540" fill="url(#coverSky)" />

        {/* Enchanted Star Glow */}
        <circle cx="480" cy="115" r="115" fill="url(#starHalo)" />
        <polygon
          points="480,52 494,95 540,95 503,121 516,164 480,138 444,164 457,121 420,95 466,95"
          fill="#fff5b8"
          stroke="#f4a261"
          strokeWidth="4"
        />

        {/* Whimsical Dr. Seuss Spiral Mountain on Right (Lula's Fortress) */}
        <path
          d="M660 420 C700 280, 740 160, 815 95 C855 60, 895 105, 848 138 C822 155, 815 125, 835 112 C860 155, 910 290, 960 420 Z"
          fill="#3c1361"
          stroke="#19082b"
          strokeWidth="5"
        />
        {/* Crooked Fortress Tower */}
        <path d="M775 162 L795 108 L835 115 L842 170 Z" fill="#5a189a" stroke="#19082b" strokeWidth="4" />
        <polygon points="785,112 818,70 848,118" fill="#e63946" stroke="#19082b" strokeWidth="4" />

        {/* Candy Castle on Left Background (Princesa Jujuba) */}
        <path d="M80 390 L110 205 L180 198 L215 390 Z" fill="#ff758f" stroke="#231942" strokeWidth="4" />
        <path d="M100 208 L145 130 L190 202 Z" fill="#ffd166" stroke="#231942" strokeWidth="4" />
        <rect x="132" y="230" width="28" height="44" rx="14" fill="#fff3b0" stroke="#231942" strokeWidth="3.5" />

        {/* Whimsical Curved Dr. Seuss Pine Trees */}
        <path
          d="M270 400 Q245 310 290 250 Q315 295 295 320 Q330 330 305 365 Q335 380 315 410 Z"
          fill="#2a9d8f"
          stroke="#14213d"
          strokeWidth="4"
        />
        <path
          d="M625 405 Q660 310 605 245 Q585 288 605 318 Q572 330 595 368 Q568 380 590 412 Z"
          fill="#2ec4b6"
          stroke="#14213d"
          strokeWidth="4"
        />
        {/* Christmas ornaments on trees */}
        <circle cx="288" cy="292" r="7" fill="#e63946" />
        <circle cx="298" cy="340" r="7" fill="#ffd166" />
        <circle cx="607" cy="295" r="7" fill="#ffd166" />
        <circle cx="598" cy="345" r="7" fill="#e63946" />

        {/* Crooked Jubalandia Houses */}
        <path d="M345 395 L358 315 L430 308 L442 395 Z" fill="#f4a261" stroke="#231942" strokeWidth="4" />
        <path d="M335 320 Q395 270 450 312 Z" fill="#e63946" stroke="#231942" strokeWidth="4" />
        <rect x="378" y="336" width="24" height="24" rx="5" fill="#fff3b0" stroke="#231942" strokeWidth="3" />

        <path d="M510 398 L522 325 L588 320 L595 398 Z" fill="#90e0ef" stroke="#231942" strokeWidth="4" />
        <path d="M500 328 Q552 282 604 324 Z" fill="#e76f51" stroke="#231942" strokeWidth="4" />
        <rect x="542" y="342" width="22" height="22" rx="5" fill="#fff3b0" stroke="#231942" strokeWidth="3" />

        {/* Foreground Rolling Snowy Hills */}
        <path d="M0 405 Q240 345 480 395 Q720 445 960 375 L960 540 L0 540 Z" fill="url(#snowHill)" stroke="#231942" strokeWidth="4" />
        <path d="M0 458 Q300 412 580 465 Q800 500 960 448 L960 540 L0 540 Z" fill="#e8f5ff" />

        {/* Twinkling stars & Snowflakes */}
        {[
          [90, 75], [220, 62], [330, 118], [620, 75], [710, 145], [890, 58],
          [160, 150], [380, 60], [565, 130], [740, 60], [45, 220], [920, 210],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 2 === 0 ? 4.5 : 3} fill="#ffffff" opacity={0.85} />
        ))}
      </svg>

      {/* Cast Badges positioned artistically across the cover */}
      {/* Princesa Jujuba in Castle */}
      <div style={{ position: 'absolute', left: '9%', top: '18%' }} className="animate-float">
        <CharacterPortrait character="jujuba" size={82} />
      </div>

      {/* Boss Lula on Spiral Mountain */}
      <div style={{ position: 'absolute', right: '6%', top: '12%' }}>
        <CharacterPortrait character="lula" size={88} />
      </div>

      {/* Hero Trio in Foreground: Lully + LUCKY BOY + Paulo (SPFC) */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '7%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 'clamp(8px, 2vw, 20px)',
        }}
      >
        <div style={{ transform: 'rotate(-5deg)' }}>
          <CharacterPortrait character="lully" size={84} />
        </div>
        <div className="animate-float" style={{ transform: 'translateY(-8px)' }}>
          <CharacterPortrait character="lucky" size={118} costume={costume} />
        </div>
        <div style={{ transform: 'rotate(5deg)' }}>
          <CharacterPortrait character="paulo" size={84} />
        </div>
      </div>

      {/* Title Banner */}
      <div
        style={{
          position: 'absolute',
          top: '4%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          width: '90%',
        }}
      >
        <div
          className="seuss-title"
          style={{
            fontSize: 'clamp(1.35rem, 3.6vw, 2.5rem)',
            fontWeight: 700,
            color: '#fff8eb',
            textShadow: '0 4px 0 #8b1222, 0 8px 18px rgba(0,0,0,0.75)',
            lineHeight: 1.05,
          }}
        >
          Lucky Boy e a Princesa Jujuba
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 'clamp(0.72rem, 1.5vw, 0.98rem)',
            fontWeight: 800,
            color: '#ffd166',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textShadow: '0 2px 6px rgba(0,0,0,0.85)',
          }}
        >
          ★ Uma Aventura Extraordinária de Natal ★
        </div>
      </div>
    </div>
  );
};
