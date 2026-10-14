const STORAGE_KEY = 'bullet-survivor-save-v1';

export interface KillCounts {
  normal: number;
  elite: number;
  boss: number;
}

export interface SaveData {
  storyStage: number;
  storyCompleted: boolean;
  endlessBestWave: number;
  weaponId: string;
  audioMuted: boolean;
  frozenCurrency: number;
  unlockedArchiveIds: string[];
  killCounts: KillCounts;
  endlessIntroShown: boolean;
}

function isPartialSaveData(value: unknown): value is Omit<
  SaveData,
  'frozenCurrency' | 'unlockedArchiveIds' | 'killCounts' | 'endlessIntroShown'
> {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.storyStage === 'number' &&
    typeof data.storyCompleted === 'boolean' &&
    typeof data.endlessBestWave === 'number' &&
    typeof data.weaponId === 'string' &&
    typeof data.audioMuted === 'boolean'
  );
}

function normalizeKillCounts(value: unknown): KillCounts {
  const data = (value ?? {}) as Record<string, unknown>;
  return {
    normal: typeof data.normal === 'number' ? data.normal : 0,
    elite: typeof data.elite === 'number' ? data.elite : 0,
    boss: typeof data.boss === 'number' ? data.boss : 0,
  };
}

export class SaveManager {
  public load(): SaveData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (!isPartialSaveData(parsed)) return null;

      const frozenCurrency = typeof parsed.frozenCurrency === 'number' ? parsed.frozenCurrency : 0;
      const unlockedArchiveIds = Array.isArray(parsed.unlockedArchiveIds)
        ? (parsed.unlockedArchiveIds as string[])
        : [];
      const killCounts = normalizeKillCounts(parsed.killCounts);
      const endlessIntroShown =
        typeof parsed.endlessIntroShown === 'boolean' ? parsed.endlessIntroShown : false;

      return {
        ...(parsed as Omit<SaveData, 'frozenCurrency' | 'unlockedArchiveIds' | 'killCounts' | 'endlessIntroShown'>),
        frozenCurrency,
        unlockedArchiveIds,
        killCounts,
        endlessIntroShown,
      };
    } catch {
      return null;
    }
  }

  public save(data: SaveData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      return;
    }
  }

  public clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      return;
    }
  }

  public get hasSave(): boolean {
    return this.load() !== null;
  }
}
