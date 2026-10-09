import type { FinalReconciliation } from './ScoringSystem';

export type PersonalBest = {
  highScore: number;
  bestRank: string;
  bestStars: number;
  bestNetProfit: number;
  journeysCompleted: number;
  lastPlayedAt?: string;
};

export type GameSettings = {
  soundEnabled: boolean;
};

const STORAGE_KEYS = {
  PERSONAL_BEST: 'change_danfo_personal_best',
  SETTINGS: 'change_danfo_settings',
} as const;

export class PersistenceSystem {
  private memoryStorage: Record<string, string> = {};

  private getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // In private browsing or sandboxed iframes, localStorage may throw
    }
    return this.memoryStorage[key] ?? null;
  }

  private setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fallback
    }
    this.memoryStorage[key] = value;
  }

  loadPersonalBest(): PersonalBest {
    const raw = this.getItem(STORAGE_KEYS.PERSONAL_BEST);
    if (!raw) {
      return {
        highScore: 0,
        bestRank: 'JJC (First Run)',
        bestStars: 0,
        bestNetProfit: 0,
        journeysCompleted: 0,
      };
    }
    try {
      const parsed = JSON.parse(raw) as Partial<PersonalBest>;
      return {
        highScore: parsed.highScore ?? 0,
        bestRank: parsed.bestRank ?? 'JJC (First Run)',
        bestStars: parsed.bestStars ?? 0,
        bestNetProfit: parsed.bestNetProfit ?? 0,
        journeysCompleted: parsed.journeysCompleted ?? 0,
        lastPlayedAt: parsed.lastPlayedAt,
      };
    } catch {
      return {
        highScore: 0,
        bestRank: 'JJC (First Run)',
        bestStars: 0,
        bestNetProfit: 0,
        journeysCompleted: 0,
      };
    }
  }

  recordJourney(reconciliation: FinalReconciliation): {
    isNewHighScore: boolean;
    personalBest: PersonalBest;
  } {
    const current = this.loadPersonalBest();
    const isNewHighScore = reconciliation.score > current.highScore;

    const updated: PersonalBest = {
      highScore: Math.max(current.highScore, reconciliation.score),
      bestRank: reconciliation.score >= current.highScore ? reconciliation.rank : current.bestRank,
      bestStars: Math.max(current.bestStars, reconciliation.stars),
      bestNetProfit: Math.max(current.bestNetProfit, reconciliation.finalProfit),
      journeysCompleted: current.journeysCompleted + 1,
      lastPlayedAt: new Date().toISOString(),
    };

    this.setItem(STORAGE_KEYS.PERSONAL_BEST, JSON.stringify(updated));
    return { isNewHighScore, personalBest: updated };
  }

  loadSettings(): GameSettings {
    const raw = this.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      return { soundEnabled: true };
    }
    try {
      const parsed = JSON.parse(raw) as Partial<GameSettings>;
      return { soundEnabled: parsed.soundEnabled ?? true };
    } catch {
      return { soundEnabled: true };
    }
  }

  saveSettings(settings: Partial<GameSettings>): GameSettings {
    const current = this.loadSettings();
    const updated: GameSettings = {
      ...current,
      ...settings,
    };
    this.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  clearAll(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEYS.PERSONAL_BEST);
        window.localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      }
    } catch {
      // Ignore
    }
    this.memoryStorage = {};
  }
}

export const persistence = new PersistenceSystem();
