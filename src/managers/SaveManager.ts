const STORAGE_KEY = 'bullet-survivor-save-v1';

export interface SaveData {
  storyStage: number;
  storyCompleted: boolean;
  endlessBestWave: number;
  weaponId: string;
  audioMuted: boolean;
  frozenCurrency: number;
}

function isPartialSaveData(value: unknown): value is Omit<SaveData, 'frozenCurrency'> {
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

export class SaveManager {
  public load(): SaveData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!isPartialSaveData(parsed)) return null;
      const frozenCurrency = typeof (parsed as { frozenCurrency?: unknown }).frozenCurrency === 'number'
        ? (parsed as { frozenCurrency: number }).frozenCurrency
        : 0;
      return { ...parsed, frozenCurrency };
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
