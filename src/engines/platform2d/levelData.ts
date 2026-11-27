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
  conveyorDir?: number;
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
  kind: 'mushroom' | 'baker_bot' | 'octopus' | 'snowman' | 'steam_dragon' | 'nutcracker';
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
  isIndoor?: boolean;
  isTrain?: boolean;
  isPinball?: boolean;
  snowIntensity: number;
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

function makeTreatArc(startX: number, y: number, count: number, spacing = 46, arch = 22): TreatDef[] {
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
    // FASE 01 · AS COLINAS DE JUBALÂNDIA (Estilo The Lorax + Cat in the Hat!)
    // Jump height = 165px, Jump horizontal reach = 270px -> ALL jumps <= 115px height & <= 145px gap!
    // =========================================================================
    case 1:
      return {
        levelId: 1,
        worldWidth: 3800,
        worldHeight: 720,
        snowIntensity: 0.15,
        skyTop: '#66cef5',
        skyMid: '#a8e7ff',
        skyBottom: '#e4f9ff',
        hillColor1: '#69b543',
        hillColor2: '#89d455',
        platformFill: '#d9a45b',
        platformTop: '#69b543',
        spawn: { x: 90, y: 500 },
        checkpoint: { x: 1840, y: 500 },
        goal: { x: 3640, y: 510 },
        platforms: [
          { id: 'g1', x: 0, y: 580, w: 680, h: 160, kind: 'normal' },
          { id: 'p1', x: 320, y: 485, w: 160, h: 28, kind: 'normal' },
          { id: 'mush1', x: 550, y: 542, w: 74, h: 38, kind: 'bounce' },
          { id: 'p2', x: 640, y: 390, w: 170, h: 28, kind: 'normal' },
          { id: 'g2', x: 785, y: 580, w: 660, h: 160, kind: 'normal' },
          { id: 'p3', x: 960, y: 485, w: 165, h: 28, kind: 'normal' },
          { id: 'p4', x: 1170, y: 395, w: 165, h: 28, kind: 'normal' },
          { id: 'g3', x: 1550, y: 580, w: 660, h: 160, kind: 'normal' },
          { id: 'mush2', x: 1680, y: 542, w: 74, h: 38, kind: 'bounce' },
          { id: 'p5', x: 1745, y: 345, w: 175, h: 28, kind: 'normal' },
          // Smooth gentle vertical elevator (stays between y=485 and y=555 -> always easily reachable!)
          { id: 'p6', x: 2290, y: 520, w: 175, h: 28, kind: 'moving', moveAxis: 'y', moveRange: 35, moveSpeed: 1.5 },
          { id: 'g4', x: 2545, y: 580, w: 1255, h: 160, kind: 'normal' },
          { id: 'p7', x: 2680, y: 485, w: 165, h: 28, kind: 'normal' },
          { id: 'mush3', x: 2945, y: 542, w: 74, h: 38, kind: 'bounce' },
          { id: 'boss_help', x: 3060, y: 465, w: 130, h: 24, kind: 'normal' },
        ],
        enemies: [
          { id: 'e1', x: 420, y: 540, kind: 'grump_slime', patrolMin: 270, patrolMax: 515, speed: 70 },
          { id: 'e2', x: 1020, y: 540, kind: 'grump_slime', patrolMin: 860, patrolMax: 1340, speed: 85 },
          { id: 'e3', x: 1230, y: 355, kind: 'grinch_elf', patrolMin: 1180, patrolMax: 1315, speed: 60 },
          { id: 'e4', x: 2020, y: 540, kind: 'grump_slime', patrolMin: 1900, patrolMax: 2150, speed: 85 },
          { id: 'e5', x: 2740, y: 445, kind: 'grinch_elf', patrolMin: 2690, patrolMax: 2820, speed: 65 },
        ],
        treats: [
          ...makeTreatArc(290, 440, 5),
          ...makeTreatArc(860, 525, 6),
          ...makeTreatArc(1180, 340, 4),
          ...makeTreatArc(1640, 450, 5),
          ...makeTreatArc(2290, 440, 4),
          ...makeTreatArc(2660, 425, 5),
        ],
        goldenPaws: [
          { x: 725, y: 335 },
          { x: 1830, y: 285 },
          { x: 2765, y: 420 },
        ],
        powerUps: [
          { id: 'pu1', x: 395, y: 440, type: 'bubble_shield' },
          { id: 'pu2', x: 1255, y: 350, type: 'spicy_treat' },
          { id: 'pu3', x: 2840, y: 535, type: 'spicy_treat' },
        ],
        allies: [
          {
            character: 'paulo',
            x: 205,
            y: 580,
            message: 'Vai Lucky! Pule com A, lata com B e role com X! #SPFC',
          },
          {
            character: 'paulo',
            x: 2610,
            y: 580,
            message: 'Pega o Petisco Apimentado ali pra derrotar o Cogumelo Espirrão!',
          },
        ],
        miniBoss: {
          name: 'Cogumelo Gigante Espirrão',
          kind: 'mushroom',
          x: 3320,
          y: 580,
          hp: 5,
        },
      };

    // =========================================================================
    // FASE 02 · A FLORESTA DOS TRAMBOLHOS (Truffulas Coloridas + Lully!)
    // =========================================================================
    case 2:
      return {
        levelId: 2,
        worldWidth: 4000,
        worldHeight: 720,
        snowIntensity: 0.18,
        skyTop: '#7be0ff',
        skyMid: '#c4f2ff',
        skyBottom: '#f2fcff',
        hillColor1: '#5aa835',
        hillColor2: '#89d455',
        platformFill: '#c98842',
        platformTop: '#76c947',
        spawn: { x: 80, y: 500 },
        checkpoint: { x: 2040, y: 480 },
        goal: { x: 3820, y: 480 },
        platforms: [
          { id: 'g1', x: 0, y: 580, w: 620, h: 160, kind: 'normal' },
          { id: 'm1', x: 690, y: 515, w: 160, h: 28, kind: 'moving', moveAxis: 'y', moveRange: 55, moveSpeed: 1.7 },
          { id: 'p1', x: 910, y: 440, w: 185, h: 28, kind: 'normal' },
          { id: 'p_sec1', x: 925, y: 295, w: 155, h: 24, kind: 'normal' },
          { id: 'g2', x: 1130, y: 580, w: 740, h: 160, kind: 'normal' },
          { id: 'p2', x: 1320, y: 470, w: 160, h: 28, kind: 'normal' },
          { id: 'm2', x: 1580, y: 420, w: 170, h: 28, kind: 'moving', moveAxis: 'x', moveRange: 85, moveSpeed: 1.7 },
          { id: 'g3', x: 1960, y: 560, w: 600, h: 180, kind: 'normal' },
          { id: 'b1', x: 2180, y: 522, w: 74, h: 38, kind: 'bounce' },
          { id: 'p_sec2', x: 2150, y: 290, w: 175, h: 24, kind: 'normal' },
          { id: 'm3', x: 2660, y: 490, w: 165, h: 28, kind: 'moving', moveAxis: 'x', moveRange: 80, moveSpeed: 1.9 },
          { id: 'p3', x: 2920, y: 435, w: 190, h: 28, kind: 'normal' },
          { id: 'm4', x: 3180, y: 410, w: 165, h: 28, kind: 'moving', moveAxis: 'y', moveRange: 65, moveSpeed: 1.9 },
          { id: 'g4', x: 3420, y: 540, w: 580, h: 200, kind: 'normal' },
        ],
        enemies: [
          { id: 'e1', x: 420, y: 540, kind: 'chomper', patrolMin: 350, patrolMax: 560, speed: 60 },
          { id: 'e2', x: 1240, y: 540, kind: 'chomper', patrolMin: 1160, patrolMax: 1480, speed: 75 },
          { id: 'e3', x: 1650, y: 540, kind: 'grump_slime', patrolMin: 1500, patrolMax: 1800, speed: 95 },
          { id: 'e4', x: 2350, y: 520, kind: 'chomper', patrolMin: 2260, patrolMax: 2490, speed: 80 },
          { id: 'e5', x: 3000, y: 395, kind: 'grinch_elf', patrolMin: 2940, patrolMax: 3090, speed: 75 },
          { id: 'e6', x: 3580, y: 500, kind: 'chomper', patrolMin: 3460, patrolMax: 3720, speed: 85 },
        ],
        treats: [
          ...makeTreatArc(260, 515, 5),
          ...makeTreatArc(920, 385, 4),
          ...makeTreatArc(1330, 415, 5),
          ...makeTreatArc(2020, 485, 5),
          ...makeTreatArc(2920, 380, 4),
          ...makeTreatArc(3480, 470, 5),
        ],
        goldenPaws: [
          { x: 1000, y: 245 },
          { x: 2235, y: 235 },
          { x: 3260, y: 295 },
        ],
        powerUps: [
          { id: 'pu1', x: 310, y: 535, type: 'spring_paws' },
          { id: 'pu2', x: 1400, y: 425, type: 'super_bark' },
          { id: 'pu3', x: 2440, y: 515, type: 'bubble_shield' },
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
            message: 'Use o cogumelo aqui para pegar a Patinha Dourada no alto!',
          },
        ],
      };

    // =========================================================================
    // FASE 04 · A FÁBRICA DE GULOSEIMAS MALUCAS (2.5D estilo sala Thing 1 & 2!)
    // =========================================================================
    case 4:
      return {
        levelId: 4,
        worldWidth: 4200,
        worldHeight: 720,
        is25D: true,
        isIndoor: true,
        snowIntensity: 0,
        skyTop: '#f3ebd3',
        skyMid: '#ece2c3',
        skyBottom: '#dfd2ae',
        hillColor1: '#d8b7e8',
        hillColor2: '#b894d6',
        platformFill: '#c98842',
        platformTop: '#f46d75',
        spawn: { x: 80, y: 500 },
        checkpoint: { x: 2060, y: 490 },
        goal: { x: 4030, y: 510 },
        platforms: [
          { id: 'g1', x: 0, y: 580, w: 620, h: 160, kind: 'normal' },
          { id: 'c1', x: 675, y: 535, w: 280, h: 34, kind: 'conveyor', conveyorDir: 1 },
          { id: 'p1', x: 1010, y: 455, w: 190, h: 30, kind: 'normal' },
          { id: 'choc1', x: 630, y: 655, w: 940, h: 65, kind: 'hazard', label: 'CHOCOLATE' },
          { id: 'c2', x: 1255, y: 520, w: 265, h: 34, kind: 'conveyor', conveyorDir: -1 },
          { id: 'g2', x: 1580, y: 580, w: 690, h: 160, kind: 'normal' },
          { id: 'press1', x: 1750, y: 445, w: 135, h: 32, kind: 'moving', moveAxis: 'y', moveRange: 70, moveSpeed: 2.1 },
          { id: 'p_hi', x: 1920, y: 325, w: 175, h: 26, kind: 'normal' },
          { id: 'c3', x: 2335, y: 520, w: 270, h: 34, kind: 'conveyor', conveyorDir: 1 },
          { id: 'm1', x: 2690, y: 455, w: 165, h: 30, kind: 'moving', moveAxis: 'x', moveRange: 85, moveSpeed: 2.0 },
          { id: 'g3', x: 2940, y: 580, w: 1260, h: 160, kind: 'normal' },
          { id: 'p2', x: 3150, y: 465, w: 175, h: 28, kind: 'normal' },
        ],
        enemies: [
          { id: 'e1', x: 400, y: 540, kind: 'candy_bot', patrolMin: 260, patrolMax: 560, speed: 90 },
          { id: 'e2', x: 1080, y: 415, kind: 'candy_bot', patrolMin: 1020, patrolMax: 1185, speed: 65 },
          { id: 'e3', x: 1700, y: 540, kind: 'candy_bot', patrolMin: 1600, patrolMax: 1950, speed: 100 },
          { id: 'e4', x: 2440, y: 480, kind: 'grinch_elf', patrolMin: 2350, patrolMax: 2575, speed: 80 },
          { id: 'e5', x: 3200, y: 425, kind: 'candy_bot', patrolMin: 3160, patrolMax: 3300, speed: 70 },
        ],
        treats: [
          ...makeTreatArc(240, 510, 5),
          ...makeTreatArc(710, 480, 5),
          ...makeTreatArc(1280, 460, 5),
          ...makeTreatArc(1920, 270, 4),
          ...makeTreatArc(2370, 460, 5),
          ...makeTreatArc(3140, 405, 5),
        ],
        goldenPaws: [
          { x: 1105, y: 385 },
          { x: 2005, y: 265 },
          { x: 2770, y: 375 },
        ],
        powerUps: [
          { id: 'pu1', x: 520, y: 535, type: 'frost_biscuit' },
          { id: 'pu2', x: 1650, y: 535, type: 'spicy_treat' },
          { id: 'pu3', x: 3040, y: 535, type: 'bubble_shield' },
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
          x: 3660,
          y: 580,
          hp: 6,
        },
      };

    // =========================================================================
    // FASE 05 · O OCEANO DAS BOLHAS PERDIDAS (Água Cristalina Ilustrada + Polvo)
    // =========================================================================
    case 5:
      return {
        levelId: 5,
        worldWidth: 3900,
        worldHeight: 720,
        isWater: true,
        snowIntensity: 0,
        skyTop: '#2ea8e0',
        skyMid: '#6fd3f7',
        skyBottom: '#b8f0ff',
        hillColor1: '#2a9d8f',
        hillColor2: '#52b788',
        platformFill: '#f46d75',
        platformTop: '#ffe055',
        spawn: { x: 110, y: 340 },
        checkpoint: { x: 1920, y: 570 },
        goal: { x: 3720, y: 360 },
        platforms: [
          { id: 'floor1', x: 0, y: 650, w: 3900, h: 90, kind: 'normal' },
          { id: 'reef1', x: 520, y: 440, w: 120, h: 210, kind: 'normal' },
          { id: 'ceil1', x: 860, y: 0, w: 160, h: 240, kind: 'normal' },
          { id: 'reef2', x: 1280, y: 460, w: 160, h: 190, kind: 'normal' },
          { id: 'cave_top', x: 1650, y: 0, w: 460, h: 160, kind: 'normal' },
          { id: 'reef3', x: 2280, y: 410, w: 140, h: 240, kind: 'normal' },
          { id: 'ceil2', x: 2650, y: 0, w: 160, h: 250, kind: 'normal' },
        ],
        enemies: [
          { id: 'e1', x: 420, y: 260, kind: 'jellyfish', patrolMin: 180, patrolMax: 520, speed: 60 },
          { id: 'e2', x: 760, y: 420, kind: 'jellyfish', patrolMin: 240, patrolMax: 560, speed: 70 },
          { id: 'e3', x: 1120, y: 280, kind: 'jellyfish', patrolMin: 160, patrolMax: 520, speed: 75 },
          { id: 'e4', x: 1520, y: 380, kind: 'jellyfish', patrolMin: 200, patrolMax: 560, speed: 70 },
          { id: 'e5', x: 2120, y: 290, kind: 'jellyfish', patrolMin: 170, patrolMax: 540, speed: 80 },
          { id: 'e6', x: 2520, y: 420, kind: 'jellyfish', patrolMin: 220, patrolMax: 560, speed: 85 },
          { id: 'e7', x: 2920, y: 300, kind: 'jellyfish', patrolMin: 180, patrolMax: 540, speed: 80 },
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
            x: 1890,
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
    // FASE 07 · A MANSÃO DOS SUSTINHOS (Sala Lilás/Creme estilo Thing 1 & 2!)
    // =========================================================================
    case 7:
      return {
        levelId: 7,
        worldWidth: 4000,
        worldHeight: 720,
        isIndoor: true,
        snowIntensity: 0.15,
        skyTop: '#d7c6f0',
        skyMid: '#e8dff7',
        skyBottom: '#f4efe1',
        hillColor1: '#b38cd9',
        hillColor2: '#9f7aea',
        platformFill: '#8b623f',
        platformTop: '#e278b8',
        spawn: { x: 90, y: 500 },
        checkpoint: { x: 2050, y: 500 },
        goal: { x: 3820, y: 470 },
        platforms: [
          { id: 'g1', x: 0, y: 580, w: 620, h: 160, kind: 'normal' },
          { id: 'gh1', x: 690, y: 505, w: 175, h: 28, kind: 'ghost' },
          { id: 'gh2', x: 930, y: 440, w: 175, h: 28, kind: 'ghost' },
          { id: 'p1', x: 1165, y: 490, w: 225, h: 30, kind: 'normal' },
          { id: 'gh_sec1', x: 1190, y: 315, w: 170, h: 24, kind: 'ghost' },
          { id: 'g2', x: 1460, y: 580, w: 720, h: 160, kind: 'normal' },
          { id: 'gh3', x: 2255, y: 500, w: 175, h: 28, kind: 'ghost' },
          { id: 'p2', x: 2500, y: 430, w: 195, h: 30, kind: 'normal' },
          { id: 'gh4', x: 2770, y: 375, w: 180, h: 28, kind: 'ghost' },
          { id: 'gh5', x: 3020, y: 455, w: 180, h: 28, kind: 'ghost' },
          { id: 'm1', x: 3260, y: 485, w: 160, h: 28, kind: 'moving', moveAxis: 'y', moveRange: 65, moveSpeed: 1.8 },
          { id: 'g3', x: 3480, y: 540, w: 520, h: 200, kind: 'normal' },
        ],
        enemies: [
          { id: 'e1', x: 430, y: 540, kind: 'living_chair', patrolMin: 300, patrolMax: 570, speed: 80 },
          { id: 'e2', x: 1240, y: 450, kind: 'ghost_goof', patrolMin: 1175, patrolMax: 1365, speed: 75 },
          { id: 'e3', x: 1680, y: 540, kind: 'living_chair', patrolMin: 1500, patrolMax: 1940, speed: 95 },
          { id: 'e4', x: 1900, y: 430, kind: 'ghost_goof', patrolMin: 1600, patrolMax: 2100, speed: 105 },
          { id: 'e5', x: 2560, y: 390, kind: 'ghost_goof', patrolMin: 2510, patrolMax: 2675, speed: 80 },
          { id: 'e6', x: 3640, y: 500, kind: 'living_chair', patrolMin: 3510, patrolMax: 3760, speed: 95 },
        ],
        treats: [
          ...makeTreatArc(250, 510, 5),
          ...makeTreatArc(710, 445, 4),
          ...makeTreatArc(950, 380, 4),
          ...makeTreatArc(1600, 495, 6),
          ...makeTreatArc(2270, 440, 4),
          ...makeTreatArc(2790, 315, 4),
        ],
        goldenPaws: [
          { x: 1275, y: 260 },
          { x: 2860, y: 310 },
          { x: 3340, y: 340 },
        ],
        powerUps: [
          { id: 'pu1', x: 520, y: 535, type: 'super_bark' },
          { id: 'pu2', x: 1780, y: 535, type: 'bubble_shield' },
          { id: 'pu3', x: 2590, y: 385, type: 'spring_paws' },
        ],
        allies: [
          {
            character: 'lully',
            x: 210,
            y: 580,
            message: 'LATE com o botão B! Seu latido acende as plataformas fantasma por 8s!',
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
    // FASE 08 · A MONTANHA DOS NARIZES GELADOS (2.5D Neve Ilustrada + Boneco)
    // =========================================================================
    case 8:
      return {
        levelId: 8,
        worldWidth: 4200,
        worldHeight: 720,
        is25D: true,
        snowIntensity: 0.85,
        skyTop: '#5ec2f0',
        skyMid: '#b5e8ff',
        skyBottom: '#eefaff',
        hillColor1: '#c6e8f7',
        hillColor2: '#ffffff',
        platformFill: '#7bc6e6',
        platformTop: '#ffffff',
        spawn: { x: 80, y: 500 },
        checkpoint: { x: 2100, y: 500 },
        goal: { x: 4030, y: 510 },
        platforms: [
          { id: 'g1', x: 0, y: 580, w: 720, h: 160, kind: 'ice' },
          { id: 'cr1', x: 795, y: 520, w: 155, h: 28, kind: 'crumble' },
          { id: 'cr2', x: 1015, y: 465, w: 155, h: 28, kind: 'crumble' },
          { id: 'p1', x: 1230, y: 425, w: 225, h: 30, kind: 'ice' },
          { id: 'g2', x: 1525, y: 580, w: 760, h: 160, kind: 'ice' },
          { id: 'b1', x: 1740, y: 542, w: 74, h: 38, kind: 'bounce' },
          { id: 'p_hi', x: 1710, y: 305, w: 180, h: 26, kind: 'ice' },
          { id: 'cr3', x: 2360, y: 510, w: 160, h: 28, kind: 'crumble' },
          { id: 'm1', x: 2610, y: 455, w: 170, h: 28, kind: 'moving', moveAxis: 'x', moveRange: 85, moveSpeed: 2.0 },
          { id: 'g3', x: 2920, y: 580, w: 1280, h: 160, kind: 'ice' },
          { id: 'p2', x: 3140, y: 455, w: 175, h: 28, kind: 'ice' },
        ],
        enemies: [
          { id: 'e1', x: 450, y: 540, kind: 'snowball_roller', patrolMin: 260, patrolMax: 660, speed: 110 },
          { id: 'e2', x: 1290, y: 385, kind: 'grinch_elf', patrolMin: 1240, patrolMax: 1430, speed: 75 },
          { id: 'e3', x: 1920, y: 540, kind: 'snowball_roller', patrolMin: 1600, patrolMax: 2200, speed: 120 },
          { id: 'e4', x: 3200, y: 415, kind: 'grinch_elf', patrolMin: 3150, patrolMax: 3295, speed: 80 },
        ],
        treats: [
          ...makeTreatArc(240, 510, 6),
          ...makeTreatArc(820, 455, 4),
          ...makeTreatArc(1250, 365, 5),
          ...makeTreatArc(1715, 250, 4),
          ...makeTreatArc(2380, 445, 4),
          ...makeTreatArc(3140, 395, 5),
        ],
        goldenPaws: [
          { x: 1340, y: 345 },
          { x: 1800, y: 245 },
          { x: 2690, y: 365 },
        ],
        powerUps: [
          { id: 'pu1', x: 580, y: 535, type: 'spicy_treat' },
          { id: 'pu2', x: 1600, y: 535, type: 'bubble_shield' },
          { id: 'pu3', x: 3020, y: 535, type: 'spicy_treat' },
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
    // FASE 09 · A VILA DO NATAL ESQUECIDO (Religar 5 Árvores de Natal!)
    // =========================================================================
    case 9:
    default:
      return {
        levelId: 9,
        worldWidth: 4200,
        worldHeight: 720,
        snowIntensity: 0.9,
        skyTop: '#4a90d9',
        skyMid: '#8bc8f5',
        skyBottom: '#ffecc7',
        hillColor1: '#5aa835',
        hillColor2: '#eef9ff',
        platformFill: '#b84239',
        platformTop: '#ffe055',
        spawn: { x: 90, y: 500 },
        checkpoint: { x: 2150, y: 500 },
        goal: { x: 4000, y: 510 },
        platforms: [
          { id: 'g1', x: 0, y: 580, w: 960, h: 160, kind: 'normal' },
          { id: 'p1', x: 420, y: 465, w: 205, h: 28, kind: 'normal' },
          { id: 'p2', x: 740, y: 365, w: 205, h: 28, kind: 'normal' },
          { id: 'g2', x: 1065, y: 580, w: 875, h: 160, kind: 'normal' },
          { id: 'p3', x: 1240, y: 465, w: 205, h: 28, kind: 'normal' },
          { id: 'p4', x: 1580, y: 375, w: 220, h: 28, kind: 'normal' },
          { id: 'm1', x: 1985, y: 500, w: 150, h: 28, kind: 'moving', moveAxis: 'y', moveRange: 55, moveSpeed: 1.8 },
          { id: 'g3', x: 2160, y: 580, w: 900, h: 160, kind: 'normal' },
          { id: 'p5', x: 2420, y: 460, w: 215, h: 28, kind: 'normal' },
          { id: 'p6', x: 2740, y: 355, w: 215, h: 28, kind: 'normal' },
          { id: 'g4', x: 3160, y: 580, w: 1040, h: 160, kind: 'normal' },
          { id: 'p7', x: 3360, y: 465, w: 225, h: 28, kind: 'normal' },
        ],
        enemies: [
          { id: 'e1', x: 540, y: 540, kind: 'grinch_elf', patrolMin: 300, patrolMax: 900, speed: 90 },
          { id: 'e2', x: 1380, y: 540, kind: 'grinch_elf', patrolMin: 1120, patrolMax: 1840, speed: 100 },
          { id: 'e3', x: 1660, y: 335, kind: 'ghost_goof', patrolMin: 1590, patrolMax: 1780, speed: 80 },
          { id: 'e4', x: 2560, y: 540, kind: 'snowball_roller', patrolMin: 2220, patrolMax: 2980, speed: 110 },
          { id: 'e5', x: 3440, y: 540, kind: 'grinch_elf', patrolMin: 3200, patrolMax: 3820, speed: 105 },
        ],
        treats: [
          ...makeTreatArc(240, 510, 5),
          ...makeTreatArc(750, 310, 4),
          ...makeTreatArc(1260, 410, 5),
          ...makeTreatArc(2440, 405, 5),
          ...makeTreatArc(3380, 410, 5),
        ],
        goldenPaws: [
          { x: 840, y: 305 },
          { x: 1690, y: 315 },
          { x: 2845, y: 295 },
        ],
        powerUps: [
          { id: 'pu1', x: 520, y: 420, type: 'golden_bone' },
          { id: 'pu2', x: 1340, y: 420, type: 'frost_biscuit' },
          { id: 'pu3', x: 2520, y: 415, type: 'spicy_treat' },
          { id: 'pu4', x: 3470, y: 420, type: 'super_bark' },
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
          { id: 't1', x: 520, y: 465 },
          { id: 't2', x: 1690, y: 375 },
          { id: 't3', x: 2340, y: 580 },
          { id: 't4', x: 2840, y: 355 },
          { id: 't5', x: 3480, y: 465 },
        ],
      };

    // =========================================================================
    // FASE 10 · O EXPRESSO DO POLO NORTE (Vagões de Trem em Alta Velocidade!)
    // =========================================================================
    case 10:
      return {
        levelId: 10,
        worldWidth: 4300,
        worldHeight: 720,
        is25D: true,
        isTrain: true,
        snowIntensity: 0.95,
        skyTop: '#24589c',
        skyMid: '#68b6eb',
        skyBottom: '#e8f8ff',
        hillColor1: '#4d9a31',
        hillColor2: '#ffffff',
        platformFill: '#c91d1d',
        platformTop: '#ffe055',
        spawn: { x: 100, y: 470 },
        checkpoint: { x: 2140, y: 480 },
        goal: { x: 4120, y: 480 },
        platforms: [
          // Train cars rushing over snowy bridges!
          { id: 'car1', x: 20, y: 560, w: 560, h: 115, kind: 'normal' },
          { id: 'crate1', x: 340, y: 465, w: 145, h: 28, kind: 'normal' },
          { id: 'car2', x: 675, y: 545, w: 510, h: 130, kind: 'normal' },
          { id: 'b_car2', x: 960, y: 507, w: 74, h: 38, kind: 'bounce' },
          { id: 'roof2', x: 890, y: 315, w: 195, h: 24, kind: 'normal' },
          { id: 'car3', x: 1290, y: 560, w: 540, h: 115, kind: 'conveyor', conveyorDir: -1 },
          { id: 'm_car', x: 1915, y: 480, w: 145, h: 28, kind: 'moving', moveAxis: 'y', moveRange: 50, moveSpeed: 2.0 },
          { id: 'car4', x: 2110, y: 555, w: 580, h: 120, kind: 'normal' },
          { id: 'crate2', x: 2430, y: 445, w: 165, h: 28, kind: 'normal' },
          { id: 'car5', x: 2790, y: 535, w: 470, h: 140, kind: 'ice' },
          { id: 'loco_deck', x: 3360, y: 560, w: 920, h: 125, kind: 'normal' },
          { id: 'loco_top', x: 3500, y: 445, w: 160, h: 26, kind: 'normal' },
        ],
        enemies: [
          { id: 'e1', x: 360, y: 520, kind: 'grinch_elf', patrolMin: 240, patrolMax: 540, speed: 95 },
          { id: 'e2', x: 810, y: 505, kind: 'candy_bot', patrolMin: 700, patrolMax: 940, speed: 105 },
          { id: 'e3', x: 1510, y: 520, kind: 'snowball_roller', patrolMin: 1320, patrolMax: 1780, speed: 120 },
          { id: 'e4', x: 2350, y: 515, kind: 'grinch_elf', patrolMin: 2220, patrolMax: 2640, speed: 110 },
          { id: 'e5', x: 2980, y: 495, kind: 'candy_bot', patrolMin: 2820, patrolMax: 3200, speed: 115 },
        ],
        treats: [
          ...makeTreatArc(240, 480, 5),
          ...makeTreatArc(730, 465, 5),
          ...makeTreatArc(1360, 475, 6),
          ...makeTreatArc(2260, 475, 5),
          ...makeTreatArc(2860, 455, 5),
          ...makeTreatArc(3460, 385, 5),
        ],
        goldenPaws: [
          { x: 985, y: 255 },
          { x: 2515, y: 370 },
          { x: 3580, y: 370 },
        ],
        powerUps: [
          { id: 'pu1', x: 410, y: 420, type: 'bubble_shield' },
          { id: 'pu2', x: 1620, y: 505, type: 'golden_bone' },
          { id: 'pu3', x: 3420, y: 515, type: 'spicy_treat' },
        ],
        allies: [
          {
            character: 'paulo',
            x: 185,
            y: 560,
            message: 'SEGURA O CACHECOL! Pula entre os vagões até a Locomotiva-Dragão!',
          },
          {
            character: 'paulo',
            x: 2210,
            y: 555,
            message: 'Você tá voando! Derrote a Locomotiva-Dragão lá na frente!',
          },
        ],
        miniBoss: {
          name: 'Locomotiva-Dragão de Vapor',
          kind: 'steam_dragon',
          x: 3820,
          y: 560,
          hp: 7,
        },
      };

    // =========================================================================
    // FASE 11 · O PINBALL DOS PRESENTES (Molas, Bumpers Musicais & Quebra-Nozes!)
    // =========================================================================
    case 11:
      return {
        levelId: 11,
        worldWidth: 4200,
        worldHeight: 720,
        isIndoor: true,
        isPinball: true,
        snowIntensity: 0.25,
        skyTop: '#fce4ec',
        skyMid: '#fff3e0',
        skyBottom: '#e8f5e9',
        hillColor1: '#f46d75',
        hillColor2: '#ffe055',
        platformFill: '#e24b78',
        platformTop: '#ffe055',
        spawn: { x: 90, y: 500 },
        checkpoint: { x: 2080, y: 500 },
        goal: { x: 4030, y: 510 },
        platforms: [
          { id: 'g1', x: 0, y: 580, w: 620, h: 160, kind: 'normal' },
          { id: 'bp1', x: 460, y: 542, w: 76, h: 38, kind: 'bounce' },
          { id: 'p1', x: 580, y: 360, w: 185, h: 28, kind: 'normal' },
          { id: 'bp2', x: 840, y: 495, w: 76, h: 38, kind: 'bounce' },
          { id: 'p2', x: 960, y: 300, w: 195, h: 28, kind: 'normal' },
          { id: 'g2', x: 1180, y: 580, w: 680, h: 160, kind: 'normal' },
          { id: 'bp3', x: 1460, y: 542, w: 76, h: 38, kind: 'bounce' },
          { id: 'm1', x: 1560, y: 355, w: 170, h: 28, kind: 'moving', moveAxis: 'x', moveRange: 80, moveSpeed: 2.1 },
          { id: 'g3', x: 1960, y: 580, w: 680, h: 160, kind: 'normal' },
          { id: 'bp4', x: 2350, y: 542, w: 76, h: 38, kind: 'bounce' },
          { id: 'p3', x: 2470, y: 345, w: 190, h: 28, kind: 'normal' },
          { id: 'bp5', x: 2740, y: 485, w: 76, h: 38, kind: 'bounce' },
          { id: 'g4', x: 2940, y: 580, w: 1260, h: 160, kind: 'normal' },
          { id: 'bp6', x: 3200, y: 542, w: 76, h: 38, kind: 'bounce' },
          { id: 'p4', x: 3320, y: 415, w: 175, h: 26, kind: 'normal' },
        ],
        enemies: [
          { id: 'e1', x: 320, y: 540, kind: 'candy_bot', patrolMin: 220, patrolMax: 440, speed: 95 },
          { id: 'e2', x: 1320, y: 540, kind: 'living_chair', patrolMin: 1210, patrolMax: 1440, speed: 95 },
          { id: 'e3', x: 1650, y: 540, kind: 'grinch_elf', patrolMin: 1550, patrolMax: 1820, speed: 105 },
          { id: 'e4', x: 2220, y: 540, kind: 'candy_bot', patrolMin: 2040, patrolMax: 2330, speed: 100 },
          { id: 'e5', x: 3060, y: 540, kind: 'grinch_elf', patrolMin: 2960, patrolMax: 3180, speed: 110 },
        ],
        treats: [
          ...makeTreatArc(460, 390, 5, 45, 55),
          ...makeTreatArc(850, 340, 5, 45, 55),
          ...makeTreatArc(1260, 505, 5),
          ...makeTreatArc(2360, 375, 5, 45, 55),
          ...makeTreatArc(3210, 385, 5, 45, 55),
        ],
        goldenPaws: [
          { x: 1055, y: 235 },
          { x: 1645, y: 270 },
          { x: 2565, y: 275 },
        ],
        powerUps: [
          { id: 'pu1', x: 670, y: 315, type: 'spring_paws' },
          { id: 'pu2', x: 1360, y: 535, type: 'super_bark' },
          { id: 'pu3', x: 3020, y: 535, type: 'spicy_treat' },
        ],
        allies: [
          {
            character: 'lully',
            x: 185,
            y: 580,
            message: 'Quique nos bumpers de Pinball para voar alto! O Quebra-Nozes tá lá no fim!',
          },
          {
            character: 'pinhao',
            x: 2020,
            y: 580,
            message: 'Hoo-hoo! Último Fragmento antes da Fortaleza do Lula — capricha!',
          },
        ],
        miniBoss: {
          name: 'Quebra-Nozes Mecânico Real',
          kind: 'nutcracker',
          x: 3680,
          y: 580,
          hp: 7,
        },
      };
  }
}

