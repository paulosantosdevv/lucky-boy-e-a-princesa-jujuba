import { CharacterId, LevelId, PowerUpType } from '../../types/game';

export type PlatformKind =
  | 'normal'
  | 'bounce'
  | 'moving'
  | 'conveyor'
  | 'ice'
  | 'crumble'
  | 'ghost'
  | 'hazard';

export interface PlatformDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: PlatformKind;
  moveAxis?: 'x' | 'y';
  moveRange?: number;
  moveSpeed?: number;
  conveyorDir?: number; // -1 or 1
  label?: string;
}

export type EnemyKind =
  | 'grump_slime'
  | 'chomper'
  | 'candy_bot'
  | 'jellyfish'
  | 'ghost_goof'
  | 'living_chair'
  | 'snowball_roller'
  | 'grinch_elf';

export interface EnemyDef {
  id: string;
  x: number;
  y: number;
  kind: EnemyKind;
  patrolMin: number;
  patrolMax: number;
  speed: number;
}

export interface TreatDef {
  x: number;
  y: number;
}

export interface PowerUpSpawn {
  id: string;
  x: number;
  y: number;
  type: PowerUpType;
}

export interface AllyNpcDef {
  character: CharacterId;
  x: number;
  y: number;
  message: string;
}

export interface ChristmasTreeSwitch {
  id: string;
  x: number;
  y: number;
}

export interface MiniBossDef {
  name: string;
  kind: 'mushroom' | 'baker_bot' | 'octopus' | 'snowman';
  x: number;
  y: number;
  hp: number;
}

export interface Level2DBlueprint {
  levelId: LevelId;
  worldWidth: number;
  worldHeight: number;
  isWater?: boolean;
  is25D?: boolean;
  snowIntensity: number; // 0..1
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  hillColor1: string;
  hillColor2: string;
  platformFill: string;
  platformTop: string;
  spawn: { x: number; y: number };
  checkpoint: { x: number; y: number };
  goal: { x: number; y: number };
  platforms: PlatformDef[];
  enemies: EnemyDef[];
  treats: TreatDef[];
  goldenPaws: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }];
  powerUps: PowerUpSpawn[];
  allies: AllyNpcDef[];
  miniBoss?: MiniBossDef;
  treeSwitches?: ChristmasTreeSwitch[];
}

function makeTreatArc(startX: number, y: number, count: number, spacing = 46, arch = 24): TreatDef[] {
  const out: TreatDef[] = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0.5;
    const dy = -Math.sin(t * Math.PI) * arch;
    out.push({ x: startX + i * spacing, y: y + dy });
  }
  return out;
}

