export type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type LevelMode = 'platform' | 'kart' | 'plane' | 'water' | 'boss3d';

export type ControlMode = 'platform' | 'kart' | 'plane' | 'water';

export type CharacterId = 'lucky' | 'jujuba' | 'lula' | 'paulo' | 'lully' | 'pinhao';

export type PowerUpType =
  | 'golden_bone'
  | 'spicy_treat'
  | 'frost_biscuit'
  | 'spring_paws'
  | 'bubble_shield'
  | 'super_bark';

export type PermanentSkill = 'roll' | 'double_jump' | 'belly_flop' | 'secret_sniff';

export type CostumeId = 'classic' | 'santa' | 'spfc' | 'diver' | 'pilot' | 'starlight';

export interface DialogueLine {
  speaker: CharacterId;
  speakerName: string;
  text: string;
  mood?: 'happy' | 'excited' | 'worried' | 'grumpy' | 'touched';
}

export interface LevelMeta {
  id: LevelId;
  title: string;
  subtitle: string;
  tag: string;
  mode: LevelMode;
  controlMode: ControlMode;
  description: string;
  themeColor: string;
  accentColor: string;
  mapPos: { x: number; y: number };
  allyAppearance?: CharacterId[];
  miniBossName?: string;
  unlocksSkill?: PermanentSkill;
  unlocksCostume?: CostumeId;
  musicTrack: MusicTrack;
}

export type MusicTrack =
  | 'menu'
  | 'adventure'
  | 'forest'
  | 'kart'
  | 'factory'
  | 'water'
  | 'sky'
  | 'spooky'
  | 'snow'
  | 'village'
  | 'boss'
  | 'victory';

export interface LevelProgress {
  completed: boolean;
  stars: number;
  goldenPaws: [boolean, boolean, boolean];
  bestTreats: number;
  bestTimeSec: number;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  showTouchControls: 'always' | 'auto' | 'hidden';
  unlockAllMode: boolean;
}

export interface SaveData {
  version: number;
  lastPlayedAt: string;
  completedLevels: LevelId[];
  levelStats: Record<number, LevelProgress>;
  totalTreats: number;
  treatsBank: number;
  lives: number;
  unlockedSkills: PermanentSkill[];
  unlockedCostumes: CostumeId[];
  equippedCostume: CostumeId;
  selectedLevel: LevelId;
  gameCompleted: boolean;
  settings: GameSettings;
}

export interface LevelCompletionResult {
  levelId: LevelId;
  won: boolean;
  treatsCollected: number;
  goldenPaws: [boolean, boolean, boolean];
  timeSec: number;
  heartsRemaining: number;
  starsEarned: number;
  extraNote?: string;
}

export interface HudSnapshot {
  hearts: number;
  maxHearts: number;
  treats: number;
  lives: number;
  goldenPaws: [boolean, boolean, boolean];
  activePower: PowerUpType | null;
  powerTimer: number;
  hasShield: boolean;
  progressLabel?: string;
  bossName?: string;
  bossHp?: number;
  bossMaxHp?: number;
  bossStageLabel?: string;
  specialPrompt?: string;
  bannerText?: string;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  axisX: number;
  axisY: number;
  a: boolean;
  b: boolean;
  x: boolean;
  y: boolean;
  pause: boolean;
  aJustPressed: boolean;
  bJustPressed: boolean;
  xJustPressed: boolean;
  yJustPressed: boolean;
  pauseJustPressed: boolean;
}

export const POWERUP_INFO: Record<
  PowerUpType,
  { name: string; emoji: string; color: string; desc: string; duration: number }
> = {
  golden_bone: {
    name: 'Osso Dourado',
    emoji: '🦴',
    color: '#ffe055',
    desc: 'Invencibilidade brilhante por 10s!',
    duration: 10,
  },
  spicy_treat: {
    name: 'Petisco Apimentado',
    emoji: '🌶️',
    color: '#f24242',
    desc: 'Dispara bolas de fogo com Y ou B!',
    duration: 14,
  },
  frost_biscuit: {
    name: 'Biscoito Congelante',
    emoji: '❄️',
    color: '#6fd3f7',
    desc: 'Congela inimigos e obstáculos próximos!',
    duration: 12,
  },
  spring_paws: {
    name: 'Patinhas de Mola',
    emoji: '🐾',
    color: '#86db58',
    desc: 'Super pulo elástico por 14s!',
    duration: 14,
  },
  bubble_shield: {
    name: 'Bolha Protetora',
    emoji: '🫧',
    color: '#e47bb8',
    desc: 'Absorve 1 dano sem perder coração!',
    duration: 999,
  },
  super_bark: {
    name: 'Superlatido',
    emoji: '📢',
    color: '#ff9f43',
    desc: 'Onda sonora gigante que afasta inimigos e revela segredos!',
    duration: 12,
  },
};

export const COSTUME_INFO: Record<
  CostumeId,
  { name: string; desc: string; unlockHint: string; badge: string }
> = {
  classic: {
    name: 'Cachecol Clássico',
    desc: 'O icônico cachecol vermelho natalino do Lucky Boy.',
    unlockHint: 'Desbloqueado desde o início',
    badge: '🧣',
  },
  spfc: {
    name: 'Manto Tricolor (Paulo)',
    desc: 'Camisa tricolor presenteada pelo amigo Paulo!',
    unlockHint: 'Conclua a Fase 01 ou colete 50 petiscos',
    badge: '⚽',
  },
  santa: {
    name: 'Lucky Papai Noel',
    desc: 'Gorrinho vermelho com pompom branco natalino!',
    unlockHint: 'Recupere 3 Fragmentos da Estrela',
    badge: '🎅',
  },
  diver: {
    name: 'Escafandro Bolha',
    desc: 'Capacete fofo de mergulhador de Jubalândia.',
    unlockHint: 'Conclua a Fase 05 (Oceano)',
    badge: '🤿',
  },
  pilot: {
    name: 'Ases dos Céus',
    desc: 'Óculos de aviador e lenço voador do Professor Pinhão.',
    unlockHint: 'Conclua a Fase 06 (Avião 3D)',
    badge: '✈️',
  },
  starlight: {
    name: 'Herói da Estrela',
    desc: 'Brilho dourado de quem salvou o Natal e a Princesa Jujuba!',
    unlockHint: 'Derrote Lula na Fase 12',
    badge: '⭐',
  },
};
