import React from 'react';
import { CharacterId, CostumeId } from '../types/game';

interface Props {
  character: CharacterId;
  size?: number;
  costume?: CostumeId;
  className?: string;
}

export const CharacterPortrait: React.FC<Props> = ({
  character,
  size = 96,
  costume = 'classic',
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <radialGradient id={`bg-seuss-${character}`} cx="50%" cy="35%" r="68%">
          {character === 'lucky' && (
            <>
              <stop offset="0%" stopColor="#d8f5ff" />
              <stop offset="100%" stopColor="#6fd3f7" />
            </>
          )}
          {character === 'jujuba' && (
            <>
              <stop offset="0%" stopColor="#fff7c2" />
              <stop offset="100%" stopColor="#ff9ebb" />
            </>
          )}
          {character === 'lully' && (
            <>
              <stop offset="0%" stopColor="#fff0f5" />
              <stop offset="100%" stopColor="#e278b8" />
            </>
          )}
          {character === 'paulo' && (
            <>
              <stop offset="0%" stopColor="#fff8eb" />
              <stop offset="100%" stopColor="#86db58" />
            </>
          )}
          {character === 'lula' && (
            <>
              <stop offset="0%" stopColor="#ead6ff" />
              <stop offset="100%" stopColor="#9f7aea" />
            </>
          )}
          {character === 'pinhao' && (
            <>
              <stop offset="0%" stopColor="#fff5cc" />
              <stop offset="100%" stopColor="#f5b922" />
            </>
          )}
        </radialGradient>
      </defs>

      {/* Hand-inked Storybook Medallion Frame */}
      <circle cx="70" cy="70" r="65" fill={`url(#bg-seuss-${character})`} stroke="#221b18" strokeWidth="4.5" />
      <circle cx="70" cy="70" r="59" fill="none" stroke="#fff9eb" strokeWidth="2.5" strokeDasharray="7 5" />

      {/* LUCKY BOY: Chubby all-white Shih Tzu with red scarf */}
      {character === 'lucky' && (
        <g>
          <ellipse cx="70" cy="112" rx="34" ry="24" fill="#ffffff" stroke="#221b18" strokeWidth="3.2" />
          {costume === 'spfc' && (
            <g>
              <path d="M40 104 Q70 96 100 104 L98 124 Q70 132 42 124 Z" fill="#ffffff" stroke="#221b18" strokeWidth="2.4" />
              <rect x="42" y="108" width="56" height="5" fill="#d92626" />
              <rect x="42" y="116" width="56" height="5" fill="#181818" />
              <polygon points="70,107 78,107 74,117" fill="#d92626" stroke="#111" strokeWidth="1.5" />
            </g>
          )}
          <ellipse cx="34" cy="72" rx="16" ry="26" transform="rotate(14 34 72)" fill="#fffef9" stroke="#221b18" strokeWidth="3.2" />
          <ellipse cx="106" cy="72" rx="16" ry="26" transform="rotate(-14 106 72)" fill="#fffef9" stroke="#221b18" strokeWidth="3.2" />
          <path
            d="M36 66 C34 40, 54 29, 70 30 C86 29, 106 40, 104 66 C106 86, 90 98, 70 98 C50 98, 34 86, 36 66 Z"
            fill="#ffffff"
            stroke="#221b18"
            strokeWidth="3.2"
          />
          <path d="M58 32 Q70 16 82 32" fill="#ffffff" stroke="#221b18" strokeWidth="3" />
          <circle cx="54" cy="64" r="8.2" fill="#221b18" />
          <circle cx="86" cy="64" r="8.2" fill="#221b18" />
          <circle cx="56.5" cy="61" r="3" fill="#ffffff" />
          <circle cx="88.5" cy="61" r="3" fill="#ffffff" />
          <ellipse cx="44" cy="74" rx="6" ry="3.5" fill="#ff9ebb" opacity="0.8" />
          <ellipse cx="96" cy="74" rx="6" ry="3.5" fill="#ff9ebb" opacity="0.8" />
          <ellipse cx="70" cy="73" rx="6" ry="4.5" fill="#221b18" />
          <path d="M62 80 Q70 86 78 80" fill="none" stroke="#221b18" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M66 82 Q70 93 74 82" fill="#f46d75" stroke="#221b18" strokeWidth="2" />
          {/* Striped Seuss Red & Cream Scarf */}
          <path d="M40 92 Q70 105 100 92 L103 103 Q70 116 37 103 Z" fill="#d92626" stroke="#221b18" strokeWidth="2.8" />
          <path d="M84 98 L95 122 L81 124 L74 102 Z" fill="#d92626" stroke="#221b18" strokeWidth="2.6" />
          <line x1="52" y1="97" x2="54" y2="106" stroke="#fff9eb" strokeWidth="3" />
          <line x1="70" y1="100" x2="70" y2="109" stroke="#fff9eb" strokeWidth="3" />

          {costume === 'santa' && (
            <g>
              <path d="M42 40 Q70 6 102 36 Q74 30 42 40 Z" fill="#d92626" stroke="#221b18" strokeWidth="2.8" />
              <rect x="40" y="34" width="60" height="10" rx="5" fill="#fff" stroke="#221b18" strokeWidth="2.5" />
              <circle cx="102" cy="34" r="7" fill="#fff" stroke="#221b18" strokeWidth="2.5" />
            </g>
          )}
          {costume === 'pilot' && (
            <g>
              <rect x="42" y="38" width="56" height="10" rx="4" fill="#6f4e37" stroke="#221b18" strokeWidth="2.4" />
              <circle cx="56" cy="43" r="9" fill="#a8e6ff" stroke="#d99316" strokeWidth="3" />
              <circle cx="84" cy="43" r="9" fill="#a8e6ff" stroke="#d99316" strokeWidth="3" />
            </g>
          )}
          {costume === 'diver' && (
            <circle cx="70" cy="66" r="46" fill="rgba(168,230,255,0.28)" stroke="#221b18" strokeWidth="3" />
          )}
          {costume === 'starlight' && (
            <polygon points="70,12 75,24 88,24 77,31 81,43 70,35 59,43 63,31 52,24 65,24" fill="#ffe055" stroke="#221b18" strokeWidth="2.4" />
          )}
        </g>
      )}

      {/* PRINCESA JUJUBA: Cheerful Golden-Blonde Princess */}
      {character === 'jujuba' && (
        <g>
          <path d="M32 62 C26 95, 36 122, 48 128 L92 128 C104 122, 114 95, 108 62 C104 30, 36 30, 32 62 Z" fill="#ffe055" stroke="#221b18" strokeWidth="3" />
          <path d="M36 126 Q70 98 104 126 L108 138 L32 138 Z" fill="#e24b78" stroke="#221b18" strokeWidth="3" />
          <path d="M44 114 Q70 124 96 114" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
          <circle cx="70" cy="118" r="5" fill="#ffd447" stroke="#221b18" strokeWidth="2" />
          <rect x="63" y="92" width="14" height="16" fill="#ffe0bd" />
          <ellipse cx="70" cy="68" rx="25" ry="28" fill="#ffe7c8" stroke="#221b18" strokeWidth="3" />
          <path d="M43 60 Q56 36 78 42 Q96 46 97 64 Q86 48 72 52 Q56 54 43 60 Z" fill="#ffeb75" stroke="#221b18" strokeWidth="2.6" />
          <path d="M50 42 L58 30 L70 36 L82 30 L90 42 Z" fill="#ffd447" stroke="#221b18" strokeWidth="2.5" />
          <polygon points="70,18 73,27 82,27 75,32 78,40 70,35 62,40 65,32 58,27 67,27" fill="#fff7b0" stroke="#221b18" strokeWidth="1.8" />
          <circle cx="60" cy="68" r="4.5" fill="#221b18" />
          <circle cx="80" cy="68" r="4.5" fill="#221b18" />
          <circle cx="61.5" cy="66.5" r="1.6" fill="#ffffff" />
          <circle cx="81.5" cy="66.5" r="1.6" fill="#ffffff" />
          <ellipse cx="52" cy="76" rx="5" ry="3" fill="#ff8fab" opacity="0.7" />
          <ellipse cx="88" cy="76" rx="5" ry="3" fill="#ff8fab" opacity="0.7" />
          <path d="M62 82 Q70 89 78 82" fill="none" stroke="#c9184a" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {/* LULLY: Adorable, fluffy black-and-white Shih Tzu with eyelashes, rosy cheeks & lush bow */}
      {character === 'lully' && (
        <g>
          {/* Fluffy white body with soft black saddle patch */}
          <ellipse cx="70" cy="113" rx="31" ry="22" fill="#ffffff" stroke="#221b18" strokeWidth="3.2" />
          <ellipse cx="86" cy="113" rx="12" ry="10" fill="#231f26" />
          {/* Cute fluffy front paws */}
          <ellipse cx="54" cy="126" rx="8" ry="5.5" fill="#ffffff" stroke="#221b18" strokeWidth="2.4" />
          <ellipse cx="86" cy="126" rx="8" ry="5.5" fill="#ffffff" stroke="#221b18" strokeWidth="2.4" />
          {/* Long silky black fluffy Shih Tzu ears with soft sheen */}
          <path d="M22 68 C19 46, 36 40, 46 58 C48 80, 42 98, 28 96 C20 94, 21 80, 22 68 Z" fill="#231f26" stroke="#111" strokeWidth="3" />
          <path d="M118 68 C121 46, 104 40, 94 58 C92 80, 98 98, 112 96 C120 94, 119 80, 118 68 Z" fill="#231f26" stroke="#111" strokeWidth="3" />
          <path d="M28 64 Q30 78 27 88" stroke="rgba(255,255,255,0.22)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M112 64 Q110 78 113 88" stroke="rgba(255,255,255,0.22)" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Fluffy round Shih Tzu face with cheek tufts */}
          <path
            d="M36 66 C34 40, 54 30, 70 31 C86 30, 106 40, 104 66 C108 82, 94 98, 70 98 C46 98, 32 82, 36 66 Z"
            fill="#ffffff"
            stroke="#221b18"
            strokeWidth="3.2"
          />
          {/* Charming soft black eye-patch */}
          <ellipse cx="53" cy="62" rx="15" ry="13.5" fill="#231f26" />
          {/* Big sparkling eyes with eyelashes */}
          <circle cx="53" cy="63" r="7" fill="#141118" stroke="#ffffff" strokeWidth="1.6" />
          <circle cx="87" cy="63" r="7.5" fill="#221b18" />
          <circle cx="55.2" cy="60" r="2.7" fill="#ffffff" />
          <circle cx="51.5" cy="65.5" r="1.3" fill="#ffffff" />
          <circle cx="89.2" cy="60" r="2.8" fill="#ffffff" />
          <circle cx="85.5" cy="65.5" r="1.3" fill="#ffffff" />
          {/* Delicate cute eyelashes */}
          <path d="M44 57 L40 53 M95 57 L100 53 M97 61 L102 59" stroke="#221b18" strokeWidth="2.4" strokeLinecap="round" />
          {/* Sweet rosy cheeks */}
          <ellipse cx="44" cy="76" rx="6" ry="3.6" fill="#ff8fab" opacity="0.78" />
          <ellipse cx="96" cy="76" rx="6" ry="3.6" fill="#ff8fab" opacity="0.78" />
          {/* Tiny shiny heart nose & happy smile */}
          <ellipse cx="70" cy="73" rx="5.5" ry="4" fill="#221b18" />
          <circle cx="71.5" cy="71.8" r="1.2" fill="#ffffff" />
          <path d="M62 80 Q70 87 78 80" fill="none" stroke="#221b18" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M66.5 82 Q70 90 73.5 82" fill="#ff758f" stroke="#221b18" strokeWidth="1.8" />
          {/* Lush layered Christmas bow on top of head */}
          <path d="M70 32 C54 14, 42 22, 52 38 Z" fill="#e63946" stroke="#221b18" strokeWidth="2.5" />
          <path d="M70 32 C86 14, 98 22, 88 38 Z" fill="#e63946" stroke="#221b18" strokeWidth="2.5" />
          <path d="M64 34 L57 44 M76 34 L83 44" stroke="#d92626" strokeWidth="4" strokeLinecap="round" />
          <circle cx="70" cy="31" r="6" fill="#ff6b81" stroke="#221b18" strokeWidth="2.3" />
          {/* Festive green velvet collar with golden jingle bell */}
          <path d="M44 93 Q70 104 96 93" fill="none" stroke="#4ea83b" strokeWidth="6.5" strokeLinecap="round" />
          <circle cx="70" cy="103" r="6.5" fill="#ffe055" stroke="#221b18" strokeWidth="2.2" />
          <line x1="66.5" y1="104" x2="73.5" y2="104" stroke="#8c5807" strokeWidth="1.8" />
        </g>
      )}

      {/* PAULO (SPFC) */}
      {character === 'paulo' && (
        <g>
          <path d="M28 128 Q35 96 70 96 Q105 96 112 128 L112 138 L28 138 Z" fill="#ffffff" stroke="#221b18" strokeWidth="3" />
          <rect x="33" y="109" width="74" height="7" fill="#d92626" />
          <rect x="31" y="119" width="78" height="7" fill="#141414" />
          <polygon points="70,104 82,104 82,113 70,126 58,113 58,104" fill="#111111" stroke="#ffffff" strokeWidth="2" />
          <rect x="60" y="106" width="20" height="5" fill="#111111" />
          <polygon points="60,113 69,113 69,122" fill="#d92626" />
          <polygon points="80,113 71,113 71,122" fill="#111111" />
          <text x="70" y="110.5" fontSize="5.2" fontWeight="900" fill="#ffffff" textAnchor="middle">SPFC</text>
          <rect x="61" y="83" width="18" height="16" fill="#f5cda7" stroke="#221b18" strokeWidth="2.5" />
          <ellipse cx="70" cy="60" rx="26" ry="28" fill="#fbd8b6" stroke="#221b18" strokeWidth="3" />
          <circle cx="43" cy="62" r="5.5" fill="#f5cda7" stroke="#221b18" strokeWidth="2.5" />
          <circle cx="97" cy="62" r="5.5" fill="#f5cda7" stroke="#221b18" strokeWidth="2.5" />
          <path d="M43 54 C42 28, 98 26, 97 54 C90 42, 76 40, 62 42 C52 44, 47 48, 43 54 Z" fill="#4a3222" stroke="#221b18" strokeWidth="2.8" />
          <path d="M53 52 Q59 48 65 52" fill="none" stroke="#4a3222" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M75 52 Q81 48 87 52" fill="none" stroke="#4a3222" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="59" cy="60" r="4" fill="#221b18" />
          <circle cx="81" cy="60" r="4" fill="#221b18" />
          <circle cx="60.5" cy="58.5" r="1.5" fill="#fff" />
          <circle cx="82.5" cy="58.5" r="1.5" fill="#fff" />
          <path d="M57 73 Q70 84 83 73 Z" fill="#ffffff" stroke="#221b18" strokeWidth="2.5" />
        </g>
      )}

      {/* LULA: Whimsical Seuss / Grinch-like Grumpy Cartoon Villain */}
      {character === 'lula' && (
        <g>
          <path d="M26 132 L40 94 L70 105 L100 94 L114 132 Z" fill="#6b2fa0" stroke="#221b18" strokeWidth="3.2" />
          <path d="M40 94 L56 114 L46 122 L34 104 Z" fill="#b38cd9" stroke="#221b18" strokeWidth="2.5" />
          <path d="M100 94 L84 114 L94 122 L106 104 Z" fill="#b38cd9" stroke="#221b18" strokeWidth="2.5" />
          <path
            d="M42 66 C38 36, 56 26, 70 28 C84 26, 102 36, 98 66 C98 86, 86 98, 70 98 C54 98, 42 86, 42 66 Z"
            fill="#c38ef5"
            stroke="#221b18"
            strokeWidth="3.2"
          />
          {/* Wild Thing-1 / Seuss spiky hair tufts */}
          <path d="M46 34 Q54 14 66 28 Q74 10 84 28 Q94 14 96 36" fill="none" stroke="#4c1d95" strokeWidth="5" strokeLinecap="round" />
          <rect x="42" y="37" width="56" height="9" rx="4" fill="#4c1d95" stroke="#221b18" strokeWidth="2.4" />
          <circle cx="56" cy="41" r="8.5" fill="#ffe055" stroke="#8c5807" strokeWidth="3" />
          <circle cx="84" cy="41" r="8.5" fill="#ffe055" stroke="#8c5807" strokeWidth="3" />
          <path d="M48 54 L66 61" stroke="#221b18" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M92 54 L74 61" stroke="#221b18" strokeWidth="4.5" strokeLinecap="round" />
          <ellipse cx="57" cy="65" rx="5.5" ry="4.5" fill="#ffe55c" stroke="#221b18" strokeWidth="2" />
          <ellipse cx="83" cy="65" rx="5.5" ry="4.5" fill="#ffe55c" stroke="#221b18" strokeWidth="2" />
          <circle cx="57" cy="65" r="2.2" fill="#221b18" />
          <circle cx="83" cy="65" r="2.2" fill="#221b18" />
          <path d="M54 83 Q70 75 86 83" fill="none" stroke="#221b18" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}

      {/* PROFESSOR PINHÃO */}
      {character === 'pinhao' && (
        <g>
          <ellipse cx="70" cy="108" rx="34" ry="26" fill="#a46a47" stroke="#221b18" strokeWidth="3" />
          <ellipse cx="70" cy="112" rx="20" ry="18" fill="#ffe599" stroke="#221b18" strokeWidth="2.5" />
          <circle cx="70" cy="68" r="29" fill="#c07e52" stroke="#221b18" strokeWidth="3" />
          <circle cx="56" cy="67" r="13" fill="#fff9eb" stroke="#d99316" strokeWidth="3.5" />
          <circle cx="84" cy="67" r="13" fill="#fff9eb" stroke="#d99316" strokeWidth="3.5" />
          <line x1="69" y1="67" x2="71" y2="67" stroke="#221b18" strokeWidth="3" />
          <circle cx="56" cy="67" r="5" fill="#221b18" />
          <circle cx="84" cy="67" r="5" fill="#221b18" />
          <circle cx="58" cy="65" r="2" fill="#fff" />
          <circle cx="86" cy="65" r="2" fill="#fff" />
          <polygon points="70,74 63,83 77,83" fill="#ff9f1c" stroke="#221b18" strokeWidth="2.4" />
          {/* Striped Seuss Top Hat! */}
          <path d="M40 46 Q70 38 100 46 L94 49 Q70 43 46 49 Z" fill="#d92626" stroke="#221b18" strokeWidth="2.5" />
          <path d="M50 43 L56 14 L88 18 L86 43 Z" fill="#ffffff" stroke="#221b18" strokeWidth="2.8" />
          <rect x="52" y="24" width="35" height="6" fill="#d92626" />
          <rect x="52" y="35" width="35" height="6" fill="#d92626" />
        </g>
      )}
    </svg>
  );
};
