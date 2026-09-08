const STORAGE_KEY = 'bullet-survivor-save-v1';

export interface SaveData {
  storyStage: number;
  storyCompleted: boolean;
  endlessBestWave: number;
  weaponId: string;
  audioMuted: boolean;
}

function isSaveData(value: unknown): value is SaveData {
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
      return isSaveData(parsed) ? parsed : null;
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
