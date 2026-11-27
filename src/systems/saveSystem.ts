import {
  CostumeId,
  LevelCompletionResult,
  LevelId,
  LevelProgress,
  PermanentSkill,
  SaveData,
} from '../types/game';
import { getLevelMeta } from '../data/levels';

const STORAGE_KEY = 'lucky_boy_jujuba_save_v1';

export function createDefaultSave(): SaveData {
  const levelStats: Record<number, LevelProgress> = {};
  for (let i = 1; i <= 10; i++) {
    levelStats[i] = {
      completed: false,
      stars: 0,
      goldenPaws: [false, false, false],
      bestTreats: 0,
      bestTimeSec: 0,
    };
  }
  return {
    version: 1,
    lastPlayedAt: new Date().toISOString(),
    completedLevels: [],
    levelStats,
    totalTreats: 0,
    treatsBank: 0,
    lives: 5,
    unlockedSkills: [],
    unlockedCostumes: ['classic'],
    equippedCostume: 'classic',
    selectedLevel: 1,
    gameCompleted: false,
    settings: {
      musicVolume: 0.45,
      sfxVolume: 0.7,
      showTouchControls: 'always',
      unlockAllMode: false,
    },
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const base = createDefaultSave();
    const merged: SaveData = {
      ...base,
      ...parsed,
      settings: {
        ...base.settings,
        ...(parsed.settings || {}),
      },
      levelStats: {
        ...base.levelStats,
        ...(parsed.levelStats || {}),
      },
    };
    return merged;
  } catch {
    return createDefaultSave();
  }
}

export function persistSave(data: SaveData): void {
  try {
    const updated: SaveData = {
      ...data,
      lastPlayedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors in restricted browsing modes
  }
}

export function hasExistingProgress(data: SaveData): boolean {
  return data.completedLevels.length > 0 || data.totalTreats > 0;
}

export function getFragmentsCount(data: SaveData): number {
  let count = 0;
  for (let i = 1; i <= 9; i++) {
    if (data.completedLevels.includes(i as LevelId)) count++;
  }
  return count;
}

export function getCompletionPercent(data: SaveData): number {
  const levelsDone = data.completedLevels.length;
  let paws = 0;
  for (let i = 1; i <= 10; i++) {
    const st = data.levelStats[i];
    if (st) paws += st.goldenPaws.filter(Boolean).length;
  }
  const levelWeight = (levelsDone / 10) * 75;
  const pawWeight = (paws / 30) * 25;
  return Math.min(100, Math.round(levelWeight + pawWeight));
}

export function isLevelUnlocked(data: SaveData, levelId: LevelId): boolean {
  if (data.settings.unlockAllMode) return true;
  if (levelId === 1) return true;
  if (levelId === 10) return getFragmentsCount(data) >= 9;
  return data.completedLevels.includes((levelId - 1) as LevelId);
}

export function applyLevelResult(
  prev: SaveData,
  result: LevelCompletionResult
): { next: SaveData; extraLivesGained: number; newlyUnlocked: string[] } {
  const next: SaveData = JSON.parse(JSON.stringify(prev));
  const newlyUnlocked: string[] = [];

  // Treats & extra lives every 100 treats
  next.totalTreats += result.treatsCollected;
  const newBank = next.treatsBank + result.treatsCollected;
  const extraLivesGained = Math.floor(newBank / 100);
  next.treatsBank = newBank % 100;
  next.lives = Math.min(99, next.lives + extraLivesGained);

  const curStat = next.levelStats[result.levelId] || {
    completed: false,
    stars: 0,
    goldenPaws: [false, false, false] as [boolean, boolean, boolean],
    bestTreats: 0,
    bestTimeSec: 0,
  };

  // Merge golden paws
  const mergedPaws: [boolean, boolean, boolean] = [
    curStat.goldenPaws[0] || result.goldenPaws[0],
    curStat.goldenPaws[1] || result.goldenPaws[1],
    curStat.goldenPaws[2] || result.goldenPaws[2],
  ];

  curStat.goldenPaws = mergedPaws;
  curStat.bestTreats = Math.max(curStat.bestTreats, result.treatsCollected);

  if (result.won) {
    curStat.completed = true;
    curStat.stars = Math.max(curStat.stars, result.starsEarned);
    if (curStat.bestTimeSec === 0 || result.timeSec < curStat.bestTimeSec) {
      curStat.bestTimeSec = Math.round(result.timeSec);
    }

    if (!next.completedLevels.includes(result.levelId)) {
      next.completedLevels.push(result.levelId);
      next.completedLevels.sort((a, b) => a - b);
    }

    const meta = getLevelMeta(result.levelId);
    const addSkill = (s: PermanentSkill, label: string) => {
      if (!next.unlockedSkills.includes(s)) {
        next.unlockedSkills.push(s);
        newlyUnlocked.push(label);
      }
    };
    const addCostume = (c: CostumeId, label: string) => {
      if (!next.unlockedCostumes.includes(c)) {
        next.unlockedCostumes.push(c);
        newlyUnlocked.push(label);
      }
    };

    if (meta.unlocksSkill === 'roll') addSkill('roll', 'Habilidade: Rolamento Veloz');
    if (meta.unlocksSkill === 'double_jump') {
      addSkill('double_jump', 'Habilidade: Pulo Duplo');
      addSkill('belly_flop', 'Habilidade: Barrigada Aérea');
    }
    if (meta.unlocksSkill === 'belly_flop') addSkill('belly_flop', 'Habilidade: Barrigada Aérea');
    if (meta.unlocksSkill === 'secret_sniff') addSkill('secret_sniff', 'Habilidade: Faro Secreto');

    if (meta.unlocksCostume === 'spfc') addCostume('spfc', 'Traje: Manto Tricolor (Paulo SPFC)');
    if (meta.unlocksCostume === 'santa') addCostume('santa', 'Traje: Lucky Papai Noel');
    if (meta.unlocksCostume === 'diver') addCostume('diver', 'Traje: Escafandro Bolha');
    if (meta.unlocksCostume === 'pilot') addCostume('pilot', 'Traje: Ases dos Céus');
    if (meta.unlocksCostume === 'starlight') addCostume('starlight', 'Traje: Herói da Estrela');

    if (getFragmentsCount(next) >= 3 && !next.unlockedCostumes.includes('santa')) {
      addCostume('santa', 'Traje: Lucky Papai Noel');
    }

    if (result.levelId < 10) {
      next.selectedLevel = (result.levelId + 1) as LevelId;
    } else {
      next.gameCompleted = true;
    }
  }

  if (next.totalTreats >= 50 && !next.unlockedCostumes.includes('spfc')) {
    next.unlockedCostumes.push('spfc');
    newlyUnlocked.push('Traje: Manto Tricolor (Paulo SPFC)');
  }

  next.levelStats[result.levelId] = curStat;
  persistSave(next);
  return { next, extraLivesGained, newlyUnlocked };
}

export function exportSaveJson(data: SaveData): string {
  return JSON.stringify(data, null, 2);
}

export function importSaveJson(raw: string): SaveData | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.completedLevels)) {
      return null;
    }
    const base = createDefaultSave();
    const merged: SaveData = {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      levelStats: { ...base.levelStats, ...(parsed.levelStats || {}) },
    };
    persistSave(merged);
    return merged;
  } catch {
    return null;
  }
}

export function resetSave(): SaveData {
  const fresh = createDefaultSave();
  persistSave(fresh);
  return fresh;
}
