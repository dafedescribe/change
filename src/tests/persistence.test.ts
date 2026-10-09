import { describe, it, expect, beforeEach } from 'vitest';
import { PersistenceSystem } from '../systems/PersistenceSystem';
import type { FinalReconciliation, ConductorRank } from '../systems/ScoringSystem';

describe('PersistenceSystem', () => {
  let persistence: PersistenceSystem;

  const mockRecon = (score: number, stars: number, profit: number, rank: ConductorRank): FinalReconciliation => ({
    startingCash: 1400,
    finalCash: 1700,
    netCashGain: 300,
    totalFaresCollected: 700,
    totalRoadsideLeviesPaid: 100,
    totalOutstandingDebt: 0,
    totalHeldChangeObligations: 0,
    changeDispensed: 300,
    unpaidDebtPenalty: 0,
    unreturnedChangePenalty: 0,
    totalPenalties: 0,
    finalProfit: profit,
    passengersDelivered: 5,
    totalPassengers: 5,
    marriagesPerformed: 1,
    score,
    stars,
    rank,
    notes: [],
  });

  beforeEach(() => {
    persistence = new PersistenceSystem();
    persistence.clearAll();
  });

  it('loads default personal best when empty', () => {
    const pb = persistence.loadPersonalBest();
    expect(pb.highScore).toBe(0);
    expect(pb.journeysCompleted).toBe(0);
    expect(pb.bestStars).toBe(0);
  });

  it('records first journey and flags as new high score', () => {
    const recon = mockRecon(85, 4, 350, 'Omo Igboro (Sharp Conductor)');
    const result = persistence.recordJourney(recon);

    expect(result.isNewHighScore).toBe(true);
    expect(result.personalBest.highScore).toBe(85);
    expect(result.personalBest.bestStars).toBe(4);
    expect(result.personalBest.bestNetProfit).toBe(350);
    expect(result.personalBest.journeysCompleted).toBe(1);
    expect(result.personalBest.bestRank).toBe('Omo Igboro (Sharp Conductor)');
  });

  it('accumulates journeys and only updates high score when beaten', () => {
    persistence.recordJourney(mockRecon(85, 4, 350, 'Omo Igboro (Sharp Conductor)'));
    const second = persistence.recordJourney(mockRecon(70, 3, 200, 'Regular Danfo Conductor'));

    expect(second.isNewHighScore).toBe(false);
    expect(second.personalBest.highScore).toBe(85);
    expect(second.personalBest.journeysCompleted).toBe(2);

    const third = persistence.recordJourney(mockRecon(98, 5, 500, 'Agba Conductor (Legendary Master)'));
    expect(third.isNewHighScore).toBe(true);
    expect(third.personalBest.highScore).toBe(98);
    expect(third.personalBest.journeysCompleted).toBe(3);
    expect(third.personalBest.bestRank).toBe('Agba Conductor (Legendary Master)');
  });

  it('saves and loads settings correctly', () => {
    const defaultSettings = persistence.loadSettings();
    expect(defaultSettings.soundEnabled).toBe(true);

    persistence.saveSettings({ soundEnabled: false });
    expect(persistence.loadSettings().soundEnabled).toBe(false);

    persistence.saveSettings({ soundEnabled: true });
    expect(persistence.loadSettings().soundEnabled).toBe(true);
  });
});