export function build2DLevel(levelId: LevelId): Level2DBlueprint {
  switch (levelId) {
    // =========================================================================
    // FASE 01 · AS COLINAS DE JUBALÂNDIA (Plataforma 2D + Paulo SPFC + Cogumelo)
    // =========================================================================
    case 1:
      return {
        levelId: 1,
        worldWidth: 3800,
        worldHeight: 720,
        snowIntensity: 0.2,
        skyTop: '#231942',
        skyMid: '#4ea8de',
        skyBottom: '#bde0fe',
        hillColor1: '#2a9d8f',
        hillColor2: '#52b788',
        platformFill: '#7f4f24',
        platformTop: '#52b788',
        spawn: { x: 90, y: 500 },
        checkpoint: { x: 1850, y: 500 },
        goal: { x: 3600, y: 490 },
        platforms: [
          { id: 'g1', x: 0, y: 580, w: 680, h: 160, kind: 'normal' },
          { id: 'p1', x: 320, y: 470, w: 150, h: 28, kind: 'normal' },
          { id: 'mush1', x: 540, y: 540, w: 72, h: 40, kind: 'bounce' },
          { id: 'p2', x: 640, y: 375, w: 170, h: 28, kind: 'normal' },
          { id: 'g2', x: 800, y: 580, w: 620, h: 160, kind: 'normal' },
          { id: 'p3', x: 960, y: 465, w: 150, h: 28, kind: 'normal' },
          { id: 'p4', x: 1180, y: 380, w: 160, h: 28, kind: 'normal' },
          { id: 'g3', x: 1550, y: 580, w: 650, h: 160, kind: 'normal' },
          { id: 'mush2', x: 1680, y: 540, w: 72, h: 40, kind: 'bounce' },
          { id: 'p5', x: 1750, y: 320, w: 170, h: 28, kind: 'normal' },
          { id: 'p6', x: 2290, y: 490, w: 160, h: 28, kind: 'moving', moveAxis: 'y', moveRange: 80, moveSpeed: 1.7 },
          { id: 'g4', x: 2540, y: 580, w: 1260, h: 160, kind: 'normal' },
          { id: 'p7', x: 2680, y: 455, w: 160, h: 28, kind: 'normal' },
          { id: 'mush3', x: 2950, y: 540, w: 72, h: 40, kind: 'bounce' },
        ],
        enemies: [
          { id: 'e1', x: 420, y: 540, kind: 'grump_slime', patrolMin: 260, patrolMax: 520, speed: 75 },
          { id: 'e2', x: 1020, y: 540, kind: 'grump_slime', patrolMin: 860, patrolMax: 1320, speed: 90 },
          { id: 'e3', x: 1240, y: 340, kind: 'grinch_elf', patrolMin: 1190, patrolMax: 1320, speed: 65 },
          { id: 'e4', x: 2020, y: 540, kind: 'grump_slime', patrolMin: 1890, patrolMax: 2150, speed: 95 },
          { id: 'e5', x: 2740, y: 415, kind: 'grinch_elf', patrolMin: 2690, patrolMax: 2820, speed: 70 },
        ],
        treats: [
          ...makeTreatArc(280, 420, 5),
          ...makeTreatArc(860, 520, 6),
          ...makeTreatArc(1190, 325, 4),
          ...makeTreatArc(1640, 450, 5),
          ...makeTreatArc(2260, 400, 4),
          ...makeTreatArc(2650, 395, 5),
        ],
        goldenPaws: [
          { x: 720, y: 325 },
          { x: 1835, y: 260 },
          { x: 2760, y: 390 },
        ],
        powerUps: [
          { id: 'pu1', x: 395, y: 425, type: 'bubble_shield' },
          { id: 'pu2', x: 1260, y: 335, type: 'spicy_treat' },
          { id: 'pu3', x: 2730, y: 530, type: 'golden_bone' },
        ],
        allies: [
          {
            character: 'paulo',
            x: 210,
            y: 580,
            message: 'Vai Lucky! Pule nos inimigos ou use B para latir! #SPFC',
          },
          {
            character: 'paulo',
            x: 2610,
            y: 580,
            message: 'Atenção! O Cogumelo Espirrão tá logo ali na frente!',
          },
        ],
        miniBoss: {
          name: 'Cogumelo Gigante Espirrão',
          kind: 'mushroom',
          x: 3300,
          y: 580,
          hp: 5,
        },
      };

    // =========================================================================
    // FASE 02 · A FLORESTA DOS TRAMBOLHOS (Pulo Duplo + Lully + Plantas)
    // =========================================================================
    case 2:
      return {
        levelId: 2,
        worldWidth: 4000,
        worldHeight: 720,
        snowIntensity: 0.25,
        skyTop: '#132a13',
        skyMid: '#31572c',
        skyBottom: '#90a955',
        hillColor1: '#1b4332',
        hillColor2: '#2d6a4f',
        platformFill: '#582f0e',
        platformTop: '#70e000',
        spawn: { x: 80, y: 500 },
        checkpoint: { x: 2040, y: 480 },
        goal: { x: 3820, y: 460 },
        platforms: [
          { id: 'g1', x: 0, y: 580, w: 620, h: 160, kind: 'normal' },
          { id: 'm1', x: 680, y: 500, w: 150, h: 28, kind: 'moving', moveAxis: 'y', moveRange: 95, moveSpeed: 1.9 },
          { id: 'p1', x: 900, y: 420, w: 180, h: 28, kind: 'normal' },
          { id: 'p_sec1', x: 920, y: 245, w: 150, h: 24, kind: 'normal' },
          { id: 'g2', x: 1120, y: 580, w: 720, h: 160, kind: 'normal' },
          { id: 'p2', x: 1320, y: 455, w: 150, h: 28, kind: 'normal' },
          { id: 'm2', x: 1560, y: 375, w: 160, h: 28, kind: 'moving', moveAxis: 'x', moveRange: 110, moveSpeed: 1.8 },
          { id: 'g3', x: 1960, y: 560, w: 580, h: 180, kind: 'normal' },
          { id: 'b1', x: 2180, y: 520, w: 74, h: 40, kind: 'bounce' },
          { id: 'p_sec2', x: 2150, y: 270, w: 170, h: 24, kind: 'normal' },
          { id: 'm3', x: 2630, y: 480, w: 150, h: 28, kind: 'moving', moveAxis: 'x', moveRange: 100, moveSpeed: 2.1 },
          { id: 'p3', x: 2920, y: 420, w: 180, h: 28, kind: 'normal' },
          { id: 'm4', x: 3180, y: 360, w: 150, h: 28, kind: 'moving', moveAxis: 'y', moveRange: 90, moveSpeed: 2.2 },
          { id: 'g4', x: 3420, y: 540, w: 580, h: 200, kind: 'normal' },
        ],
        enemies: [
          { id: 'e1', x: 420, y: 540, kind: 'chomper', patrolMin: 350, patrolMax: 560, speed: 60 },
          { id: 'e2', x: 1240, y: 540, kind: 'chomper', patrolMin: 1160, patrolMax: 1480, speed: 75 },
          { id: 'e3', x: 1650, y: 540, kind: 'grump_slime', patrolMin: 1500, patrolMax: 1790, speed: 105 },
          { id: 'e4', x: 2340, y: 520, kind: 'chomper', patrolMin: 2240, patrolMax: 2480, speed: 80 },
          { id: 'e5', x: 3000, y: 380, kind: 'grinch_elf', patrolMin: 2940, patrolMax: 3080, speed: 75 },
          { id: 'e6', x: 3580, y: 500, kind: 'chomper', patrolMin: 3460, patrolMax: 3720, speed: 90 },
        ],
        treats: [
          ...makeTreatArc(260, 510, 5),
          ...makeTreatArc(910, 365, 4),
          ...makeTreatArc(1330, 395, 5),
          ...makeTreatArc(2020, 480, 5),
          ...makeTreatArc(2920, 360, 4),
          ...makeTreatArc(3480, 465, 5),
        ],
        goldenPaws: [
          { x: 995, y: 195 },
          { x: 2235, y: 215 },
          { x: 3255, y: 240 },
        ],
        powerUps: [
          { id: 'pu1', x: 310, y: 530, type: 'spring_paws' },
          { id: 'pu2', x: 1400, y: 410, type: 'super_bark' },
          { id: 'pu3', x: 2440, y: 510, type: 'bubble_shield' },
        ],
        allies: [
          {
            character: 'lully',
            x: 190,
            y: 580,
            message: 'Au-au! Aperte A 2x para PULO DUPLO e BAIXO+B no ar para BARRIGADA!',
          },
          {
            character: 'lully',
            x: 2010,
            y: 560,
            message: 'Tem uma Patinha Dourada escondida bem lá em cima!',
          },
        ],
      };

    // =========================================================================
    // FASE 04 · A FÁBRICA DE GULOSEIMAS MALUCAS (2.5D + Esteiras + Robô Confeiteiro)
    // =========================================================================
    case 4:
      return {
        levelId: 4,
        worldWidth: 4200,
        worldHeight: 720,
        is25D: true,
        snowIntensity: 0.15,
        skyTop: '#240046',
        skyMid: '#5a189a',
        skyBottom: '#ff9e00',
        hillColor1: '#3c096c',
        hillColor2: '#7b2cbf',
        platformFill: '#6c2bd9',
        platformTop: '#ff9f1c',
        spawn: { x: 80, y: 500 },
        checkpoint: { x: 2060, y: 490 },
        goal: { x: 4010, y: 490 },
        platforms: [
          { id: 'g1', x: 0, y: 580, w: 620, h: 160, kind: 'normal' },
          { id: 'c1', x: 680, y: 540, w: 280, h: 34, kind: 'conveyor', conveyorDir: 1 },
          { id: 'p1', x: 1020, y: 445, w: 180, h: 30, kind: 'normal' },
          { id: 'choc1', x: 640, y: 650, w: 800, h: 70, kind: 'hazard', label: 'CHOCOLATE' },
          { id: 'c2', x: 1260, y: 520, w: 260, h: 34, kind: 'conveyor', conveyorDir: -1 },
          { id: 'g2', x: 1580, y: 580, w: 680, h: 160, kind: 'normal' },
          { id: 'press1', x: 1750, y: 410, w: 120, h: 36, kind: 'moving', moveAxis: 'y', moveRange: 100, moveSpeed: 2.5 },
          { id: 'p_hi', x: 1920, y: 295, w: 160, h: 26, kind: 'normal' },
          { id: 'c3', x: 2340, y: 520, w: 260, h: 34, kind: 'conveyor', conveyorDir: 1 },
          { id: 'm1', x: 2680, y: 430, w: 160, h: 30, kind: 'moving', moveAxis: 'x', moveRange: 110, moveSpeed: 2.2 },
          { id: 'g3', x: 2940, y: 580, w: 1260, h: 160, kind: 'normal' },
          { id: 'p2', x: 3150, y: 440, w: 160, h: 28, kind: 'normal' },
        ],
        enemies: [
          { id: 'e1', x: 400, y: 540, kind: 'candy_bot', patrolMin: 260, patrolMax: 560, speed: 95 },
          { id: 'e2', x: 1080, y: 405, kind: 'candy_bot', patrolMin: 1030, patrolMax: 1180, speed: 70 },
          { id: 'e3', x: 1700, y: 540, kind: 'candy_bot', patrolMin: 1600, patrolMax: 1950, speed: 110 },
          { id: 'e4', x: 2440, y: 480, kind: 'grinch_elf', patrolMin: 2360, patrolMax: 2560, speed: 85 },
          { id: 'e5', x: 3200, y: 400, kind: 'candy_bot', patrolMin: 3160, patrolMax: 3290, speed: 75 },
        ],
        treats: [
          ...makeTreatArc(240, 505, 5),
          ...makeTreatArc(710, 480, 5),
          ...makeTreatArc(1280, 455, 5),
          ...makeTreatArc(1920, 240, 4),
          ...makeTreatArc(2370, 455, 5),
          ...makeTreatArc(3140, 375, 5),
        ],
        goldenPaws: [
          { x: 1110, y: 365 },
          { x: 2000, y: 235 },
          { x: 2760, y: 340 },
        ],
        powerUps: [
          { id: 'pu1', x: 520, y: 530, type: 'frost_biscuit' },
          { id: 'pu2', x: 1650, y: 530, type: 'spicy_treat' },
          { id: 'pu3', x: 3040, y: 530, type: 'bubble_shield' },
        ],
        allies: [
          {
            character: 'paulo',
            x: 190,
            y: 580,
            message: 'Ativei seu FARO SECRETO! Olha a setinha dourada guiando pras patinhas!',
          },
          {
            character: 'paulo',
            x: 2990,
            y: 580,
            message: 'Lá vem o Robô Confeiteiro! Desvie dos cupcakes e mande ver!',
          },
        ],
        miniBoss: {
          name: 'Robô Confeiteiro Maluco',
          kind: 'baker_bot',
          x: 3650,
          y: 580,
          hp: 6,
        },
      };

    // =========================================================================
    // FASE 05 · O OCEANO DAS BOLHAS PERDIDAS (Exploração Aquática 2D + Polvo)
    // =========================================================================
    case 5:
      return {
        levelId: 5,
        worldWidth: 3900,
        worldHeight: 720,
        isWater: true,
        snowIntensity: 0,
        skyTop: '#03045e',
        skyMid: '#0077b6',
        skyBottom: '#00b4d8',
        hillColor1: '#023e8a',
        hillColor2: '#0096c7',
        platformFill: '#5a189a',
        platformTop: '#48cae4',
        spawn: { x: 110, y: 340 },
        checkpoint: { x: 1920, y: 340 },
        goal: { x: 3720, y: 360 },
        platforms: [
          // Sea floor & coral caves
          { id: 'floor1', x: 0, y: 650, w: 3900, h: 90, kind: 'normal' },
          { id: 'reef1', x: 520, y: 420, w: 120, h: 230, kind: 'normal' },
          { id: 'ceil1', x: 860, y: 0, w: 160, h: 260, kind: 'normal' },
          { id: 'reef2', x: 1280, y: 450, w: 160, h: 200, kind: 'normal' },
          { id: 'cave_top', x: 1650, y: 0, w: 460, h: 170, kind: 'normal' },
          { id: 'reef3', x: 2280, y: 390, w: 140, h: 260, kind: 'normal' },
          { id: 'ceil2', x: 2650, y: 0, w: 160, h: 280, kind: 'normal' },
        ],
        enemies: [
          { id: 'e1', x: 420, y: 260, kind: 'jellyfish', patrolMin: 180, patrolMax: 520, speed: 65 },
          { id: 'e2', x: 760, y: 420, kind: 'jellyfish', patrolMin: 240, patrolMax: 560, speed: 78 },
          { id: 'e3', x: 1120, y: 280, kind: 'jellyfish', patrolMin: 160, patrolMax: 520, speed: 85 },
          { id: 'e4', x: 1520, y: 380, kind: 'jellyfish', patrolMin: 200, patrolMax: 560, speed: 75 },
          { id: 'e5', x: 2120, y: 290, kind: 'jellyfish', patrolMin: 170, patrolMax: 540, speed: 90 },
          { id: 'e6', x: 2520, y: 420, kind: 'jellyfish', patrolMin: 220, patrolMax: 560, speed: 95 },
          { id: 'e7', x: 2920, y: 300, kind: 'jellyfish', patrolMin: 180, patrolMax: 540, speed: 85 },
        ],
        treats: [
          ...makeTreatArc(240, 290, 5, 50, 45),
          ...makeTreatArc(680, 350, 5, 50, 50),
          ...makeTreatArc(1180, 260, 5, 50, 35),
          ...makeTreatArc(1740, 430, 6, 52, 40),
          ...makeTreatArc(2420, 280, 5, 50, 40),
          ...makeTreatArc(2920, 460, 5, 50, 35),
        ],
        goldenPaws: [
          { x: 580, y: 210 },
          { x: 1880, y: 585 },
          { x: 2730, y: 560 },
        ],
        powerUps: [
          { id: 'pu1', x: 330, y: 460, type: 'bubble_shield' },
          { id: 'pu2', x: 1420, y: 280, type: 'super_bark' },
          { id: 'pu3', x: 2850, y: 240, type: 'golden_bone' },
        ],
        allies: [
          {
            character: 'pinhao',
            x: 160,
            y: 650,
            message: 'Capacete pronto! Nade com o direcional, A acelera e B dispara bolha sonora!',
          },
          {
            character: 'lully',
            x: 1900,
            y: 650,
            message: 'Cuidado com o Polvo Gigante guardando o 5º Fragmento!',
          },
        ],
        miniBoss: {
          name: 'Polvo Gigante do Tesouro',
          kind: 'octopus',
          x: 3420,
          y: 380,
          hp: 6,
        },
      };

    // =========================================================================
    // FASE 07 · A MANSÃO DOS SUSTINHOS (Plataformas Fantasma + Latido + Lully)
    // =========================================================================
    case 7:
      return {
        levelId: 7,
        worldWidth: 4000,
        worldHeight: 720,
        snowIntensity: 0.3,
        skyTop: '#10002b',
        skyMid: '#240046',
        skyBottom: '#5a189a',
        hillColor1: '#1a0933',
        hillColor2: '#3c096c',
        platformFill: '#3b2c59',
        platformTop: '#c77dff',
        spawn: { x: 90, y: 500 },
        checkpoint: { x: 2050, y: 490 },
        goal: { x: 3820, y: 450 },
        platforms: [
          { id: 'g1', x: 0, y: 580, w: 620, h: 160, kind: 'normal' },
          { id: 'gh1', x: 690, y: 495, w: 165, h: 26, kind: 'ghost' },
          { id: 'gh2', x: 920, y: 420, w: 165, h: 26, kind: 'ghost' },
          { id: 'p1', x: 1150, y: 480, w: 220, h: 30, kind: 'normal' },
          { id: 'gh_sec1', x: 1180, y: 280, w: 160, h: 24, kind: 'ghost' },
          { id: 'g2', x: 1450, y: 580, w: 720, h: 160, kind: 'normal' },
          { id: 'gh3', x: 2250, y: 490, w: 165, h: 26, kind: 'ghost' },
          { id: 'p2', x: 2490, y: 410, w: 190, h: 30, kind: 'normal' },
          { id: 'gh4', x: 2760, y: 340, w: 170, h: 26, kind: 'ghost' },
          { id: 'gh5', x: 3010, y: 440, w: 170, h: 26, kind: 'ghost' },
          { id: 'm1', x: 3250, y: 470, w: 150, h: 28, kind: 'moving', moveAxis: 'y', moveRange: 95, moveSpeed: 2.0 },
          { id: 'g3', x: 3480, y: 540, w: 520, h: 200, kind: 'normal' },
        ],
        enemies: [
          { id: 'e1', x: 430, y: 540, kind: 'living_chair', patrolMin: 300, patrolMax: 570, speed: 85 },
          { id: 'e2', x: 1240, y: 440, kind: 'ghost_goof', patrolMin: 1160, patrolMax: 1350, speed: 80 },
          { id: 'e3', x: 1680, y: 540, kind: 'living_chair', patrolMin: 1500, patrolMax: 1940, speed: 100 },
          { id: 'e4', x: 1900, y: 430, kind: 'ghost_goof', patrolMin: 1600, patrolMax: 2100, speed: 115 },
          { id: 'e5', x: 2560, y: 370, kind: 'ghost_goof', patrolMin: 2490, patrolMax: 2660, speed: 85 },
          { id: 'e6', x: 3640, y: 500, kind: 'living_chair', patrolMin: 3510, patrolMax: 3760, speed: 105 },
        ],
        treats: [
          ...makeTreatArc(250, 505, 5),
          ...makeTreatArc(710, 435, 4),
          ...makeTreatArc(940, 360, 4),
          ...makeTreatArc(1600, 490, 6),
          ...makeTreatArc(2270, 430, 4),
          ...makeTreatArc(2780, 280, 4),
        ],
        goldenPaws: [
          { x: 1260, y: 225 },
          { x: 2845, y: 270 },
          { x: 3325, y: 325 },
        ],
        powerUps: [
          { id: 'pu1', x: 520, y: 530, type: 'super_bark' },
          { id: 'pu2', x: 1780, y: 530, type: 'bubble_shield' },
          { id: 'pu3', x: 2580, y: 365, type: 'spring_paws' },
        ],
        allies: [
          {
            character: 'lully',
            x: 210,
            y: 580,
            message: 'LATE com o botão B! Seu latido revela as plataformas fantasma invisíveis!',
          },
          {
            character: 'lully',
            x: 2010,
            y: 580,
            message: 'Mais plataformas mágicas adiante — solta o latidão, Lucky!',
          },
        ],
      };

    // =========================================================================
    // FASE 08 · A MONTANHA DOS NARIZES GELADOS (2.5D Gelo + Boneco de Neve)
    // =========================================================================
    case 8:
      return {
        levelId: 8,
        worldWidth: 4200,
        worldHeight: 720,
        is25D: true,
        snowIntensity: 0.9,
        skyTop: '#0b132b',
        skyMid: '#1c2541',
        skyBottom: '#5bc0be',
        hillColor1: '#3a506b',
        hillColor2: '#a8dadc',
        platformFill: '#457b9d',
        platformTop: '#e0fbfc',
        spawn: { x: 80, y: 500 },
        checkpoint: { x: 2100, y: 490 },
        goal: { x: 4020, y: 490 },
        platforms: [
          { id: 'g1', x: 0, y: 580, w: 720, h: 160, kind: 'ice' },
          { id: 'cr1', x: 800, y: 515, w: 140, h: 28, kind: 'crumble' },
          { id: 'cr2', x: 1010, y: 455, w: 140, h: 28, kind: 'crumble' },
          { id: 'p1', x: 1220, y: 400, w: 220, h: 30, kind: 'ice' },
          { id: 'g2', x: 1520, y: 580, w: 760, h: 160, kind: 'ice' },
          { id: 'b1', x: 1740, y: 540, w: 74, h: 40, kind: 'bounce' },
          { id: 'p_hi', x: 1710, y: 290, w: 170, h: 26, kind: 'ice' },
          { id: 'cr3', x: 2360, y: 505, w: 150, h: 28, kind: 'crumble' },
          { id: 'm1', x: 2590, y: 430, w: 160, h: 28, kind: 'moving', moveAxis: 'x', moveRange: 105, moveSpeed: 2.3 },
          { id: 'g3', x: 2920, y: 580, w: 1280, h: 160, kind: 'ice' },
          { id: 'p2', x: 3140, y: 430, w: 170, h: 28, kind: 'ice' },
        ],
        enemies: [
          { id: 'e1', x: 450, y: 540, kind: 'snowball_roller', patrolMin: 260, patrolMax: 660, speed: 120 },
          { id: 'e2', x: 1290, y: 360, kind: 'grinch_elf', patrolMin: 1230, patrolMax: 1420, speed: 80 },
          { id: 'e3', x: 1920, y: 540, kind: 'snowball_roller', patrolMin: 1600, patrolMax: 2200, speed: 135 },
          { id: 'e4', x: 3200, y: 390, kind: 'grinch_elf', patrolMin: 3150, patrolMax: 3290, speed: 85 },
        ],
        treats: [
          ...makeTreatArc(240, 505, 6),
          ...makeTreatArc(820, 445, 4),
          ...makeTreatArc(1240, 340, 5),
          ...makeTreatArc(1710, 235, 4),
          ...makeTreatArc(2380, 435, 4),
          ...makeTreatArc(3140, 365, 5),
        ],
        goldenPaws: [
          { x: 1330, y: 320 },
          { x: 1795, y: 230 },
          { x: 2670, y: 340 },
        ],
        powerUps: [
          { id: 'pu1', x: 580, y: 530, type: 'spicy_treat' },
          { id: 'pu2', x: 1600, y: 530, type: 'bubble_shield' },
          { id: 'pu3', x: 3020, y: 530, type: 'spicy_treat' },
        ],
        allies: [
          {
            character: 'paulo',
            x: 190,
            y: 580,
            message: 'Piso gelado escorrega! Pega o Petisco Apimentado ali pra derreter os inimigos!',
          },
          {
            character: 'paulo',
            x: 2980,
            y: 580,
            message: 'Boneco de Neve Gigante à vista! Mostra quem manda, Tricolor!',
          },
        ],
        miniBoss: {
          name: 'Boneco de Neve Gigante',
          kind: 'snowman',
          x: 3660,
          y: 580,
          hp: 6,
        },
      };

    // =========================================================================
    // FASE 09 · A VILA DO NATAL ESQUECIDO (Religar 5 Árvores de Natal + Lully + Paulo)
    // =========================================================================
    case 9:
    default:
      return {
        levelId: 9,
        worldWidth: 4200,
        worldHeight: 720,
        snowIntensity: 1.0,
        skyTop: '#110b2e',
        skyMid: '#2a1a5e',
        skyBottom: '#78290f',
        hillColor1: '#1d3557',
        hillColor2: '#2a9d8f',
        platformFill: '#7f1d1d',
        platformTop: '#ffd166',
        spawn: { x: 90, y: 500 },
        checkpoint: { x: 2150, y: 500 },
        goal: { x: 4000, y: 490 },
        platforms: [
          { id: 'g1', x: 0, y: 580, w: 960, h: 160, kind: 'normal' },
          { id: 'p1', x: 420, y: 440, w: 200, h: 28, kind: 'normal' },
          { id: 'p2', x: 740, y: 330, w: 200, h: 28, kind: 'normal' },
          { id: 'g2', x: 1080, y: 580, w: 860, h: 160, kind: 'normal' },
          { id: 'p3', x: 1240, y: 440, w: 200, h: 28, kind: 'normal' },
          { id: 'p4', x: 1580, y: 340, w: 220, h: 28, kind: 'normal' },
          { id: 'm1', x: 1990, y: 470, w: 140, h: 28, kind: 'moving', moveAxis: 'y', moveRange: 80, moveSpeed: 2.0 },
          { id: 'g3', x: 2150, y: 580, w: 900, h: 160, kind: 'normal' },
          { id: 'p5', x: 2420, y: 430, w: 210, h: 28, kind: 'normal' },
          { id: 'p6', x: 2740, y: 315, w: 210, h: 28, kind: 'normal' },
          { id: 'g4', x: 3160, y: 580, w: 1040, h: 160, kind: 'normal' },
          { id: 'p7', x: 3360, y: 440, w: 220, h: 28, kind: 'normal' },
        ],
        enemies: [
          { id: 'e1', x: 540, y: 540, kind: 'grinch_elf', patrolMin: 300, patrolMax: 900, speed: 95 },
          { id: 'e2', x: 1380, y: 540, kind: 'grinch_elf', patrolMin: 1120, patrolMax: 1840, speed: 110 },
          { id: 'e3', x: 1660, y: 300, kind: 'ghost_goof', patrolMin: 1590, patrolMax: 1780, speed: 85 },
          { id: 'e4', x: 2560, y: 540, kind: 'snowball_roller', patrolMin: 2220, patrolMax: 2980, speed: 120 },
          { id: 'e5', x: 3440, y: 540, kind: 'grinch_elf', patrolMin: 3200, patrolMax: 3820, speed: 115 },
        ],
        treats: [
          ...makeTreatArc(240, 505, 5),
          ...makeTreatArc(750, 275, 4),
          ...makeTreatArc(1260, 385, 5),
          ...makeTreatArc(2440, 375, 5),
          ...makeTreatArc(3380, 385, 5),
        ],
        goldenPaws: [
          { x: 840, y: 270 },
          { x: 1690, y: 280 },
          { x: 2845, y: 255 },
        ],
        powerUps: [
          { id: 'pu1', x: 520, y: 395, type: 'golden_bone' },
          { id: 'pu2', x: 1340, y: 395, type: 'frost_biscuit' },
          { id: 'pu3', x: 2520, y: 385, type: 'spicy_treat' },
          { id: 'pu4', x: 3470, y: 395, type: 'super_bark' },
        ],
        allies: [
          {
            character: 'lully',
            x: 190,
            y: 580,
            message: 'Religue as 5 Árvores de Natal apagadas para restaurar a Estrela Encantada!',
          },
          {
            character: 'paulo',
            x: 2240,
            y: 580,
            message: 'A vila já está ficando colorida de novo! Falta pouco pra chegar no Lula!',
          },
        ],
        treeSwitches: [
          { id: 't1', x: 520, y: 440 },
          { id: 't2', x: 1690, y: 340 },
          { id: 't3', x: 2340, y: 580 },
          { id: 't4', x: 2840, y: 315 },
          { id: 't5', x: 3480, y: 440 },
        ],
      };
  }
}
