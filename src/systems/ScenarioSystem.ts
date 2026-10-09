import { SCENARIOS, type JourneyScenario } from '../data/scenarios';
import type { Passenger } from '../data/passengers';
import type { Cash } from '../game/GameState';

export class ScenarioSystem {
  getAllScenarios(): JourneyScenario[] {
    return SCENARIOS;
  }

  getScenarioById(id: string): JourneyScenario {
    const found = SCENARIOS.find((s) => s.id === id);
    return found ?? SCENARIOS[0];
  }

  /**
   * Deterministically generates a custom scenario given a seed.
   * Useful for endless replayability while remaining 100% reproducible in automated tests.
   */
  generateScenarioFromSeed(seed: string | number): JourneyScenario {
    let numericSeed = typeof seed === 'number' ? seed : 0;
    if (typeof seed === 'string') {
      for (let i = 0; i < seed.length; i++) {
        numericSeed = (numericSeed << 5) - numericSeed + seed.charCodeAt(i);
        numericSeed |= 0;
      }
    }
    numericSeed = Math.abs(numericSeed);

    // Pick base scenario as template
    const baseScenario = SCENARIOS[numericSeed % SCENARIOS.length];

    // Seeded pseudo-random generator
    let state = numericSeed || 12345;
    const nextRandom = (): number => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };

    // Vary starting cash slightly while keeping it viable
    const cash: Cash = {
      100: 2 + Math.floor(nextRandom() * 4), // 2 to 5 notes
      200: 2 + Math.floor(nextRandom() * 3), // 2 to 4 notes
      500: 1 + Math.floor(nextRandom() * 3), // 1 to 3 notes
      1000: Math.floor(nextRandom() * 2),     // 0 or 1 note
    };

    // Deep clone passengers and randomize their tendered note between valid denominations
    const clonePassenger = (p: Passenger, index: number): Passenger => {
      const tenderOptions = p.fare <= 300 ? [500, 1000] : p.fare <= 500 ? [500, 1000] : [1000];
      const tenderChoice = tenderOptions[(numericSeed + index) % tenderOptions.length];

      return {
        ...p,
        paidAmount: 0,
        outstandingBalance: p.fare,
        paymentStatus: 'unpaid',
        status: 'waiting',
        tenderedNotes: [tenderChoice],
        changeHeld: false,
        heldChangeAmount: 0,
        marriedTo: undefined,
      };
    };

    const passengers = baseScenario.passengers.map((p, i) => clonePassenger(p, i));
    const boardingPool = baseScenario.boardingPool.map((p, i) => clonePassenger(p, i + 10));

    return {
      id: `seeded-${seed}`,
      title: `Lagos Shift #${Math.abs(numericSeed % 999) + 1}`,
      subtitle: `Seed: ${seed}`,
      description: `Procedurally generated Lagos journey based on seed "${seed}".`,
      difficulty: numericSeed % 2 === 0 ? 'Normal' : 'Challenging',
      startingCash: cash,
      passengers,
      boardingPool,
    };
  }
}

export const scenarioSystem = new ScenarioSystem();
